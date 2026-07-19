from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminCouponViewSet, ValidateCouponView

router = DefaultRouter()
router.register("coupons", AdminCouponViewSet, basename="admin-coupons")

urlpatterns = [
    path("coupons/validate/", ValidateCouponView.as_view(), name="coupon-validate"),
    path("admin/", include(router.urls)),
]
