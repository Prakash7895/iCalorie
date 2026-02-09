from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseModel):
    api_base_url: str = os.getenv("API_BASE_URL", "http://localhost:8000")
    database_url: str = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/icalorie")

    s3_endpoint_url: str = os.getenv("S3_ENDPOINT_URL", "http://localhost:9000")
    s3_access_key: str = os.getenv("S3_ACCESS_KEY", "minio")
    s3_secret_key: str = os.getenv("S3_SECRET_KEY", "minio123")
    s3_bucket: str = os.getenv("S3_BUCKET", "icalorie")

    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")


settings = Settings()
