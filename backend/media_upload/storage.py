"""Shared media upload helpers (R2 + local fallback)."""

from __future__ import annotations

import logging
import uuid
from io import BytesIO
from pathlib import Path

import boto3
from botocore.client import Config
from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


def r2_configured() -> bool:
    return bool(
        settings.R2_ACCESS_KEY_ID
        and settings.R2_SECRET_ACCESS_KEY
        and settings.R2_BUCKET
        and settings.R2_ENDPOINT_URL
    )


def upload_to_r2(file_obj, key: str, content_type: str) -> str:
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


def upload_local(file_obj, key: str) -> str:
    saved_path = default_storage.save(key, file_obj)
    media = settings.MEDIA_URL.rstrip("/")
    return f"{media}/{saved_path}"


def upload_bytes(
    data: bytes,
    *,
    key: str,
    content_type: str = "image/jpeg",
    absolute_local: bool = False,
    request=None,
    retries: int = 3,
) -> tuple[str, str]:
    """Upload raw bytes to R2 (or local). Returns (url, storage)."""
    if len(data) > MAX_UPLOAD_BYTES:
        raise ValueError(f"File too large ({len(data)} bytes). Max {MAX_UPLOAD_BYTES}.")

    if r2_configured():
        last_exc: Exception | None = None
        for attempt in range(1, retries + 1):
            file_obj = BytesIO(data)
            try:
                url = upload_to_r2(file_obj, key, content_type)
                return url, "r2"
            except (ClientError, BotoCoreError, OSError) as exc:
                last_exc = exc
                logger.warning(
                    "R2 upload attempt %s/%s failed for key=%s: %s",
                    attempt,
                    retries,
                    key,
                    exc,
                )
                if attempt < retries:
                    import time

                    time.sleep(1.5 * attempt)
        logger.exception("R2 upload failed for key=%s", key)
        assert last_exc is not None
        raise last_exc

    content = ContentFile(data)
    url = upload_local(content, key)
    if absolute_local and request is not None:
        url = request.build_absolute_uri(url)
    return url, "local"


def make_object_key(folder: str, filename: str | None = None, ext: str = ".jpg") -> str:
    folder = (folder or "products").strip("/") or "products"
    if filename:
        name = Path(filename).name
        if not Path(name).suffix:
            name = f"{name}{ext}"
        return f"{folder}/{name}"
    return f"{folder}/{uuid.uuid4().hex}{ext}"
