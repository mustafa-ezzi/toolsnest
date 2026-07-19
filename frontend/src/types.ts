export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  sort_order: number;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  is_active: boolean;
}

export interface ProductImage {
  id: number;
  url: string;
  alt: string;
  sort_order: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  brand: Brand;
  category: Category | null;
  description: string;
  specs: Record<string, string | number>;
  price: string;
  compare_at_price: string | null;
  stock_qty: number;
  is_active: boolean;
  featured: boolean;
  primary_image: string;
  images?: ProductImage[];
  created_at?: string;
  updated_at?: string;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  cta_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}
