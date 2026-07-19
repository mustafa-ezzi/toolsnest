from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from catalog.models import Product
from promotions.models import Coupon

from .models import Order, OrderItem


class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    customer_name = serializers.CharField(min_length=2, max_length=100)
    email = serializers.EmailField()
    phone = serializers.CharField(min_length=7, max_length=32)
    address_line = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(required=False, allow_blank=True, max_length=100)
    postal_code = serializers.CharField(required=False, allow_blank=True, max_length=32)
    area = serializers.CharField(required=False, allow_blank=True, max_length=120)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)
    coupon_code = serializers.CharField(required=False, allow_blank=True, max_length=40)
    source = serializers.ChoiceField(
        choices=["web", "whatsapp"], required=False, default="web"
    )
    items = OrderItemCreateSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Cart must contain at least one item.")
        return value

    def validate_phone(self, value):
        cleaned = value.strip()
        digits = "".join(ch for ch in cleaned if ch.isdigit() or ch == "+")
        if len(digits.replace("+", "")) < 7:
            raise serializers.ValidationError("Enter a valid phone number.")
        return cleaned

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        coupon_code = (validated_data.pop("coupon_code", "") or "").strip().upper()
        product_ids = [i["product_id"] for i in items_data]
        products = {
            p.id: p
            for p in Product.objects.filter(id__in=product_ids, is_active=True)
        }

        line_items = []
        subtotal = Decimal("0.00")
        for row in items_data:
            product = products.get(row["product_id"])
            if not product:
                raise serializers.ValidationError(
                    {"items": f"Product {row['product_id']} is unavailable."}
                )
            qty = row["quantity"]
            unit = product.price
            line_total = unit * qty
            subtotal += line_total
            line_items.append(
                {
                    "product": product,
                    "product_name_snapshot": product.name,
                    "sku_snapshot": product.sku,
                    "unit_price": unit,
                    "quantity": qty,
                    "line_total": line_total,
                }
            )

        discount = Decimal("0.00")
        applied_code = ""
        coupon = None
        if coupon_code:
            try:
                coupon = Coupon.objects.select_for_update().get(code__iexact=coupon_code)
            except Coupon.DoesNotExist:
                raise serializers.ValidationError(
                    {"coupon_code": "Invalid coupon code."}
                )
            ok, message = coupon.is_valid_now(subtotal)
            if not ok:
                raise serializers.ValidationError({"coupon_code": message})
            discount = coupon.calculate_discount(subtotal)
            applied_code = coupon.code

        total = subtotal - discount
        source = validated_data.get("source", "web")
        initial_status = (
            Order.Status.WHATSAPP_ORDER
            if source == "whatsapp"
            else Order.Status.PENDING
        )

        order = Order.objects.create(
            order_number=Order.generate_order_number(),
            customer_name=validated_data["customer_name"],
            email=validated_data["email"],
            phone=validated_data["phone"],
            address_line=validated_data["address_line"],
            city=validated_data["city"],
            state=validated_data.get("state", ""),
            postal_code=validated_data.get("postal_code", ""),
            area=validated_data.get("area", ""),
            notes=validated_data.get("notes", ""),
            source=source,
            subtotal=subtotal,
            discount_amount=discount,
            coupon_code=applied_code,
            total=total,
            status=initial_status,
        )

        OrderItem.objects.bulk_create(
            [OrderItem(order=order, **item) for item in line_items]
        )

        if coupon and discount > 0:
            coupon.used_count += 1
            coupon.save(update_fields=["used_count", "updated_at"])

        return order


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name_snapshot",
            "sku_snapshot",
            "unit_price",
            "quantity",
            "line_total",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "customer_name",
            "email",
            "phone",
            "address_line",
            "city",
            "state",
            "postal_code",
            "area",
            "notes",
            "status",
            "subtotal",
            "discount_amount",
            "coupon_code",
            "total",
            "source",
            "items",
            "created_at",
            "updated_at",
        ]


class OrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)


class OrderLookupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    phone = serializers.CharField(min_length=7, max_length=32)
