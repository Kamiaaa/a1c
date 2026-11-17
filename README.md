# A1 Communication - Website + Staff Dashboard + Customer Self Care

Next.js 16 · TypeScript · Tailwind CSS v4 · MongoDB (Mongoose) · JWT cookies

## Run

```bash
cp .env.example .env.local      # then fill in MONGODB_URI and a strong JWT_SECRET
npm install
npm run dev
```

**First run:** open `/register` once to create the first **admin** (public sign-up closes automatically as soon as any staff account exists).

## How the Self Care flow works

1. **Admin or Moderator** signs in at `/login` -> **Dashboard -> Customers -> Create Customer**.
2. The system generates a Customer ID (`A1C` + 6 random digits, e.g. `A1C482913`) and a one-time **temporary password**.
   The staff member copies it, or sends it by WhatsApp / SMS / print straight from the dialog.
3. The customer signs in at **`/self-care/login`** with that ID + temporary password.
   They are forced to set their own password before anything else is usable.
4. Inside Self Care the customer can:
   - **Overview**: package, connection status, next billing date, outstanding balance
   - **My Package**: see all plans, request an upgrade/downgrade, cancel a pending request, view history
   - **Billing**: invoices with paid/unpaid status (+ link to your existing Pay Bill page)
   - **Support**: open tickets and chat with staff
   - **Profile**: edit phone / email / address
   - **Password**: change password any time (signs out other devices)
5. Staff handle the other side in the dashboard:
   **Customers** (create, edit, suspend/disconnect, reset password, delete = admin only),
   **Package Requests** (approve/reject), **Billing** (create invoices, mark paid), **Support Tickets** (reply, change status).

Set `SELF_CARE_AUTO_APPROVE_PACKAGE_CHANGE=true` to apply package changes instantly instead of requiring approval.

## Roles

| Area | Admin | Moderator |
|---|---|---|
| Customers / Package requests / Billing / Tickets | yes | yes |
| Delete customers & invoices | yes | no |
| User Management, Manage Plans | yes | no |
| Customer Orders (website sign-up leads) | yes | no (API allows staff, menu is admin-only) |

## Security notes

- Passwords are bcrypt-hashed; temporary passwords are random, shown once, never stored in plain text.
- Customer and staff sessions are separate httpOnly, SameSite=Strict cookies (`customer_token` / `token`).
- Resetting or changing a customer's password invalidates all of their existing sessions.
- Login is rate-limited (8 failures / 15 min per IP + ID). The limiter is in-memory; use Redis if you run multiple instances.
- Customers can only ever read/write their own records (every query is scoped to the session's customer).
- `/api/plans` (write), `/api/orders` (read/update) now require staff login. `POST /api/orders` stays public for the website's plan form.

## Main files

```
models/        Customer, PackageRequest, Invoice, Ticket (+ existing User, Plan, Order)
lib/           session.ts (auth helpers), ids.ts (A1C ids + temp passwords), http.ts, types.ts
proxy.ts       route protection for /dashboard and /self-care
app/self-care  customer portal UI           app/api/self-care  customer API
app/dashboard  staff UI (customers, package-requests, invoices, tickets)
app/api/{customers,package-requests,invoices,tickets}  staff API
```
