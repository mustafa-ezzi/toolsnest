import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    brand = django_filters.CharFilter(field_name="brand__slug")
    category = django_filters.CharFilter(field_name="category__slug")
    featured = django_filters.BooleanFilter(field_name="featured")
    is_active = django_filters.BooleanFilter(field_name="is_active")

    class Meta:
        model = Product
        fields = ["brand", "category", "featured", "is_active"]
