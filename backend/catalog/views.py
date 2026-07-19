from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

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
