# Excel Product Import — Can We Create Products From Your Sheet?

**Yes.** If you give ToolsNest (or the developer) an Excel file like your TOTAL catalog sheet, we can **bulk-create products** in the admin/database from it.

This note explains **what works**, **how pictures are treated**, and **what you may still need to do manually**.

---

## 1. Your sheet columns (what we map)


| Excel column               | Maps to in ToolsNest    | Notes                                                           |
| -------------------------- | ----------------------- | --------------------------------------------------------------- |
| **TOTAL Item No.**         | `sku`                   | Unique product code (e.g. `TJB048K`) — **main key for updates** |
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


So:

- `Brand = Total` ✅  
- `Category = Kitchen` ✅

That **is** the right approach.

Spell names consistently (`Total` not `TOTAL TOOLS` on one row and `total` on another) so matching stays clean. We can normalize case, but consistent spelling is best.

---



## 1c. Extra columns for a *better* update (recommended)

Your current sheet is enough to **create** products.  
Add these for cleaner **updates** and richer storefront data:


| Extra column         | Why it helps                          | Example                       |
| -------------------- | ------------------------------------- | ----------------------------- |
| **Brand**            | Links product to brand theme/sections | `Total`                       |
| **Category**         | Shop-by-category filters              | `Kitchen`                     |
| **Stock**            | Inventory / low-stock alerts          | `25`                          |
| **Compare at price** | Show “was / now” sale price           | `18900` (optional)            |
| **Featured**         | Homepage / featured badge             | `yes` / `no`                  |
| **Active**           | Hide without deleting                 | `yes` / `no`                  |
| **Specs** (optional) | Structured bullets                    | `Voltage: 16V; Wattage: 100W` |




### Update key (most important)

- **SKU** (`TOTAL Item No.`) = unique ID  
- Re-import same SKU → **update** that product (name, price, stock, etc.)  
- New SKU → **create** new product

So for ongoing catalog updates, always keep **SKU** stable. Don’t change SKUs unless it’s truly a new item.

### Nice-to-have later


| Column            | Use                                    |
| ----------------- | -------------------------------------- |
| **Barcode / EAN** | Warehouse / search                     |
| **Warranty**      | Support text                           |
| **Sort order**    | Control listing order                  |
| **Tags**          | Search helpers (`cordless`, `blender`) |


---



## 1d. Minimal “good” Excel template

**Required**

- SKU  
- Product name  
- Selling Price (PKR)  
- Brand *(or one default for the whole sheet)*  
- Category *(or one default for the whole sheet)*

**Strongly recommended**

- Description & Features  
- Picture (embedded)  
- Stock

**Optional**

- Compare at price  
- Featured  
- Active

We will also set defaults when importing if columns are missing:

- **Stock** → e.g. `10`  
- **Active** → `true`  
- **Featured** → `false`

---



## 2. How will the Picture column be treated?

Your **Picture** column has **images embedded inside Excel cells** (not file names, not URLs).

### What that means


| Approach                                   | Possible? | Result                                                                          |
| ------------------------------------------ | --------- | ------------------------------------------------------------------------------- |
| A. Extract images from Excel automatically | **Yes**   | We pull each embedded image, upload to **Cloudflare R2**, attach to the product |
| B. You export images as separate files     | **Yes**   | You name files by SKU (`TJB048K.jpg`) and we match them                         |
| C. Leave Picture empty / skip images       | **Yes**   | Products created **without** images; you upload later in Admin                  |




### Recommended flow (best quality)

1. You send the `.xlsx` file.
2. Import script:
  - Creates/updates product from name, SKU, description, price.
  - Extracts the embedded cell image for that row.
  - Uploads to R2 (`products/{sku}.jpg` or similar).
  - Saves the public URL on the product.
3. You open Admin → Products and **spot-check** a few images (crop/quality).



### Do you need to update pictures manually?


