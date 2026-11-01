# Volosync Admin — Platform (Apex) API Reference

Backend: `BackEnd/` (Django + DRF + SimpleJWT, MySQL via PyMySQL, python-decouple).

Conventions used by **every** endpoint on this console:

- **Envelopes** — success is `{"data": ...}`, failure is `{"errors": {...}}` (usually
  `{"errors": {"message": "..."}}`).
- **Auth** — `Authorization: Bearer <access>` (JWT from `POST /api/auth/login/`).
  Unauthenticated requests get `401`. Authenticated non-admins get
  `403 {"errors":{"message":"Platform admin only."}}`.
- **Money** — always a string with 2 decimals, e.g. `"68000.00"` (ETB).
- **Dates** — ISO `YYYY-MM-DD`; timestamps ISO 8601.
- **Yearly billing only** — there is no quarterly concept anywhere (spec §9).
- Every mutation writes an `AuditLog` row (visible at `GET /api/tenants/audit/`).

---

## 1. Authentication (Apex-only)

This console is **Apex-only**: only Django superusers/staff can log in. Tenant-role
accounts (OWNER/MANAGER/STORE/…) are rejected with the same generic error — they
belong to the other volosync repos. A `Profile` row is **not** required for the
admin (superusers created via `createsuperuser` have none).

### `POST /api/auth/login/`

Auth: none (this is the login). Body: `{ "username": "founder", "password": "..." }`.

Success `200`:

```json
{
  "access": "<jwt>",
  "refresh": "<jwt>",
  "user": {
    "id": 1,
    "username": "founder",
    "name": "Founder Name",
    "role": "APEX",
    "tenant": null,
    "tenant_id": null,
    "must_change_password": false
  }
}
```

The JWT itself carries custom claims: `role: "APEX"`, `tenant_id: null`,
`tenant_name: ""`, `name`.

Failure `401` — identical for wrong password, unknown user, inactive user, or a
valid non-superuser:

```json
{"errors": {"message": "Invalid credentials."}}
```

### `POST /api/auth/token/refresh/`

Standard SimpleJWT refresh: `{"refresh": "<jwt>"}` → `{"access": "<jwt>"}`.

### `GET /api/user/me/`  (admin)

`200 {"data": {"id": 1, "username": "founder", "first_name": "", "last_name": "", "email": "", "role": "APEX", "tenant": null}}`

### `POST /api/user/change_password/`  (admin)

Body `{"old_password": "...", "new_password": "..."}` (min 6 chars).
`200 {"data": {"detail": "Password updated."}}` · `400` on bad old/short new.

---

## 2. Tenants

### `GET /api/tenants/`  (admin)

Every wholesaler **and** its branches. Row = full tenant serializer (see §2.3)
plus:

```json
{
  "data": [
    {
      "id": 2, "name": "Acme Trading", "tin": "0012345678",
      "phone": "+251911...", "address": "Merkato", "logo_url": "",
      "vat_rate": "15.00",
      "module_inventory": true, "module_hr": true, "sales_role_enabled": false,
      "parent": null, "is_main": true,
      "subscription_expires_on": "2027-10-31",
      "subscription_transaction_id": "BANK-001",
      "subscription_paid_on": "2026-10-31", "subscription_note": "",
      "subscription_state": "ACTIVE",
      "annual_fee": "60000.00",
      "created_at": "2026-01-05T10:12:00Z",
      "is_branch": false,
      "staff_count": 5, "branch_count": 2, "lot_count": 12,
      "stock_value": "184350.00"
    }
  ]
}
```

`subscription_state` ∈ `UNPAID | EXPIRED | DUE_SOON | ACTIVE`
(`UNPAID` = never paid, `EXPIRED` = expiry in the past, `DUE_SOON` = expires within
30 days).

### `POST /api/tenants/`  (admin) — signup

Creates a tenant **and** its owner account in one call.

```json
{
  "name": "Acme Trading", "tin": "0012345678",
  "phone": "+251911000111", "address": "Merkato",
  "vat_rate": "15.00",
  "module_inventory": true, "module_hr": true, "sales_role_enabled": false,
  "username": "acme-owner", "password": "secret123",
  "owner_first_name": "Abebe", "owner_last_name": "Alemu"
}
```

`201 {"data": {<tenant serializer>}, "owner": "acme-owner"}` — the tenant starts
with `is_main: true` and a one-year subscription from today.
`400` for missing name/TIN, taken TIN, missing/short owner credentials, taken username.

