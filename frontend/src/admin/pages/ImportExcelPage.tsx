import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { adminImportExcel, type ExcelImportResult } from "../api";
import {
  AdminPageHeader,
  Field,
  FormSection,
  Toggle,
  adminBtnGhost,
  adminBtnPrimary,
  adminInputClass,
} from "../components/AdminUI";

export default function AdminImportExcelPage() {
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [imagesFile, setImagesFile] = useState<File | null>(null);
  const [defaultBrand, setDefaultBrand] = useState("Total");
  const [defaultCategory, setDefaultCategory] = useState("");
  const [defaultStock, setDefaultStock] = useState(10);
  const [sheet, setSheet] = useState("");
  const [imagesSheet, setImagesSheet] = useState("");
  const [limit, setLimit] = useState("");
  const [skipImages, setSkipImages] = useState(false);
  const [updateImages, setUpdateImages] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExcelImportResult | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!dataFile) {
      setError("Choose a data Excel/CSV file first.");
      return;
    }
    setBusy(true);
    try {
      const res = await adminImportExcel({
        file: dataFile,
        images: skipImages ? null : imagesFile,
        defaultBrand,
        defaultCategory,
        defaultStock,
        sheet: sheet.trim() || undefined,
        imagesSheet: imagesSheet.trim() || undefined,
        limit: limit.trim() ? Number(limit) : undefined,
        skipImages,
        updateImages,
        dryRun,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Import Excel"
        subtitle="Create or update products from Excel. Pictures go to Cloudflare R2."
        action={
          <Link to="/admin/products" className={adminBtnGhost}>
            Back to products
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-5">
        <FormSection title="Files">
          <Field label="Data file (.xlsx / .xlsm / .csv) *">
            <input
              type="file"
              accept=".xlsx,.xlsm,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12,text/csv"
              className={adminInputClass}
              onChange={(e) => setDataFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Needs SKU, Product name, Selling Price. Brand & Category columns
              recommended. Upserts by SKU.
            </p>
          </Field>

          <Field label="Images workbook (optional .xlsm / .xlsx)">
            <input
              type="file"
              accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12"
              className={adminInputClass}
              disabled={skipImages}
              onChange={(e) => setImagesFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Use when pictures live in a separate file (e.g. original TOTAL
              Offers sheet). If omitted, embeds in the data file are used when
              present. Large full catalogs (~1000+ images) are better via CLI.
            </p>
          </Field>
        </FormSection>

        <FormSection title="Defaults & options">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default brand">
              <input
                className={adminInputClass}
                value={defaultBrand}
                onChange={(e) => setDefaultBrand(e.target.value)}
                placeholder="Total"
              />
            </Field>
            <Field label="Default category">
              <input
                className={adminInputClass}
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                placeholder="Leave blank if column present"
              />
            </Field>
            <Field label="Default stock">
              <input
                type="number"
                min={0}
                className={adminInputClass}
                value={defaultStock}
                onChange={(e) => setDefaultStock(Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Limit rows (optional)">
              <input
                type="number"
                min={1}
                className={adminInputClass}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="All rows"
              />
            </Field>
            <Field label="Data sheet name">
              <input
                className={adminInputClass}
                value={sheet}
                onChange={(e) => setSheet(e.target.value)}
                placeholder="Auto (Products / first)"
              />
            </Field>
            <Field label="Images sheet name">
              <input
                className={adminInputClass}
                value={imagesSheet}
                onChange={(e) => setImagesSheet(e.target.value)}
                placeholder="Auto (Offers / first)"
              />
            </Field>
          </div>

          <div className="mt-4 space-y-3">
            <Toggle
              checked={skipImages}
              onChange={setSkipImages}
              label="Skip images"
              description="Import product data only"
            />
            <Toggle
              checked={updateImages}
              onChange={setUpdateImages}
              label="Replace existing images"
              description="Overwrite product photos already in the catalog"
            />
            <Toggle
              checked={dryRun}
              onChange={setDryRun}
              label="Dry run"
              description="Count creates/updates without writing to the database or R2"
            />
          </div>
        </FormSection>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy} className={adminBtnPrimary}>
            {busy
              ? "Importing… this can take a few minutes"
              : dryRun
                ? "Run dry import"
                : "Import products"}
          </button>
        </div>

        {busy && (
          <p className="text-sm text-slate-400">
            Keep this tab open. Images upload to Cloudflare R2 one by one.
          </p>
        )}

        {result && (
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <h2 className="brand-font text-lg font-semibold text-white">
              {dryRun ? "Dry-run summary" : "Import complete"}
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Stat label="Created" value={result.created} />
              <Stat label="Updated" value={result.updated} />
              <Stat label="Skipped" value={result.skipped} />
              <Stat label="Images uploaded" value={result.images_uploaded} />
              <Stat label="Images skipped" value={result.images_skipped} />
              <Stat label="Images failed" value={result.images_failed} />
              <Stat label="Images missing" value={result.images_missing} />
              <Stat label="Storage" value={result.storage} />
            </dl>

            {result.warnings?.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-amber-400">
                  {result.warning_count ?? result.warnings.length} warnings
                </summary>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-slate-400">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </details>
            )}

            {result.errors?.length > 0 && (
              <details className="mt-3" open>
                <summary className="cursor-pointer text-sm text-red-400">
                  {result.error_count ?? result.errors.length} errors
                </summary>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-red-300/90">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </details>
            )}

            <div className="mt-5">
              <Link to="/admin/products" className={adminBtnGhost}>
                Review products
              </Link>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0f1419] px-3 py-2.5">
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-lg font-semibold text-white">{value}</dd>
    </div>
  );
}
