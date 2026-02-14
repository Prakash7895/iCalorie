"""Helper function to generate accessible URLs from S3 keys"""

from app.config import settings


def get_s3_url(key: str | None) -> str | None:
    """Convert S3 key to full accessible URL"""
    if not key:
        return None
    if key.startswith("http"):
        return key  # Already a full URL
    return f"{settings.s3_endpoint_url}/{settings.s3_bucket}/{key}"
