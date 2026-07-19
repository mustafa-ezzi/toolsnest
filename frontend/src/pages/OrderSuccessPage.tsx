import { Link, useLocation, useParams } from "react-router-dom";
import type { Order } from "../types/order";
import { formatPrice } from "../api/client";
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  WHATSAPP_OWNER_NUMBER,
} from "../utils/whatsapp";
import { orderStatusLabel } from "../utils/orderStatus";
import type { CartItem } from "../types";

type LocationState = {
  order?: Order;
  openedWhatsApp?: boolean;
};

export default function OrderSuccessPage() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;
  const order = state.order;
  const isWhatsApp =
    state.openedWhatsApp ||
    order?.source === "whatsapp" ||
    order?.status === "whatsapp_order";

  function openWhatsAppAgain() {
    if (!order) {
      window.open(
        buildWhatsAppUrl(
          `Hi ToolsNest, I placed order ${orderNumber}. Please confirm.`
        ),
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
    const fakeItems: CartItem[] = order.items.map((item) => ({
      quantity: item.quantity,
      product: {
        id: item.product || 0,
        name: item.product_name_snapshot,
        slug: "",
        sku: item.sku_snapshot,
        brand: {
          id: 0,
          name: "",
          slug: "",
          logo_url: "",
          primary_color: "#0F4C5C",
          secondary_color: "",
          sort_order: 0,
          is_active: true,
        },
        category: null,
        description: "",
        specs: {},
        price: item.unit_price,
        compare_at_price: null,
        stock_qty: 0,
        is_active: true,
        featured: false,
        primary_image: "",
      },
    }));
    const msg = buildWhatsAppOrderMessage(
      {
        customer_name: order.customer_name,
        email: order.email,
        phone: order.phone,
        address_line: order.address_line,
        city: order.city,
        state: order.state,
        postal_code: order.postal_code,
        notes: order.notes,
      },
      fakeItems,
      order.order_number
    );
    window.open(buildWhatsAppUrl(msg), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center animate-fade-up">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
        {isWhatsApp ? "💬" : "✓"}
      </div>
      <h1 className="brand-font text-3xl font-bold text-slate-900">
        {isWhatsApp ? "WhatsApp order sent!" : "Order placed!"}
      </h1>
      <p className="mt-3 text-slate-500">
        {isWhatsApp ? (
          <>
            Your order is marked as a{" "}
            <span className="font-semibold text-emerald-700">
              WhatsApp Order
            </span>{" "}
            and needs confirmation from ToolsNest after you chat with the owner
            {orderNumber ? (
              <>
                {" "}
                (
                <span className="font-semibold text-[#0F4C5C]">{orderNumber}</span>
                )
              </>
            ) : null}
            .
          </>
        ) : (
          <>
            Thank you. We received your order
            {orderNumber ? (
              <>
                {" "}
                <span className="font-semibold text-[#0F4C5C]">{orderNumber}</span>
              </>
            ) : null}
            .
          </>
        )}
      </p>

      {order && (
        <div className="mt-8 rounded-2xl bg-white p-5 text-left text-sm shadow-sm">
          <p>
            <span className="text-slate-400">Name:</span> {order.customer_name}
          </p>
          <p className="mt-1">
            <span className="text-slate-400">Phone:</span> {order.phone}
          </p>
          <p className="mt-1">
            <span className="text-slate-400">Total:</span>{" "}
            <span className="font-semibold text-[#0F4C5C]">
              {formatPrice(order.total)}
            </span>
          </p>
          <p className="mt-1">
            <span className="text-slate-400">Status:</span>{" "}
            <span
              className={
                order.status === "whatsapp_order"
                  ? "font-semibold text-emerald-700"
                  : ""
              }
            >
              {orderStatusLabel(order.status)}
              {order.status === "whatsapp_order"
                ? " — awaiting confirmation"
                : ""}
            </span>
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={openWhatsAppAgain}
          className="rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white hover:brightness-95"
        >
          {isWhatsApp
            ? `Message owner again (+${WHATSAPP_OWNER_NUMBER})`
            : `Message on WhatsApp (+${WHATSAPP_OWNER_NUMBER})`}
        </button>
        <Link
          to="/products"
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Continue shopping
        </Link>
        <Link
          to="/track-order"
          className="text-sm font-medium text-[#0F4C5C] hover:underline"
        >
          Track this order
        </Link>
      </div>
    </div>
  );
}
