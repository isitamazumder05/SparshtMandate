import os
from pathlib import Path
from dotenv import load_dotenv

# Project root directory (one level up from backend/)
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

# Ensure database path is always anchored to project root, not current working directory
_DEFAULT_DB_FILE = (ROOT_DIR / "spashtmandate.db").resolve().as_posix()
_DEFAULT_DATABASE_URL = f"sqlite:///{_DEFAULT_DB_FILE}"

_raw_db_url = os.getenv("DATABASE_URL")
if not _raw_db_url:
    _EFFECTIVE_DB_URL = _DEFAULT_DATABASE_URL
elif _raw_db_url.startswith("sqlite:///./"):
    _rel_name = _raw_db_url.replace("sqlite:///./", "")
    _EFFECTIVE_DB_URL = f"sqlite:///{(ROOT_DIR / _rel_name).resolve().as_posix()}"
elif _raw_db_url.startswith("sqlite:///") and not os.path.isabs(_raw_db_url.replace("sqlite:///", "")):
    _rel_name = _raw_db_url.replace("sqlite:///", "")
    _EFFECTIVE_DB_URL = f"sqlite:///{(ROOT_DIR / _rel_name).resolve().as_posix()}"
else:
    _EFFECTIVE_DB_URL = _raw_db_url

class Settings:
    PROJECT_NAME: str = "SpashtMandate AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # AI Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    FIRECRAWL_API_KEY: str = os.getenv("FIRECRAWL_API_KEY", "")
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
    
    # DB
    DATABASE_URL: str = _EFFECTIVE_DB_URL
    
    # Network Security
    REQUEST_TIMEOUT_SECONDS: int = 20
    MAX_CONTENT_LENGTH: int = 1_000_000 # 1MB text limit for safety

settings = Settings()
