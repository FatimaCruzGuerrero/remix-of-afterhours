import { useState } from "react";
import { Building2, Plus, MapPin, UserCircle, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MobileNav } from "@/components/admin/MobileNav";
import { branches as initialBranches, type Branch } from "@/data/mockData";

const emptyBranch = { name: "", category: "", location: "", manager: "" };

const Admin = () => {
  const [expandedBranch, setExpandedBranch] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(emptyBranch);

  const openNew = () => {
    setEditing(null);
    setForm(emptyBranch);
    setDialogOpen(true);
  };
  const openEdit = (b: Branch) => {
    setEditing(b);
    setForm({ name: b.name, category: b.category, location: b.location, manager: b.manager });
    setDialogOpen(true);
  };
  const save = () => {
    if (!form.name.trim()) return;
    if (editing) {
      setBranches((prev) => prev.map((b) => (b.id === editing.id ? { ...b, ...form } : b)));
    } else {
      setBranches((prev) => [...prev, { id: Date.now(), ...form }]);
    }
    setDialogOpen(false);
  };
  const remove = (id: number) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
    setExpandedBranch(null);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <MobileNav />

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient-gold">Sucursales</h1>
            <Button onClick={openNew} className="gold-glow hover:scale-[1.02] transition-transform">
              <Plus className="w-4 h-4 mr-2" /> Nueva Sucursal
            </Button>
          </div>

          <div className="grid gap-4">
            {branches.map((b) => (
              <div key={b.id} className="glass-card p-5 space-y-3 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{b.name}</h3>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{b.category}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setExpandedBranch(expandedBranch === b.id ? null : b.id)}
                    className="text-muted-foreground hover:text-primary">
                    {expandedBranch === b.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span className="ml-1 text-xs">Detalles</span>
                  </Button>
                </div>

                {expandedBranch === b.id && (
                  <div className="pt-3 border-t border-border space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary/70" /> {b.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserCircle className="w-4 h-4 text-primary/70" /> Encargado: {b.manager}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(b)}>
                        <Pencil className="w-3 h-3 mr-1" /> Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => remove(b.id)}
                        className="text-muted-foreground hover:text-foreground hover:border-muted-foreground">
                        <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">{editing ? "Editar Sucursal" : "Nueva Sucursal"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editing ? "Modifica los datos de la sucursal." : "Completa los datos para agregar una nueva sucursal."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Lounge Noir" className="bg-muted/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Categoría</Label>
              <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Ej: Cocktail Bar" className="bg-muted/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Ubicación</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Ej: Av. Reforma 234, CDMX" className="bg-muted/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Encargado</Label>
              <Input value={form.manager} onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))}
                placeholder="Ej: Carlos Mendoza" className="bg-muted/50 border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border text-muted-foreground">Cancelar</Button>
            <Button onClick={save} className="gold-glow">{editing ? "Guardar Cambios" : "Agregar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
