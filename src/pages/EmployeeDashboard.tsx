import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wine,
  LogOut,
  Armchair,
  Clock,
  MapPin,
  BadgeCheck,
  Plus,
  Minus,
  Trash2,
  Receipt,
  ShoppingCart,
  CalendarClock,
  CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  employees,
  initialShifts,
  initialTables,
  initialSectionWaiters,
  productCatalog,
  WEEK_DAYS,
  TABLE_SECTIONS,
  type BarTable,
  type DayKey,
  type Product,
  type TableSection,
} from "@/data/mockData";
import { toast } from "sonner";

interface OrderLine {
  productId: number;
  quantity: number;
}

interface Order {
  id: number;
  tableId: number;
  lines: OrderLine[];
  total: number;
  createdAt: string;
}

const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const currentDayKey = (): DayKey => DAY_KEYS[new Date().getDay()];
const currentMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const sectionLabel = (key: TableSection) =>
  TABLE_SECTIONS.find((s) => s.key === key)?.label ?? key;

const formatMxn = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const EmployeeDashboard = () => {
  // Simulated session: default to first employee (Luis García - mesero, Lounge Noir)
  const [currentEmployeeId, setCurrentEmployeeId] = useState<number>(employees[0].id);
  const currentEmployee = employees.find((e) => e.id === currentEmployeeId)!;

  // Mock-only state
  const [tables, setTables] = useState<BarTable[]>(initialTables);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [orderDraft, setOrderDraft] = useState<OrderLine[]>([]);
  const [productPicker, setProductPicker] = useState<string>("");

  // ---- Employee info ----
  const employeeShift = useMemo(
    () => initialShifts.find((s) => s.employeeId === currentEmployee.id),
    [currentEmployee.id],
  );

  const onShiftNow = useMemo(() => {
    if (!employeeShift) return false;
    const today = currentDayKey();
    if (!employeeShift.days.includes(today)) return false;
    const now = currentMinutes();
    const start = toMin(employeeShift.startTime);
    const end = toMin(employeeShift.endTime);
    return end <= start
      ? now >= start || now < end // wraps midnight
      : now >= start && now < end;
  }, [employeeShift]);

  // ---- Tables visible to this employee ----
  // Rule: only tables of his branch + sections where he is the section waiter.
  const visibleTables = useMemo(() => {
    const mySections = (Object.keys(initialSectionWaiters) as TableSection[]).filter(
      (s) => initialSectionWaiters[s] === currentEmployee.id,
    );
    return tables.filter((t) => mySections.includes(t.section));
  }, [tables, currentEmployee.id]);

  const selectedTable = visibleTables.find((t) => t.id === selectedTableId) ?? null;
  const tableHasOrder = (tableId: number) => orders.some((o) => o.tableId === tableId);

  // ---- Order draft helpers ----
  const draftTotal = useMemo(
    () =>
      orderDraft.reduce((sum, line) => {
        const p = productCatalog.find((pp) => pp.id === line.productId);
        return sum + (p ? p.unitPrice * line.quantity : 0);
      }, 0),
    [orderDraft],
  );

  const addProductToDraft = () => {
    const id = Number(productPicker);
    if (!id) {
      toast.error("Selecciona un producto.");
      return;
    }
    const exists = productCatalog.find((p) => p.id === id);
    if (!exists) {
      toast.error("Producto no encontrado en el catálogo.");
      return;
    }
    setOrderDraft((prev) => {
      const found = prev.find((l) => l.productId === id);
      if (found) {
        return prev.map((l) =>
          l.productId === id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { productId: id, quantity: 1 }];
    });
    setProductPicker("");
  };

  const updateQty = (productId: number, delta: number) => {
    setOrderDraft((prev) =>
      prev
        .map((l) =>
          l.productId === productId ? { ...l, quantity: l.quantity + delta } : l,
        )
        .filter((l) => l.quantity > 0),
    );
  };

  const removeLine = (productId: number) => {
    setOrderDraft((prev) => prev.filter((l) => l.productId !== productId));
  };

  const saveOrder = () => {
    if (!selectedTable) {
      toast.error("Selecciona una mesa.");
      return;
    }
    if (orderDraft.length === 0) {
      toast.error("Agrega al menos un producto al pedido.");
      return;
    }
    if (orderDraft.some((l) => l.quantity <= 0 || !Number.isInteger(l.quantity))) {
      toast.error("Las cantidades deben ser enteros positivos.");
      return;
    }
    if (orderDraft.some((l) => !productCatalog.find((p) => p.id === l.productId))) {
      toast.error("Hay productos inexistentes en el pedido.");
      return;
    }

    const newOrder: Order = {
      id: Date.now(),
      tableId: selectedTable.id,
      lines: orderDraft,
      total: draftTotal,
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => [...prev, newOrder]);
    // Mark table as occupied + assign this waiter
    setTables((prev) =>
      prev.map((t) =>
        t.id === selectedTable.id
          ? { ...t, status: "ocupada", waiterId: currentEmployee.id }
          : t,
      ),
    );
    toast.success(`Pedido guardado para mesa ${selectedTable.number} • ${formatMxn(draftTotal)}`);
    setOrderDraft([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Wine className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Panel de operación
              </p>
              <h1 className="font-display text-xl text-gradient-gold leading-none">
                BarManager
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Sesión simulada</span>
            </div>
            <Select
              value={String(currentEmployeeId)}
              onValueChange={(v) => {
                setCurrentEmployeeId(Number(v));
                setSelectedTableId(null);
                setOrderDraft([]);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name} — {e.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Link to="/">
              <Button variant="ghost" size="icon" aria-label="Salir">
                <LogOut className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Employee info + shift */}
        <section className="glass-card p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Employee info */}
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Empleado
              </p>
              <h2 className="font-display text-2xl text-foreground">
                {currentEmployee.name}
              </h2>
              <div className="mt-3 space-y-1.5 text-sm">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <BadgeCheck className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{currentEmployee.position}</span>
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{currentEmployee.branch}</span>
                </p>
              </div>
            </div>

            {/* Shift info */}
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Turno actual
              </p>
              {employeeShift ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-display text-xl">
                        {employeeShift.startTime}{" "}
                        <span className="text-muted-foreground text-base">→</span>{" "}
                        {employeeShift.endTime}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {employeeShift.branch}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {WEEK_DAYS.map((d) => {
                      const active = employeeShift.days.includes(d.key);
                      const isToday = d.key === currentDayKey();
                      return (
                        <span
                          key={d.key}
                          className={`text-xs px-2 py-1 rounded-md border ${
                            active
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-muted/40 text-muted-foreground border-border"
                          } ${isToday ? "ring-1 ring-primary/40" : ""}`}
                        >
                          {d.label}
                        </span>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" />
                  Sin turno asignado.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Tables + Order panel */}
        <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          {/* Tables */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-xl">Mis mesas</h3>
                <p className="text-xs text-muted-foreground">
                  Solo se muestran las mesas de las secciones que atiendes.
                </p>
              </div>
              <Badge variant="outline" className="text-muted-foreground">
                {visibleTables.length} mesas
              </Badge>
            </div>

            {visibleTables.length === 0 ? (
              <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-8 text-center">
                No tienes mesas asignadas en este momento.
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {visibleTables.map((t) => {
                  const isSelected = t.id === selectedTableId;
                  const occupied = t.status === "ocupada";
                  const reserved = t.status === "apartada";
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTableId(t.id)}
                      className={`text-left rounded-lg border p-4 transition-all ${
                        isSelected
                          ? "border-primary/60 bg-primary/5 gold-glow"
                          : "border-border hover:border-primary/30 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Armchair className="w-4 h-4 text-primary" />
                          <span className="font-display text-lg">Mesa {t.number}</span>
                        </div>
                        <Badge
                          className={
                            occupied
                              ? "bg-primary/15 text-primary border-primary/30 border"
                              : reserved
                              ? "bg-amber-500/15 text-amber-700 border-amber-500/30 border"
                              : "bg-muted/40 text-muted-foreground border-border border"
                          }
                        >
                          {occupied ? "Ocupada" : reserved ? "Apartada" : "Libre"}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{sectionLabel(t.section)}</span>
                        {tableHasOrder(t.id) && (
                          <span className="flex items-center gap-1 text-primary">
                            <Receipt className="w-3 h-3" /> Pedido activo
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order panel */}
          <div className="glass-card p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-xl">Pedido</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedTable
                    ? `Mesa ${selectedTable.number} • ${sectionLabel(selectedTable.section)}`
                    : "Selecciona una mesa para iniciar"}
                </p>
              </div>
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>

            {!selectedTable ? (
              <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-8 text-center flex-1 flex items-center justify-center">
                Selecciona una mesa de la izquierda.
              </div>
            ) : (
              <div className="flex flex-col gap-4 flex-1">
                {/* Product picker */}
                <div className="flex gap-2">
                  <Select value={productPicker} onValueChange={setProductPicker}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Agregar producto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {productCatalog.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} — {formatMxn(p.unitPrice)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addProductToDraft} size="icon" aria-label="Agregar">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Lines */}
                <div className="flex-1 min-h-[120px] space-y-2 overflow-auto">
                  {orderDraft.length === 0 ? (
                    <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-6 text-center">
                      Aún no hay productos en el pedido.
                    </div>
                  ) : (
                    orderDraft.map((l) => {
                      const p = productCatalog.find((pp) => pp.id === l.productId)!;
                      return (
                        <div
                          key={l.productId}
                          className="flex items-center justify-between gap-2 border border-border rounded-lg p-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatMxn(p.unitPrice)} · {p.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => updateQty(l.productId, -1)}
                              aria-label="Restar"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">
                              {l.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => updateQty(l.productId, 1)}
                              aria-label="Sumar"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => removeLine(l.productId)}
                              aria-label="Eliminar"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Total + save */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-display text-2xl text-gradient-gold">
                      {formatMxn(draftTotal)}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={saveOrder}
                    disabled={orderDraft.length === 0}
                  >
                    Guardar pedido
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Saved orders for current employee */}
        {orders.length > 0 && (
          <section className="glass-card p-6">
            <h3 className="font-display text-xl mb-4">Pedidos de la sesión</h3>
            <div className="space-y-2">
              {orders.map((o) => {
                const t = tables.find((tt) => tt.id === o.tableId);
                return (
                  <div
                    key={o.id}
                    className="flex items-center justify-between border border-border rounded-lg p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        Mesa {t?.number} · {t ? sectionLabel(t.section) : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {o.lines.length} producto(s) ·{" "}
                        {new Date(o.createdAt).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="font-display text-lg text-primary">
                      {formatMxn(o.total)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default EmployeeDashboard;