| Situation                               | Manual work?                                                       |
| --------------------------------------- | ------------------------------------------------------------------ |
| Embedded Excel images extract cleanly   | **Usually no** — automatic                                         |
| Image is tiny / blurry / wrong cell     | **Yes** — re-upload that product in Admin                          |
| Sheet has no real images (placeholders) | **Yes** — upload good photos later                                 |
| You prefer full control of photos       | **Yes** — create products from Excel first, upload images in Admin |


**Practical answer:**  
You do **not** have to upload every picture by hand if the Excel images are good and extractable. Plan for a **quick review** and fixing a few bad ones manually.

---



## 3. Image size reminder (for best results)

If you replace Excel pictures later, use:

- **Product photo:** **1200 × 1200 px** (square), JPG/WebP, under **5 MB**

Excel-embedded images are often smaller; auto-import will still work, but sharper separate files look better on the storefront.

---



## 4. What you should send us

1. The `.xlsx` **file** (not only a screenshot).
2. Confirm:
  - Brand name (e.g. **Total**)
  - Category (or “create Kitchen Appliances”)
  - Currency is **PKR** (your prices like `15900` already look correct)
3. Optional: a folder of high-res images named by SKU if you want better photos than Excel embeds.

---



## 5. What we will build / run (when you’re ready)

A management command or admin “Import Excel” tool that:

```text
Excel row → Product (name, sku, description, price)
         → Extract picture (if present)
         → Upload to Cloudflare R2
         → Link image to product
```

Idempotent by **SKU**: re-importing the same sheet **updates** existing products instead of duplicating them.

---



## 6. Short FAQ

**Q: If I give you this Excel, can you create the products?**  
**A: Yes.**

**Q: Will pictures come with them?**  
**A: Yes, if they are embedded in the sheet and extract successfully.** Otherwise products are created without images and you upload in Admin.

**Q: Should I update pictures manually?**  
**A: Only for missing/bad images.** Full manual upload of every product is **not** required if Excel embeds are usable.

**Q: Is writing Brand = Total and Category = Kitchen wrong?**  
**A: No — that’s correct.** We match (or create) Brand/Category by those names. You don’t need numeric IDs.

**Q: What is the key for updates?**  
**A: SKU (Item No.).** Same SKU on re-import updates the product; new SKU creates one.

---



## 8. Categorized TOTAL file (ready)

Files created from your sheet:

| File | What’s inside | Opens? |
|---|---|---|
| `docs/updated total products.xlsm` | **Original** — SKU, names, prices, **embedded pictures** (~1100 images) | Yes (source) |
| `docs/updated-total-products-with-category.xlsx` | Clean data + **Brand** + **Category** (no pictures) | Yes |
| `docs/updated-total-products-with-category.csv` | Same data as CSV backup | Yes |

### Where did the images go?

They are **still in the original** `updated total products.xlsm`.

They are **not** in the clean `.xlsx` / `.csv` because saving that huge `.xlsm` (VBA + 1000+ embedded images) as `.xlsx` **corrupted** the file. The clean file is for **Brand/Category/data** only.

### How will images be uploaded?

When we run **product import**, the importer will:

1. Read each row’s **SKU / name / price / brand / category** from the clean `.xlsx` (or CSV).
2. Open the **original `.xlsm`** and **extract the embedded picture** for that row (matched by row / SKU).
3. Upload the image to **Cloudflare R2** (`products/{sku}.jpg`).
4. Attach the public R2 URL to the product in the database.

So you do **not** need to upload ~1100 photos by hand.

| Step | Who | File used |
|---|---|---|
| Categories / Brand filled | Done | clean `.xlsx` |
| Create products in DB | Done via `import_excel_products` | clean `.xlsx` + original `.xlsm` for images |
| Spot-check bad photos | You (Admin) | only broken/missing ones |

Re-run category fill (data only):

```bash
.\.venv\Scripts\python.exe scripts\categorize_total_excel.py
```

### Run the product importer

```powershell
cd backend
$env:PYTHONUNBUFFERED='1'
D:\ToolsNest.tools\.venv\Scripts\python.exe -u manage.py import_excel_products
```

