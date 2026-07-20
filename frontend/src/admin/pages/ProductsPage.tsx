import { useEffect, useRef, useState } from "react";
import type { Brand, Category, Product } from "../../types";
import {
  adminDelete,
  adminDownloadCsv,
  adminGet,
  adminPost,
  adminPut,
  adminUpload,
  type Paginated,
} from "../api";
import { formatPrice } from "../../api/client";
import {
  AdminPageHeader,
  AdminSearch,
  AdminTable,
  BrandBadge,
  Field,
  FormSection,
  ImageUploadBox,
  Modal,
  StockBadge,
  Toggle,
  adminBtnGhost,
  adminBtnPrimary,
  adminInputClass,
} from "../components/AdminUI";

type ProductForm = {
  name: string;
  sku: string;
  brand_id: number;
  category_id: number | "";
  price: string;
  stock_qty: number;
  description: string;
  is_active: boolean;
  featured: boolean;
  image_url: string;
};

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  brand_id: 0,
  category_id: "",
  price: "",
  stock_qty: 0,
  description: "",
  is_active: true,
  featured: false,
  image_url: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [count, setCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLTableRowElement | null>(null);
  const loadingMoreRef = useRef(false);
  const pageSize = 40;

  function loadBrandsAndCategories() {
    return Promise.all([
      adminGet<Paginated<Brand>>("/api/admin/brands/?page_size=100"),
      adminGet<Paginated<Category>>("/api/admin/categories/?page_size=100"),
    ]).then(([b, c]) => {
      setBrands(b.results);
      setCategories(c.results);
    });
  }

  function loadFirstPage() {
    setLoading(true);
    setProducts([]);
    setPage(1);
    setHasMore(false);
    loadingMoreRef.current = false;
    const q = new URLSearchParams({ page: "1", page_size: String(pageSize) });
    if (search) q.set("search", search);
    Promise.all([
      adminGet<Paginated<Product>>(`/api/admin/products/?${q}`),
      loadBrandsAndCategories(),
    ])
      .then(([p]) => {
        setProducts(p.results);
        setCount(p.count);
        setHasMore(Boolean(p.next));
        setPage(1);
      })
      .finally(() => setLoading(false));
  }

  async function loadMore() {
    if (loadingMoreRef.current || !hasMore || loading) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const q = new URLSearchParams({
        page: String(nextPage),
        page_size: String(pageSize),
      });
      if (search) q.set("search", search);
      const p = await adminGet<Paginated<Product>>(`/api/admin/products/?${q}`);
      setProducts((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        return [...prev, ...p.results.filter((x) => !seen.has(x.id))];
      });
      setCount(p.count);
      setHasMore(Boolean(p.next));
      setPage(nextPage);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const t = window.setTimeout(loadFirstPage, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { root: null, rootMargin: "200px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, page, products.length, search]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      brand_id: brands[0]?.id || 0,
      category_id: categories[0]?.id || "",
    });
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      brand_id: p.brand.id,
      category_id: p.category?.id || "",
      price: p.price,
      stock_qty: p.stock_qty,
      description: p.description,
      is_active: p.is_active,
      featured: p.featured,
      image_url: p.primary_image || "",
    });
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        brand_id: form.brand_id,
        category_id: form.category_id || null,
        price: form.price,
        stock_qty: form.stock_qty,
        description: form.description,
        is_active: form.is_active,
        featured: form.featured,
        images: form.image_url
          ? [{ url: form.image_url, alt: form.name, sort_order: 0 }]
          : [],
      };
      if (editing) {
        await adminPut(`/api/admin/products/${editing.id}/`, payload);
      } else {
        await adminPost("/api/admin/products/", payload);
      }
      setModalOpen(false);
      loadFirstPage();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onUpload(file: File) {
    try {
      const res = await adminUpload(file, "products");
      setForm((f) => ({ ...f, image_url: res.url }));
      if (res.storage === "local") {
        setError(
          "Image saved locally — restart Django after setting R2 keys in backend/.env so uploads go to Cloudflare."
        );
      } else {
        setError("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await adminDelete(`/api/admin/products/${id}/`);
      if (editing?.id === id) {
        setModalOpen(false);
        setEditing(null);
      }
      loadFirstPage();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Products"
        subtitle="Manage inventory, pricing, and details."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                void adminDownloadCsv("/api/admin/products/export/", "products.csv")
              }
              className={adminBtnGhost}
            >
              Export CSV
            </button>
            <button type="button" onClick={openCreate} className={adminBtnPrimary}>
              + Add Product
            </button>
          </div>
        }
      />

      <AdminSearch
        value={search}
        onChange={setSearch}
        placeholder="Search products by name, SKU, or brand..."
      />

      <AdminTable>
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-white/5 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Name & SKU</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No products found.
                </td>
              </tr>
            ) : (
              <>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <img
                        src={p.primary_image || "https://placehold.co/48"}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3">
                      <BrandBadge name={p.brand.name} color={p.brand.primary_color} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {p.category?.name || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#2dd4bf]">
                      {formatPrice(p.price)}
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge qty={p.stock_qty} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white"
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(p.id)}
                          className="rounded-lg border border-red-500/30 p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr ref={sentinelRef}>
                  <td colSpan={7} className="px-4 py-4 text-center text-xs text-slate-500">
                    {loadingMore
                      ? "Loading more…"
                      : hasMore
                        ? `Showing ${products.length} of ${count} — scroll for more`
                        : `Showing ${products.length} of ${count}`}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </AdminTable>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Product" : "Add Product"}
        subtitle={
          editing
            ? "Update pricing, stock, and media for this item."
            : "Create a new catalog product with brand and pricing."
        }
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className={adminBtnGhost}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className={adminBtnPrimary}
            >
              {saving ? "Saving…" : editing ? "Update product" : "Create product"}
            </button>
          </>
        }
      >
        {error && (
          <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <div className="space-y-4">
          <FormSection title="Basics">
            <Field label="Product name">
              <input
                className={adminInputClass}
                placeholder="e.g. Total Cordless Drill 20V"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="SKU">
                <input
                  className={adminInputClass}
                  placeholder="SKU-XXXX"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </Field>
              <Field label="Stock qty">
                <input
                  type="number"
                  className={adminInputClass}
                  placeholder="0"
                  value={form.stock_qty}
                  onChange={(e) =>
                    setForm({ ...form, stock_qty: Number(e.target.value) })
                  }
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Brand">
                <select
                  className={adminInputClass}
                  value={form.brand_id}
                  onChange={(e) =>
                    setForm({ ...form, brand_id: Number(e.target.value) })
                  }
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Category">
                <select
                  className={adminInputClass}
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category_id: e.target.value ? Number(e.target.value) : "",
                    })
                  }
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection title="Pricing">
            <Field label="Price (PKR)" hint="Displayed as Pakistani Rupees on the storefront.">
              <input
                className={adminInputClass}
                placeholder="e.g. 8999"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Field>
          </FormSection>

          <FormSection title="Details & media">
            <Field label="Description">
              <textarea
                className={adminInputClass}
                rows={3}
                placeholder="Short product description for customers…"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </Field>
            <ImageUploadBox
              label="Product image"
              previewUrl={form.image_url}
              onFile={(f) => void onUpload(f)}
            />
          </FormSection>

          <FormSection title="Visibility">
            <div className="space-y-2">
              <Toggle
                checked={form.is_active}
                onChange={(v) => setForm({ ...form, is_active: v })}
                label="Active"
                description="Show this product on the storefront"
              />
              <Toggle
                checked={form.featured}
                onChange={(v) => setForm({ ...form, featured: v })}
                label="Featured"
                description="Highlight in featured collections"
              />
            </div>
          </FormSection>
        </div>
      </Modal>
    </div>
  );
}
