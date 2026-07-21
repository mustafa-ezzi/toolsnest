"""Import products from categorized Excel + embedded images from original .xlsm."""

from __future__ import annotations

from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from catalog.excel_import import import_products

REPO_ROOT = Path(settings.BASE_DIR).resolve().parent
DEFAULT_XLSX = REPO_ROOT / "docs" / "updated-total-products-with-category.xlsx"
DEFAULT_XLSM = REPO_ROOT / "docs" / "updated total products.xlsm"


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
        parser.add_argument("--default-brand", type=str, default="Total")
        parser.add_argument("--default-category", type=str, default="")
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
            import openpyxl  # noqa: F401
        except ImportError as exc:
            raise CommandError(
                "openpyxl is required. Install with: pip install openpyxl"
            ) from exc

        xlsx_path = Path(options["xlsx"])
        xlsm_path = Path(options["images_xlsm"])
        if not xlsx_path.exists():
            raise CommandError(f"Data file not found: {xlsx_path}")

        images_path = xlsm_path if xlsm_path.exists() else None
        if not options["skip_images"] and images_path is None:
            self.stderr.write(
                self.style.WARNING(
                    f"Images workbook missing ({xlsm_path}); continuing without dedicated images file."
                )
            )

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING("DRY RUN — no database or upload changes"))

        def progress(msg: str) -> None:
            self.stdout.write(msg)

        try:
            result = import_products(
                data_path=xlsx_path,
                images_path=images_path,
                data_sheet=options["sheet"] or None,
                images_sheet=options["images_sheet"] or None,
                default_brand=options["default_brand"],
                default_category=options["default_category"],
                default_stock=options["default_stock"],
                limit=options["limit"] or None,
                skip_images=options["skip_images"],
                update_images=options["update_images"],
                dry_run=options["dry_run"],
                progress=progress,
            )
        except ValueError as exc:
            raise CommandError(str(exc)) from exc

        for w in result.warnings:
            self.stderr.write(self.style.WARNING(w))
        for e in result.errors:
            self.stderr.write(self.style.ERROR(e))

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Import complete"))
        self.stdout.write(f"  Products created: {result.created}")
        self.stdout.write(f"  Products updated: {result.updated}")
        self.stdout.write(f"  Products skipped: {result.skipped}")
        if not options["skip_images"]:
            self.stdout.write(f"  Images uploaded:  {result.images_uploaded}")
            self.stdout.write(
                f"  Images skipped:   {result.images_skipped} (already had image)"
            )
            self.stdout.write(f"  Images failed:    {result.images_failed}")
            self.stdout.write(f"  Missing embeds:   {result.images_missing}")
            self.stdout.write(f"  Storage:          {result.storage}")