- Data: `docs/updated-total-products-with-category.xlsx`
- Images: `docs/updated total products.xlsm` → Cloudflare R2
- Safe to re-run (upsert by SKU; skips images that already exist unless `--update-images`)
# Excel Product Import — Can We Create Products From Your Sheet?

**Yes.** If you give ToolsNest (or the developer) an Excel file like your TOTAL catalog sheet, we can **bulk-create products** in the admin/database from it.

This note explains **what works**, **how pictures are treated**, and **what you may still need to do manually**.

---

## 1. Your sheet columns (what we map)


| Excel column               | Maps to in ToolsNest    | Notes                                                           |
| -------------------------- | ----------------------- | --------------------------------------------------------------- |
| **TOTAL Item No.**         | `sku`                   | Unique product code (e.g. `TJB048K`) — **main key for updates** |
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


So:

- `Brand = Total` ✅  
- `Category = Kitchen` ✅

That **is** the right approach.

Spell names consistently (`Total` not `TOTAL TOOLS` on one row and `total` on another) so matching stays clean. We can normalize case, but consistent spelling is best.

---



## 1c. Extra columns for a *better* update (recommended)

Your current sheet is enough to **create** products.  
Add these for cleaner **updates** and richer storefront data:


| Extra column         | Why it helps                          | Example                       |
| -------------------- | ------------------------------------- | ----------------------------- |
| **Brand**            | Links product to brand theme/sections | `Total`                       |
| **Category**         | Shop-by-category filters              | `Kitchen`                     |
| **Stock**            | Inventory / low-stock alerts          | `25`                          |
| **Compare at price** | Show “was / now” sale price           | `18900` (optional)            |
| **Featured**         | Homepage / featured badge             | `yes` / `no`                  |
| **Active**           | Hide without deleting                 | `yes` / `no`                  |
| **Specs** (optional) | Structured bullets                    | `Voltage: 16V; Wattage: 100W` |




### Update key (most important)

- **SKU** (`TOTAL Item No.`) = unique ID  
- Re-import same SKU → **update** that product (name, price, stock, etc.)  
- New SKU → **create** new product

So for ongoing catalog updates, always keep **SKU** stable. Don’t change SKUs unless it’s truly a new item.

### Nice-to-have later


| Column            | Use                                    |
| ----------------- | -------------------------------------- |
| **Barcode / EAN** | Warehouse / search                     |
| **Warranty**      | Support text                           |
| **Sort order**    | Control listing order                  |
| **Tags**          | Search helpers (`cordless`, `blender`) |


---



## 1d. Minimal “good” Excel template

**Required**

- SKU  
- Product name  
- Selling Price (PKR)  
- Brand *(or one default for the whole sheet)*  
- Category *(or one default for the whole sheet)*

**Strongly recommended**

- Description & Features  
- Picture (embedded)  
- Stock

**Optional**

- Compare at price  
- Featured  
- Active

We will also set defaults when importing if columns are missing:

- **Stock** → e.g. `10`  
- **Active** → `true`  
- **Featured** → `false`

---



## 2. How will the Picture column be treated?

Your **Picture** column has **images embedded inside Excel cells** (not file names, not URLs).

### What that means


| Approach                                   | Possible? | Result                                                                          |
| ------------------------------------------ | --------- | ------------------------------------------------------------------------------- |
| A. Extract images from Excel automatically | **Yes**   | We pull each embedded image, upload to **Cloudflare R2**, attach to the product |
| B. You export images as separate files     | **Yes**   | You name files by SKU (`TJB048K.jpg`) and we match them                         |
| C. Leave Picture empty / skip images       | **Yes**   | Products created **without** images; you upload later in Admin                  |




### Recommended flow (best quality)

1. You send the `.xlsx` file.
2. Import script:
  - Creates/updates product from name, SKU, description, price.
  - Extracts the embedded cell image for that row.
  - Uploads to R2 (`products/{sku}.jpg` or similar).
  - Saves the public URL on the product.
3. You open Admin → Products and **spot-check** a few images (crop/quality).



### Do you need to update pictures manually?