### `GET /api/tenants/<id>/`  (admin) — full detail (tenant detail page)

```json
{
  "data": {
    "id": 2, "name": "Acme Trading", "tin": "0012345678",
    "phone": "+251911000111", "address": "Merkato", "logo_url": "",
    "vat_rate": "15.00",
    "module_inventory": true, "module_hr": true, "sales_role_enabled": false,
    "parent": null, "is_main": true,
    "subscription_expires_on": "2027-10-31",
    "subscription_transaction_id": "BANK-001",
    "subscription_paid_on": "2026-10-31", "subscription_note": "",
    "subscription_state": "ACTIVE",
    "annual_fee": "60000.00",
    "created_at": "2026-01-05T10:12:00Z",
    "is_branch": false,
    "parent_name": null,
    "next_renewal_date": "2027-10-31",
    "suggested_annual_fee": "60000.00",
    "counts": {
      "staff": 5, "branches": 2, "lots": 12,
      "payments": 3, "setup_payments": 1, "module_requests": 0
    },
    "stock_value": "184350.00"
  }
}
```

- `next_renewal_date` — yearly billing: renewal falls due on the expiry date;
  `null` when never paid (`subscription_state` `UNPAID`).
- `suggested_annual_fee` — fee recalculation from the default active pricing plan
  (see §6); `null` when no default active plan exists.
- `stock_value` = Σ `remaining_quantity × unit_cost` over the tenant's lots.

### `PATCH /api/tenants/<id>/`  (admin) — whitelisted updates + fee recalculation

Whitelisted fields: `name`, `phone`, `address`, `vat_rate`, `module_inventory`,
`module_hr`, `sales_role_enabled`, `subscription_expires_on`, `annual_fee`,
`subscription_note`.

**Fee recalculation (Modules tab):** every PATCH response carries
`suggested_annual_fee`, computed from the default **active** plan **after** the
module toggles in this payload are applied:

```
suggested = yearly_base_fee
          + inventory_yearly_fee   if module_inventory
          + hr_yearly_fee          if module_hr
          + sales_role_yearly_fee  if sales_role_enabled
```

The suggestion is **stored** on `tenant.annual_fee` **only** when the client sends
`"apply_fee": true`; `apply_fee` itself is never stored. When no default active
plan exists, `suggested_annual_fee` is `null` and `apply_fee` is a no-op.

Request (preview only):

```json
{"module_hr": false}
```

Response `200`:

```json
{
  "data": { <tenant serializer, module_hr now false, annual_fee unchanged> },
  "suggested_annual_fee": "44000.00",
  "fee_applied": false
}
```

Request (toggle + apply):

```json
{"module_hr": false, "apply_fee": true}
```

Response `200` — `data.annual_fee` is now `"44000.00"`, `fee_applied: true`.
Also accepts a manual `annual_fee` override (a number; `400` if not) — the Billing
tab's "manual override". Every PATCH is audit-logged.

### `GET /api/tenants/<id>/payments/`  (admin) — payment history, newest first

```json
{"data": [<payment row>, ...]}
```

Payment row shape (shared by every subscription-payment listing; `transaction_ref`
is canonical, `transaction_id` an alias for legacy consumers):

```json
{
  "id": 9, "tenant": 2, "tenant_name": "Acme Trading",
  "transaction_id": "TELEBIRR-777", "transaction_ref": "TELEBIRR-777",
  "channel": "TELEBIRR", "status": "APPROVED",
  "amount": "68000.00", "years": 1,
  "paid_on": "2026-10-31", "covers_until": "2027-10-31",
  "note": "",
  "submitted_by": "acme-owner", "submitted_at": "2026-10-30T14:02:00Z",
  "decided_by": "founder", "decided_at": "2026-10-31T09:00:00Z",
  "decision_note": "ok",
  "recorded_by": "",
  "created_at": "2026-10-30T14:02:00Z"
}
```

`channel` ∈ `TELEBIRR | BANK | CASH | OTHER`;
`status` ∈ `PENDING | APPROVED | REJECTED`.

### `GET /api/tenants/<id>/staff/`  (admin) — users of one tenant

```json
{
  "data": [
    {
      "id": 12, "profile_id": 7,
      "username": "acme-owner", "name": "Abebe Alemu",
      "role": "OWNER", "phone": "+251911...",
      "last_login": "2026-10-30T18:44:00Z",
      "must_change_password": false, "is_active": true
    }
  ]
}
```

