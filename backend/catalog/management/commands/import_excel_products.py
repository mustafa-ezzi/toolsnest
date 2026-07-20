"""Import products from categorized Excel + embedded images from original .xlsm."""

from __future__ import annotations

import mimetypes
from decimal import Decimal, InvalidOperation
from io import BytesIO
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify
from PIL import Image as PilImage

from catalog.models import Brand, Category, Product, ProductImage
from media_upload.storage import make_object_key, r2_configured, upload_bytes

REPO_ROOT = Path(settings.BASE_DIR).resolve().parent
DEFAULT_XLSX = REPO_ROOT / "docs" / "updated-total-products-with-category.xlsx"
DEFAULT_XLSM = REPO_ROOT / "docs" / "updated total products.xlsm"

BRAND_COLORS = {
    "total": ("#117076", "#0B5559"),
    "ingco": ("#E30613", "#9B0000"),
    "makita": ("#003DA5", "#00A3E0"),
    "dewalt": ("#FFCC00", "#1D1D1D"),
    "stanley": ("#1D1D1D", "#FFD100"),
}


class Command(BaseCommand):
    help = (
        "Import products from categorized Excel; extract pictures from the "
        "original .xlsm and upload them to R2 (or local media)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--xlsx",
            type=str,
            default=str(DEFAULT_XLSX),
            help="Clean categorized workbook (data only).",
        )
        parser.add_argument(
            "--images-xlsm",
            type=str,
            default=str(DEFAULT_XLSM),
            help="Original workbook with embedded pictures.",
        )
        parser.add_argument("--sheet", type=str, default="Products")
        parser.add_argument("--images-sheet", type=str, default="Offers")
        parser.add_argument("--default-stock", type=int, default=10)
        parser.add_argument("--limit", type=int, default=0, help="Import only first N rows.")
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--skip-images", action="store_true")
        parser.add_argument(
            "--update-images",
            action="store_true",
            help="Replace existing product images (default: only add if missing).",
        )

    def handle(self, *args, **options):
        try:
            import openpyxl
        except ImportError as exc:
            raise CommandError(
                "openpyxl is required. Install with: pip install openpyxl"
            ) from exc

        xlsx_path = Path(options["xlsx"])
        xlsm_path = Path(options["images_xlsm"])
        if not xlsx_path.exists():
            raise CommandError(f"Data file not found: {xlsx_path}")

        dry_run = options["dry_run"]
        skip_images = options["skip_images"]
        update_images = options["update_images"]
        limit = options["limit"] or None
        default_stock = options["default_stock"]

        self.stdout.write(f"Reading products from {xlsx_path}")
        rows = self._load_product_rows(openpyxl, xlsx_path, options["sheet"], limit)
        self.stdout.write(f"Loaded {len(rows)} product rows")

        images_by_sku: dict[str, bytes] = {}
        if not skip_images:
            if not xlsm_path.exists():
                self.stderr.write(
                    self.style.WARNING(
                        f"Images workbook missing ({xlsm_path}); continuing without images."
                    )
                )
            else:
                self.stdout.write(f"Extracting images from {xlsm_path} (this can take a minute)…")
                images_by_sku = self._extract_images_by_sku(
                    openpyxl, xlsm_path, options["images_sheet"]
                )
                self.stdout.write(f"Matched images for {len(images_by_sku)} SKUs")

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — no database or upload changes"))

        if not dry_run and not skip_images:
            storage = "r2" if r2_configured() else "local"
            self.stdout.write(f"Image storage: {storage}")

        created = updated = images_ok = images_skip = images_fail = 0
        missing_image = 0

        for i, row in enumerate(rows, start=1):
            sku = row["sku"]
            try:
                brand = self._get_or_create_brand(row["brand"], dry_run=dry_run)
                category = self._get_or_create_category(row["category"], dry_run=dry_run)
            except Exception as exc:
                self.stderr.write(f"[{i}] {sku}: brand/category error: {exc}")
                continue

            defaults = {
                "name": row["name"],
                "description": row["description"],
                "price": row["price"],
                "brand": brand,
                "category": category,
                "stock_qty": default_stock,
                "is_active": True,
                "featured": False,
            }

            if dry_run:
                exists = Product.objects.filter(sku=sku).exists()
                if exists:
                    updated += 1
                    action = "update"
                else:
                    created += 1
                    action = "create"
                has_img = sku in images_by_sku
                if not skip_images and not has_img:
                    missing_image += 1
                self.stdout.write(
                    f"[{i}/{len(rows)}] {action} {sku} — {row['name'][:50]} "
                    f"| img={'yes' if has_img else 'no'}"
                )
                continue

            with transaction.atomic():
                product, was_created = Product.objects.update_or_create(
                    sku=sku, defaults=defaults
                )
            if was_created:
                created += 1
            else:
                updated += 1

            if skip_images:
                if i % 25 == 0 or i == len(rows):
                    self.stdout.write(f"Progress {i}/{len(rows)}…")
                continue

            img_bytes = images_by_sku.get(sku)
            if not img_bytes:
                missing_image += 1
                if i % 25 == 0 or i == len(rows):
                    self.stdout.write(f"Progress {i}/{len(rows)}…")
                continue

            has_existing = product.images.exists()
            if has_existing and not update_images:
                images_skip += 1
                if i % 25 == 0 or i == len(rows):
                    self.stdout.write(f"Progress {i}/{len(rows)}…")
                continue

            try:
                url = self._upload_product_image(sku, img_bytes)
                if has_existing and update_images:
                    product.images.all().delete()
                ProductImage.objects.create(
                    product=product,
                    url=url,
                    alt=product.name,
                    sort_order=0,
                )
                images_ok += 1
            except Exception as exc:
                images_fail += 1
                self.stderr.write(f"[{i}] {sku}: image upload failed: {exc}")

            if i % 25 == 0 or i == len(rows):
                self.stdout.write(
                    f"Progress {i}/{len(rows)} "
                    f"(created={created} updated={updated} imgs={images_ok})…"
                )

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Import complete"))
        self.stdout.write(f"  Products created: {created}")
        self.stdout.write(f"  Products updated: {updated}")
        if not skip_images:
            self.stdout.write(f"  Images uploaded:  {images_ok}")
            self.stdout.write(f"  Images skipped:   {images_skip} (already had image)")
            self.stdout.write(f"  Images failed:    {images_fail}")
            self.stdout.write(f"  Missing in xlsm:  {missing_image}")

    def _load_product_rows(self, openpyxl, path: Path, sheet_name: str, limit: int | None):
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        if sheet_name not in wb.sheetnames:
            raise CommandError(
                f"Sheet '{sheet_name}' not found. Available: {wb.sheetnames}"
            )
        ws = wb[sheet_name]
        rows_iter = ws.iter_rows(values_only=True)
        try:
            headers = [str(h or "").strip() for h in next(rows_iter)]
        except StopIteration as exc:
            raise CommandError("Workbook is empty") from exc

        col = {h.lower(): i for i, h in enumerate(headers)}

        def req(*names):
            for name in names:
                if name.lower() in col:
                    return col[name.lower()]
            raise CommandError(f"Missing column (tried {names}). Headers: {headers}")

        idx_sku = req("SKU", "TOTAL Item No.")
        idx_name = req("Product name", "Product Name")
        idx_desc = col.get("description & features", col.get("description"))
        idx_price = req("Selling Price", "Price")
        idx_brand = req("Brand")
        idx_category = req("Category")

        out = []
        for raw in rows_iter:
            if limit is not None and len(out) >= limit:
                break
            sku = self._cell_str(raw[idx_sku] if idx_sku < len(raw) else None)
            if not sku:
                continue
            name = self._cell_str(raw[idx_name] if idx_name < len(raw) else None)
            if not name:
                self.stderr.write(f"Skip {sku}: empty name")
                continue
            price_raw = raw[idx_price] if idx_price < len(raw) else None
            try:
                price = Decimal(str(price_raw).replace(",", "").strip())
            except (InvalidOperation, AttributeError, TypeError):
                self.stderr.write(f"Skip {sku}: bad price {price_raw!r}")
                continue
            if price <= 0:
                self.stderr.write(f"Skip {sku}: non-positive price {price}")
                continue

            desc = ""
            if idx_desc is not None and idx_desc < len(raw):
                desc = self._cell_str(raw[idx_desc])

            brand = self._cell_str(raw[idx_brand] if idx_brand < len(raw) else None) or "Total"
            category = self._cell_str(
                raw[idx_category] if idx_category < len(raw) else None
            )

            out.append(
                {
                    "sku": sku,
                    "name": name,
                    "description": desc,
                    "price": price,
                    "brand": brand,
                    "category": category,
                }
            )
        wb.close()
        return out

    def _extract_images_by_sku(self, openpyxl, path: Path, sheet_name: str) -> dict[str, bytes]:
        # Keep drawings; do not use read_only.
        wb = openpyxl.load_workbook(path, data_only=True)
        if sheet_name not in wb.sheetnames:
            raise CommandError(
                f"Images sheet '{sheet_name}' not found. Available: {wb.sheetnames}"
            )
        ws = wb[sheet_name]

        # SKU is column A; data starts at row 3 in the Total Offers sheet.
        sku_by_row: dict[int, str] = {}
        for r in range(3, ws.max_row + 1):
            sku = self._cell_str(ws.cell(r, 1).value)
            if sku:
                sku_by_row[r] = sku

        by_sku: dict[str, bytes] = {}
        images = list(getattr(ws, "_images", []) or [])
        for img in images:
            anchor = getattr(img, "anchor", None)
            marker = getattr(anchor, "_from", None) if anchor is not None else None
            if marker is None:
                continue
            # AnchorMarker.row is 0-based → Excel 1-based row
            excel_row = int(marker.row) + 1
            sku = sku_by_row.get(excel_row)
            if not sku or sku in by_sku:
                continue
            try:
                data = img._data()
            except Exception:
                continue
            if data:
                by_sku[sku] = data
        wb.close()
        return by_sku

    def _normalize_image_bytes(self, data: bytes) -> bytes:
        """Convert to JPEG under 5 MB when needed; pass through small JPEGs."""
        max_bytes = 5 * 1024 * 1024
        if data[:3] == b"\xff\xd8\xff" and len(data) <= max_bytes:
            return data
        if data[:8] == b"\x89PNG\r\n\x1a\n" and len(data) <= max_bytes:
            return data

        with PilImage.open(BytesIO(data)) as im:
            if im.mode in ("RGBA", "P", "LA"):
                background = PilImage.new("RGB", im.size, (255, 255, 255))
                rgba = im.convert("RGBA")
                background.paste(rgba, mask=rgba.split()[-1])
                im = background
            elif im.mode != "RGB":
                im = im.convert("RGB")

            quality = 85
            out = data
            while quality >= 50:
                buf = BytesIO()
                im.save(buf, format="JPEG", quality=quality, optimize=True)
                out = buf.getvalue()
                if len(out) <= max_bytes:
                    return out
                quality -= 10
            return out

    def _upload_product_image(self, sku: str, data: bytes) -> str:
        try:
            data = self._normalize_image_bytes(data)
        except Exception:
            pass
        safe = slugify(sku) or "product"
        key = make_object_key("products", filename=f"{safe}.jpg", ext=".jpg")
        # Prefer jpeg key; if still PNG magic keep .png
        if data[:8] == b"\x89PNG\r\n\x1a\n":
            key = make_object_key("products", filename=f"{safe}.png", ext=".png")
        content_type = mimetypes.guess_type(key)[0] or "image/jpeg"
        url, _storage = upload_bytes(data, key=key, content_type=content_type)
        return url

    def _get_or_create_brand(self, name: str, *, dry_run: bool) -> Brand | object:
        name = (name or "Total").strip()
        existing = Brand.objects.filter(name__iexact=name).first()
        if existing:
            return existing
        display = name.title() if name.isupper() else name
        primary, secondary = BRAND_COLORS.get(name.lower(), ("#117076", "#0B5559"))
        if dry_run:
            return type("BrandStub", (), {"id": None, "name": display})()
        brand, _ = Brand.objects.get_or_create(
            name=display,
            defaults={
                "primary_color": primary,
                "secondary_color": secondary,
                "is_active": True,
            },
        )
        return brand

    def _get_or_create_category(self, name: str, *, dry_run: bool) -> Category | None:
        name = (name or "").strip()
        if not name:
            return None
        existing = Category.objects.filter(name__iexact=name).first()
        if existing:
            return existing
        if dry_run:
            return type("CategoryStub", (), {"id": None, "name": name})()
        category, _ = Category.objects.get_or_create(
            name=name,
            defaults={"is_active": True},
        )
        return category

    @staticmethod
    def _cell_str(value) -> str:
        if value is None:
            return ""
        return str(value).strip()
