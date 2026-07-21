# Excel Product Import — Can We Create Products From Your Sheet?

**Yes.** ToolsNest can **bulk-create / update products** from Excel (or CSV), including uploading embedded pictures to **Cloudflare R2**.

This note explains **what works**, **how pictures are treated**, and **how to run the importer** (Admin UI or CLI).

---

## 1. Your sheet columns (what we map)


| Excel column               | Maps to in ToolsNest    | Notes                                                           |
| -------------------------- | ----------------------- | --------------------------------------------------------------- |
| **TOTAL Item No.** / SKU   | `sku`                   | Unique product code (e.g. `TJB048K`) — **main key for updates** |
| **Picture**                | Product image           | See section 2 — special handling                                |
| **Old Item No.**           | Optional note / ignored | Can store in description if useful                              |
| **Product name**           | `name`                  | e.g. Cordless hand blender                                      |
| **Description & Features** | `description`           | Multi-line text kept as-is                                      |
| **Selling Price**          | `price` (PKR)           | e.g. `15900`                                                    |


---

## 1b. Brand & Category — you’re thinking the right way

**Yes: brand and category are required links** for every product in ToolsNest.

Writing something like:


| Brand | Category |
| ----- | -------- |
| Total | Kitchen  |


…in the Excel is **correct**, not wrong.

### How it works

1. Importer reads the text `Total` and `Kitchen`.
2. It finds (or creates) Brand **Total** and Category **Kitchen** in the database.
3. It attaches that product to those records.

You do **not** need database IDs like `brand_id = 3`.  
Plain names are enough: `Total`, `Makita`, `Kitchen`, `Power Tools`, etc.

### Two easy options


| Option                      | How                                                       | When to use                                                       |
| --------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| **A. Columns on every row** | Add `Brand` + `Category` columns                          | Mixed brands/categories in one sheet                              |
| **B. Sheet-level default**  | You tell us “whole sheet = Brand Total, Category Kitchen” | One brand + one category per file (like your TOTAL kitchen sheet) |


Spell names consistently so matching stays clean. We normalize case, but consistent spelling is best.

---

## 1c. Extra columns for a *better* update (recommended)

| Extra column         | Why it helps                          | Example                       |
| -------------------- | ------------------------------------- | ----------------------------- |
| **Brand**            | Links product to brand theme/sections | `Total`                       |
| **Category**         | Shop-by-category filters              | `Kitchen`                     |
| **Stock**            | Inventory / low-stock alerts          | `25`                          |
| **Compare at price** | Show “was / now” sale price           | `18900` (optional)            |
| **Featured**         | Homepage / featured badge             | `yes` / `no`                  |
| **Active**           | Hide without deleting                 | `yes` / `no`                  |

### Update key (most important)

- **SKU** = unique ID  
- Re-import same SKU → **update** that product  
- New SKU → **create** new product

Defaults when columns are missing: Stock `10`, Active `true`, Featured `false`.

---

## 2. How will the Picture column be treated?

Your **Picture** column has **images embedded inside Excel cells** (not file names, not URLs).


| Approach                                   | Possible? | Result                                                                          |
| ------------------------------------------ | --------- | ------------------------------------------------------------------------------- |
| A. Extract images from Excel automatically | **Yes**   | We pull each embedded image, upload to **Cloudflare R2**, attach to the product |
| B. Leave Picture empty / skip images       | **Yes**   | Products created **without** images; you upload later in Admin                  |

Flow:

1. Read SKU / name / price / brand / category from the data file.
2. Extract the embedded picture for that row (same file or a separate images workbook).
3. Upload to R2 (`products/{sku}.jpg`).
4. Save the public URL on `ProductImage`.

Spot-check a few images in Admin after import. Fix only missing/bad ones manually.

Product photo guideline if you replace later: **1200 × 1200**, JPG/WebP, under **5 MB**.

---

## 3. How to import (ready)

