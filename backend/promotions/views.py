from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Coupon
from .serializers import CouponSerializer, CouponValidateSerializer


class IsAdminUser(permissions.IsAdminUser):
    pass


class AdminCouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [IsAdminUser]
    search_fields = ["code"]
    ordering_fields = ["created_at", "code", "used_count"]


class ValidateCouponView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"].strip().upper()
        subtotal = serializer.validated_data["subtotal"]

        try:
            coupon = Coupon.objects.get(code__iexact=code)
        except Coupon.DoesNotExist:
            return Response(
                {"detail": "Invalid coupon code."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ok, message = coupon.is_valid_now(subtotal)
        if not ok:
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)

        discount = coupon.calculate_discount(subtotal)
        return Response(
            {
                "code": coupon.code,
                "discount_type": coupon.discount_type,
                "value": str(coupon.value),
                "discount_amount": str(discount),
                "subtotal": str(subtotal),
                "total_after_discount": str(subtotal - discount),
            }
        )
