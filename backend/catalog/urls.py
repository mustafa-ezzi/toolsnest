from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

admin_router = DefaultRouter()
admin_router.register("brands", views.AdminBrandViewSet, basename="admin-brands")
admin_router.register(
    "categories", views.AdminCategoryViewSet, basename="admin-categories"
)
admin_router.register("banners", views.AdminBannerViewSet, basename="admin-banners")
admin_router.register("products", views.AdminProductViewSet, basename="admin-products")

urlpatterns = [
    path("health/", views.HealthView.as_view(), name="health"),
    path("brands/", views.BrandListView.as_view(), name="brand-list"),
    path("categories/", views.CategoryListView.as_view(), name="category-list"),
    path("banners/", views.BannerListView.as_view(), name="banner-list"),
    path("products/", views.ProductListView.as_view(), name="product-list"),
    path(
        "products/<slug:slug>/",
        views.ProductDetailView.as_view(),
        name="product-detail",
    ),
    path(
        "products/<slug:slug>/related/",
        views.RelatedProductsView.as_view(),
        name="product-related",
    ),
    path("admin/", include(admin_router.urls)),
]