Roles: `STORE | FINANCE | MANAGER | HR | SALES | OWNER`.

### `GET /api/tenants/<id>/branches/`  (admin) — child tenants

```json
{
  "data": [
    {
      "id": 5, "name": "Acme Bole Branch", "tin": "0087654321",
      "parent": 2, "is_main": false,
      "subscription_state": "ACTIVE",
      "subscription_expires_on": "2027-10-31",
      "annual_fee": "0.00",
      "...": "full tenant serializer fields",
      "is_branch": true, "staff_count": 2
    }
  ]
}
```

Ordered main-first, then by name.

### `POST /api/tenants/<id>/branches/`  (admin) — create a branch

```json
{
  "name": "Acme Bole Branch", "tin": "0087654321",
  "phone": "", "address": "",
  "username": "acme-bole-mgr", "password": "secret123",
  "manager_first_name": "Kebede", "manager_last_name": "Dera"
}
```

`201 {"data": {<tenant serializer>}}`. The branch inherits the parent's VAT rate
and module switches. `username`/`password` are optional — when present, a MANAGER
account is created. `400` when name/TIN missing, TIN equals/duplicates the
parent's, or username taken.

### `GET /api/tenants/me/`  (admin)

The caller's own tenant from their Profile — `{"data": null}` for admins (they
have no tenant).

---

## 3. Subscription payments — verification queue

Flow: **owner submits** channel + transaction ref + amount → row lands `PENDING`
(tenant NOT extended) → **Apex approves** → tenant extended 365 × `years` days
from `max(today, current expiry)`. Yearly only, `years` 1–5 (default 1).

### `POST /api/payments/subscription/` — owner-side submission

Auth: any authenticated user (the owner app calls it later). The tenant comes
from an explicit `tenant` id or the caller's Profile tenant.

```json
{"tenant": 2, "channel": "TELEBIRR", "transaction_ref": "TELEBIRR-777",
 "amount": "68000", "years": 1, "note": "yearly fee"}
```

`201` — the created PENDING payment row (shape §2) **plus** the caller's current
tenant state:

```json
{"data": { "...payment row...": "", "tenant_expires_on": "2026-12-01",
           "tenant_state": "ACTIVE" }}
```

Nothing on the tenant changes at this point. `400` when no tenant resolves,
`transaction_ref` missing, bad channel, non-positive amount.

### `PATCH /api/payments/subscription/<id>/decision/` — Apex approve/reject (admin)

```json
{"decision": "APPROVED", "note": "verified at bank"}
```

- `APPROVED` — extends `tenant.subscription_expires_on` by 365 × years from
  `max(today, current expiry)` and stamps the tenant's
  `subscription_transaction_id` / `subscription_paid_on`.
- `REJECTED` — records the decision only; tenant untouched.
- Only `PENDING` rows can be decided (`400` otherwise). Audit-logged.

Response `200`:

```json
{
  "data": {
    "...payment row...": "",
    "covers_until": "2027-10-31",
    "tenant": { "<full tenant serializer>" }
  }
}
```

### `GET /api/tenants/subscriptions/`  (admin) — global ledger / queue

All payment rows (max 200), newest first, carrying the queue fields (§2 row shape).

### `POST /api/tenants/subscriptions/`  (admin) — legacy direct record

Body `{tenant, transaction_id, years?, amount, note?, channel?}`:

- default → creates a **PENDING** row (same as `POST /api/payments/subscription/`)
- `?approved=true` (or `"approved": true`) → records **and extends immediately**
  (status `APPROVED`, decided/recorded by the caller)

Response `201 {"data": {"payment": 9, "status": "PENDING", "tenant": {...},
"covers_until": "2027-10-31"}}`.

---

## 4. Setup payments (onboarding fee)

### `POST /api/payments/setup/submit/` — owner-side submission

