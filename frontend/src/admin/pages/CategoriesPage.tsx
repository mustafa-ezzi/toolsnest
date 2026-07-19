import { useEffect, useState } from "react";
import type { Category } from "../../types";
import {
  adminDelete,
  adminGet,
  adminPost,
  adminPut,
  type Paginated,
} from "../api";
import {
  AdminPageHeader,
  AdminTable,
  Field,
  Modal,
  Toggle,
  adminBtnGhost,
  adminBtnPrimary,
  adminInputClass,
} from "../components/AdminUI";

type CatForm = { name: string; is_active: boolean };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CatForm>({ name: "", is_active: true });

  function load() {
    adminGet<Paginated<Category>>("/api/admin/categories/?page_size=100").then(
      (d) => setCategories(d.results)
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (editing) {
      await adminPut(`/api/admin/categories/${editing.id}/`, form);
    } else {
      await adminPost("/api/admin/categories/", form);
    }
    setModalOpen(false);
    load();
  }

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        subtitle="Organize products by tool type."
        action={
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm({ name: "", is_active: true });
              setModalOpen(true);
            }}
            className={adminBtnPrimary}
          >
            + Add Category
          </button>
        }
      />

      <AdminTable>
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="border-b border-white/5 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                <td className="px-4 py-3 text-slate-400">{c.slug}</td>
                <td className="px-4 py-3">
                  {c.is_active ? (
                    <span className="text-emerald-400">Yes</span>
                  ) : (
                    <span className="text-slate-500">No</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(c);
                      setForm({ name: c.name, is_active: c.is_active });
                      setModalOpen(true);
                    }}
                    className="mr-2 text-slate-400 hover:text-white"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Delete?")) void adminDelete(`/api/admin/categories/${c.id}/`).then(load);
                    }}
                    className="text-red-400"
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
        title={editing ? "Edit Category" : "Add Category"}
        subtitle="Organize products by tool type."
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
              {editing ? "Update category" : "Create category"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Category name">
            <input
              className={adminInputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Power Tools"
            />
          </Field>
          <Toggle
            checked={form.is_active}
            onChange={(v) => setForm({ ...form, is_active: v })}
            label="Active"
            description="Show this category on the storefront"
          />
        </div>
      </Modal>
    </div>
  );
}
