import { useEffect, useState } from "react";
import type { Brand } from "../../types";
import {
  adminDelete,
  adminGet,
  adminPost,
  adminPut,
  adminUpload,
  type Paginated,
} from "../api";
import {
  AdminPageHeader,
  AdminTable,
  Field,
  FormSection,
  ImageUploadBox,
  Modal,
  Toggle,
  adminBtnGhost,
  adminBtnPrimary,
  adminInputClass,
  useRowFlash,
} from "../components/AdminUI";

type BrandForm = {
  name: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  sort_order: number;
  is_active: boolean;
};

const empty: BrandForm = {
  name: "",
  primary_color: "#117076",
  secondary_color: "",
  logo_url: "",
  sort_order: 0,
  is_active: true,
};

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState<BrandForm>(empty);
  const [flashId, setFlashId] = useState<number | null>(null);
  useRowFlash(flashId);

  function load() {
    return adminGet<Paginated<Brand>>("/api/admin/brands/?page_size=100").then((d) =>
      setBrands(d.results)
    );
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  }

  function openEdit(b: Brand) {
    setEditing(b);
    setForm({
      name: b.name,
      primary_color: b.primary_color,
      secondary_color: b.secondary_color,
      logo_url: b.logo_url,
      sort_order: b.sort_order,
      is_active: b.is_active,
    });
    setModalOpen(true);
  }

  async function save() {
    let savedId = editing?.id ?? null;
    if (editing) {
      await adminPut(`/api/admin/brands/${editing.id}/`, form);
    } else {
      const created = await adminPost<Brand>("/api/admin/brands/", form);
      savedId = created.id;
    }
    setModalOpen(false);
    await load();
    if (savedId != null) {
      setFlashId(savedId);
      window.setTimeout(() => setFlashId(null), 1600);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete brand?")) return;
    await adminDelete(`/api/admin/brands/${id}/`);
    load();
  }

  return (
    <div>
      <AdminPageHeader
        title="Brands"
        subtitle="Manage brand themes and logos."
        action={
          <button type="button" onClick={openCreate} className={adminBtnPrimary}>
            + Add Brand
          </button>
        }
      />

      <AdminTable>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-white/5 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">Sort</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id} data-row-id={b.id} className="border-b border-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {b.logo_url && (
                      <img src={b.logo_url} alt="" className="h-8 max-w-[80px] object-contain" />
                    )}
                    <span className="font-medium text-white">{b.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block h-6 w-6 rounded-full border border-white/20"
                    style={{ backgroundColor: b.primary_color }}
                  />
                  <span className="ml-2 text-slate-400">{b.primary_color}</span>
                </td>
                <td className="px-4 py-3 text-slate-400">{b.sort_order}</td>
                <td className="px-4 py-3">
                  {b.is_active ? (
                    <span className="text-emerald-400">Yes</span>
                  ) : (
                    <span className="text-slate-500">No</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="mr-2 text-slate-400 hover:text-white"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(b.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Brand" : "Add Brand"}
        subtitle="Brand colors drive the themed sections on the landing page."
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
              {editing ? "Update brand" : "Create brand"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormSection title="Identity">
            <Field label="Brand name">
              <input
                className={adminInputClass}
                placeholder="e.g. Total"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <ImageUploadBox
              label="Logo"
              previewUrl={form.logo_url}
              onFile={(f) =>
                void adminUpload(f, "brands").then((r) =>
                  setForm((p) => ({ ...p, logo_url: r.url }))
                )
              }
            />
          </FormSection>

          <FormSection title="Theme colors">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Primary color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primary_color || "#117076"}
                    onChange={(e) =>
                      setForm({ ...form, primary_color: e.target.value })
                    }
                    className="h-11 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                  />
                  <input
                    className={adminInputClass}
                    placeholder="#117076"
                    value={form.primary_color}
                    onChange={(e) =>
                      setForm({ ...form, primary_color: e.target.value })
                    }
                  />
                </div>
              </Field>
              <Field label="Secondary color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.secondary_color || "#0a4a52"}
                    onChange={(e) =>
                      setForm({ ...form, secondary_color: e.target.value })
                    }
                    className="h-11 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                  />
                  <input
                    className={adminInputClass}
                    placeholder="#0a4a52"
                    value={form.secondary_color}
                    onChange={(e) =>
                      setForm({ ...form, secondary_color: e.target.value })
                    }
                  />
                </div>
              </Field>
            </div>
            <div
              className="mt-1 h-12 rounded-xl"
              style={{
                background: `linear-gradient(120deg, ${form.primary_color || "#117076"}, ${form.secondary_color || form.primary_color || "#0a4a52"})`,
              }}
            />
          </FormSection>

          <Toggle
            checked={form.is_active}
            onChange={(v) => setForm({ ...form, is_active: v })}
            label="Active"
            description="Show this brand on the storefront"
          />
        </div>
      </Modal>
    </div>
  );
}
