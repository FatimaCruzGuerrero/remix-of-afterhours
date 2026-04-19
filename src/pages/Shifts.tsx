import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Clock, MapPin, UserCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MobileNav } from "@/components/admin/MobileNav";
import { branches, employees, WEEK_DAYS, initialShifts, type Shift, type DayKey } from "@/data/mockData";
import { validateShift, intervalsForDay } from "@/lib/shiftConflicts";

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0..23
const PX_PER_HOUR = 36;

const emptyForm = {
  employeeId: 0,
  branch: "",
  startTime: "18:00",
  endTime: "23:00",
  days: [] as DayKey[],
};

const employeeName = (id: number) => employees.find((e) => e.id === id)?.name ?? "—";

// Deterministic accent per employee using existing tokens
const accentFor = (id: number) => {
  const palette = [
    { bg: "bg-primary/15", border: "border-primary/40", text: "text-primary" },
    { bg: "bg-accent", border: "border-primary/30", text: "text-accent-foreground" },
    { bg: "bg-secondary", border: "border-border", text: "text-secondary-foreground" },
  ];
  return palette[id % palette.length];
};

const Shifts = () => {
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (s: Shift) => {
    setEditing(s);
    setForm({ employeeId: s.employeeId, branch: s.branch, startTime: s.startTime, endTime: s.endTime, days: [...s.days] });
    setError(null);
    setDialogOpen(true);
  };

  const toggleDay = (d: DayKey) => {
    setForm((f) => ({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] }));
  };

  const save = () => {
    const result = validateShift({ ...form, id: editing?.id }, shifts);
    if (result.hasConflict) {
      setError(result.message ?? "Conflicto de horario.");
      return;
    }
    if (editing) {
      setShifts((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...form } : s)));
      toast.success("Turno actualizado", { description: `${employeeName(form.employeeId)} · ${form.branch}` });
    } else {
      const newShift: Shift = { id: Date.now(), ...form };
      setShifts((prev) => [...prev, newShift]);
      toast.success("Turno asignado", {
        description: `Se notificó a ${employeeName(form.employeeId)} sobre su turno en ${form.branch} (${form.startTime}–${form.endTime}).`,
      });
    }
    setDialogOpen(false);
  };

  const remove = (id: number) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
    toast("Turno eliminado");
  };

  // Group shift segments per day for the grid
  const segmentsByDay = useMemo(() => {
    const map: Record<DayKey, Array<{ shift: Shift; startMin: number; endMin: number }>> = {
      mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
    };
    for (const day of WEEK_DAYS.map((d) => d.key)) {
      for (const s of shifts) {
        for (const [start, end] of intervalsForDay(s, day)) {
          map[day].push({ shift: s, startMin: start, endMin: end });
        }
      }
    }
    return map;
  }, [shifts]);

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <MobileNav />

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient-gold">Gestión de Turnos</h1>
              <p className="text-sm text-muted-foreground mt-1">Asigna y visualiza la semana de cada empleado.</p>
            </div>
            <Button onClick={openNew} className="gold-glow hover:scale-[1.02] transition-transform">
              <Plus className="w-4 h-4 mr-2" /> Nuevo Turno
            </Button>
          </div>

          {/* Weekly grid */}
          <div className="glass-card p-4 overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid" style={{ gridTemplateColumns: "60px repeat(7, minmax(0, 1fr))" }}>
                <div />
                {WEEK_DAYS.map((d) => (
                  <div key={d.key} className="text-center text-xs font-medium text-muted-foreground pb-2 uppercase tracking-wide">
                    {d.label}
                  </div>
                ))}
              </div>

              <div className="grid" style={{ gridTemplateColumns: "60px repeat(7, minmax(0, 1fr))" }}>
                {/* Hours column */}
                <div className="relative" style={{ height: HOURS.length * PX_PER_HOUR }}>
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 text-[10px] text-muted-foreground pr-2 text-right"
                      style={{ top: h * PX_PER_HOUR - 6 }}
                    >
                      {h.toString().padStart(2, "0")}:00
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {WEEK_DAYS.map((d) => (
                  <div
                    key={d.key}
                    className="relative border-l border-border"
                    style={{ height: HOURS.length * PX_PER_HOUR }}
                  >
                    {/* hour grid lines */}
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-border/40"
                        style={{ top: h * PX_PER_HOUR }}
                      />
                    ))}

                    {/* shift blocks */}
                    {segmentsByDay[d.key].map((seg, idx) => {
                      const top = (seg.startMin / 60) * PX_PER_HOUR;
                      const height = Math.max(((seg.endMin - seg.startMin) / 60) * PX_PER_HOUR, 22);
                      const accent = accentFor(seg.shift.employeeId);
                      return (
                        <button
                          key={`${seg.shift.id}-${idx}`}
                          onClick={() => openEdit(seg.shift)}
                          className={`absolute left-1 right-1 rounded-md border ${accent.bg} ${accent.border} p-1.5 text-left overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all`}
                          style={{ top, height }}
                        >
                          <div className={`text-[11px] font-semibold leading-tight ${accent.text} truncate`}>
                            {employeeName(seg.shift.employeeId)}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">{seg.shift.branch}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {seg.shift.startTime}–{seg.shift.endTime}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Shift list */}
          <div className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">Turnos asignados</h2>
            {shifts.length === 0 ? (
              <div className="glass-card p-8 text-center text-muted-foreground text-sm">
                No hay turnos asignados todavía.
              </div>
            ) : (
              <div className="grid gap-3">
                {shifts.map((s) => (
                  <div key={s.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <UserCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">{employeeName(s.employeeId)}</div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                          <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-primary/70" /> {s.branch}</span>
                          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-primary/70" /> {s.startTime}–{s.endTime}</span>
                          <span className="inline-flex flex-wrap gap-1">
                            {s.days.map((d) => (
                              <span key={d} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                                {WEEK_DAYS.find((w) => w.key === d)?.label}
                              </span>
                            ))}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(s)}>
                        <Pencil className="w-3 h-3 mr-1" /> Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => remove(s.id)}
                        className="text-muted-foreground hover:text-foreground hover:border-muted-foreground">
                        <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">
              {editing ? "Editar Turno" : "Nuevo Turno"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Asigna un horario semanal a un empleado en una sucursal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Empleado</Label>
              <Select
                value={form.employeeId ? String(form.employeeId) : ""}
                onValueChange={(v) => setForm((f) => ({ ...f, employeeId: Number(v) }))}
              >
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue placeholder="Selecciona empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.name} <span className="text-muted-foreground">— {e.position}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Sucursal</Label>
              <Select value={form.branch} onValueChange={(v) => setForm((f) => ({ ...f, branch: v }))}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue placeholder="Selecciona sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Hora de entrada</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Hora de salida</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  className="bg-muted/50 border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Días de la semana</Label>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map((d) => {
                  const active = form.days.includes(d.key);
                  return (
                    <button
                      type="button"
                      key={d.key}
                      onClick={() => toggleDay(d.key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-all ${
                        active
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Checkbox checked={active} className="pointer-events-none" />
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border text-muted-foreground">
              Cancelar
            </Button>
            <Button onClick={save} className="gold-glow">
              {editing ? "Guardar Cambios" : "Asignar Turno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Shifts;
