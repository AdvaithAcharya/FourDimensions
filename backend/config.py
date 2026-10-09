import os
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables
load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "Scryptic LLM FinOps Dashboard"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Provider Mode: Default to high-fidelity Simulated Provider (PS-404 requirement).
    # Can toggle to live Gemini by setting USE_LIVE_GEMINI=true in .env
    MOCK_PROVIDER: bool = os.getenv("USE_LIVE_GEMINI", "false").lower() not in ("true", "1", "yes")
    SIMULATED_LATENCY_MS: int = int(os.getenv("SIMULATED_LATENCY_MS", 45))
    
    # MongoDB Settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "scryptic_finops")
    
    # Redis Settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

settings = Settings()
