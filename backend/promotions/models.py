from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Coupon(models.Model):
    class DiscountType(models.TextChoices):
        PERCENT = "percent", "Percent"
        FIXED = "fixed", "Fixed amount"

    code = models.CharField(max_length=40, unique=True)
    discount_type = models.CharField(
        max_length=10, choices=DiscountType.choices, default=DiscountType.PERCENT
    )
    value = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    min_order_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    max_uses = models.PositiveIntegerField(
        null=True, blank=True, help_text="Blank = unlimited"
    )
    used_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.code.upper()

    def save(self, *args, **kwargs):
        self.code = self.code.strip().upper()
        super().save(*args, **kwargs)

    def is_valid_now(self, subtotal: Decimal | None = None) -> tuple[bool, str]:
        if not self.is_active:
            return False, "This coupon is inactive."
        now = timezone.now()
        if self.valid_from and now < self.valid_from:
            return False, "This coupon is not active yet."
        if self.valid_until and now > self.valid_until:
            return False, "This coupon has expired."
        if self.max_uses is not None and self.used_count >= self.max_uses:
            return False, "This coupon has reached its usage limit."
        if subtotal is not None and subtotal < self.min_order_amount:
            return False, f"Minimum order amount is {self.min_order_amount}."
        return True, ""

    def calculate_discount(self, subtotal: Decimal) -> Decimal:
        if self.discount_type == self.DiscountType.PERCENT:
            discount = (subtotal * self.value) / Decimal("100")
        else:
            discount = self.value
        if discount > subtotal:
            discount = subtotal
        return discount.quantize(Decimal("0.01"))
