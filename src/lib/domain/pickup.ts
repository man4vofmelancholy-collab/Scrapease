// Pure business rules for pickup requests. No I/O here.

export type ScrapUnit = "kg" | "piece" | "litre";
export type PickupStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "picked_up"
  | "completed"
  | "cancelled";

export const STATUS_LABELS: Record<PickupStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  assigned: "Assigned",
  picked_up: "Picked Up",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const UNIT_LABELS: Record<ScrapUnit, string> = { kg: "kg", piece: "piece", litre: "litre" };

// Mirrors the database trigger `enforce_status_transition`.
const NEXT: Record<PickupStatus, PickupStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["assigned", "cancelled"],
  assigned: ["picked_up", "cancelled"],
  picked_up: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function nextStatuses(s: PickupStatus): PickupStatus[] {
  return NEXT[s];
}

export function canTransition(from: PickupStatus, to: PickupStatus): boolean {
  return NEXT[from].includes(to);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function lineEstimate(quantity: number, rate: number): number {
  if (!(quantity > 0) || !(rate > 0)) return 0;
  return round2(quantity * rate);
}

export function estimateTotal(items: { quantity: number; rate: number }[]): number {
  return round2(items.reduce((sum, i) => sum + lineEstimate(i.quantity, i.rate), 0));
}

export const MOBILE_RE = /^[6-9]\d{9}$/;
export const PINCODE_RE = /^[1-9]\d{5}$/;

export function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}
