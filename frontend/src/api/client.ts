import type { Banner, Brand, Category, Paginated, Product } from "../types";
import type { CreateOrderPayload, Order } from "../types/order";

const API_BASE = import.meta.env.VITE_API_URL || "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      message =
        typeof data === "string"
          ? data
          : data.detail || JSON.stringify(data);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function getBrands() {
  return request<Brand[]>("/api/brands/");
}

export function getCategories() {
  return request<Category[]>("/api/categories/");
}

export function getBanners() {
  return request<Banner[]>("/api/banners/");
}

export function getProducts(params: Record<string, string | undefined> = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) q.set(k, v);
  });
  const qs = q.toString();
  return request<Paginated<Product>>(`/api/products/${qs ? `?${qs}` : ""}`);
}

export function getProduct(slug: string) {
  return request<Product>(`/api/products/${slug}/`);
}

export function getRelatedProducts(slug: string) {
  return request<Product[]>(`/api/products/${slug}/related/`);
}

export function createOrder(payload: CreateOrderPayload) {
  return request<Order>("/api/orders/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function lookupOrders(email: string, phone: string) {
  return request<Order[]>("/api/orders/lookup/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, phone }),
  });
}

export type CouponValidation = {
  code: string;
  discount_type: string;
  value: string;
  discount_amount: string;
  subtotal: string;
  total_after_discount: string;
};

export function validateCoupon(code: string, subtotal: number) {
  return request<CouponValidation>("/api/coupons/validate/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotal: subtotal.toFixed(2) }),
  });
}

export function formatPrice(value: string | number) {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "Rs 0";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
