import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from catalog.models import Banner, Brand, Category, Product, ProductImage


BRANDS = [
    {
        "name": "Total",
        "primary_color": "#117076",
        "secondary_color": "#0B5559",
        "sort_order": 1,
        "logo_url": "https://placehold.co/200x80/117076/ffffff?text=TOTAL",
    },
    {
        "name": "Ingco",
        "primary_color": "#E30613",
        "secondary_color": "#9B0000",
        "sort_order": 2,
        "logo_url": "https://placehold.co/200x80/E30613/ffffff?text=INGCO",
    },
    {
        "name": "Makita",
        "primary_color": "#003DA5",
        "secondary_color": "#00A3E0",
        "sort_order": 3,
        "logo_url": "https://placehold.co/200x80/003DA5/ffffff?text=MAKITA",
    },
    {
        "name": "DeWalt",
        "primary_color": "#FFCC00",
        "secondary_color": "#1D1D1D",
        "sort_order": 4,
        "logo_url": "https://placehold.co/200x80/FFCC00/1D1D1D?text=DeWALT",
    },
    {
        "name": "Stanley",
        "primary_color": "#1D1D1D",
        "secondary_color": "#FFD100",
        "sort_order": 5,
        "logo_url": "https://placehold.co/200x80/1D1D1D/FFD100?text=STANLEY",
    },
]

CATEGORIES = [
    "Power Tools",
    "Hand Tools",
    "Measuring",
    "Safety",
    "Electrical",
    "Fasteners",
]

PRODUCTS = [
    {
        "name": "Total Cordless Drill 20V",
        "sku": "TTL-CD-20V-001",
        "brand": "Total",
        "category": "Power Tools",
        "price": "8999.00",
        "compare_at_price": "10999.00",
        "stock_qty": 40,
        "featured": True,
        "description": "Compact 20V cordless drill with 2 batteries and charger.",
        "specs": {"voltage": "20V", "chuck": "10mm", "battery": "2x 1.5Ah"},
        "image": "https://placehold.co/600x600/117076/ffffff?text=Drill",
    },
    {
        "name": "Total Angle Grinder 850W",
        "sku": "TTL-AG-850-002",
        "brand": "Total",
        "category": "Power Tools",
        "price": "5499.00",
        "stock_qty": 25,
        "featured": True,
        "description": "850W angle grinder for metal and masonry cutting.",
        "specs": {"power": "850W", "disc": "115mm"},
        "image": "https://placehold.co/600x600/117076/ffffff?text=Grinder",
    },
    {
        "name": "Ingco Combination Pliers 8in",
        "sku": "ING-PL-8-001",
        "brand": "Ingco",
        "category": "Hand Tools",
        "price": "1299.00",
        "stock_qty": 100,
        "featured": True,
        "description": "Heavy-duty combination pliers with insulated grip.",
        "specs": {"length": "8 inch", "material": "CR-V"},
        "image": "https://placehold.co/600x600/E30613/ffffff?text=Pliers",
    },
    {
        "name": "Ingco Socket Set 94pcs",
        "sku": "ING-SS-94-002",
        "brand": "Ingco",
        "category": "Hand Tools",
        "price": "7999.00",
        "compare_at_price": "9499.00",
        "stock_qty": 18,
        "featured": False,
        "description": "94-piece chrome vanadium socket set in blow-mold case.",
        "specs": {"pieces": 94, "drive": "1/4 and 1/2"},
        "image": "https://placehold.co/600x600/E30613/ffffff?text=Sockets",
    },
    {
        "name": "Makita Circular Saw 185mm",
        "sku": "MKT-CS-185-001",
        "brand": "Makita",
        "category": "Power Tools",
        "price": "24999.00",
        "stock_qty": 12,
        "featured": True,
        "description": "Professional circular saw with magnesium base.",
        "specs": {"blade": "185mm", "power": "1800W"},
        "image": "https://placehold.co/600x600/003DA5/ffffff?text=Saw",
    },
    {
        "name": "Makita Laser Distance Meter",
        "sku": "MKT-LD-50-002",
        "brand": "Makita",
        "category": "Measuring",
        "price": "11999.00",
        "stock_qty": 30,
        "featured": False,
        "description": "50m laser distance meter with backlight display.",
        "specs": {"range": "50m", "accuracy": "+/-1.5mm"},
        "image": "https://placehold.co/600x600/003DA5/ffffff?text=Laser",
    },
    {
        "name": "DeWalt Impact Driver 20V",
        "sku": "DWT-ID-20V-001",
        "brand": "DeWalt",
        "category": "Power Tools",
        "price": "27999.00",
        "stock_qty": 15,
        "featured": True,
        "description": "Brushless impact driver with belt hook and LED.",
        "specs": {"voltage": "20V MAX", "torque": "1825 in-lbs"},
        "image": "https://placehold.co/600x600/FFCC00/1D1D1D?text=Impact",
    },
    {
        "name": "DeWalt Safety Glasses Clear",
        "sku": "DWT-SG-CLR-002",
        "brand": "DeWalt",
        "category": "Safety",
        "price": "1499.00",
        "stock_qty": 80,
        "featured": False,
        "description": "Anti-fog clear safety glasses, ANSI Z87.1 rated.",
        "specs": {"rating": "ANSI Z87.1", "lens": "Clear"},
        "image": "https://placehold.co/600x600/FFCC00/1D1D1D?text=Glasses",
    },
    {
        "name": "Stanley FatMax Tape 8m",
        "sku": "STN-TP-8M-001",
        "brand": "Stanley",
        "category": "Measuring",
        "price": "2199.00",
        "stock_qty": 60,
        "featured": True,
        "description": "8m FatMax tape measure with blade armor coating.",
        "specs": {"length": "8m", "blade_width": "32mm"},
        "image": "https://placehold.co/600x600/1D1D1D/FFD100?text=Tape",
    },
    {
        "name": "Stanley Claw Hammer 16oz",
        "sku": "STN-HM-16-002",
        "brand": "Stanley",
        "category": "Hand Tools",
        "price": "1899.00",
        "stock_qty": 45,
        "featured": False,
        "description": "16oz steel claw hammer with comfort grip.",
        "specs": {"weight": "16oz", "face": "Smooth"},
        "image": "https://placehold.co/600x600/1D1D1D/FFD100?text=Hammer",
    },
]

