import { describe, expect, it } from "vitest";
import { canTransition, estimateTotal, lineEstimate, MOBILE_RE, PINCODE_RE } from "./pickup";

describe("price estimation", () => {
  it("estimated price = quantity x current rate", () => {
    expect(lineEstimate(12.5, 26)).toBe(325);
  });
  it("sums lines and rounds to paise", () => {
    expect(estimateTotal([{ quantity: 3, rate: 14 }, { quantity: 1.333, rate: 105 }])).toBe(181.97);
  });
  it("ignores zero or negative quantities", () => {
    expect(lineEstimate(0, 26)).toBe(0);
    expect(lineEstimate(-2, 26)).toBe(0);
  });
});

describe("status flow", () => {
  it("pending can be confirmed", () => expect(canTransition("pending", "confirmed")).toBe(true));
  it("pending cannot skip to completed", () => expect(canTransition("pending", "completed")).toBe(false));
  it("picked up can be completed", () => expect(canTransition("picked_up", "completed")).toBe(true));
  it("completed is final", () => expect(canTransition("completed", "cancelled")).toBe(false));
  it("any open status can be cancelled", () => expect(canTransition("assigned", "cancelled")).toBe(true));
});

describe("validation", () => {
  it("accepts 10-digit Indian mobile", () => expect(MOBILE_RE.test("9876543210")).toBe(true));
  it("rejects mobile starting with 5", () => expect(MOBILE_RE.test("5876543210")).toBe(false));
  it("accepts 6-digit pincode", () => expect(PINCODE_RE.test("411001")).toBe(true));
});
