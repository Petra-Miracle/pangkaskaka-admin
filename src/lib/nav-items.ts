import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShieldCheck,
  Store,
  Users,
  ClipboardList,
  CreditCard,
  CalendarClock,
  History,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  blocked?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Verifications", href: "/verifications", icon: ShieldCheck },
  { label: "Shops", href: "/shops", icon: Store, blocked: true },
  { label: "Users", href: "/users", icon: Users },
  { label: "Recruitment", href: "/recruitment", icon: ClipboardList },
  { label: "Payments", href: "/payments", icon: CreditCard, blocked: true },
  { label: "Bookings", href: "/bookings", icon: CalendarClock, blocked: true },
  { label: "Audit Log", href: "/audit-log", icon: History, blocked: true },
];
