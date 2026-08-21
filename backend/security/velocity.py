import time
import logging
from typing import Tuple
from backend.config import settings
from backend.db import redis_client, in_memory_redis_windows, in_memory_cost_windows

logger = logging.getLogger("krypton.velocity")

class VelocityTracker:
    def __init__(self, window_seconds: int = 60):
        self.window_seconds = window_seconds

    async def check_velocity(self, identifier: str, estimated_cost_usd: float) -> Tuple[bool, str, int, float]:
        """
        Checks request frequency and cost velocity using a sliding window algorithm.
        Returns: (is_allowed, reason, current_requests_in_window, current_cost_velocity_usd)
        """
        now = time.time()
        window_start = now - self.window_seconds
        
        # Redis Sliding Window implementation if Redis connection is active
        if redis_client is not None:
            try:
                pipe = redis_client.pipeline()
                req_key = f"rate:{identifier}"
                cost_key = f"cost:{identifier}"
                
                # Clean old entries
                pipe.zremrangebyscore(req_key, 0, window_start)
                pipe.zremrangebyscore(cost_key, 0, window_start)
                
                # Count current requests and sum cost
                pipe.zcard(req_key)
                pipe.zrange(cost_key, 0, -1, withscores=True)
                
                results = await pipe.execute()
                req_count = results[2]
                cost_entries = results[3]
                
                current_cost_usd = sum([float(member.decode('utf-8')) for member, score in cost_entries]) if cost_entries else 0.0
                
                # Check limits
                if req_count >= settings.MAX_REQUESTS_PER_MINUTE:
                    reason = f"Anomaly Trap Triggered: High-Frequency Request Velocity ({req_count + 1} req/min exceeds limit of {settings.MAX_REQUESTS_PER_MINUTE}). Blocked."
                    return False, reason, req_count, current_cost_usd

                if (current_cost_usd + estimated_cost_usd) > settings.MAX_COST_VELOCITY_PER_MINUTE_USD:
                    reason = f"Denial-of-Wallet Trap Triggered: Cost Velocity Breach (${current_cost_usd + estimated_cost_usd:.4f}/min exceeds ceiling of ${settings.MAX_COST_VELOCITY_PER_MINUTE_USD}/min). Blocked."
                    return False, reason, req_count, current_cost_usd

                # Add current request to Redis
                pipe = redis_client.pipeline()
                pipe.zadd(req_key, {str(now): now})
                pipe.zadd(cost_key, {str(estimated_cost_usd): now})
                pipe.expire(req_key, self.window_seconds + 5)
                pipe.expire(cost_key, self.window_seconds + 5)
                await pipe.execute()

                return True, "", req_count + 1, current_cost_usd + estimated_cost_usd
            except Exception as e:
                logger.warning(f"Redis velocity check error ({e}). Falling back to in-memory velocity window.")

        # Fallback In-Memory Sliding Window
        req_timestamps = in_memory_redis_windows.setdefault(identifier, [])
        cost_tuples = in_memory_cost_windows.setdefault(identifier, [])
        
        # Purge entries outside 60-second window
        in_memory_redis_windows[identifier] = [ts for ts in req_timestamps if ts > window_start]
        in_memory_cost_windows[identifier] = [(cost, ts) for cost, ts in cost_tuples if ts > window_start]
        
        current_req_count = len(in_memory_redis_windows[identifier])
        current_cost_velocity = sum([cost for cost, ts in in_memory_cost_windows[identifier]])
        
        if current_req_count >= settings.MAX_REQUESTS_PER_MINUTE:
            reason = f"Anomaly Trap Triggered: Rapid-Fire Request Burst ({current_req_count + 1} req/min exceeds limit of {settings.MAX_REQUESTS_PER_MINUTE}). Blocked."
            return False, reason, current_req_count, current_cost_velocity

        if (current_cost_velocity + estimated_cost_usd) > settings.MAX_COST_VELOCITY_PER_MINUTE_USD:
            reason = f"Denial-of-Wallet Trap Triggered: Cost Velocity Spiking (${current_cost_velocity + estimated_cost_usd:.4f}/min exceeds ceiling of ${settings.MAX_COST_VELOCITY_PER_MINUTE_USD}/min). Blocked."
            return False, reason, current_req_count, current_cost_velocity

        # Record request
        in_memory_redis_windows[identifier].append(now)
        in_memory_cost_windows[identifier].append((estimated_cost_usd, now))

        return True, "", current_req_count + 1, current_cost_velocity + estimated_cost_usd

velocity_tracker = VelocityTracker()
