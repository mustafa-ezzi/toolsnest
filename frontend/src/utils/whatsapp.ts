import type { CartItem } from "../types";
import { formatPrice } from "../api/client";

/** International number without + e.g. 923001234567 */
export const WHATSAPP_OWNER_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER || "+92 336 3399445";

export type CheckoutCustomer = {
  customer_name: string;
  email: string;
  phone: string;
  address_line: string;
  city: string;
  state?: string;
  postal_code?: string;
  notes?: string;
};

export function buildWhatsAppOrderMessage(
  customer: CheckoutCustomer,
  items: CartItem[],
  orderNumber?: string
) {
  const lines: string[] = [
    "🛒 *New ToolsNest Order Inquiry*",
    orderNumber ? `Order #: *${orderNumber}*` : "",
    "",
    "*Customer*",
    `Name: ${customer.customer_name}`,
    `Email: ${customer.email}`,
    `Phone: ${customer.phone}`,
    `Address: ${customer.address_line}`,
    `City: ${customer.city}`,
    customer.state ? `State: ${customer.state}` : "",
    customer.postal_code ? `ZIP: ${customer.postal_code}` : "",
    customer.notes ? `Notes: ${customer.notes}` : "",
    "",
    "*Cart*",
  ].filter(Boolean);

  let subtotal = 0;
  items.forEach((item, idx) => {
    const line = Number(item.product.price) * item.quantity;
    subtotal += line;
    lines.push(
      `${idx + 1}. ${item.product.name} (${item.product.brand.name})`,
      `   Qty: ${item.quantity} × ${formatPrice(item.product.price)} = ${formatPrice(line)}`
    );
  });

  lines.push("", `*Total: ${formatPrice(subtotal)}*`, "", "Please confirm availability & delivery. Thanks!");
  return lines.join("\n");
}

export function buildWhatsAppUrl(message: string) {
  const phone = WHATSAPP_OWNER_NUMBER.replace(/[^\d]/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
