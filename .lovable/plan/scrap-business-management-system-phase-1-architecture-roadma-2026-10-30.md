# Scrap Business Management System — Phase 1 Architecture & Roadmap

As your brief asks, this plan comes first. Nothing gets built until you approve it.

## 1. Business workflow

```text
Visitor -> Browse categories -> Check live rates -> Pick materials + approx qty
  -> See provisional estimate (qty x current rate) -> Submit pickup enquiry
  -> Request ID issued (e.g. SCR-20261030-0042) -> Stored in database
  -> Admin reviews -> Pending -> Confirmed -> Assigned -> Picked Up -> Completed
                                                    \-> Cancelled (from any open state)
```
Estimates are labelled **provisional**. The final price is set after weighing and checking the scrap at pickup.

## 2. System architecture

- **Frontend:** React + TypeScript + Tailwind, Lucide icons. Pages are separate routes.
- **Backend:** Lovable Cloud (PostgreSQL, auth, row-level security). Secret keys stay on the server and never reach the browser.
- **Layers:** `lib/domain` holds pure business logic (estimate calc, status transitions, ID format, tested). `lib/api` holds data access functions. Routes and components only handle display.

## 3. Database schema

| Table | Key columns |
|---|---|
| profiles | id (= auth user), full_name, mobile, address, created_at |
| user_roles | user_id, role (`admin`/`customer`). Kept separate so users can't escalate their own role |
| scrap_categories | id, name, slug, description, unit (`kg`/`piece`/`litre`), is_active, sort_order, timestamps |
| scrap_rates | id, category_id FK, rate_per_unit numeric(>0), effective_from, created_by. **Append-only**: the current rate is the latest row, so rate history comes built in |
| pickup_requests | id, request_code unique, customer_id FK (nullable for guests), name, mobile (validated), address, pincode, preferred_date, status enum, estimated_total, final_total, notes, timestamps |
| pickup_request_items | id, request_id FK cascade, category_id FK, quantity >0, unit, rate_snapshot, line_estimate |
| request_status_history | request_id FK, from_status, to_status, changed_by, changed_at |

- The request code and the estimate are calculated **by the database** when a request is saved, using current rates. Customers can't tamper with prices.
- A database view, `current_scrap_rates`, gives the latest rate for each active category.

## 4. Security (RLS)

- Categories and current rates: anyone can read. Only admins can write.
- Pickup requests: guests can submit through a secure database function only. Logged-in customers can read only their own requests. Admins can read and update all requests.
- Status changes: admin only, and the database enforces the allowed order of steps.
- Admin check uses a database role check (`has_role`), never the browser's local storage.

## 5. Module roadmap (one at a time, each verified)

1. **Foundation:** enable Cloud, design tokens, public layout, Home + Contact pages
2. **Categories + Rates (read):** schema, a few starter categories you'll edit later, Categories + Rates pages
3. **Pickup enquiry:** multi-item form, live estimate, submission, request ID confirmation page, tests for the estimate and ID logic
4. **Auth + roles:** customer login, admin role, "My requests" history
5. **Admin: Categories & Rates:** create/edit/deactivate categories, add rates, view rate history
6. **Admin: Pickup requests:** list/filter requests, change status, record final weight and price

Dependencies: 2 needs 1. 3 needs 2. 4 needs 1. 5 and 6 need both 4 and 2/3.

## 6. Open questions before Module 1
- Business name, city/service area, phone/WhatsApp for the Contact page
- Starting list of materials and rates (or I'll add clearly marked samples for you to replace)
