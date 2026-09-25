# SmartCart — Order Management & Tracking

## 1. Overview

SmartCart supports authenticated, user-owned orders with order cancellation and a controlled order-status lifecycle.

Implemented lifecycle:

```text
PLACED
   ├──> CONFIRMED
   │       └──> SHIPPED
   │              └──> OUT_FOR_DELIVERY
   │                     └──> DELIVERED
   │
   └──> CANCELLED

CONFIRMED
   └──> CANCELLED
```

Customers can view only their own orders and can cancel an order while it is `PLACED` or `CONFIRMED`.

Order lifecycle progression is restricted to an admin/operations role.

---

## 2. Supported Statuses

- `PLACED`
- `CONFIRMED`
- `SHIPPED`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `CANCELLED`

### Allowed transitions

| Current status | Allowed next status |
|---|---|
| `PLACED` | `CONFIRMED`, `CANCELLED` |
| `CONFIRMED` | `SHIPPED`, `CANCELLED` |
| `SHIPPED` | `OUT_FOR_DELIVERY` |
| `OUT_FOR_DELIVERY` | `DELIVERED` |
| `DELIVERED` | None |
| `CANCELLED` | None |

The backend validates transitions instead of allowing arbitrary status changes.

For example, `SHIPPED -> DELIVERED` is rejected because the order must first move through `OUT_FOR_DELIVERY`.

---

## 3. Authentication and Authorization

Order APIs use the existing JWT authentication mechanism through `get_current_user()`.

### Customer permissions

A customer can:

- Create an order
- View their own orders
- View their own order details
- Cancel their own eligible order

A customer cannot directly change the delivery lifecycle status.

### Admin permissions

An admin can use the order-status endpoint to progress an order through the allowed lifecycle.

The backend checks:

```text
current_user.role == "ADMIN"
```

A non-admin attempting to update status receives:

```text
403 Forbidden
```

with:

```json
{
  "detail": "Admin access required"
}
```

---

## 4. Order Ownership

Orders are associated with users through:

```text
orders.user_id -> users.id
```

### Get orders

```http
GET /orders
```

Only orders belonging to the authenticated user are returned.

### Get one order

```http
GET /orders/{order_id}
```

The requested order must belong to the authenticated user.

### Create order

```http
POST /orders
```

The backend assigns:

```text
user_id = current_user.id
```

The frontend does not choose the order owner.

---

## 5. Create Order

### Endpoint

```http
POST /orders
```

Authentication is required.

The backend:

1. Validates the authenticated user.
2. Finds each product.
3. Uses the database product price.
4. Calculates the order total.
5. Creates the order.
6. Creates the associated order items.
7. Associates the order with the authenticated user.
8. Returns the created order.

The backend does not trust a client-provided product price.

---

## 6. View Orders

### Endpoint

```http
GET /orders
```

Authentication is required.

The result is filtered using the current user's ID, preventing one customer from seeing another customer's order list.

---

## 7. View Order Details

### Endpoint

```http
GET /orders/{order_id}
```

Authentication is required.

The backend checks both:

```text
order.id == requested order ID
AND
order.user_id == current_user.id
```

Knowing another customer's order ID is therefore not enough to access that order.

---

## 8. Cancel Order

### Endpoint

```http
PATCH /orders/{order_id}/cancel
```

Authentication is required.

A customer can cancel only their own order.

Cancellation is allowed only when the current status is:

```text
PLACED
CONFIRMED
```

After cancellation:

```text
status = CANCELLED
```

`CANCELLED` is a terminal state.

The frontend hides the cancel button after the order moves beyond the cancellable states.

---

## 9. Update Order Status

### Endpoint

```http
PATCH /orders/{order_id}/status
```

Authentication is required.

The endpoint is restricted to users with:

```text
role = ADMIN
```

The new status is validated against the current status.

Example:

```text
PLACED -> CONFIRMED
```

is allowed.

But:

```text
PLACED -> DELIVERED
```

is rejected.

Invalid transitions return:

```text
400 Bad Request
```

Example:

```json
{
  "detail": "Order cannot move from SHIPPED to DELIVERED"
}
```

---

## 10. Order Tracking UI

The Order Details page displays a tracking timeline based on the actual backend `order.status`.

### Delivered order