BANNERS = [
    {
        "title": "Pro Tools. Honest Prices.",
        "subtitle": "Shop Total, Makita, DeWalt and more at ToolsNest.",
        "image_url": "https://placehold.co/1600x700/0F4C5C/ffffff?text=ToolsNest+Hero",
        "cta_label": "Shop Products",
        "cta_url": "/products",
        "sort_order": 1,
    },
    {
        "title": "Total Power Tools",
        "subtitle": "Workshop essentials in signature teal.",
        "image_url": "https://placehold.co/1600x700/117076/ffffff?text=Total+Collection",
        "cta_label": "View Total",
        "cta_url": "/products?brand=total",
        "sort_order": 2,
    },
    {
        "title": "DeWalt Performance",
        "subtitle": "Jobsite ready. Built tough.",
        "image_url": "https://placehold.co/1600x700/FFCC00/1D1D1D?text=DeWalt+Collection",
        "cta_label": "Shop DeWalt",
        "cta_url": "/products?brand=dewalt",
        "sort_order": 3,
    },
]


class Command(BaseCommand):
    help = "Seed brands, categories, products, banners, and an admin user."

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.getenv("ADMIN_USERNAME", "admin")
        email = os.getenv("ADMIN_EMAIL", "admin@toolsnest.tools")
        password = os.getenv("ADMIN_PASSWORD", "admin123")

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "is_staff": True, "is_superuser": True},
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Created admin user `{username}`"))
        else:
            user.is_staff = True
            user.is_superuser = True
            user.email = email
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.WARNING(f"Updated admin user `{username}`"))

        brand_map = {}
        for data in BRANDS:
            brand, _ = Brand.objects.update_or_create(
                name=data["name"],
                defaults={
                    "primary_color": data["primary_color"],
                    "secondary_color": data["secondary_color"],
                    "sort_order": data["sort_order"],
                    "logo_url": data["logo_url"],
                    "is_active": True,
                },
            )
            brand_map[brand.name] = brand
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(brand_map)} brands"))

        category_map = {}
        for name in CATEGORIES:
            cat, _ = Category.objects.update_or_create(
                name=name, defaults={"is_active": True}
            )
            category_map[name] = cat
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(category_map)} categories"))

        for data in PRODUCTS:
            product, _ = Product.objects.update_or_create(
                sku=data["sku"],
                defaults={
                    "name": data["name"],
                    "brand": brand_map[data["brand"]],
                    "category": category_map[data["category"]],
                    "price": data["price"],
                    "compare_at_price": data.get("compare_at_price"),
                    "stock_qty": data["stock_qty"],
                    "featured": data["featured"],
                    "description": data["description"],
                    "specs": data["specs"],
                    "is_active": True,
                },
            )
            if not product.images.exists():
                ProductImage.objects.create(
                    product=product,
                    url=data["image"],
                    alt=product.name,
                    sort_order=0,
                )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(PRODUCTS)} products"))

        for data in BANNERS:
            Banner.objects.update_or_create(
                title=data["title"],
                defaults={
                    "subtitle": data["subtitle"],
                    "image_url": data["image_url"],
                    "cta_label": data["cta_label"],
                    "cta_url": data["cta_url"],
                    "sort_order": data["sort_order"],
                    "is_active": True,
                },
            )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(BANNERS)} banners"))
        self.stdout.write(self.style.SUCCESS("Catalog seed complete."))
