import logging
import uuid
from pathlib import Path

from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from media_upload.storage import (
    ALLOWED_CONTENT_TYPES,
    MAX_UPLOAD_BYTES,
    make_object_key,
    r2_configured,
    upload_bytes,
)

logger = logging.getLogger(__name__)


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
        key = make_object_key(folder, filename=f"{uuid.uuid4().hex}{ext}", ext=ext)

        try:
            url, storage = upload_bytes(
                upload.read(),
                key=key,
                content_type=content_type,
                absolute_local=True,
                request=request,
            )
        except Exception as exc:
            if r2_configured():
                return Response(
                    {
                        "detail": "Cloudflare R2 upload failed. Check R2 credentials, bucket name, and endpoint.",
                        "error": str(exc),
                        "storage": "r2",
                    },
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            raise

        if storage == "local":
            logger.warning(
                "R2 not configured — saved locally. Set R2_ACCESS_KEY_ID, "
                "R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT_URL in backend/.env and restart Django."
            )
        else:
            logger.info("Uploaded to R2: %s", url)

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
