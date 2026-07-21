# PayFast Pakistan — How to Add It to ToolsNest

This guide is for **PayFast Pakistan** ([gopayfast.com](https://gopayfast.com/)), the SBP-licensed gateway — **not** PayFast South Africa (`payfast.io` / `payfast.co.za`).

It explains how PayFast fits ToolsNest’s current checkout (guest cart → Django order → WhatsApp), what to build, and the exact integration shape in this repo.

**Official docs:** [gopayfast.com/docs](https://gopayfast.com/docs/)

---

## 1. What you’re building

Today ToolsNest can:

1. Create an order via `POST /api/orders/`
2. Optionally open WhatsApp (`source: whatsapp`)

With PayFast you add:

1. Customer picks **Pay online (PayFast)** at checkout  
2. Backend creates order as **`pending_payment`**  
3. Backend gets a PayFast **access token**  
4. Frontend (or backend HTML) **POSTs a form** → PayFast hosted checkout  
5. Customer pays (card / JazzCash / EasyPaisa / bank — whatever PayFast enables on your account)  
6. PayFast redirects to your **SUCCESS** or **FAILURE** URL  
7. Backend **verifies** payment (`GET /transaction/basket_id/...`) and marks order **paid / confirmed**

```text
Customer                ToolsNest API              PayFast
   |                         |                        |
   |-- place order --------->|                        |
   |                         |-- create Order         |
   |                         |   status=pending_payment
   |                         |-- POST /token -------->|
   |                         |<-- access token -------|
   |<-- checkout form fields-|                        |
   |-- POST form to PayFast checkout ---------------->|
   |                         |                        | (customer pays)
   |<-- redirect SUCCESS/FAILURE ---------------------|
   |-- hit /payment/payfast/return -->|               |
   |                         |-- GET status by basket-|
   |                         |-- update Order paid    |
   |<-- Order success page --|                        |
```

**Recommended path for ToolsNest:** **Hosted Checkout** (form POST).  
You never touch card numbers → lower PCI burden. Keep WhatsApp + COD as separate methods.

---

## 2. Before you write code (merchant setup)

1. Register at [gopayfast.com](https://gopayfast.com/)  
2. Complete KYC / SBP merchant onboarding  
3. Ask sales to enable (and confirm in writing):
   - JazzCash  
   - EasyPaisa  
   - Cards (Visa / Mastercard / UnionPay if needed)  
   - Bank transfer / Raast  
   - NayaPay / SadaPay (only if they support them for you)  
4. Get credentials from the merchant portal:
   - `MERCHANT_ID`
   - `SECURED_KEY`
   - Merchant display name  
5. Ask for:
   - **Sandbox / UAT base URL** (testing)  
   - **Live base URL**  
   - **Hosted checkout POST URL** (often something like `{BASE}/Ecommerce/api/Transaction/PostTransaction` or a `/checkout` URL — **confirm with PayFast**; it varies by account)

Until you have sandbox keys, you can still implement the ToolsNest side with stubs.

---

## 3. Env vars to add

### `backend/.env` (never commit real keys)

```env
# PayFast Pakistan (gopayfast)
PAYFAST_MODE=sandbox
PAYFAST_MERCHANT_ID=
PAYFAST_SECURED_KEY=
PAYFAST_MERCHANT_NAME=ToolsNest
PAYFAST_BASE_URL=https://ipg1.apps.net.pk/Ecommerce/api
PAYFAST_CHECKOUT_URL=https://ipg1.apps.net.pk/Ecommerce/api/Transaction/PostTransaction
PAYFAST_CURRENCY=PKR

# Where PayFast sends the browser after pay
# Use your real frontend + API public URLs
FRONTEND_URL=https://your-frontend.up.railway.app
BACKEND_PUBLIC_URL=https://your-backend.up.railway.app
```

> Exact `PAYFAST_BASE_URL` / `PAYFAST_CHECKOUT_URL` come from **your** PayFast onboarding pack. Community packages often use `ipg1.apps.net.pk` — treat that as a hint, not gospel. Confirm with PayFast.

Also document placeholders in `backend/.env.example`.

---

## 4. Database changes (Order model)

Add payment fields on `orders.Order` (new migration):

| Field | Purpose |
|---|---|
| `payment_method` | `cod` \| `whatsapp` \| `payfast` \| `bank_transfer` |
| `payment_status` | `unpaid` \| `pending` \| `paid` \| `failed` \| `refunded` |
| `payfast_basket_id` | Usually same as `order_number` |
| `payfast_transaction_id` | From PayFast after success |
| `paid_at` | Timestamp when verified paid |

Extend `Order.Status` (optional but clear):

| Status | When |
|---|---|
| `pending_payment` | Order created, waiting for PayFast |
| `paid` or keep `confirmed` | Payment verified |
| existing statuses | Fulfillment unchanged |

**Rule:** Never mark paid from the browser alone. Always **verify with PayFast API** using `basket_id` (= your `order_number`).

---

## 5. Hosted checkout flow (what PayFast expects)

### Step A — Access token (backend only)

```http
POST {PAYFAST_BASE_URL}/token
Content-Type: application/x-www-form-urlencoded

merchant_id=...&secured_key=...&grant_type=client_credentials
```

Response (shape):

```json
{
  "token": "<access_token>",
  "refresh_token": "...",
  "expiry": 3600
}
```

Use: `Authorization: Bearer <token>` on status APIs.

Some PayFast packs also require amount/basket when minting the token for checkout — follow **your** PDF/docs if they differ.

### Step B — Signature (common community formula)

Many Pakistan WooCommerce / Laravel PayFast packages use:

```text
SIGNATURE = md5( MERCHANT_ID + ":" + MERCHANT_NAME + ":" + TXNAMT + ":" + BASKET_ID )
```

Example (Python):

```python
import hashlib

def payfast_signature(merchant_id: str, merchant_name: str, amount: str, basket_id: str) -> str:
    raw = f"{merchant_id}:{merchant_name}:{amount}:{basket_id}"
    return hashlib.md5(raw.encode("utf-8")).hexdigest()
```

**Confirm this hash formula with PayFast** for your account. If they give a different recipe (secured_key included, different separators), use theirs.

### Step C — Form POST to hosted checkout

Backend returns these fields to the frontend; frontend auto-submits a hidden form:

| Field | Example / notes |
|---|---|
| `MERCHANT_ID` | From env |
| `MERCHANT_NAME` | ToolsNest |
| `TOKEN` | Access token |
| `PROCCODE` | Often `00` |
| `TXNAMT` | Order total as string, e.g. `15900.00` |
| `BASKET_ID` | `order_number` e.g. `TN-20260721-0007` |
| `ORDER_DATE` | `YYYY-MM-DD HH:mm:ss` |
| `CUSTOMER_EMAIL_ADDRESS` | Customer email |
| `CUSTOMER_MOBILE_NO` | Prefer `92-3XXXXXXXXX` format |
| `TXNDESC` | Short description |
| `SUCCESS_URL` | URL-encoded frontend success page |
| `FAILURE_URL` | URL-encoded frontend failure page |
| `CHECKOUT_URL` | URL-encoded **backend callback** (server notify / return handler) |
| `SIGNATURE` | MD5 as above |
| `CURRENCY_CODE` | `PKR` (if required by your form) |
| `VERSION` | Optional (some packs use a WooCommerce version string) |

Customer lands on PayFast’s page and picks JazzCash / EasyPaisa / card / etc.

---

## 6. ToolsNest API design (what to implement)

Put PayFast behind Django — **never** put `SECURED_KEY` in the frontend.

### New endpoints

| Method | Path | Role |
|---|---|---|
| `POST` | `/api/orders/` | Existing — extend with `payment_method` |
| `POST` | `/api/payments/payfast/initiate/` | Create/attach payment; return form fields + checkout URL |
| `GET` / `POST` | `/api/payments/payfast/return/` | Browser return + verify status |
| `POST` | `/api/payments/payfast/ipn/` | Optional server callback if PayFast sends one |
| `GET` | `/api/payments/payfast/status/<order_number>/` | Poll while “Checking payment…” |

### Suggested initiate request

```json
{
  "order_number": "TN-20260721-0007"
}
```

Or combine create + initiate:

```json
{
  "customer_name": "...",
  "email": "...",
  "phone": "...",
  "address_line": "...",
  "city": "...",
  "items": [{ "product_id": 1, "quantity": 2 }],
  "payment_method": "payfast",
  "coupon_code": ""
}
```

### Suggested initiate response

```json
{
  "order_number": "TN-20260721-0007",
  "checkout_url": "https://…/PostTransaction",
  "form": {
    "MERCHANT_ID": "...",
    "MERCHANT_NAME": "ToolsNest",
    "TOKEN": "...",
    "PROCCODE": "00",
    "TXNAMT": "15900.00",
    "BASKET_ID": "TN-20260721-0007",
    "ORDER_DATE": "2026-07-21 18:00:00",
    "CUSTOMER_EMAIL_ADDRESS": "buyer@example.com",
    "CUSTOMER_MOBILE_NO": "92-3001234567",
    "TXNDESC": "ToolsNest order TN-20260721-0007",
    "SUCCESS_URL": "https://store…/order-success/TN-20260721-0007?paid=1",
    "FAILURE_URL": "https://store…/checkout?payment=failed",
    "CHECKOUT_URL": "https://api…/api/payments/payfast/return/",
    "SIGNATURE": "…"
  }
}
```

Frontend:

```ts
function postToPayFast(checkoutUrl: string, form: Record<string, string>) {
  const f = document.createElement("form");
  f.method = "POST";
  f.action = checkoutUrl;
  for (const [k, v] of Object.entries(form)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = v;
    f.appendChild(input);
  }
  document.body.appendChild(f);
  f.submit();
}
```

---

## 7. Verify payment (critical)

After redirect, **do not trust query params alone**.

```http
GET {PAYFAST_BASE_URL}/transaction/basket_id/{BASKET_ID}?order_date=YYYY-MM-DD%20HH:mm:ss
Authorization: Bearer {access_token}
```

Also available:

```http
GET {PAYFAST_BASE_URL}/transaction/{transaction_id}
Authorization: Bearer {access_token}
```

On success response (`status_code` / message per their docs):

1. Find order by `order_number` == `basket_id`  
2. Set `payment_status=paid`, `status=confirmed` (or `paid`)  
3. Save `payfast_transaction_id`, `paid_at`  
4. Show success page / clear cart  

Idempotent: if already paid, return success again (safe double-hit from refresh).

---

## 8. Checkout UX (frontend)

On `CheckoutPage`, payment method radios:

| Option | Behavior |
|---|---|
| **Pay online (PayFast)** | Create order → initiate → form POST |
| **Cash on delivery** | Create order `payment_method=cod`, `status=pending` |
| **WhatsApp order** | Existing flow (`source=whatsapp`) |
| **Bank transfer** (optional) | Create order + show IBAN instructions; admin marks paid |

Keep WhatsApp CTA — many buyers still prefer chat.

Suggested success routes:

- `/order-success/:orderNumber` — already exists; add “Payment received” when `payment_status=paid`
- `/checkout?payment=failed` — allow retry initiate for same unpaid order

---

## 9. Suggested file layout in this repo

```text
backend/
  payments/                 # new Django app
    __init__.py
    apps.py
    urls.py
    views.py                # initiate, return, status
    services/
      payfast.py            # token, signature, status, form payload
    models.py               # optional PaymentAttempt log
  orders/
    models.py               # + payment_* fields
  config/
    settings.py             # PAYFAST_* from env
    urls.py                 # include payments urls

frontend/src/
  pages/CheckoutPage.tsx    # payment method + postToPayFast
  api/client.ts             # initiatePayFastPayment()
  pages/OrderSuccessPage.tsx
```

Register app: `INSTALLED_APPS += ["payments"]`.

---

## 10. Pseudo-code (backend service)

```python
# payments/services/payfast.py (sketch)

import hashlib
import requests
from django.conf import settings

def get_access_token() -> str:
    r = requests.post(
        f"{settings.PAYFAST_BASE_URL}/token",
        data={
            "merchant_id": settings.PAYFAST_MERCHANT_ID,
            "secured_key": settings.PAYFAST_SECURED_KEY,
            "grant_type": "client_credentials",
        },
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["token"]

def make_signature(amount: str, basket_id: str) -> str:
    raw = (
        f"{settings.PAYFAST_MERCHANT_ID}:"
        f"{settings.PAYFAST_MERCHANT_NAME}:"
        f"{amount}:{basket_id}"
    )
    return hashlib.md5(raw.encode()).hexdigest()

def build_checkout_form(order, token: str) -> dict:
    amount = f"{order.total:.2f}"
    basket = order.order_number
    return {
        "MERCHANT_ID": settings.PAYFAST_MERCHANT_ID,
        "MERCHANT_NAME": settings.PAYFAST_MERCHANT_NAME,
        "TOKEN": token,
        "PROCCODE": "00",
        "TXNAMT": amount,
        "BASKET_ID": basket,
        "ORDER_DATE": order.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "CUSTOMER_EMAIL_ADDRESS": order.email,
        "CUSTOMER_MOBILE_NO": normalize_pk_mobile(order.phone),
        "TXNDESC": f"ToolsNest order {basket}",
        "SUCCESS_URL": f"{settings.FRONTEND_URL}/order-success/{basket}?paid=1",
        "FAILURE_URL": f"{settings.FRONTEND_URL}/checkout?payment=failed&order={basket}",
        "CHECKOUT_URL": f"{settings.BACKEND_PUBLIC_URL}/api/payments/payfast/return/",
        "SIGNATURE": make_signature(amount, basket),
    }

def verify_by_basket(basket_id: str, order_date: str) -> dict:
    token = get_access_token()
    r = requests.get(
        f"{settings.PAYFAST_BASE_URL}/transaction/basket_id/{basket_id}",
        params={"order_date": order_date},
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()
```

Normalize phone to PayFast’s expected format (often `92-3XXXXXXXXX`).

---

## 11. Security checklist

- [ ] `SECURED_KEY` only on server  
- [ ] HTTPS on success/failure/callback URLs  
- [ ] Verify payment via status API before stocking/confirming  
- [ ] Idempotent return handler  
- [ ] Amount on PayFast must match `order.total` (re-check on verify)  
- [ ] Log PayFast responses (without card data) for support  
- [ ] Sandbox test: success, failure, cancel, double refresh  

---

## 12. Testing plan

| # | Test |
|---|---|
| 1 | Sandbox token request returns `token` |
| 2 | Form POST opens PayFast checkout UI |
| 3 | Successful pay → SUCCESS URL → order `paid` |
| 4 | Failed/cancel → FAILURE URL → order still unpaid |
| 5 | Refresh success page → still one paid order |
| 6 | COD / WhatsApp still work unchanged |
| 7 | Live keys only after sandbox OK |

Use PayFast’s sandbox credentials and test wallets/cards they provide.

---

## 13. What PayFast does **not** replace

| Still yours | Why |
|---|---|
| COD | Cash on delivery — no gateway |
| WhatsApp order | Chat confirmation |
| Shipping / inventory | Business logic |
| Refunds policy | Call PayFast refund APIs separately if needed |

---

## 14. Implementation phases (for this repo)

### Phase P1 — Scaffold (no live money)
1. Create `payments` app + env settings  
2. Add `payment_method` / `payment_status` on `Order`  
3. Checkout UI: method radios  
4. Stub initiate that returns fake form in `DEBUG`

### Phase P2 — Sandbox hosted checkout
1. Real token + signature + form POST  
2. Return URL + status verify  
3. Success / failure pages  

### Phase P3 — Production
1. Live URLs + keys on Railway  
2. Confirm JazzCash / EasyPaisa enabled  
3. Admin: show payment status on Orders  

### Phase P4 (optional)
1. Direct JazzCash/EasyPaisa APIs if PayFast misses a wallet  
2. Refunds / partial capture  

---

## 15. Admin & ops

In Admin → Orders, show:

- Payment method  
- Payment status  
- PayFast transaction id  
- Button: “Re-check PayFast status” (calls verify API)

Export CSV: include payment columns.

---

## 16. Common pitfalls

| Pitfall | Fix |
|---|---|
| Using South Africa PayFast docs | Use **gopayfast.com** only |
| Putting secured key in React | Backend only |
| Trusting SUCCESS redirect without verify | Always status API |
| Wrong mobile format | Normalize to `92-…` |
| Amount `15900` vs `15900.00` | Match PayFast’s expected format |
| Basket ID changes between create and pay | Use stable `order_number` |
| URLs not publicly reachable | Railway public HTTPS; no localhost for live callbacks |

---

## 17. References

- PayFast Pakistan docs: https://gopayfast.com/docs/  
- Merchant site: https://gopayfast.com/  
- Community hosted-checkout examples (Laravel/Woo): search `zfhassaan/payfast` — useful patterns, but **validate against your official pack**  
- ToolsNest order API: `backend/orders/` (`Order`, `POST /api/orders/`)  
- Checkout UI: `frontend/src/pages/CheckoutPage.tsx`  
- Product roadmap note: `docs/PHASES.md` (Online payments)

---

## 18. Next step when you’re ready

1. Create / request PayFast **sandbox** `MERCHANT_ID` + `SECURED_KEY`  
2. Confirm hosted checkout POST URL + signature formula in writing  
3. Say: **“Implement PayFast Phase P1/P2”**  

Then we wire the `payments` app, order fields, and checkout UI in this codebase.

---

## Summary

| Question | Answer |
|---|---|
| Which PayFast? | **Pakistan** (gopayfast) |
| Best integration for ToolsNest? | Hosted checkout (form POST) |
| Keys live where? | Backend env only |
| When is order paid? | After **status API** verify |
| Keep WhatsApp/COD? | Yes |
| Can we code without keys? | Scaffold yes; live test needs sandbox |
