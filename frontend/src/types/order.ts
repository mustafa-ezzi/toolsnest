export interface OrderItemPayload {
  product_id: number;
  quantity: number;
}

export interface CreateOrderPayload {
  customer_name: string;
  email: string;
  phone: string;
  address_line: string;
  city: string;
  state?: string;
  postal_code?: string;
  area?: string;
  notes?: string;
  coupon_code?: string;
  source?: "web" | "whatsapp";
  items: OrderItemPayload[];
}

export interface OrderItem {
  id: number;
  product: number | null;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  area: string;
  notes: string;
  status: string;
  subtotal: string;
  discount_amount?: string;
  coupon_code?: string;
  total: string;
  source: string;
  items: OrderItem[];
  created_at: string;
}
