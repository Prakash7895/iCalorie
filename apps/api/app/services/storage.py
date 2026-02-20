import io
import logging
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError, EndpointResolutionError
from app.config import settings

logger = logging.getLogger(__name__)

s3 = boto3.client(
    "s3",
    endpoint_url=settings.s3_endpoint_url,
    aws_access_key_id=settings.s3_access_key,
    aws_secret_access_key=settings.s3_secret_key,
    region_name=settings.s3_region,
    config=Config(
        signature_version="s3v4", connect_timeout=5, retries={"max_attempts": 1}
    ),
)


def ensure_bucket():
    try:
        s3.head_bucket(Bucket=settings.s3_bucket)
    except ClientError:
        try:
            s3.create_bucket(Bucket=settings.s3_bucket)
        except Exception as e:
            logger.warning(f"Could not create S3 bucket: {e}")
    except Exception as e:
        logger.warning(f"S3 not reachable at startup (is MinIO running?): {e}")


def upload_image(key: str, data: bytes, content_type: str) -> str:
    s3.upload_fileobj(
        io.BytesIO(data),
        settings.s3_bucket,
        key,
        ExtraArgs={"ContentType": content_type},
    )
    return key


def generate_presigned_url(key: str, expiration: int = 3600) -> str:
    """
    Generate a presigned URL to share an S3 object securely.
    :param key: The key of the object to share.
    :param expiration: Time in seconds for the presigned URL to remain valid.
    :return: Presigned URL as string.
    """
    try:
        response = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.s3_bucket, "Key": key},
            ExpiresIn=expiration,
        )
    except ClientError as e:
        logger.error(f"Error generating presigned URL: {e}")
        return None
    return response
