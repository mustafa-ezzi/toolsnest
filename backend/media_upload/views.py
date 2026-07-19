import logging
import uuid
from pathlib import Path

import boto3
from botocore.client import Config
from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView


logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


def _r2_configured() -> bool:
    return bool(
        settings.R2_ACCESS_KEY_ID
        and settings.R2_SECRET_ACCESS_KEY
        and settings.R2_BUCKET
        and settings.R2_ENDPOINT_URL
    )


def _upload_to_r2(file_obj, key: str, content_type: str) -> str:
    client = boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT_URL,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )
    client.upload_fileobj(
        file_obj,
        settings.R2_BUCKET,
        key,
        ExtraArgs={"ContentType": content_type},
    )
    base = (settings.R2_PUBLIC_BASE_URL or "").rstrip("/")
    if base:
        return f"{base}/{key}"
    return f"{settings.R2_ENDPOINT_URL.rstrip('/')}/{settings.R2_BUCKET}/{key}"


def _upload_local(file_obj, key: str) -> str:
    saved_path = default_storage.save(key, file_obj)
    media = settings.MEDIA_URL.rstrip("/")
    return f"{media}/{saved_path}"


class UploadView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response(
                {"detail": "No file provided. Use multipart field `file`."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content_type = upload.content_type or ""
        if content_type not in ALLOWED_CONTENT_TYPES:
            return Response(
                {
                    "detail": f"Unsupported file type: {content_type}",
                    "allowed": sorted(ALLOWED_CONTENT_TYPES),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if upload.size > MAX_UPLOAD_BYTES:
            return Response(
                {"detail": "File too large. Max 5 MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ext = Path(upload.name).suffix.lower() or ".bin"
        folder = request.data.get("folder", "products")
        key = f"{folder}/{uuid.uuid4().hex}{ext}"

        if _r2_configured():
            try:
                url = _upload_to_r2(upload, key, content_type)
                storage = "r2"
                logger.info("Uploaded to R2: %s", url)
            except (ClientError, BotoCoreError, OSError) as exc:
                logger.exception("R2 upload failed")
                return Response(
                    {
                        "detail": "Cloudflare R2 upload failed. Check R2 credentials, bucket name, and endpoint.",
                        "error": str(exc),
                        "storage": "r2",
                    },
                    status=status.HTTP_502_BAD_GATEWAY,
                )
        else:
            url = _upload_local(upload, key)
            url = request.build_absolute_uri(url)
            storage = "local"
            logger.warning(
                "R2 not configured — saved locally. Set R2_ACCESS_KEY_ID, "
                "R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT_URL in backend/.env and restart Django."
            )

        return Response(
            {
                "url": url,
                "key": key,
                "storage": storage,
                "content_type": content_type,
                "size": upload.size,
            },
            status=status.HTTP_201_CREATED,
        )
