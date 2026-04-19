import { useState } from "react";
import { Plus, Truck, Pencil, Trash2, ChevronDown, ChevronUp, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MobileNav } from "@/components/admin/MobileNav";
import { initialSuppliers, type Supplier } from "@/data/mockData";
import { toast } from "sonner";

const emptyForm = { name: "", contactName: "", phone: "", email: "" };

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, contactName: s.contactName, phone: s.phone, email: s.email });
    setDialogOpen(true);
  };

  const save = () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("El nombre del proveedor es obligatorio");
      return;
    }
    // Validate duplicates by name (case-insensitive), excluding the one being edited
    const duplicate = suppliers.some(
      (s) => s.name.trim().toLowerCase() === name.toLowerCase() && s.id !== editing?.id
    );
    if (duplicate) {
      toast.error("Ya existe un proveedor con ese nombre");
      return;
    }

    if (editing) {
      setSuppliers((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...form, name } : s)));
      toast.success("Proveedor actualizado");
    } else {
      // Rule: every new supplier is registered as active
      setSuppliers((prev) => [...prev, { id: Date.now(), ...form, name, active: true }]);
      toast.success("Proveedor registrado como activo");
    }
    setDialogOpen(false);
  };

  const remove = (id: number) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    setExpanded(null);
    toast.success("Proveedor eliminado");
  };

  const toggleActive = (s: Supplier) => {
    setSuppliers((prev) => prev.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)));
    toast.success(s.active ? "Proveedor marcado como inactivo" : "Proveedor reactivado");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <MobileNav />

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient-gold">Proveedores</h1>
              <p className="text-sm text-muted-foreground mt-1">{suppliers.length} registrados</p>
            </div>
            <Button onClick={openNew} className="gold-glow hover:scale-[1.02] transition-transform shrink-0">
              <Plus className="w-4 h-4 mr-2" /> Registrar proveedor
            </Button>
          </div>

          {suppliers.length === 0 ? (
            <div className="glass-card p-10 text-center text-muted-foreground">
              Aún no hay proveedores registrados.
            </div>
          ) : (
            <div className="grid gap-4">
              {suppliers.map((s) => (
                <div key={s.id} className="glass-card p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{s.name}</h3>
                          <Badge variant={s.active ? "default" : "secondary"} className={s.active ? "bg-primary/15 text-primary border-primary/30" : ""}>
                            {s.active ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{s.contactName || "Sin contacto asignado"}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                      className="text-muted-foreground hover:text-primary shrink-0"
                    >
                      {expanded === s.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <span className="ml-1 text-xs">Detalles</span>
                    </Button>
                  </div>

                  {expanded === s.id && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      {s.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5" /> <span className="text-foreground">{s.phone}</span>
                        </p>
                      )}
                      {s.email && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5" /> <span className="text-foreground">{s.email}</span>
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(s)}>
                          <Pencil className="w-3 h-3 mr-1" /> Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleActive(s)}>
                          {s.active ? "Marcar inactivo" : "Reactivar"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => remove(s.id)}
                          className="text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">
              {editing ? "Editar proveedor" : "Registrar proveedor"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editing
                ? "Modifica los datos del proveedor."
                : "Todo proveedor se registra como activo. No se permiten nombres duplicados."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Distribuidora La Madrileña"
                maxLength={100}
                className="bg-muted/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Persona de contacto</Label>
              <Input
                value={form.contactName}
                onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                placeholder="Ej: Roberto Núñez"
                maxLength={100}
                className="bg-muted/50 border-border"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Teléfono</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+52 55 0000 0000"
                  maxLength={30}
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="contacto@proveedor.com"
                  maxLength={120}
                  className="bg-muted/50 border-border"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border text-muted-foreground">
              Cancelar
            </Button>
            <Button onClick={save} className="gold-glow">
              {editing ? "Guardar cambios" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Suppliers;
