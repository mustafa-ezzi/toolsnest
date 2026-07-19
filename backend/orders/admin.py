from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        "product",
        "product_name_snapshot",
        "sku_snapshot",
        "unit_price",
        "quantity",
        "line_total",
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "customer_name",
        "phone",
        "status",
        "total",
        "source",
        "created_at",
    )
    list_filter = ("status", "source", "created_at")
    search_fields = ("order_number", "customer_name", "email", "phone")
    inlines = [OrderItemInline]
    readonly_fields = ("order_number", "subtotal", "total", "created_at", "updated_at")