Shared code: `backend/catalog/excel_import.py`  
CLI: `manage.py import_excel_products`  
Admin API: `POST /api/admin/products/import-excel/`  
Admin UI: **Admin → Import Excel** (`/admin/import`)

```text
Excel row → Product (name, sku, description, price, brand, category, …)
         → Extract picture (if present)
         → Upload to Cloudflare R2
         → Link image to product
```

Idempotent by **SKU**. Existing images are skipped unless you choose **Replace existing images** / `--update-images`.

### A. Admin UI (best for smaller batches)

1. Open **Admin → Import Excel**.
2. Upload the **data** file (`.xlsx` / `.xlsm` / `.csv`).
3. Optionally upload a separate **images** workbook (`.xlsm` / `.xlsx`) if pictures are not in the data file.
4. Set defaults (brand / category / stock) if columns are missing.
5. Optional: dry run, skip images, replace images, row limit.
6. Click **Import products** and wait for the summary.

API multipart fields: `file`, optional `images`, `default_brand`, `default_category`, `default_stock`, `sheet`, `images_sheet`, `limit`, `skip_images`, `update_images`, `dry_run`.

**Note:** Browser / Railway timeouts make **full ~1100-image catalogs** safer via CLI. Admin is ideal for updates, new brand sheets, or limited batches (`Limit rows`).

### B. CLI (best for full TOTAL catalog)

Requires R2 env vars in `backend/.env` (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`).

```powershell
cd backend
$env:PYTHONUNBUFFERED='1'
D:\ToolsNest.tools\.venv\Scripts\python.exe -u manage.py import_excel_products
```

Defaults:

- Data: `docs/updated-total-products-with-category.xlsx`
- Images: `docs/updated total products.xlsm` → Cloudflare R2

Useful flags:

```powershell
# Preview counts only
… manage.py import_excel_products --dry-run

# Data only
… manage.py import_excel_products --skip-images

# First N rows (smoke test)
… manage.py import_excel_products --limit 20

# Overwrite photos already attached
… manage.py import_excel_products --update-images

# Custom paths / sheet names
… manage.py import_excel_products --xlsx "D:\path\data.xlsx" --images-xlsm "D:\path\pics.xlsm" --sheet Products --images-sheet Offers
```

---

## 4. Categorized TOTAL files

| File | What’s inside | Opens? |
|---|---|---|
| `docs/updated total products.xlsm` | **Original** — SKU, names, prices, **embedded pictures** (~1100 images) | Yes (source) |
| `docs/updated-total-products-with-category.xlsx` | Clean data + **Brand** + **Category** (no pictures) | Yes |
| `docs/updated-total-products-with-category.csv` | Same data as CSV backup | Yes |

Pictures stay in the original `.xlsm`. The clean `.xlsx` / `.csv` is data-only (saving the huge `.xlsm` as `.xlsx` corrupted Excel).

| Step | Who | File used |
|---|---|---|
| Categories / Brand filled | Done | clean `.xlsx` |
| Create products + R2 images | CLI or Admin Import | clean data + original `.xlsm` |
| Spot-check bad photos | You (Admin → Products) | only broken/missing ones |

Re-run category fill (data only):

```bash
.\.venv\Scripts\python.exe scripts\categorize_total_excel.py
```

---

## 5. Short FAQ

**Q: If I give you this Excel, can you create the products?**  
**A: Yes** — via Admin → Import Excel or the CLI.

**Q: Will pictures come with them?**  
**A: Yes, if they are embedded and extract successfully.** They upload to Cloudflare R2 automatically.

**Q: Should I update pictures manually?**  
**A: Only for missing/bad images.**

**Q: Is writing Brand = Total and Category = Kitchen wrong?**  
**A: No — that’s correct.** We match (or create) by name.

**Q: What is the key for updates?**  
**A: SKU.** Same SKU updates; new SKU creates.
