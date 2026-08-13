export type NavItem = {
  label: string;
  href: string;
  blocked?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Verifications", href: "/verifications" },
  { label: "Shops", href: "/shops", blocked: true },
  { label: "Users", href: "/users" },
  { label: "Recruitment", href: "/recruitment" },
  { label: "Payments", href: "/payments", blocked: true },
  { label: "Bookings", href: "/bookings", blocked: true },
  { label: "Audit Log", href: "/audit-log", blocked: true },
];
