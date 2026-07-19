import csv

from django.http import HttpResponse
from rest_framework import filters, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Product

from .models import Order
from .serializers import (
    OrderCreateSerializer,
    OrderLookupSerializer,
    OrderSerializer,
    OrderStatusSerializer,
)


class IsAdminUser(permissions.IsAdminUser):
    pass


class CreateOrderView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


class OrderLookupView(APIView):
    """Public order status lookup by email + phone (digits normalized)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OrderLookupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        phone_digits = "".join(
            ch for ch in serializer.validated_data["phone"] if ch.isdigit()
        )

        orders = (
            Order.objects.filter(email__iexact=email)
            .prefetch_related("items")
            .order_by("-created_at")[:20]
        )
        matched = []
        for order in orders:
            order_digits = "".join(ch for ch in order.phone if ch.isdigit())
            # Match last 7+ digits to allow country-code differences
            if phone_digits and order_digits and (
                phone_digits[-7:] == order_digits[-7:]
                or phone_digits == order_digits
            ):
                matched.append(order)

        if not matched:
            return Response(
                {"detail": "No orders found for that email and phone."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(OrderSerializer(matched, many=True).data)


class AdminOrderListView(generics.ListAPIView):
    queryset = Order.objects.prefetch_related("items").all()
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["order_number", "customer_name", "email", "phone"]
    ordering_fields = ["created_at", "total", "status"]


class AdminOrderDetailView(generics.RetrieveDestroyAPIView):
    queryset = Order.objects.prefetch_related("items").all()
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]


class AdminOrderStatusView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order.status = serializer.validated_data["status"]
        order.save(update_fields=["status", "updated_at"])
        return Response(OrderSerializer(order).data)


class AdminOrdersExportCSVView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="orders.csv"'
        writer = csv.writer(response)
        writer.writerow(
            [
                "order_number",
                "customer_name",
                "email",
                "phone",
                "city",
                "status",
                "subtotal",
                "discount",
                "coupon",
                "total",
                "source",
                "created_at",
            ]
        )
        for o in Order.objects.all().order_by("-created_at"):
            writer.writerow(
                [
                    o.order_number,
                    o.customer_name,
                    o.email,
                    o.phone,
                    o.city,
                    o.status,
                    o.subtotal,
                    o.discount_amount,
                    o.coupon_code,
                    o.total,
                    o.source,
                    o.created_at.isoformat(),
                ]
            )
        return response


class AdminProductsExportCSVView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="products.csv"'
        writer = csv.writer(response)
        writer.writerow(
            [
                "sku",
                "name",
                "brand",
                "category",
                "price",
                "compare_at_price",
                "stock_qty",
                "featured",
                "is_active",
            ]
        )
        qs = Product.objects.select_related("brand", "category").all()
        for p in qs:
            writer.writerow(
                [
                    p.sku,
                    p.name,
                    p.brand.name if p.brand else "",
                    p.category.name if p.category else "",
                    p.price,
                    p.compare_at_price or "",
                    p.stock_qty,
                    p.featured,
                    p.is_active,
                ]
            )
        return response


class AdminLowStockView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        threshold = int(request.query_params.get("threshold", 15))
        products = (
            Product.objects.filter(is_active=True, stock_qty__lte=threshold)
            .select_related("brand", "category")
            .order_by("stock_qty")
        )
        from catalog.serializers import ProductListSerializer

        return Response(
            {
                "threshold": threshold,
                "count": products.count(),
                "products": ProductListSerializer(products, many=True).data,
            }
        )
