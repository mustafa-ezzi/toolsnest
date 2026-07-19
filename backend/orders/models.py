from django.db import models
from django.utils import timezone

from catalog.models import Product


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        WHATSAPP_ORDER = "whatsapp_order", "WhatsApp Order"
        CONFIRMED = "confirmed", "Confirmed"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    order_number = models.CharField(max_length=32, unique=True, db_index=True)
    customer_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=32)
    address_line = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True, default="")
    postal_code = models.CharField(max_length=32, blank=True, default="")
    area = models.CharField(max_length=120, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.PENDING
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    coupon_code = models.CharField(max_length=40, blank=True, default="")
    total = models.DecimalField(max_digits=12, decimal_places=2)
    source = models.CharField(
        max_length=32,
        default="web",
        help_text="web | whatsapp",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number

    @staticmethod
    def generate_order_number() -> str:
        stamp = timezone.localtime().strftime("%Y%m%d")
        prefix = f"TN-{stamp}-"
        last = (
            Order.objects.filter(order_number__startswith=prefix)
            .order_by("-order_number")
            .first()
        )
        if last:
            try:
                seq = int(last.order_number.rsplit("-", 1)[-1]) + 1
            except ValueError:
                seq = 1
        else:
            seq = 1
        return f"{prefix}{seq:04d}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(
        Product, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    product_name_snapshot = models.CharField(max_length=255)
    sku_snapshot = models.CharField(max_length=64, blank=True, default="")
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.product_name_snapshot} x{self.quantity}"
