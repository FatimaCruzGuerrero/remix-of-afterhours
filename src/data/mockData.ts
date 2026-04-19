export interface Branch {
  id: number;
  name: string;
  category: string;
  location: string;
  manager: string;
}

export interface Employee {
  id: number;
  name: string;
  branch: string;
  position: string;
}

export const branches: Branch[] = [
  { id: 1, name: "Lounge Noir", category: "Cocktail Bar", location: "Av. Reforma 234, CDMX", manager: "Carlos Mendoza" },
  { id: 2, name: "The Amber Room", category: "Whiskey Bar", location: "Calle 5 de Mayo 12, Guadalajara", manager: "Ana Torres" },
  { id: 3, name: "Velvet Underground", category: "Speakeasy", location: "Zona Rosa 88, Monterrey", manager: "Diego Ruiz" },
];

export const employees: Employee[] = [
  { id: 1, name: "Luis García", branch: "Lounge Noir", position: "Bartender" },
  { id: 2, name: "María López", branch: "The Amber Room", position: "Hostess" },
  { id: 3, name: "Pedro Sánchez", branch: "Velvet Underground", position: "DJ" },
  { id: 4, name: "Sofia Reyes", branch: "Lounge Noir", position: "Mesera" },
  { id: 5, name: "Javier Morales", branch: "The Amber Room", position: "Bartender" },
];

// Days of week — Monday-first
export const WEEK_DAYS = [
  { key: "mon", label: "Lun" },
  { key: "tue", label: "Mar" },
  { key: "wed", label: "Mié" },
  { key: "thu", label: "Jue" },
  { key: "fri", label: "Vie" },
  { key: "sat", label: "Sáb" },
  { key: "sun", label: "Dom" },
] as const;

export type DayKey = typeof WEEK_DAYS[number]["key"];

export interface Shift {
  id: number;
  employeeId: number;
  branch: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  days: DayKey[];
}

export interface Supplier {
  id: number;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  active: boolean;
}

export const initialSuppliers: Supplier[] = [
  { id: 1, name: "Distribuidora La Madrileña", contactName: "Roberto Núñez", phone: "+52 55 1234 5678", email: "ventas@lamadrilena.mx", active: true },
  { id: 2, name: "Vinos & Spirits MX", contactName: "Patricia Vega", phone: "+52 33 9876 5432", email: "contacto@vinosspirits.mx", active: true },
];

export const initialShifts: Shift[] = [
  { id: 1, employeeId: 1, branch: "Lounge Noir", startTime: "18:00", endTime: "23:00", days: ["thu", "fri", "sat"] },
  { id: 2, employeeId: 2, branch: "The Amber Room", startTime: "19:00", endTime: "02:00", days: ["fri", "sat"] },
  { id: 4, employeeId: 4, branch: "Lounge Noir", startTime: "12:00", endTime: "18:00", days: ["mon", "tue", "wed"] },
];
