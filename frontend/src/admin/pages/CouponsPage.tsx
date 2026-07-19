import { useEffect, useState } from "react";
import {
  adminDelete,
  adminGet,
  adminPost,
  adminPut,
  type Paginated,
} from "../api";
import { formatPrice } from "../../api/client";
import {
  AdminPageHeader,
  AdminTable,
  Field,
  FormSection,
  Modal,
  Toggle,
  adminBtnGhost,
  adminBtnPrimary,
  adminInputClass,
} from "../components/AdminUI";

type Coupon = {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  value: string;
  min_order_amount: string;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
};

type Form = {
  code: string;
  discount_type: "percent" | "fixed";
  value: string;
  min_order_amount: string;
  max_uses: string;
  is_active: boolean;
};

const empty: Form = {
  code: "",
  discount_type: "percent",
  value: "10",
  min_order_amount: "0",
  max_uses: "",
  is_active: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<Form>(empty);

  function load() {
    adminGet<Paginated<Coupon>>("/api/admin/coupons/?page_size=100").then((d) =>
      setCoupons(d.results)
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      value: form.value,
      min_order_amount: form.min_order_amount || "0",
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      is_active: form.is_active,
    };
    if (editing) {
      await adminPut(`/api/admin/coupons/${editing.id}/`, payload);
    } else {
      await adminPost("/api/admin/coupons/", payload);
    }
    setModalOpen(false);
    load();
  }

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        subtitle="Create promo codes for checkout discounts."
        action={
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm(empty);
              setModalOpen(true);
            }}
            className={adminBtnPrimary}
          >
            + Add Coupon
          </button>
        }
      />

      <AdminTable>
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-white/5 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Uses</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="px-4 py-3 font-semibold text-[#2dd4bf]">{c.code}</td>
                <td className="px-4 py-3 text-slate-300">
                  {c.discount_type === "percent"
                    ? `${c.value}%`
                    : formatPrice(c.value)}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {c.used_count}
                  {c.max_uses != null ? ` / ${c.max_uses}` : ""}
                </td>
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
                    className="mr-2 text-slate-400 hover:text-white"
                    onClick={() => {
                      setEditing(c);
                      setForm({
                        code: c.code,
                        discount_type: c.discount_type,
                        value: c.value,
                        min_order_amount: c.min_order_amount,
                        max_uses: c.max_uses != null ? String(c.max_uses) : "",
                        is_active: c.is_active,
                      });
                      setModalOpen(true);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="text-red-400"
                    onClick={() => {
                      if (confirm("Delete coupon?"))
                        void adminDelete(`/api/admin/coupons/${c.id}/`).then(load);
                    }}
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
        title={editing ? "Edit Coupon" : "Add Coupon"}
        subtitle="Promo codes applied at checkout (amounts in PKR)."
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
              {editing ? "Update coupon" : "Create coupon"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormSection title="Code">
            <Field label="Coupon code" hint="Customers enter this at checkout.">
              <input
                className={`${adminInputClass} font-mono tracking-wider uppercase`}
                placeholder="TOOLS10"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
              />
            </Field>
          </FormSection>

          <FormSection title="Discount">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Type">
                <select
                  className={adminInputClass}
                  value={form.discount_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discount_type: e.target.value as "percent" | "fixed",
                    })
                  }
                >
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed amount (PKR)</option>
                </select>
              </Field>
              <Field
                label={
                  form.discount_type === "percent" ? "Percent value" : "Amount (PKR)"
                }
              >
                <input
                  className={adminInputClass}
                  placeholder={form.discount_type === "percent" ? "10" : "500"}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Min order (PKR)">
                <input
                  className={adminInputClass}
                  placeholder="0"
                  value={form.min_order_amount}
                  onChange={(e) =>
                    setForm({ ...form, min_order_amount: e.target.value })
                  }
                />
              </Field>
              <Field label="Max uses" hint="Leave blank for unlimited.">
                <input
                  className={adminInputClass}
                  placeholder="Unlimited"
                  value={form.max_uses}
                  onChange={(e) =>
                    setForm({ ...form, max_uses: e.target.value })
                  }
                />
              </Field>
            </div>
          </FormSection>

          <Toggle
            checked={form.is_active}
            onChange={(v) => setForm({ ...form, is_active: v })}
            label="Active"
            description="Allow customers to use this coupon"
          />
        </div>
      </Modal>
    </div>
  );
}
