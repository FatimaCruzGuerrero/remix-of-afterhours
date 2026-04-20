import { Building2, Users, CalendarClock, Truck, Wine, LogOut, Armchair, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/admin", label: "Sucursales", icon: Building2 },
  { to: "/admin/empleados", label: "Empleados", icon: Users },
  { to: "/admin/turnos", label: "Turnos", icon: CalendarClock },
  { to: "/admin/proveedores", label: "Proveedores", icon: Truck },
  { to: "/admin/mesas", label: "Mesas", icon: Armchair },
  { to: "/admin/ordenes", label: "Órdenes", icon: FileText },
];

export const AdminSidebar = () => {
  const { pathname } = useLocation();

  return (
    <aside className="w-64 border-r border-border bg-card/50 flex-col shrink-0 hidden md:flex">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Wine className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-display font-bold text-gradient-gold">BarManager</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Link to="/">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
          </Button>
        </Link>
      </div>
    </aside>
  );
};
