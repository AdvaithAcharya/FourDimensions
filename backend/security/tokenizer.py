import tiktoken
import logging
from typing import List, Dict, Any, Tuple
from backend.config import settings

logger = logging.getLogger("krypton.tokenizer")

class PreFlightTokenizer:
    def __init__(self, model_name: str = "gpt-4o"):
        try:
            self.encoding = tiktoken.encoding_for_model(model_name)
        except Exception:
            self.encoding = tiktoken.get_encoding("cl100k_base")

    def count_tokens_and_media(self, messages: List[Dict[str, Any]]) -> Tuple[int, Dict[str, int]]:
        """Calculates exact text token count and estimates media volume."""
        num_tokens = 0
        media_stats = {"images": 0, "audio_sec": 0, "video_frames": 0}
        
        for msg in messages:
            num_tokens += 4  # every message follows <im_start>{role/name}\n{content}<im_end>\n
            content = msg.get("content", "")
            
            if isinstance(content, str):
                num_tokens += len(self.encoding.encode(content))
            elif isinstance(content, list):
                # Handle multimodal arrays
                for part in content:
                    if isinstance(part, dict):
                        if "text" in part and isinstance(part["text"], str):
                            num_tokens += len(self.encoding.encode(part["text"]))
                        elif part.get("type") == "image_url":
                            media_stats["images"] += 1
                            num_tokens += 85
                        elif part.get("type") == "audio_url":
                            # Estimate audio length by base64 length (~16KB/sec)
                            url = part.get("audio_url", {}).get("url", "")
                            sec = len(url) // 16384
                            media_stats["audio_sec"] += sec if sec > 0 else 1
                        elif part.get("type") == "video_url":
                            # Estimate video frames by base64 length (~30 frames per MB)
                            url = part.get("video_url", {}).get("url", "")
                            frames = int((len(url) / 1048576.0) * 30)
                            media_stats["video_frames"] += frames if frames > 0 else 1
                            
            role = msg.get("role", "")
            if isinstance(role, str):
                num_tokens += len(self.encoding.encode(role))
        num_tokens += 2  # every reply is primed with <im_start>assistant
        return num_tokens, media_stats

    def estimate_request_cost_usd(self, input_tokens: int, max_output_tokens: int = 1000) -> float:
        """Estimates total financial cost in USD before any LLM API is invoked."""
        input_cost = (input_tokens / 1000.0) * settings.INPUT_TOKEN_COST_PER_1K
        output_cost = (max_output_tokens / 1000.0) * settings.OUTPUT_TOKEN_COST_PER_1K
        return round(input_cost + output_cost, 6)

    def evaluate_preflight_complexity(self, messages: List[Dict[str, Any]], max_output_tokens: int = 1000) -> Tuple[bool, int, float, str, Dict[str, int]]:
        """
        Interprets incoming request and performs zero-cost pre-flight token complexity check.
        Returns: (is_allowed, input_token_count, estimated_cost_usd, reason_if_blocked, media_stats)
        """
        input_tokens, media_stats = self.count_tokens_and_media(messages)
        total_estimated_tokens = input_tokens + max_output_tokens
        
        # We can add an arbitrary cost weight for audio and video if we want, but for now we just track it.
        estimated_cost_usd = self.estimate_request_cost_usd(input_tokens, max_output_tokens)
        
        # Security Thresholds for heavy multimedia token burn
        if media_stats["audio_sec"] > 3600:
             return False, input_tokens, estimated_cost_usd, f"Audio Length Exceeded: {media_stats['audio_sec']} sec requested (Max 3600s)", media_stats
        if media_stats["video_frames"] > 50000:
             return False, input_tokens, estimated_cost_usd, f"Video Frames Exceeded: {media_stats['video_frames']} frames requested (Max 100)", media_stats

        if total_estimated_tokens > settings.MAX_TOKENS_PER_REQUEST:
            reason = f"Token Complexity Ceiling Exceeded: {total_estimated_tokens} tokens requested (Max allowed: {settings.MAX_TOKENS_PER_REQUEST}). Payload dropped pre-flight ($0 spent)."
            return False, input_tokens, estimated_cost_usd, reason, media_stats

        return True, input_tokens, estimated_cost_usd, "", media_stats

tokenizer_engine = PreFlightTokenizer()
