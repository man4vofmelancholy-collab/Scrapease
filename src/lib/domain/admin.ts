import type { PickupStatus } from "./pickup";

export type EnquiryStatus = "new" | "in_progress" | "resolved";
export const ENQUIRY_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const PHONE_RE = /^[0-9+\- ]{7,15}$/;

export type EnquiryInput = { name: string; email: string; phone: string; message: string };

/** Returns an error message, or null when the enquiry is valid. */
export function validateEnquiry(e: EnquiryInput): string | null {
  if (e.name.trim().length < 2) return "Please enter your name";
  const email = e.email.trim();
  const phone = e.phone.trim();
  if (!email && !phone) return "Give an email or phone number so we can reply";
  if (email && !EMAIL_RE.test(email)) return "Enter a valid email";
  if (phone && !PHONE_RE.test(phone)) return "Enter a valid phone number";
  const m = e.message.trim().length;
  if (m < 5) return "Message is too short";
  if (m > 2000) return "Message is too long (max 2000 characters)";
  return null;
}

/** Validates a rate value entered by an admin. */
export function validateRate(raw: string): number | null {
  const n = Number(raw);
  if (!raw.trim() || !Number.isFinite(n) || n <= 0 || n > 1_000_000) return null;
  return Math.round(n * 100) / 100;
}

export type OrderLike = {
  request_code: string;
  customer_name: string;
  mobile: string;
  status: PickupStatus;
  created_at: string;
};

export type OrderFilter = { status: PickupStatus | "all"; search: string; from: string; to: string };

/** from/to are YYYY-MM-DD, inclusive, compared on the request's local date. */
export function filterOrders<T extends OrderLike>(orders: T[], f: OrderFilter): T[] {
  const q = f.search.trim().toLowerCase();
  return orders.filter((o) => {
    if (f.status !== "all" && o.status !== f.status) return false;
    const d = localDate(o.created_at);
    if (f.from && d < f.from) return false;
    if (f.to && d > f.to) return false;
    if (q && ![o.request_code, o.customer_name, o.mobile].some((v) => v.toLowerCase().includes(q))) return false;
    return true;
  });
}

function localDate(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function summarizeOrders(orders: { status: PickupStatus }[]) {
  const count = (s: PickupStatus) => orders.filter((o) => o.status === s).length;
  return {
    total: orders.length,
    pending: count("pending"),
    completed: count("completed"),
    cancelled: count("cancelled"),
    inProgress: count("confirmed") + count("assigned") + count("picked_up"),
  };
}
