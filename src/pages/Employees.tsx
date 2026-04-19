import { useState } from "react";
import { Plus, UserCircle, Pencil, Trash2, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MobileNav } from "@/components/admin/MobileNav";
import { branches, employees as initialEmployees, type Employee } from "@/data/mockData";

const emptyEmployee = { name: "", branch: "", position: "" };

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [branchFilter, setBranchFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyEmployee);

  const filtered = branchFilter === "all" ? employees : employees.filter((e) => e.branch === branchFilter);

  const openNew = () => {
    setEditing(null);
    setForm(emptyEmployee);
    setDialogOpen(true);
  };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({ name: e.name, branch: e.branch, position: e.position });
    setDialogOpen(true);
  };
  const save = () => {
    if (!form.name.trim()) return;
    if (editing) {
      setEmployees((prev) => prev.map((e) => (e.id === editing.id ? { ...e, ...form } : e)));
    } else {
      setEmployees((prev) => [...prev, { id: Date.now(), ...form }]);
    }
    setDialogOpen(false);
  };
  const remove = (id: number) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setExpanded(null);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <MobileNav />

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient-gold">Empleados</h1>
            <div className="flex gap-3 w-full sm:w-auto">
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-muted/50 border-border">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filtrar por sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={openNew} className="gold-glow hover:scale-[1.02] transition-transform shrink-0">
                <Plus className="w-4 h-4 mr-2" /> Agregar
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {filtered.map((e) => (
              <div key={e.id} className="glass-card p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{e.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{e.branch}</span>
                        <span className="text-border">•</span>
                        <span className="text-primary/80">{e.position}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                    className="text-muted-foreground hover:text-primary">
                    {expanded === e.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span className="ml-1 text-xs">Detalles</span>
                  </Button>
                </div>

                {expanded === e.id && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-muted-foreground">Sucursal: <span className="text-foreground">{e.branch}</span></p>
                    <p className="text-sm text-muted-foreground">Puesto: <span className="text-foreground">{e.position}</span></p>
                    <div className="flex gap-2 pt-2">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(e)}>
                        <Pencil className="w-3 h-3 mr-1" /> Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => remove(e.id)}
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
            <DialogTitle className="text-foreground font-display">{editing ? "Editar Empleado" : "Agregar Empleado"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editing ? "Modifica los datos del empleado." : "Completa los datos para agregar un nuevo empleado."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Luis García" className="bg-muted/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Sucursal</Label>
              <Select value={form.branch} onValueChange={(v) => setForm((f) => ({ ...f, branch: v }))}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue placeholder="Selecciona sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Puesto</Label>
              <Input value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                placeholder="Ej: Bartender" className="bg-muted/50 border-border" />
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

export default Employees;
