from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseModel):
    api_base_url: str = os.getenv("API_BASE_URL", "http://localhost:8000")
    database_url: str = os.getenv(
        "DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/icalorie"
    )

    s3_endpoint_url: str = os.getenv("S3_ENDPOINT_URL", "http://localhost:9000")
    s3_access_key: str = os.getenv("S3_ACCESS_KEY", "minio")
    s3_secret_key: str = os.getenv("S3_SECRET_KEY", "minio123")
    s3_bucket: str = os.getenv("S3_BUCKET", "icalorie")

    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    usda_api_key: str = os.getenv("USDA_API_KEY", "")

    # JWT settings
    jwt_secret_key: str = os.getenv(
        "JWT_SECRET_KEY", "your-secret-key-change-in-production"
    )

    ai_model: str = os.getenv("AI_MODEL", "gpt-4o-mini")

    # Token pricing configuration
    # Base unit: 1 scan ≈ 3000 AI tokens (prompt + image + response)
    tokens_per_scan: int = 3000  # AI tokens consumed per scan
    price_per_scan_usd: float = 0.10  # $0.10 per scan

    # Google Play product IDs (for Android IAP)
    google_play_package_name: str = os.getenv("GOOGLE_PLAY_PACKAGE_NAME", "")
    google_play_service_account_json: str = os.getenv(
        "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", ""
    )

    # Free scan limits for non-paying users
    max_free_scans: int = int(os.getenv("MAX_FREE_SCANS", "5"))  # Default: 5 free scans

    # Google OAuth
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")


settings = Settings()
