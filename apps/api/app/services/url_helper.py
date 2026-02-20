"""Helper function to generate accessible URLs from S3 keys"""

from app.config import settings


def get_s3_url(key: str | None) -> str | None:
    """Convert S3 key to a secure presigned URL"""
    if not key:
        return None
    if key.startswith("http"):
        return key  # Already a full URL (e.g., Google OAuth profile picture)

    from app.services.storage import generate_presigned_url

    return generate_presigned_url(key, expiration=3600)
