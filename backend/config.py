import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Krypton Gateway"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # MongoDB Settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "krypton_gateway")
    
    # Redis Settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Security Thresholds
    MAX_TOKENS_PER_REQUEST: int = int(os.getenv("MAX_TOKENS_PER_REQUEST", 4000))
    MAX_COST_VELOCITY_PER_MINUTE_USD: float = float(os.getenv("MAX_COST_VELOCITY_PER_MINUTE_USD", 0.10))
    MAX_REQUESTS_PER_MINUTE: int = int(os.getenv("MAX_REQUESTS_PER_MINUTE", 20))
    
    # Budget Defaults (Daily Freemium Ceiling in Base USD)
    DEFAULT_DAILY_BUDGET_USD: float = float(os.getenv("DEFAULT_DAILY_BUDGET_USD", 0.50))
    
    # Token Pricing Model (per 1k tokens - e.g., GPT-4o style estimated rate: $0.005 / 1k input tokens, $0.015 / 1k output tokens)
    INPUT_TOKEN_COST_PER_1K: float = 0.005
    OUTPUT_TOKEN_COST_PER_1K: float = 0.015

settings = Settings()
