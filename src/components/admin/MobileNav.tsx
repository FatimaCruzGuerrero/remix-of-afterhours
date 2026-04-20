import { Building2, Users, CalendarClock, Truck, Armchair, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/admin", label: "Sucursales", icon: Building2 },
  { to: "/admin/empleados", label: "Empleados", icon: Users },
  { to: "/admin/turnos", label: "Turnos", icon: CalendarClock },
  { to: "/admin/proveedores", label: "Proveedores", icon: Truck },
  { to: "/admin/mesas", label: "Mesas", icon: Armchair },
  { to: "/admin/ordenes", label: "Órdenes", icon: FileText },
];

export const MobileNav = () => {
  const { pathname } = useLocation();
  return (
    <div className="flex md:hidden gap-2 mb-6 overflow-x-auto">
      {items.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} className="flex-1 min-w-[110px]">
          <Button variant={pathname === to ? "default" : "secondary"} className="w-full">
            <Icon className="w-4 h-4 mr-2" /> {label}
          </Button>
        </Link>
      ))}
    </div>
  );
};
