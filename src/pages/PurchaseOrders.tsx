import { useMemo, useState } from "react";
import { Plus, FileText, Pencil, Trash2, ChevronDown, ChevronUp, Send, Package, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MobileNav } from "@/components/admin/MobileNav";
import {
  initialSuppliers,
  initialPurchaseOrders,
  productCatalog,
  PURCHASE_ORDER_STATUS,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type PurchaseOrderStatus,
  type Supplier,
} from "@/data/mockData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DraftItem {
  productId: number | null;
  quantity: string; // keep as string while typing
}

const emptyDraftItem: DraftItem = { productId: null, quantity: "1" };

const statusBadgeVariant = (s: PurchaseOrderStatus) => {
  switch (s) {
    case "pendiente":
      return "secondary";
    case "enviada":
      return "default";
    case "recibida":
      return "outline";
    case "cancelada":
      return "destructive";
  }
};

const PurchaseOrders = () => {
  // Suppliers are sourced (read-only) from mock — orders module depends on them
  const [suppliers] = useState<Supplier[]>(initialSuppliers);
  const [orders, setOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);

  // Form state
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [status, setStatus] = useState<PurchaseOrderStatus>("pendiente");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [items, setItems] = useState<DraftItem[]>([emptyDraftItem]);

  const activeSuppliers = useMemo(() => suppliers.filter((s) => s.active), [suppliers]);

  const supplierName = (id: number) => suppliers.find((s) => s.id === id)?.name ?? "Proveedor desconocido";
  const product = (id: number) => productCatalog.find((p) => p.id === id);

  const draftTotal = useMemo(
    () =>
      items.reduce((sum, it) => {
        if (it.productId == null) return sum;
        const p = product(it.productId);
        const q = Number(it.quantity);
        if (!p || !Number.isFinite(q) || q <= 0) return sum;
        return sum + p.unitPrice * q;
      }, 0),
    [items]
  );

  const resetForm = () => {
    setSupplierId(null);
    setStatus("pendiente");
    setDeliveryDate(undefined);
    setItems([{ ...emptyDraftItem }]);
    setEditing(null);
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (o: PurchaseOrder) => {
    setEditing(o);
    setSupplierId(o.supplierId);
    setStatus(o.status);
    setDeliveryDate(new Date(o.expectedDeliveryDate));
    setItems(o.items.map((i) => ({ productId: i.productId, quantity: String(i.quantity) })));
    setDialogOpen(true);
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyDraftItem }]);
  const removeItem = (idx: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  const updateItem = (idx: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const save = () => {
    // Rule: only active suppliers
    if (supplierId == null) {
      toast.error("Selecciona un proveedor");
      return;
    }
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier || !supplier.active) {
      toast.error("Solo se pueden generar órdenes para proveedores activos");
      return;
    }
    if (!deliveryDate) {
      toast.error("Selecciona la fecha de entrega esperada");
      return;
    }
    if (items.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    // Validate items: product chosen, quantity is positive integer, no duplicate products
    const seen = new Set<number>();
    const cleanItems: PurchaseOrderItem[] = [];
    for (const it of items) {
      if (it.productId == null) {
        toast.error("Selecciona un producto en cada línea");
        return;
      }
      const q = Number(it.quantity);
      if (!Number.isFinite(q) || q <= 0 || !Number.isInteger(q)) {
        toast.error("Las cantidades deben ser números enteros mayores a 0");
        return;
      }
      if (seen.has(it.productId)) {
        toast.error("Hay productos duplicados en la orden");
        return;
      }
      seen.add(it.productId);
      const p = product(it.productId)!;
      cleanItems.push({ productId: it.productId, quantity: q, unitPrice: p.unitPrice });
    }

    const total = cleanItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const isoDelivery = format(deliveryDate, "yyyy-MM-dd");

    if (editing) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === editing.id
            ? {
                ...o,
                supplierId,
                items: cleanItems,
                expectedDeliveryDate: isoDelivery,
                status,
                total,
              }
            : o
        )
      );
      toast.success("Orden de compra actualizada");
    } else {
      const newOrder: PurchaseOrder = {
        id: Date.now(),
        supplierId,
        items: cleanItems,
        expectedDeliveryDate: isoDelivery,
        status,
        createdAt: format(new Date(), "yyyy-MM-dd"),
        total,
      };
      setOrders((prev) => [newOrder, ...prev]);
      toast.success("Orden de compra guardada");
    }
    setDialogOpen(false);
    resetForm();
  };

  const remove = (id: number) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    toast.success("Orden eliminada");
  };

  const notify = (o: PurchaseOrder) => {
    const supplier = suppliers.find((s) => s.id === o.supplierId);
    if (!supplier) return;
    // Mock notification — mark as "enviada" if still pending
    if (o.status === "pendiente") {
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: "enviada" } : x)));
    }
    toast.success(`Proveedor notificado: ${supplier.name}`, {
      description: supplier.email ? `Notificación enviada a ${supplier.email}` : "Notificación registrada",
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
        <MobileNav />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold">Órdenes de Compra</h1>
            <p className="text-muted-foreground mt-1">Genera y gestiona las órdenes a tus proveedores activos</p>
          </div>
          <Button onClick={openNew} disabled={activeSuppliers.length === 0}>
            <Plus className="w-4 h-4 mr-2" /> Nueva orden
          </Button>
        </div>

        {activeSuppliers.length === 0 && (
          <div className="rounded-lg border border-border bg-card/50 p-6 text-center text-muted-foreground mb-6">
            No hay proveedores activos. Activa al menos uno desde el módulo de Proveedores para generar órdenes.
          </div>
        )}

        {/* Orders list */}
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
              Aún no hay órdenes de compra registradas.
            </div>
          ) : (
            orders.map((o) => {
              const isOpen = expanded === o.id;
              const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <div key={o.id} className="rounded-lg border border-border bg-card/50 overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 p-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">Orden #{o.id}</span>
                          <Badge variant={statusBadgeVariant(o.status)} className="capitalize">
                            {o.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {supplierName(o.supplierId)} · {o.items.length}{" "}
                          {o.items.length === 1 ? "producto" : "productos"} ({itemCount} uds.)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 md:gap-8 text-sm shrink-0">
                      <div>
                        <p className="text-xs text-muted-foreground">Entrega</p>
                        <p className="font-medium">
                          {format(new Date(o.expectedDeliveryDate), "dd MMM yyyy", { locale: es })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-semibold text-primary">
                          ${o.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => notify(o)} title="Notificar al proveedor">
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(o)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(o.id)}
                        title="Eliminar"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(isOpen ? null : o.id)}
                        title="Detalles"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-border bg-muted/20 p-4 space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                        Productos · creada el {format(new Date(o.createdAt), "dd MMM yyyy", { locale: es })}
                      </p>
                      <div className="space-y-1.5">
                        {o.items.map((it) => {
                          const p = product(it.productId);
                          const lineTotal = it.quantity * it.unitPrice;
                          return (
                            <div
                              key={it.productId}
                              className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate">{p?.name ?? "Producto eliminado"}</span>
                              </div>
                              <div className="flex items-center gap-4 shrink-0 text-muted-foreground">
                                <span>
                                  {it.quantity} × ${it.unitPrice.toLocaleString("es-MX")}
                                </span>
                                <span className="text-foreground font-medium w-24 text-right">
                                  ${lineTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-end pt-2 text-sm">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Total de la orden</p>
                          <p className="text-lg font-semibold text-primary">
                            ${o.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar orden de compra" : "Nueva orden de compra"}</DialogTitle>
              <DialogDescription>
                Solo se muestran proveedores activos. Las cantidades deben ser enteros mayores a 0.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Select
                    value={supplierId?.toString() ?? ""}
                    onValueChange={(v) => setSupplierId(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeSuppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as PurchaseOrderStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PURCHASE_ORDER_STATUS.map((s) => (
                        <SelectItem key={s.key} value={s.key}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fecha de entrega esperada</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deliveryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deliveryDate ? format(deliveryDate, "PPP", { locale: es }) : "Selecciona fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deliveryDate}
                      onSelect={setDeliveryDate}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Productos</Label>
                  <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Agregar producto
                  </Button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => {
                    const p = it.productId != null ? product(it.productId) : null;
                    const q = Number(it.quantity);
                    const lineTotal = p && Number.isFinite(q) && q > 0 ? p.unitPrice * q : 0;
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-end p-3 rounded-md border border-border bg-muted/20"
                      >
                        <div className="col-span-12 sm:col-span-6 space-y-1">
                          <Label className="text-xs">Producto</Label>
                          <Select
                            value={it.productId?.toString() ?? ""}
                            onValueChange={(v) => updateItem(idx, { productId: Number(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona producto" />
                            </SelectTrigger>
                            <SelectContent>
                              {productCatalog.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.name} · {p.unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-4 sm:col-span-2 space-y-1">
                          <Label className="text-xs">Cantidad</Label>
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            value={it.quantity}
                            onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2 space-y-1">
                          <Label className="text-xs">P. unit.</Label>
                          <div className="h-10 px-3 flex items-center text-sm rounded-md border border-input bg-background text-muted-foreground">
                            {p ? `$${p.unitPrice.toLocaleString("es-MX")}` : "—"}
                          </div>
                        </div>
                        <div className="col-span-3 sm:col-span-1 space-y-1">
                          <Label className="text-xs">Total</Label>
                          <div className="h-10 px-2 flex items-center text-sm font-medium">
                            ${lineTotal.toLocaleString("es-MX")}
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(idx)}
                            disabled={items.length === 1}
                            title="Quitar"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2 border-t border-border mt-2">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total estimado</p>
                    <p className="text-xl font-semibold text-primary">
                      ${draftTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={save}>{editing ? "Guardar cambios" : "Crear orden"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default PurchaseOrders;
