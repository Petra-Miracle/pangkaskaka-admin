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

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Utama",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Verifications", href: "/verifications", icon: ShieldCheck },
    ],
  },
  {
    label: "Manajemen",
    items: [
      { label: "Shops", href: "/shops", icon: Store },
      { label: "Users", href: "/users", icon: Users },
      { label: "Recruitment", href: "/recruitment", icon: ClipboardList },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { label: "Payments", href: "/payments", icon: CreditCard, blocked: true },
      { label: "Bookings", href: "/bookings", icon: CalendarClock, blocked: true },
      { label: "Audit Log", href: "/audit-log", icon: History, blocked: true },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);
