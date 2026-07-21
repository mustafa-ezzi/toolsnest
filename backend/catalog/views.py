from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, permissions, status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .excel_import import import_products
from .filters import ProductFilter
from .models import Banner, Brand, Category, Product
from .serializers import (
    BannerSerializer,
    BrandSerializer,
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


class IsAdminUser(permissions.IsAdminUser):
    """Staff/admin only (JWT-authenticated)."""


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"status": "ok", "service": "toolsnest-api"})


# ---------- Public read ----------


class BrandListView(generics.ListAPIView):
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
    pagination_class = None


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    pagination_class = None


class BannerListView(generics.ListAPIView):
    queryset = Banner.objects.filter(is_active=True)
    serializer_class = BannerSerializer
    pagination_class = None


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    filterset_class = ProductFilter
    search_fields = ["name", "sku", "description"]
    ordering_fields = ["price", "created_at", "name"]

    def get_queryset(self):
        return (
            Product.objects.filter(is_active=True)
            .select_related("brand", "category")
            .prefetch_related("images")
        )


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Product.objects.filter(is_active=True)
            .select_related("brand", "category")
            .prefetch_related("images")
        )


class RelatedProductsView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    pagination_class = None

    def get_queryset(self):
        slug = self.kwargs["slug"]
        try:
            product = Product.objects.select_related("brand", "category").get(
                slug=slug, is_active=True
            )
        except Product.DoesNotExist:
            return Product.objects.none()

        qs = (
            Product.objects.filter(is_active=True)
            .exclude(pk=product.pk)
            .select_related("brand", "category")
            .prefetch_related("images")
        )
        related = qs.filter(brand=product.brand)
        if product.category_id:
            related = related | qs.filter(category=product.category)
        return related.distinct()[:8]


# ---------- Admin CRUD ----------


class AdminBrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [IsAdminUser]
    search_fields = ["name", "slug"]
    ordering_fields = ["sort_order", "name", "created_at"]


class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]
    search_fields = ["name", "slug"]


class AdminBannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [IsAdminUser]
    ordering_fields = ["sort_order", "created_at"]


class AdminProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    filterset_class = ProductFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["name", "sku", "description"]
    ordering_fields = ["price", "created_at", "name", "stock_qty"]

    def get_queryset(self):
        return Product.objects.select_related("brand", "category").prefetch_related(
            "images"
        )

    def get_serializer_class(self):
        if self.action in ("retrieve", "create", "update", "partial_update"):
            return ProductDetailSerializer
        return ProductListSerializer


class AdminExcelProductImportView(APIView):
    """Multipart Excel import: data workbook + optional images workbook → R2."""

    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    # Soft caps so browser uploads stay manageable; full catalog → CLI.
    MAX_DATA_BYTES = 25 * 1024 * 1024
    MAX_IMAGES_BYTES = 80 * 1024 * 1024

    def post(self, request):
        data_file = request.FILES.get("file") or request.FILES.get("data")
        if not data_file:
            return Response(
                {"detail": "Upload a data Excel file as 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name = (data_file.name or "").lower()
        if not name.endswith((".xlsx", ".xlsm", ".xls", ".csv")):
            return Response(
                {"detail": "Data file must be .xlsx, .xlsm, or .csv."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if data_file.size and data_file.size > self.MAX_DATA_BYTES:
            return Response(
                {
                    "detail": (
                        f"Data file too large ({data_file.size // (1024 * 1024)} MB). "
                        "Use the CLI importer for full catalogs."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        images_file = request.FILES.get("images") or request.FILES.get("images_file")
        if images_file:
            iname = (images_file.name or "").lower()
            if not iname.endswith((".xlsx", ".xlsm", ".xls")):
                return Response(
                    {"detail": "Images file must be .xlsx or .xlsm."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if images_file.size and images_file.size > self.MAX_IMAGES_BYTES:
                return Response(
                    {
                        "detail": (
                            f"Images file too large ({images_file.size // (1024 * 1024)} MB). "
                            "Use the CLI importer for full catalogs with embedded pictures."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        def flag(key: str, default: bool = False) -> bool:
            raw = request.data.get(key)
            if raw is None or raw == "":
                return default
            return str(raw).strip().lower() in ("1", "true", "yes", "on")

        def opt_int(key: str) -> int | None:
            raw = request.data.get(key)
            if raw is None or raw == "":
                return None
            try:
                n = int(raw)
                return n if n > 0 else None
            except (TypeError, ValueError):
                return None

        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory(prefix="excel_import_") as tmp:
            tmp_path = Path(tmp)
            data_path = tmp_path / (data_file.name or "data.xlsx")
            with open(data_path, "wb") as out:
                for chunk in data_file.chunks():
                    out.write(chunk)

            images_path = None
            if images_file:
                images_path = tmp_path / (images_file.name or "images.xlsm")
                with open(images_path, "wb") as out:
                    for chunk in images_file.chunks():
                        out.write(chunk)

            try:
                result = import_products(
                    data_path=data_path,
                    images_path=images_path,
                    data_sheet=(request.data.get("sheet") or "").strip() or None,
                    images_sheet=(request.data.get("images_sheet") or "").strip()
                    or None,
                    default_brand=(request.data.get("default_brand") or "Total").strip()
                    or "Total",
                    default_category=(request.data.get("default_category") or "").strip(),
                    default_stock=opt_int("default_stock") or 10,
                    limit=opt_int("limit"),
                    skip_images=flag("skip_images"),
                    update_images=flag("update_images"),
                    dry_run=flag("dry_run"),
                )
            except ValueError as exc:
                return Response(
                    {"detail": str(exc)},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            except Exception as exc:
                return Response(
                    {"detail": f"Import failed: {exc}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(result.as_dict(), status=status.HTTP_200_OK)
