from django.urls import path

from .analytics import DashboardView, SalesReportView
from .views import (
    AdminLowStockView,
    AdminOrderDetailView,
    AdminOrderListView,
    AdminOrdersExportCSVView,
    AdminOrderStatusView,
    AdminProductsExportCSVView,
    CreateOrderView,
    OrderLookupView,
)

urlpatterns = [
    path("orders/", CreateOrderView.as_view(), name="order-create"),
    path("orders/lookup/", OrderLookupView.as_view(), name="order-lookup"),
    path("admin/dashboard/", DashboardView.as_view(), name="admin-dashboard"),
    path("admin/reports/sales/", SalesReportView.as_view(), name="admin-sales-report"),
    path("admin/orders/", AdminOrderListView.as_view(), name="admin-order-list"),
    path(
        "admin/orders/export/",
        AdminOrdersExportCSVView.as_view(),
        name="admin-orders-export",
    ),
    path(
        "admin/products/export/",
        AdminProductsExportCSVView.as_view(),
        name="admin-products-export",
    ),
    path("admin/low-stock/", AdminLowStockView.as_view(), name="admin-low-stock"),
    path(
        "admin/orders/<int:pk>/",
        AdminOrderDetailView.as_view(),
        name="admin-order-detail",
    ),
    path(
        "admin/orders/<int:pk>/status/",
        AdminOrderStatusView.as_view(),
        name="admin-order-status",
    ),
]