| Situation                               | Manual work?                                                       |
| --------------------------------------- | ------------------------------------------------------------------ |
| Embedded Excel images extract cleanly   | **Usually no** — automatic                                         |
| Image is tiny / blurry / wrong cell     | **Yes** — re-upload that product in Admin                          |
| Sheet has no real images (placeholders) | **Yes** — upload good photos later                                 |
| You prefer full control of photos       | **Yes** — create products from Excel first, upload images in Admin |


**Practical answer:**  
You do **not** have to upload every picture by hand if the Excel images are good and extractable. Plan for a **quick review** and fixing a few bad ones manually.

---



## 3. Image size reminder (for best results)

If you replace Excel pictures later, use:

- **Product photo:** **1200 × 1200 px** (square), JPG/WebP, under **5 MB**

Excel-embedded images are often smaller; auto-import will still work, but sharper separate files look better on the storefront.

---



## 4. What you should send us

1. The `.xlsx` **file** (not only a screenshot).
2. Confirm:
  - Brand name (e.g. **Total**)
  - Category (or “create Kitchen Appliances”)
  - Currency is **PKR** (your prices like `15900` already look correct)
3. Optional: a folder of high-res images named by SKU if you want better photos than Excel embeds.

---



## 5. What we will build / run (when you’re ready)

A management command or admin “Import Excel” tool that:

```text
Excel row → Product (name, sku, description, price)
         → Extract picture (if present)
         → Upload to Cloudflare R2
         → Link image to product
```

Idempotent by **SKU**: re-importing the same sheet **updates** existing products instead of duplicating them.

---



## 6. Short FAQ

**Q: If I give you this Excel, can you create the products?**  
**A: Yes.**

**Q: Will pictures come with them?**  
**A: Yes, if they are embedded in the sheet and extract successfully.** Otherwise products are created without images and you upload in Admin.

**Q: Should I update pictures manually?**  
**A: Only for missing/bad images.** Full manual upload of every product is **not** required if Excel embeds are usable.

**Q: Is writing Brand = Total and Category = Kitchen wrong?**  
**A: No — that’s correct.** We match (or create) Brand/Category by those names. You don’t need numeric IDs.

**Q: What is the key for updates?**  
**A: SKU (Item No.).** Same SKU on re-import updates the product; new SKU creates one.

---



## 8. Categorized TOTAL file (ready)

Files created from your sheet:

| File | What’s inside | Opens? |
|---|---|---|
| `docs/updated total products.xlsm` | **Original** — SKU, names, prices, **embedded pictures** (~1100 images) | Yes (source) |
| `docs/updated-total-products-with-category.xlsx` | Clean data + **Brand** + **Category** (no pictures) | Yes |
| `docs/updated-total-products-with-category.csv` | Same data as CSV backup | Yes |

### Where did the images go?

They are **still in the original** `updated total products.xlsm`.

They are **not** in the clean `.xlsx` / `.csv` because saving that huge `.xlsm` (VBA + 1000+ embedded images) as `.xlsx` **corrupted** the file. The clean file is for **Brand/Category/data** only.

### How will images be uploaded?

When we run **product import**, the importer will:

1. Read each row’s **SKU / name / price / brand / category** from the clean `.xlsx` (or CSV).
2. Open the **original `.xlsm`** and **extract the embedded picture** for that row (matched by row / SKU).
3. Upload the image to **Cloudflare R2** (`products/{sku}.jpg`).
4. Attach the public R2 URL to the product in the database.

So you do **not** need to upload ~1100 photos by hand.

| Step | Who | File used |
|---|---|---|
| Categories / Brand filled | Done | clean `.xlsx` |
| Create products in DB | Import script (next) | clean `.xlsx` + original `.xlsm` for images |
| Spot-check bad photos | You (Admin) | only broken/missing ones |

Re-run category fill (data only):

```bash
.\.venv\Scripts\python.exe scripts\categorize_total_excel.py
```

When you want this live:

1. Share the real `.xlsx` file in the project (or a Google Drive link).
2. Say: **“Build Excel product import.”**
3. We add the importer and run it for your Total (or other brand) sheet.

Until then, you can still add products one-by-one in **Admin → Products**.