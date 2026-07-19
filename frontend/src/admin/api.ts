const API_BASE = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "toolsnest_admin_token";

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function adminRequest<T>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init?.json !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/admin/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      message = data.detail || JSON.stringify(data);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function adminLogin(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Invalid credentials");
  }
  const data = await res.json();
  setToken(data.access);
  return data.user as AdminUser;
}

export async function adminMe() {
  return adminRequest<AdminUser>("/api/auth/me/");
}

export function adminGet<T>(path: string) {
  return adminRequest<T>(path);
}

export function adminPost<T>(path: string, json: unknown) {
  return adminRequest<T>(path, { method: "POST", json });
}

export function adminPatch<T>(path: string, json: unknown) {
  return adminRequest<T>(path, { method: "PATCH", json });
}

export function adminPut<T>(path: string, json: unknown) {
  return adminRequest<T>(path, { method: "PUT", json });
}

export function adminDelete(path: string) {
  return adminRequest<void>(path, { method: "DELETE" });
}

export async function adminUpload(file: File, folder = "products") {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const res = await fetch(`${API_BASE}/api/admin/upload/`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    storage?: string;
    detail?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.detail || data.error || "Upload failed");
  }
  if (!data.url) throw new Error("Upload failed: no URL returned");
  return data as { url: string; storage?: string; key?: string };
}

/** Download CSV with JWT auth */
export async function adminDownloadCsv(path: string, filename: string) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type DashboardData = {
  total_revenue: number;
  revenue_this_month: number;
  revenue_change_pct: number;
  orders_count: number;
  orders_this_month: number;
  orders_change_pct: number;
  products_count: number;
  low_stock_count: number;
  pending_orders: number;
  daily_sales: { day: string; date: string; orders: number; revenue: number }[];
  weekly_revenue: { week: string; revenue: number }[];
};

export type SalesReport = {
  from: string;
  to: string;
  revenue: number;
  order_count: number;
  top_products: {
    name: string;
    sku: string;
    quantity_sold: number;
    revenue: number;
  }[];
};