```text
✓ Order placed
│
✓ Order confirmed
│
✓ Shipped
│
✓ Out for delivery
│
✓ Delivered
```

### Shipped order

```text
✓ Order placed
│
✓ Order confirmed
│
✓ Shipped
│
○ Out for delivery
│
○ Delivered
```

### Cancelled order

Cancelled orders use a separate timeline:

```text
✓ Order placed
│
× Order cancelled
```

Cancelled orders do not display later delivery stages.

---

## 11. Frontend Implementation

The tracking UI is implemented in:

```text
frontend/src/pages/OrderDetailsPage.tsx
frontend/src/pages/OrderDetailsPage.css
```

Existing functionality was preserved:

- Order items
- Order total
- Payment method
- Delivery address
- Current status
- Cancel order action
- Back to orders navigation
- Loading state
- Error state

The tracking timeline was added without replacing the existing order-details functionality.

---

## 12. Frontend Order Service

The existing order service provides:

```text
createOrder()
getOrders()
getOrder()
cancelOrder()
```

The tracking UI currently needs only:

```text
getOrder()
```

because the current order status is returned by the backend.

A dedicated frontend Admin/Operations interface has not yet been implemented. The protected status-update endpoint is currently exercised through the backend/Swagger workflow.

---

## 13. Database Relationship

Orders are associated with users:

```text
users
  |
  | 1
  |
  | many
  v
orders
```

The `orders` table contains:

```text
user_id
```

which references:

```text
users.id
```

The SQLAlchemy models use a bidirectional relationship between `UserDB` and `OrderDB`.

Existing legacy orders with:

```text
user_id = NULL
```

are preserved. Newly created authenticated orders receive the current user's ID.

---

## 14. Verification Performed

### Authentication

Verified:

- Valid login succeeds.
- Invalid login is rejected.
- `/auth/me` returns the authenticated user.
- Authenticated order requests use a Bearer token.

### Order ownership

Verified:

- Authenticated `GET /orders` works.
- The user's order list contains only their orders.
- New orders are associated with the logged-in user.

### Cancellation

Verified:

- An eligible order can be cancelled.
- The order status changes to `CANCELLED`.
- The cancelled state appears in My Orders.
- The Cancel order button disappears.
- Cancelled order tracking displays the cancellation path.

### Status authorization

Verified:

```text
CUSTOMER -> PATCH /orders/{id}/status -> 403
```

The backend correctly rejects non-admin status changes.

### Status lifecycle

Order #5 was tested through:

```text
PLACED
  ↓
CONFIRMED
  ↓
SHIPPED
  ↓
OUT_FOR_DELIVERY
  ↓
DELIVERED
```

Valid transitions returned successful responses.

An invalid transition was also tested:

```text
SHIPPED -> DELIVERED
```

The backend returned:

```text
400 Bad Request
```

with the transition validation message.

---

## 15. Current Limitations

The current implementation stores the order's current status but does not yet store a historical record of every status change.

Therefore, the tracking UI shows lifecycle progress but does not show individual transition timestamps.

A future tracking-history implementation could introduce an order status history table containing:

```text
id
order_id
status
changed_at
changed_by
```

This is not part of the current implementation.

The frontend also does not yet contain a dedicated Admin/Operations order-management interface. Status progression is currently available through the protected backend endpoint.

---

## 16. Current API Summary

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| `POST` | `/orders` | Required | Create an order for current user |
| `GET` | `/orders` | Required | Get current user's orders |
| `GET` | `/orders/{order_id}` | Required | Get current user's order |
| `PATCH` | `/orders/{order_id}/cancel` | Required | Cancel own eligible order |
| `PATCH` | `/orders/{order_id}/status` | Required + Admin | Progress order lifecycle |

---

## 17. Result

SmartCart now has a functional authenticated order-management flow:

```text
Login
  ↓
Browse products
  ↓
Add to cart
  ↓
Checkout
  ↓
Place order
  ↓
PLACED
  ↓
Order details
  ↓
Tracking
  ↓
CONFIRMED
  ↓
SHIPPED
  ↓
OUT_FOR_DELIVERY
  ↓
DELIVERED
```

or:

```text
PLACED / CONFIRMED
        ↓
    CANCELLED
```

The implemented scope includes backend authorization, user ownership, lifecycle validation, cancellation behavior, and customer-facing tracking UI.
