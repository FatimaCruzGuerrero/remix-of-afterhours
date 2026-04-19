import type { Shift, DayKey } from "@/data/mockData";

// Convert "HH:mm" to minutes from midnight.
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Returns the [start, end] minute intervals a shift occupies on a given day.
 * If end <= start, the shift wraps past midnight: it spans [start, 1440] today
 * AND [0, end] the NEXT day.
 */
const intervalsForDay = (shift: Shift, day: DayKey): Array<[number, number]> => {
  const intervals: Array<[number, number]> = [];
  const start = toMin(shift.startTime);
  const end = toMin(shift.endTime);
  const wraps = end <= start;

  if (shift.days.includes(day)) {
    intervals.push([start, wraps ? 1440 : end]);
  }
  // Check if the previous day's shift wraps INTO this day
  if (wraps) {
    const prev = previousDay(day);
    if (shift.days.includes(prev)) {
      intervals.push([0, end]);
    }
  }
  return intervals;
};

const ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const previousDay = (d: DayKey): DayKey => ORDER[(ORDER.indexOf(d) + 6) % 7];

const overlaps = (a: [number, number], b: [number, number]) => a[0] < b[1] && b[0] < a[1];

export interface ConflictResult {
  hasConflict: boolean;
  message?: string;
}

export interface NewShiftInput {
  id?: number; // when editing, ignore self
  employeeId: number;
  branch: string;
  startTime: string;
  endTime: string;
  days: DayKey[];
}

export const validateShift = (input: NewShiftInput, existing: Shift[]): ConflictResult => {
  if (!input.employeeId) return { hasConflict: true, message: "Selecciona un empleado." };
  if (!input.branch) return { hasConflict: true, message: "Selecciona una sucursal." };
  if (input.days.length === 0) return { hasConflict: true, message: "Selecciona al menos un día." };
  if (!input.startTime || !input.endTime) {
    return { hasConflict: true, message: "Define hora de entrada y salida." };
  }
  if (input.startTime === input.endTime) {
    return { hasConflict: true, message: "La hora de entrada y salida no pueden ser iguales." };
  }

  const candidate: Shift = { id: input.id ?? -1, ...input };
  const others = existing.filter((s) => s.id !== input.id && s.employeeId === input.employeeId);

  for (const day of ORDER) {
    const candidateIntervals = intervalsForDay(candidate, day);
    if (candidateIntervals.length === 0) continue;
    for (const other of others) {
      const otherIntervals = intervalsForDay(other, day);
      for (const ci of candidateIntervals) {
        for (const oi of otherIntervals) {
          if (overlaps(ci, oi)) {
            const sameBranch = other.branch === input.branch;
            return {
              hasConflict: true,
              message: sameBranch
                ? `Conflicto: el empleado ya tiene un turno en ${other.branch} (${other.startTime}–${other.endTime}) que se cruza.`
                : `Conflicto: el empleado está asignado a ${other.branch} en ese mismo horario (${other.startTime}–${other.endTime}).`,
            };
          }
        }
      }
    }
  }

  return { hasConflict: false };
};

export { intervalsForDay };
