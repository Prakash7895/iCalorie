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
    config=Config(connect_timeout=5, retries={"max_attempts": 1}),
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
        ExtraArgs={"ContentType": content_type, "ACL": "public-read"},
    )
    return f"{settings.s3_endpoint_url}/{settings.s3_bucket}/{key}"
