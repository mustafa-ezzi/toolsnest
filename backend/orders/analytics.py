from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import Count, Sum
from django.db.models.functions import TruncDate, TruncWeek
from django.utils import timezone
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Product
from orders.models import Order, OrderItem


class DashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        prev_month_end = month_start - timedelta(seconds=1)
        prev_month_start = prev_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        def revenue_between(start, end):
            return (
                Order.objects.filter(
                    created_at__gte=start,
                    created_at__lte=end,
                )
                .exclude(status=Order.Status.CANCELLED)
                .aggregate(total=Sum("total"))["total"]
                or Decimal("0")
            )

        def orders_between(start, end):
            return Order.objects.filter(
                created_at__gte=start, created_at__lte=end
            ).count()

        revenue_this = revenue_between(month_start, now)
        revenue_prev = revenue_between(prev_month_start, prev_month_end)
        orders_this = orders_between(month_start, now)
        orders_prev = orders_between(prev_month_start, prev_month_end)

        def pct_change(current, previous):
            if previous == 0:
                return 100.0 if current > 0 else 0.0
            return float((current - previous) / previous * 100)

        total_revenue = (
            Order.objects.exclude(status=Order.Status.CANCELLED).aggregate(
                total=Sum("total")
            )["total"]
            or Decimal("0")
        )

        # Daily sales — last 7 days
        week_ago = now - timedelta(days=6)
        daily_qs = (
            Order.objects.filter(created_at__date__gte=week_ago.date())
            .exclude(status=Order.Status.CANCELLED)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(orders=Count("id"), revenue=Sum("total"))
            .order_by("day")
        )
        daily_map = {row["day"]: row for row in daily_qs}
        daily_sales = []
        for i in range(7):
            d = (week_ago + timedelta(days=i)).date()
            row = daily_map.get(d, {})
            daily_sales.append(
                {
                    "day": d.strftime("%a"),
                    "date": d.isoformat(),
                    "orders": row.get("orders", 0),
                    "revenue": float(row.get("revenue") or 0),
                }
            )

        # Weekly revenue — last 4 weeks
        four_weeks_ago = now - timedelta(weeks=4)
        weekly_qs = (
            Order.objects.filter(created_at__gte=four_weeks_ago)
            .exclude(status=Order.Status.CANCELLED)
            .annotate(week=TruncWeek("created_at"))
            .values("week")
            .annotate(revenue=Sum("total"))
            .order_by("week")
        )
        weekly_revenue = [
            {
                "week": f"Week {idx + 1}",
                "revenue": float(row["revenue"] or 0),
            }
            for idx, row in enumerate(weekly_qs)
        ]
        while len(weekly_revenue) < 4:
            weekly_revenue.append(
                {"week": f"Week {len(weekly_revenue) + 1}", "revenue": 0}
            )

        low_stock_threshold = 15
        products_count = Product.objects.filter(is_active=True).count()
        low_stock_count = Product.objects.filter(
            is_active=True, stock_qty__lte=low_stock_threshold
        ).count()
        pending_orders = Order.objects.filter(status=Order.Status.PENDING).count()

        return Response(
            {
                "total_revenue": float(total_revenue),
                "revenue_this_month": float(revenue_this),
                "revenue_change_pct": round(pct_change(revenue_this, revenue_prev), 1),
                "orders_count": Order.objects.count(),
                "orders_this_month": orders_this,
                "orders_change_pct": round(pct_change(orders_this, orders_prev), 1),
                "products_count": products_count,
                "low_stock_count": low_stock_count,
                "pending_orders": pending_orders,
                "daily_sales": daily_sales,
                "weekly_revenue": weekly_revenue[:4],
            }
        )


class SalesReportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        now = timezone.now()

        if date_from:
            start = datetime.fromisoformat(date_from)
            if timezone.is_naive(start):
                start = timezone.make_aware(start)
        else:
            start = now - timedelta(days=30)

        if date_to:
            end = datetime.fromisoformat(date_to)
            if timezone.is_naive(end):
                end = timezone.make_aware(end)
            end = end.replace(hour=23, minute=59, second=59)
        else:
            end = now

        orders = Order.objects.filter(
            created_at__gte=start, created_at__lte=end
        ).exclude(status=Order.Status.CANCELLED)

        revenue = orders.aggregate(total=Sum("total"))["total"] or Decimal("0")
        order_count = orders.count()

        top_products = (
            OrderItem.objects.filter(order__in=orders)
            .values("product_name_snapshot", "sku_snapshot")
            .annotate(
                quantity_sold=Sum("quantity"),
                revenue=Sum("line_total"),
            )
            .order_by("-revenue")[:10]
        )

        return Response(
            {
                "from": start.date().isoformat(),
                "to": end.date().isoformat(),
                "revenue": float(revenue),
                "order_count": order_count,
                "top_products": [
                    {
                        "name": row["product_name_snapshot"],
                        "sku": row["sku_snapshot"],
                        "quantity_sold": row["quantity_sold"],
                        "revenue": float(row["revenue"] or 0),
                    }
                    for row in top_products
                ],
            }
        )
