import time
import logging
from typing import Dict, Any, List, Optional
from backend.config import settings

logger = logging.getLogger("krypton.db")
logging.basicConfig(level=logging.INFO)

# In-memory resilient stores
in_memory_logs: List[Dict[str, Any]] = []
in_memory_budgets: Dict[str, Dict[str, Any]] = {
    "user_freemium_01": {
        "user_id": "user_freemium_01",
        "tier": "freemium",
        "daily_budget_usd": settings.DEFAULT_DAILY_BUDGET_USD,
        "current_spent_usd": 0.0,
        "requests_today": 0,
        "blocked_attacks": 0,
        "last_reset": time.time()
    },
    "user_pro_02": {
        "user_id": "user_pro_02",
        "tier": "pro",
        "daily_budget_usd": 10.0,
        "current_spent_usd": 0.05,
        "requests_today": 12,
        "blocked_attacks": 0,
        "last_reset": time.time()
    }
}

in_memory_stats: Dict[str, Any] = {
    "total_requests": 0,
    "total_tokens_processed": 0,
    "total_tokens_blocked": 0,
    "blocked_threat_count": 0,
    "total_cost_saved_usd": 0.0,
    "latency_history": [],
    "total_images_blocked": 0,
    "total_audio_blocked": 0,
    "total_video_blocked": 0
}

# Redis Sliding Window sliding tracker in-memory fallback
in_memory_redis_windows: Dict[str, List[float]] = {}
in_memory_cost_windows: Dict[str, List[tuple[float, float]]] = {}

# Motor MongoDB instance
mongo_client = None
db = None

# Redis instance
redis_client = None

async def init_databases():
    global mongo_client, db, redis_client
    
    # Try connecting to MongoDB
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        mongo_client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=1500)
        await mongo_client.admin.command('ping')
        db = mongo_client[settings.DATABASE_NAME]
        logger.info("Successfully connected to MongoDB Atlas!")
    except Exception as e:
        logger.warning(f"MongoDB connection unfulfilled ({e}). Operating in resilient In-Memory Mongo Mode.")
        mongo_client = None
        db = None

    # Try connecting to Redis
    try:
        import redis.asyncio as aioredis
        redis_client = aioredis.from_url(settings.REDIS_URL, socket_connect_timeout=1.5)
        await redis_client.ping()
        logger.info("Successfully connected to Redis instance!")
    except Exception as e:
        logger.warning(f"Redis connection unfulfilled ({e}). Operating in resilient In-Memory Redis Mode.")
        redis_client = None

# Database Accessors & Loggers
async def save_threat_log(log_data: Dict[str, Any]):
    log_data["timestamp_epoch"] = time.time()
    in_memory_logs.insert(0, log_data)
    if len(in_memory_logs) > 200:
        in_memory_logs.pop()
        
    in_memory_stats["total_tokens_blocked"] += log_data.get("tokens_blocked", 0)
    in_memory_stats["total_cost_saved_usd"] += log_data.get("cost_saved_usd", 0.0)
    in_memory_stats["blocked_threat_count"] += 1
    
    media_stats = log_data.get("media_stats", {})
    if media_stats:
        in_memory_stats["total_images_blocked"] += media_stats.get("images", 0)
        in_memory_stats["total_audio_blocked"] += media_stats.get("audio_sec", 0)
        in_memory_stats["total_video_blocked"] += media_stats.get("video_frames", 0)
        
        if db is not None:
            try:
                await db.system_stats.update_one(
                    {"_id": "global"},
                    {"$inc": {
                        "total_images_blocked": media_stats.get("images", 0),
                        "total_audio_blocked": media_stats.get("audio_sec", 0),
                        "total_video_blocked": media_stats.get("video_frames", 0)
                    }},
                    upsert=True
                )
            except Exception:
                pass
    
    if db is not None:
        try:
            await db.threat_logs.insert_one(log_data)
        except Exception:
            pass

async def get_recent_threat_logs(limit: int = 50) -> List[Dict[str, Any]]:
    if db is not None:
        try:
            cursor = db.threat_logs.find({}, {'_id': 0}).sort("timestamp_epoch", -1).limit(limit)
            logs = await cursor.to_list(length=limit)
            if logs:
                return logs
        except Exception:
            pass
    return in_memory_logs[:limit]

