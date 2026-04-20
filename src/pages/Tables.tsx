import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserCircle,
  Clock,
  User,
  Armchair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MobileNav } from "@/components/admin/MobileNav";
import {
  employees,
  initialSectionWaiters,
  initialTables,
  TABLE_SECTIONS,
  type BarTable,
  type TableSection,
  type TableStatus,
} from "@/data/mockData";
import { toast } from "sonner";

const emptyForm: { number: string; section: TableSection } = {
  number: "",
  section: "barra",
};

const emptyReservation = { name: "", time: "" };

const statusBadge: Record<TableStatus, { label: string; className: string }> = {
  libre: {
    label: "Libre",
    className: "bg-muted/40 text-muted-foreground border-border",
  },
  ocupada: {
    label: "Ocupada",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  apartada: {
    label: "Apartada",
    className: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  },
};

const Tables = () => {
  const [tables, setTables] = useState<BarTable[]>(initialTables);
  const [sectionWaiters, setSectionWaiters] =
    useState<Record<TableSection, number | null>>(initialSectionWaiters);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Create/edit dialog
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BarTable | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Assign waiter dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState<BarTable | null>(null);
  const [assignWaiterId, setAssignWaiterId] = useState<string>("");

  // Reservation dialog
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
  const [reserving, setReserving] = useState<BarTable | null>(null);
  const [reservationForm, setReservationForm] = useState(emptyReservation);

  const waiterName = (id: number | null) =>
    id ? employees.find((e) => e.id === id)?.name ?? "—" : "Sin asignar";

  const sectionLabel = (key: TableSection) =>
    TABLE_SECTIONS.find((s) => s.key === key)?.label ?? key;

  const sortedTables = useMemo(
    () =>
      [...tables].sort(
        (a, b) =>
          a.section.localeCompare(b.section) || a.number - b.number,
      ),
    [tables],
  );

  const availableCount = tables.filter((t) => t.status === "libre").length;

  // ── Table CRUD ───────────────────────────────────────────
  const openNewTable = () => {
    setEditing(null);
    setForm(emptyForm);
    setTableDialogOpen(true);
  };

  const openEditTable = (t: BarTable) => {
    setEditing(t);
    setForm({ number: String(t.number), section: t.section });
    setTableDialogOpen(true);
  };

  const saveTable = () => {
    const num = parseInt(form.number, 10);
    if (!num || num <= 0) {
      toast.error("El número de mesa debe ser mayor a 0");
      return;
    }
    const duplicate = tables.some(
      (t) => t.number === num && t.id !== editing?.id,
    );
    if (duplicate) {
      toast.error("Ya existe una mesa con ese número");
      return;
    }

    if (editing) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === editing.id ? { ...t, number: num, section: form.section } : t,
        ),
      );
      toast.success("Mesa actualizada");
    } else {
      setTables((prev) => [
        ...prev,
        {
          id: Date.now(),
          number: num,
          section: form.section,
          status: "libre",
          waiterId: sectionWaiters[form.section] ?? null,
        },
      ]);
      toast.success("Mesa creada");
    }
    setTableDialogOpen(false);
  };

  const removeTable = (id: number) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
    setExpanded(null);
    toast.success("Mesa eliminada");
  };

  // ── Status actions (one state at a time) ─────────────────
  const setOccupied = (t: BarTable) => {
    setTables((prev) =>
      prev.map((x) =>
        x.id === t.id
          ? { ...x, status: "ocupada", reservationName: undefined, reservationTime: undefined }
          : x,
      ),
    );
    toast.success(`Mesa ${t.number} asignada a clientes`);
  };

  const setFree = (t: BarTable) => {
    setTables((prev) =>
      prev.map((x) =>
        x.id === t.id
          ? { ...x, status: "libre", reservationName: undefined, reservationTime: undefined }
          : x,
      ),
    );
    toast.success(`Mesa ${t.number} liberada`);
  };

  // ── Reservation ──────────────────────────────────────────
  const openReservation = (t: BarTable) => {
    setReserving(t);
    setReservationForm({
      name: t.reservationName ?? "",
      time: t.reservationTime ?? "",
    });
    setReservationDialogOpen(true);
  };

  const saveReservation = () => {
    if (!reserving) return;
    const name = reservationForm.name.trim();
    if (!name) {
      toast.error("El nombre del cliente es obligatorio");
      return;
    }
    if (!reservationForm.time) {
      toast.error("La hora de la reservación es obligatoria");
      return;
    }
    setTables((prev) =>
      prev.map((x) =>
        x.id === reserving.id
          ? {
              ...x,
              status: "apartada",
              reservationName: name,
              reservationTime: reservationForm.time,
            }
          : x,
      ),
    );
    toast.success(`Mesa ${reserving.number} apartada para ${name}`);
    setReservationDialogOpen(false);
  };

  // ── Assign waiter to a single table ──────────────────────
  const openAssignWaiter = (t: BarTable) => {
    setAssigning(t);
    setAssignWaiterId(t.waiterId ? String(t.waiterId) : "none");
    setAssignDialogOpen(true);
  };

  const saveAssignWaiter = () => {
    if (!assigning) return;
    const waiterId =
      assignWaiterId && assignWaiterId !== "none"
        ? parseInt(assignWaiterId, 10)
        : null;
    setTables((prev) =>
      prev.map((t) => (t.id === assigning.id ? { ...t, waiterId } : t)),
    );
    toast.success(`Mesero asignado a mesa ${assigning.number}`);
    setAssignDialogOpen(false);
  };

  // ── Assign waiter to a whole section ─────────────────────
  const setSectionWaiter = (section: TableSection, value: string) => {
    const waiterId = value && value !== "none" ? parseInt(value, 10) : null;
    setSectionWaiters((prev) => ({ ...prev, [section]: waiterId }));
    setTables((prev) =>
      prev.map((t) => (t.section === section ? { ...t, waiterId } : t)),
    );
    toast.success(
      `Mesero ${waiterId ? "asignado" : "removido"} en ${sectionLabel(section)}`,
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <MobileNav />

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient-gold">
                Mesas
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {availableCount} disponible{availableCount === 1 ? "" : "s"} de{" "}
                {tables.length}
              </p>
            </div>
            <Button
              onClick={openNewTable}
              className="gold-glow hover:scale-[1.02] transition-transform shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" /> Nueva mesa
            </Button>
          </div>

          {/* Section waiter quick assignment */}
          <div className="glass-card p-4 grid gap-3 sm:grid-cols-3">
            {TABLE_SECTIONS.map((s) => (
              <div key={s.key} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Mesero — {s.label}
                </Label>
                <Select
                  value={
                    sectionWaiters[s.key] ? String(sectionWaiters[s.key]) : "none"
                  }
                  onValueChange={(v) => setSectionWaiter(s.key, v)}
                >
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {tables.length === 0 ? (
            <div className="glass-card p-10 text-center text-muted-foreground">
              Aún no hay mesas registradas.
            </div>
          ) : (
            <div className="grid gap-4">
              {sortedTables.map((t) => {
                const badge = statusBadge[t.status];
                const isOpen = expanded === t.id;
                return (
                  <div
                    key={t.id}
                    className="glass-card p-5 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <Armchair className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground truncate">
                              Mesa {t.number}
                            </h3>
                            <Badge className={badge.className}>
                              {badge.label}
                            </Badge>
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              {sectionLabel(t.section)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {t.status === "apartada" && t.reservationName
                              ? `Apartada · ${t.reservationName} a las ${t.reservationTime}`
                              : `Mesero: ${waiterName(t.waiterId)}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(isOpen ? null : t.id)}
                        className="text-muted-foreground hover:text-primary shrink-0"
                      >
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        <span className="ml-1 text-xs">Detalles</span>
                      </Button>
                    </div>

                    {isOpen && (
                      <div className="mt-3 pt-3 border-t border-border space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <UserCircle className="w-3.5 h-3.5" />
                          <span className="text-foreground">
                            {waiterName(t.waiterId)}
                          </span>
                        </p>
                        {t.status === "apartada" && (
                          <>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <User className="w-3.5 h-3.5" />
                              <span className="text-foreground">
                                {t.reservationName}
                              </span>
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-foreground">
                                {t.reservationTime}
                              </span>
                            </p>
                          </>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2">
                          {t.status !== "ocupada" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setOccupied(t)}
                            >
                              Asignar a clientes
                            </Button>
                          )}
                          {t.status !== "libre" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFree(t)}
                            >
                              Liberar
                            </Button>
                          )}
                          {t.status !== "apartada" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReservation(t)}
                            >
                              <Clock className="w-3 h-3 mr-1" /> Apartar
                            </Button>
                          )}
                          {t.status === "apartada" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReservation(t)}
                            >
                              <Pencil className="w-3 h-3 mr-1" /> Editar reserva
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignWaiter(t)}
                          >
                            Cambiar mesero
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditTable(t)}
                          >
                            <Pencil className="w-3 h-3 mr-1" /> Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTable(t.id)}
                            className="text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Table create/edit dialog */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">
              {editing ? "Editar mesa" : "Nueva mesa"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Las mesas nuevas se crean como libres y heredan el mesero de la sección.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Número de mesa</Label>
              <Input
                type="number"
                min={1}
                value={form.number}
                onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                className="bg-muted/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Sección</Label>
              <Select
                value={form.section}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, section: v as TableSection }))
                }
              >
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TABLE_SECTIONS.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTableDialogOpen(false)}
              className="border-border text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button onClick={saveTable} className="gold-glow">
              {editing ? "Guardar cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reservation dialog */}
      <Dialog open={reservationDialogOpen} onOpenChange={setReservationDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">
              Apartar mesa {reserving?.number}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Registra a nombre de quién y a qué hora se aparta esta mesa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nombre del cliente *</Label>
              <Input
                value={reservationForm.name}
                onChange={(e) =>
                  setReservationForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ej: Carlos Mendoza"
                maxLength={100}
                className="bg-muted/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Hora *</Label>
              <Input
                type="time"
                value={reservationForm.time}
                onChange={(e) =>
                  setReservationForm((f) => ({ ...f, time: e.target.value }))
                }
                className="bg-muted/50 border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReservationDialogOpen(false)}
              className="border-border text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button onClick={saveReservation} className="gold-glow">
              Guardar reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign waiter dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">
              Mesero — Mesa {assigning?.number}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Selecciona el mesero asignado a esta mesa específica.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-muted-foreground">Mesero</Label>
            <Select value={assignWaiterId} onValueChange={setAssignWaiterId}>
              <SelectTrigger className="bg-muted/50 border-border">
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name} — {e.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
              className="border-border text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button onClick={saveAssignWaiter} className="gold-glow">
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tables;
