export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  whatsapp_order: "WhatsApp Order",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUSES = [
  "pending",
  "whatsapp_order",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] || status;
}
