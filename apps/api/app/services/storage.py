import io
import boto3
from botocore.exceptions import ClientError
from app.config import settings


s3 = boto3.client(
    "s3",
    endpoint_url=settings.s3_endpoint_url,
    aws_access_key_id=settings.s3_access_key,
    aws_secret_access_key=settings.s3_secret_key,
)


def ensure_bucket():
    try:
        s3.head_bucket(Bucket=settings.s3_bucket)
    except ClientError:
        s3.create_bucket(Bucket=settings.s3_bucket)


def upload_image(key: str, data: bytes, content_type: str) -> str:
    s3.upload_fileobj(
        io.BytesIO(data),
        settings.s3_bucket,
        key,
        ExtraArgs={"ContentType": content_type, "ACL": "public-read"},
    )
    return f"{settings.s3_endpoint_url}/{settings.s3_bucket}/{key}"
