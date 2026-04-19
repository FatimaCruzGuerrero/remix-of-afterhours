import { describe, it, expect } from "vitest";
import { validateShift } from "@/lib/shiftConflicts";
import type { Shift } from "@/data/mockData";

const base: Shift[] = [
  { id: 1, employeeId: 1, branch: "A", startTime: "18:00", endTime: "23:00", days: ["mon", "tue"] },
];

describe("validateShift", () => {
  it("rejects overlap same employee same day", () => {
    const r = validateShift({ employeeId: 1, branch: "B", startTime: "20:00", endTime: "22:00", days: ["mon"] }, base);
    expect(r.hasConflict).toBe(true);
  });
  it("allows non-overlap same day", () => {
    const r = validateShift({ employeeId: 1, branch: "B", startTime: "10:00", endTime: "17:00", days: ["mon"] }, base);
    expect(r.hasConflict).toBe(false);
  });
  it("allows different employee same time", () => {
    const r = validateShift({ employeeId: 2, branch: "A", startTime: "18:00", endTime: "23:00", days: ["mon"] }, base);
    expect(r.hasConflict).toBe(false);
  });
  it("detects wrap-past-midnight conflict on next day", () => {
    const wrap: Shift[] = [{ id: 1, employeeId: 1, branch: "A", startTime: "22:00", endTime: "03:00", days: ["fri"] }];
    const r = validateShift({ employeeId: 1, branch: "B", startTime: "01:00", endTime: "05:00", days: ["sat"] }, wrap);
    expect(r.hasConflict).toBe(true);
  });
  it("ignores self when editing", () => {
    const r = validateShift({ id: 1, employeeId: 1, branch: "A", startTime: "18:00", endTime: "23:00", days: ["mon", "tue"] }, base);
    expect(r.hasConflict).toBe(false);
  });
  it("requires days", () => {
    const r = validateShift({ employeeId: 1, branch: "A", startTime: "18:00", endTime: "23:00", days: [] }, base);
    expect(r.hasConflict).toBe(true);
  });
});
