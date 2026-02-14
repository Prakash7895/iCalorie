"""
Script to set MinIO bucket policy to allow public read access.
This allows all uploaded files to be publicly accessible.
"""

import boto3
import json
from app.config import settings

# Create S3 client
s3_client = boto3.client(
    "s3",
    endpoint_url=settings.s3_endpoint_url,
    aws_access_key_id=settings.s3_access_key,
    aws_secret_access_key=settings.s3_secret_key,
)

# Define bucket policy for public read access
bucket_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {"AWS": "*"},
            "Action": ["s3:GetObject"],
            "Resource": [f"arn:aws:s3:::{settings.s3_bucket}/*"],
        }
    ],
}

# Set the bucket policy
try:
    s3_client.put_bucket_policy(
        Bucket=settings.s3_bucket, Policy=json.dumps(bucket_policy)
    )
    print(f"✅ Bucket policy set successfully for '{settings.s3_bucket}'")
    print("All objects in this bucket are now publicly readable")
except Exception as e:
    print(f"❌ Error setting bucket policy: {e}")
