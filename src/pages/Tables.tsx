import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Users, UserCircle, Wine } from "lucide-react";
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

const Tables = () => {
  const [tables, setTables] = useState<BarTable[]>(initialTables);
  const [sectionWaiters, setSectionWaiters] =
    useState<Record<TableSection, number | null>>(initialSectionWaiters);

  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BarTable | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState<BarTable | null>(null);
  const [assignWaiterId, setAssignWaiterId] = useState<string>("");

  const waiterName = (id: number | null) =>
    id ? employees.find((e) => e.id === id)?.name ?? "—" : "Sin asignar";

  const sectionLabel = (key: TableSection) =>
    TABLE_SECTIONS.find((s) => s.key === key)?.label ?? key;

  const grouped = useMemo(() => {
    return TABLE_SECTIONS.map((s) => ({
      ...s,
      tables: tables
        .filter((t) => t.section === s.key)
        .sort((a, b) => a.number - b.number),
    }));
  }, [tables]);

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
      // New tables start as 'libre' and inherit the section's default waiter
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
    toast.success("Mesa eliminada");
  };

  // ── Status toggle ────────────────────────────────────────
  const toggleStatus = (t: BarTable) => {
    const next: TableStatus = t.status === "libre" ? "ocupada" : "libre";
    setTables((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)),
    );
    toast.success(
      next === "ocupada"
        ? `Mesa ${t.number} asignada a clientes`
        : `Mesa ${t.number} liberada`,
    );
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
    // Apply to every table in that section
    setTables((prev) =>
      prev.map((t) => (t.section === section ? { ...t, waiterId } : t)),
    );
    toast.success(`Mesero ${waiterId ? "asignado" : "removido"} en ${sectionLabel(section)}`);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
        <MobileNav />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold">
              Gestión de Mesas
            </h1>
            <p className="text-muted-foreground mt-2">
              {availableCount} mesa{availableCount === 1 ? "" : "s"} disponible
              {availableCount === 1 ? "" : "s"} de {tables.length}
            </p>
          </div>
          <Button onClick={openNewTable} className="gap-2">
            <Plus className="w-4 h-4" /> Nueva mesa
          </Button>
        </div>

        <div className="space-y-8">
          {grouped.map(({ key, label, tables: sectionTables }) => (
            <section key={key}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                  <Wine className="w-5 h-5 text-primary" /> {label}
                  <span className="text-sm font-sans font-normal text-muted-foreground">
                    ({sectionTables.length})
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">
                    Mesero de sección:
                  </Label>
                  <Select
                    value={
                      sectionWaiters[key] ? String(sectionWaiters[key]) : "none"
                    }
                    onValueChange={(v) => setSectionWaiter(key, v)}
                  >
                    <SelectTrigger className="w-[200px]">
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
              </div>

              {sectionTables.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No hay mesas en esta sección
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {sectionTables.map((t) => {
                    const occupied = t.status === "ocupada";
                    return (
                      <div
                        key={t.id}
                        className={`rounded-lg border p-4 transition-all ${
                          occupied
                            ? "border-primary/40 bg-primary/5"
                            : "border-border bg-card hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Mesa</p>
                            <p className="text-3xl font-display font-bold">
                              {t.number}
                            </p>
                          </div>
                          <Badge variant={occupied ? "default" : "secondary"}>
                            {occupied ? "Ocupada" : "Libre"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <UserCircle className="w-4 h-4 shrink-0" />
                          <span className="truncate">{waiterName(t.waiterId)}</span>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant={occupied ? "outline" : "default"}
                            onClick={() => toggleStatus(t)}
                            className="w-full gap-2"
                          >
                            <Users className="w-4 h-4" />
                            {occupied ? "Liberar" : "Asignar cliente"}
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openAssignWaiter(t)}
                              className="flex-1"
                            >
                              Mesero
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditTable(t)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeTable(t.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Table create/edit dialog */}
        <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar mesa" : "Nueva mesa"}</DialogTitle>
              <DialogDescription>
                Las mesas nuevas se crean como libres y heredan el mesero de la sección.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="number">Número de mesa</Label>
                <Input
                  id="number"
                  type="number"
                  min={1}
                  value={form.number}
                  onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Sección</Label>
                <Select
                  value={form.section}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, section: v as TableSection }))
                  }
                >
                  <SelectTrigger>
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
              <Button variant="ghost" onClick={() => setTableDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveTable}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign waiter dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Asignar mesero — Mesa {assigning?.number}
              </DialogTitle>
              <DialogDescription>
                Selecciona un mesero para esta mesa específica.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label>Mesero</Label>
              <Select value={assignWaiterId} onValueChange={setAssignWaiterId}>
                <SelectTrigger>
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
              <Button variant="ghost" onClick={() => setAssignDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveAssignWaiter}>Asignar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Tables;