async def get_user_budget_db(user_id: str) -> Dict[str, Any]:
    if db is not None:
        try:
            user_doc = await db.user_budgets.find_one({"user_id": user_id}, {'_id': 0})
            if user_doc:
                return user_doc
        except Exception:
            pass
            
    if user_id not in in_memory_budgets:
        in_memory_budgets[user_id] = {
            "user_id": user_id,
            "tier": "freemium",
            "daily_budget_usd": settings.DEFAULT_DAILY_BUDGET_USD,
            "current_spent_usd": 0.0,
            "requests_today": 0,
            "blocked_attacks": 0,
            "last_reset": time.time()
        }
    return in_memory_budgets[user_id]

async def get_all_users_budgets() -> List[Dict[str, Any]]:
    if db is not None:
        try:
            cursor = db.user_budgets.find({}, {'_id': 0})
            users = await cursor.to_list(length=1000)
            if users:
                return users
        except Exception:
            pass
            
    # Fallback to in-memory
    # Let's ensure the hardcoded ones exist in memory if they don't already
    for uid in ["user_freemium_01", "legit_user_02", "attacker_bot_02"]:
        if uid not in in_memory_budgets:
             in_memory_budgets[uid] = {
                "user_id": uid,
                "tier": "freemium",
                "daily_budget_usd": settings.DEFAULT_DAILY_BUDGET_USD,
                "current_spent_usd": 0.0,
                "requests_today": 0,
                "blocked_attacks": 0,
                "last_reset": time.time()
            }
            
    return list(in_memory_budgets.values())

async def update_user_budget_db(user_id: str, added_spent_usd: float, request_increment: int = 1, attack_increment: int = 0):
    user_data = await get_user_budget_db(user_id)
    user_data["current_spent_usd"] += added_spent_usd
    user_data["requests_today"] += request_increment
    user_data["blocked_attacks"] += attack_increment
    
    in_memory_budgets[user_id] = user_data
    if db is not None:
        try:
            await db.user_budgets.update_one(
                {"user_id": user_id},
                {"$set": user_data},
                upsert=True
            )
        except Exception:
            pass

async def record_successful_request(tokens_used: int, latency_ms: float, media_stats: Dict[str, int] = None):
    in_memory_stats["total_requests"] += 1
    in_memory_stats["total_tokens_processed"] += tokens_used
    in_memory_stats["latency_history"].append(latency_ms)
    if len(in_memory_stats["latency_history"]) > 100:
        in_memory_stats["latency_history"].pop(0)

async def get_system_stats() -> Dict[str, Any]:
    stats = in_memory_stats.copy()
    
    if db is not None:
        try:
            # Aggregate threats to get persistent blocked tokens and cost saved
            pipeline = [
                {"$group": {
                    "_id": None,
                    "total_tokens_blocked": {"$sum": "$tokens_blocked"},
                    "total_cost_saved_usd": {"$sum": "$cost_saved_usd"},
                    "blocked_threat_count": {"$sum": 1}
                }}
            ]
            cursor = db.threat_logs.aggregate(pipeline)
            async for doc in cursor:
                stats["total_tokens_blocked"] = doc.get("total_tokens_blocked", 0)
                stats["total_cost_saved_usd"] = doc.get("total_cost_saved_usd", 0.0)
                stats["blocked_threat_count"] = doc.get("blocked_threat_count", 0)
                
            # Aggregate total requests from user_budgets
            req_pipeline = [{"$group": {"_id": None, "total_requests": {"$sum": "$requests_today"}}}]
            req_cursor = db.user_budgets.aggregate(req_pipeline)
            async for rdoc in req_cursor:
                stats["total_requests"] = rdoc.get("total_requests", 0)
                
            # Fetch persisted multimedia stats
            sys_doc = await db.system_stats.find_one({"_id": "global"})
            if sys_doc:
                # We overwrite the in-memory stats with the persisted ones because in-memory resets
                stats["total_images_blocked"] = sys_doc.get("total_images_blocked", 0)
                stats["total_audio_blocked"] = sys_doc.get("total_audio_blocked", 0)
                stats["total_video_blocked"] = sys_doc.get("total_video_blocked", 0)
                
        except Exception as e:
            logger.error(f"Error aggregating stats: {e}")

    lat_hist = in_memory_stats["latency_history"]
    avg_lat = sum(lat_hist) / len(lat_hist) if lat_hist else 2.4
    stats["avg_latency_ms"] = round(avg_lat, 2)
    return stats
