import { useEffect, useState } from "react";
import type { Banner } from "../../types";
import {
  adminDelete,
  adminGet,
  adminPatch,
  adminPost,
  adminPut,
  adminUpload,
  type Paginated,
} from "../api";
import {
  AdminPageHeader,
  Field,
  FormSection,
  ImageUploadBox,
  Modal,
  Toggle,
  adminBtnGhost,
  adminBtnPrimary,
  adminInputClass,
} from "../components/AdminUI";

type BannerForm = {
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  cta_url: string;
  sort_order: number;
  is_active: boolean;
};

const empty: BannerForm = {
  title: "",
  subtitle: "",
  image_url: "",
  cta_label: "Shop Now",
  cta_url: "/products",
  sort_order: 0,
  is_active: true,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerForm>(empty);

  function load() {
    setLoading(true);
    adminGet<Paginated<Banner>>("/api/admin/banners/?page_size=50")
      .then((d) => setBanners(d.results))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  }

  function openEdit(b: Banner) {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle,
      image_url: b.image_url,
      cta_label: b.cta_label,
      cta_url: b.cta_url,
      sort_order: b.sort_order,
      is_active: b.is_active,
    });
    setModalOpen(true);
  }

  async function save() {
    if (editing) {
      await adminPut(`/api/admin/banners/${editing.id}/`, form);
    } else {
      await adminPost("/api/admin/banners/", form);
    }
    setModalOpen(false);
    load();
  }

  async function toggleActive(b: Banner) {
    await adminPatch(`/api/admin/banners/${b.id}/`, {
      is_active: !b.is_active,
    });
    load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this banner?")) return;
    await adminDelete(`/api/admin/banners/${id}/`);
    load();
  }

  return (
    <div>
      <AdminPageHeader
        title="Banners"
        subtitle="Manage promotional banners across the store."
        action={
          <button type="button" onClick={openCreate} className={adminBtnPrimary}>
            + Add Banner
          </button>
        }
      />

      {loading ? (
        <p className="text-slate-400">Loading banners…</p>
      ) : banners.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-slate-500">
          No banners yet. Add your first hero banner.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {banners.map((b) => (
            <div
              key={b.id}
              className="overflow-hidden rounded-2xl border border-white/5 bg-[#111827]"
            >
              <div className="relative aspect-[16/7]">
                <img
                  src={b.image_url}
                  alt={b.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute right-3 top-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="rounded-lg bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(b.id)}
                    className="rounded-lg bg-red-500/80 p-2 text-white hover:bg-red-600"
                  >
                    🗑
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-white">{b.title}</p>
                  {b.subtitle && (
                    <p className="text-xs text-slate-500">{b.subtitle}</p>
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  Active
                  <button
                    type="button"
                    role="switch"
                    aria-checked={b.is_active}
                    onClick={() => void toggleActive(b)}
                    className={`relative h-6 w-11 rounded-full transition ${
                      b.is_active ? "bg-[#2dd4bf]" : "bg-slate-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                        b.is_active ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Banner" : "Add Banner"}
        subtitle="Hero carousel slides on the landing page."
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
              className={adminBtnPrimary}
            >
              {editing ? "Update banner" : "Create banner"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormSection title="Content">
            <Field label="Title">
              <input
                className={adminInputClass}
                placeholder="Built Tough. Built to Last."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Subtitle">
              <input
                className={adminInputClass}
                placeholder="Supporting line under the headline"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="CTA label">
                <input
                  className={adminInputClass}
                  placeholder="Shop Now"
                  value={form.cta_label}
                  onChange={(e) =>
                    setForm({ ...form, cta_label: e.target.value })
                  }
                />
              </Field>
              <Field label="CTA URL">
                <input
                  className={adminInputClass}
                  placeholder="/products"
                  value={form.cta_url}
                  onChange={(e) =>
                    setForm({ ...form, cta_url: e.target.value })
                  }
                />
              </Field>
            </div>
            <Field label="Sort order" hint="Lower numbers appear first.">
              <input
                type="number"
                className={adminInputClass}
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
              />
            </Field>
          </FormSection>

          <FormSection title="Image">
            <ImageUploadBox
              label="Banner image"
              previewUrl={form.image_url}
              aspect="wide"
              onFile={(f) =>
                void adminUpload(f, "banners").then((r) =>
                  setForm((prev) => ({ ...prev, image_url: r.url }))
                )
              }
            />
          </FormSection>

          <Toggle
            checked={form.is_active}
            onChange={(v) => setForm({ ...form, is_active: v })}
            label="Active"
            description="Show this slide in the hero carousel"
          />
        </div>
      </Modal>
    </div>
  );
}