Auth: authenticated (explicit `tenant` id or caller's Profile tenant).

```json
{"tenant": 2, "channel": "BANK", "transaction_ref": "CBE-1234", "amount": "30000"}
```

`201` — the created `PENDING` SetupPayment:

```json
{
  "data": {
    "id": 3, "tenant": 2, "tenant_name": "Acme Trading",
    "amount": "30000.00", "transaction_ref": "CBE-1234", "channel": "BANK",
    "status": "PENDING", "note": "",
    "decided_by": "", "decided_at": null, "decision_note": "",
    "created_at": "2026-10-31T10:00:00Z"
  }
}
```

### `GET /api/tenants/setup-payments/`  (admin) — the queue (max 200)

Same row shape as above.

### `PATCH /api/tenants/setup-payments/`  (admin) — decide (note: PATCH by id in body)

```json
{"id": 3, "status": "APPROVED", "note": "cash at bank"}
```

(`decision` accepted as an alias for `status`.) Only `PENDING` rows decide;
stamps `decided_by`/`decided_at`/`decision_note`, audit-logged.
`200 {"data": {"id": 3, "status": "APPROVED"}}`. Approving records the fee only —
it does not activate the tenant.

---

## 5. Module requests

### `GET /api/tenants/module-requests/`  (admin)

```json
{"data": [{"id": 1, "tenant": "Acme Trading", "tenant_id": 2,
           "requested_modules": "INVENTORY", "note": "", "status": "PENDING",
           "created_at": "...", "decided_at": null}]}
```

### `PATCH /api/tenants/module-requests/`  (admin) — decide

`{"id": 1, "status": "APPROVED"}` — approving switches the requested modules
(`INVENTORY` / `HR`, comma-separated) on for the tenant. Audit-logged.

---

## 6. Pricing plans (yearly only — no quarterly fee exists)

### `GET /api/pricing/`  (admin)

```json
{
  "data": [
    {
      "id": 1, "name": "VoloSync Standard",
      "setup_fee": "30000.00",
      "yearly_base_fee": "20000.00",
      "inventory_yearly_fee": "24000.00",
      "hr_yearly_fee": "16000.00",
      "sales_role_yearly_fee": "8000.00",
      "is_default": true, "active": true,
      "created_at": "2026-10-30T12:00:00Z"
    }
  ]
}
```

Default plan first. A seeded plan **"VoloSync Standard"** exists in the database
(created by migration `0007`; the migration is a no-op if a plan already exists).

### `POST /api/pricing/`  (admin)

```json
{"name": "Premium", "setup_fee": "50000", "yearly_base_fee": "40000",
 "inventory_yearly_fee": "36000", "hr_yearly_fee": "24000",
 "sales_role_yearly_fee": "12000", "is_default": true, "active": true}
```

`201` — the plan. Only one plan may be `is_default` (making one default clears
the others atomically). `400` on missing/duplicate name or non-numeric fee.

### `GET /api/pricing/<id>/`  (admin) — one plan · `404` if missing.

### `PATCH /api/pricing/<id>/`  (admin)

Any subset of the create fields. Same single-default rule.

### `DELETE /api/pricing/<id>/`  (admin)

`200 {"data": {"id": 1, "deleted": true}}`.

### Fee recalculation formula (used by tenant detail/PATCH)

From the default **active** plan (`is_default AND active`):

```
annual_fee = yearly_base_fee
           + inventory_yearly_fee   if module_inventory
           + hr_yearly_fee          if module_hr
           + sales_role_yearly_fee  if sales_role_enabled
```

`suggest_annual_fee` returns `null` (and PATCH `apply_fee` is a no-op) when no
default active plan exists.

---

## 7. Modules catalog

### `GET /api/modules/catalog/`  (admin)

```json
{
  "data": {
    "modules": [
      {"code": "INVENTORY", "name": "Inventory",
       "description": "Voucher-lot stock: store, finance and manager approvals, promotions, sales.",
       "yearly_fee": "24000.00", "active_for_platform": true},
      {"code": "HR", "name": "HR Module",
       "description": "Employees, leave, attendance, payroll workflows and the emp/ats companions.",
       "yearly_fee": "16000.00", "active_for_platform": true}
    ],
    "plan": { "<full pricing plan>" },
    "sales_role_enabled_fee": "8000.00"
  }
}
```

`yearly_fee`/`sales_role_enabled_fee` come from the default active plan; `null`
(and `active_for_platform: false`) when no such plan exists.

---

## 8. Platform reports

### `GET /api/reports/platform/`  (admin) — per-tenant rows + totals

The Reports page exports client-side (no server PDF/Excel).

```json
{
  "data": {
    "rows": [
      {
        "id": 2, "tenant": "Acme Trading", "tin": "0012345678",
        "is_branch": false, "state": "ACTIVE",
        "annual_fee": "60000.00",
        "staff_count": 5, "lot_count": 12, "stock_value": "184350.00",
        "payments_count": 3
      }
    ],
    "totals": {
      "tenants": 4, "staff": 11, "lots": 37,
      "stock_value": "512000.00", "annual_fee": "180000.00", "payments": 9
    }
  }
}
```

---

## 9. Dashboard

### `GET /api/tenants/dashboard/`  (admin)

```json
{
  "data": {
    "companies": 3, "branches": 1,
    "active": 2, "due_soon": 1, "expired": 0,
    "year_revenue": "136000.00", "payments": 5,
    "stock_value": "184350.00", "staff": 12,
    "pending_subscription_payments": 2,
    "pending_setup_payments": 0,
    "pending_module_requests": 1,
    "unread_feedback": 4
  }
}
```

(`companies` = top-level tenants, `branches` = child tenants; revenue counts
payments recorded this calendar year.)

---

## 10. Staff & credential reset

### `GET /api/tenants/staff/`  (admin) — every account, all tenants

Same row shape as `GET /api/tenants/<id>/staff/` plus `tenant`/`tenant_id`.
Ordered by tenant name, then role. `id` here is the **user** id.

### `POST /api/tenants/staff/<user_id>/reset-password/`  (admin)

- `{}` → generates a random 12-character temp password;
- `{"password": "manualpw"}` → sets that password (min 6 chars, `400` otherwise).

Either way: `profile.must_change_password = True`, and the password is returned
**once** — it is never retrievable again. Audit-logged.

```json
{
  "data": {
    "id": 12, "username": "acme-owner",
    "password": "Xk4tR9pQm2Za",
    "generated": true,
    "must_change_password": true
  }
}
```

---

## 11. Platform sales agents (Apex's own sellers — not tenant agents)

### `GET /api/sales-agents/`  (admin)

```json
{"data": [{"id": 1, "name": "Hanna Tesfaye", "phone": "+251911777888",
           "email": "hanna@apex.et", "sex": "F", "active": true,
           "notes": "", "created_at": "..."}]}
```

### `POST /api/sales-agents/`  (admin)

`{"name": "Hanna Tesfaye", "phone": "", "email": "", "sex": "", "active": true,
"notes": ""}` → `201`. `400` when name missing. Audit-logged.

### `PATCH /api/sales-agents/<id>/`  (admin)

Any subset of `name, phone, email, sex, active, notes` → `200`. Audit-logged.

---

## 12. Audit & feedback

### `GET /api/tenants/audit/`  (admin) — last 200 entries, newest first

```json
{"data": [{"id": 1, "actor": "founder", "action": "TENANT_UPDATED",
           "target_type": "tenant", "target_id": "2",
           "detail": "['module_hr']", "at": "..."}]}
```

### `GET /api/tenants/feedback/`  (admin) — last 200, newest first

```json
{"data": [{"id": 1, "tenant": "Acme Trading", "subject": "Question",
           "body": "...", "category": "GENERAL", "status": "OPEN",
           "contact": "", "unread": true, "created_at": "..."}]}
```

- `POST /api/tenants/feedback/` — `{tenant?, subject, body?, category?, contact?}`
  → `201 {"data": {"id": 1}}`.
- `PATCH /api/tenants/feedback/` — `{id, status}` (`OPEN|READ|RESOLVED`); `unread`
  follows the status. `200 {"data": {"id": 1, "status": "READ"}}`.

---

## 13. Authorization summary

| Condition | Result |
|---|---|
| No/expired token | `401` (SimpleJWT) |
| Valid token, user not `is_superuser`/`is_staff` | `403 {"errors":{"message":"Platform admin only."}}` |
| Login with a non-superuser account | `401 {"errors":{"message":"Invalid credentials."}}` |

**Every** platform endpoint above is admin-only, including auth, feedback, audit,
pricing, payments, module requests, reports, catalog, sales agents and
`/api/user/*`. The domain apps (`/api/inventory/`, `/api/sales/`, `/api/assets/`)
are tenant-scoped and NOT used by this console.

## 14. Billing tab cheat-sheet

- **Yearly fee** → `GET /api/tenants/<id>/` → `annual_fee`; change via
  `PATCH` with `annual_fee` (manual override) or `apply_fee: true` (recalculated).
- **Next renewal** → `next_renewal_date` (= `subscription_expires_on`; yearly only).
- **State** → `subscription_state` (`UNPAID/EXPIRED/DUE_SOON/ACTIVE`).
- **Payments** → `GET /api/tenants/<id>/payments/`, decide via
  `PATCH /api/payments/subscription/<id>/decision/`.
