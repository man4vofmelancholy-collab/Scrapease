import { describe, expect, it } from "vitest";
import { filterOrders, summarizeOrders, validateEnquiry, validateRate } from "./admin";

const base = { name: "Ravi", email: "", phone: "9876543210", message: "Need a pickup" };

describe("validateEnquiry", () => {
  it("accepts phone-only enquiry", () => expect(validateEnquiry(base)).toBeNull());
  it("requires email or phone", () => expect(validateEnquiry({ ...base, phone: "" })).not.toBeNull());
  it("rejects bad email", () => expect(validateEnquiry({ ...base, email: "x@y" })).not.toBeNull());
});

describe("validateRate", () => {
  it("rejects zero and negatives", () => {
    expect(validateRate("0")).toBeNull();
    expect(validateRate("-3")).toBeNull();
  });
  it("rounds to paise", () => expect(validateRate("12.345")).toBe(12.35));
});

const orders = [
  { request_code: "SCR-1", customer_name: "Asha", mobile: "9000000001", status: "pending" as const, created_at: "2026-11-01T10:00:00" },
  { request_code: "SCR-2", customer_name: "Bala", mobile: "9000000002", status: "completed" as const, created_at: "2026-11-03T10:00:00" },
];

describe("filterOrders", () => {
  it("filters by status", () => expect(filterOrders(orders, { status: "completed", search: "", from: "", to: "" })).toHaveLength(1));
  it("filters by date range inclusive", () =>
    expect(filterOrders(orders, { status: "all", search: "", from: "2026-11-02", to: "2026-11-03" }).map((o) => o.request_code)).toEqual(["SCR-2"]));
  it("searches name, code, mobile", () =>
    expect(filterOrders(orders, { status: "all", search: "asha", from: "", to: "" })).toHaveLength(1));
});

describe("summarizeOrders", () => {
  it("counts by status", () => expect(summarizeOrders(orders)).toMatchObject({ total: 2, pending: 1, completed: 1, cancelled: 0 }));
});
