import { Sidebar } from "@/components/nav/sidebar";
import { MobileNav } from "@/components/nav/mobile-nav";
import { CommandPalette } from "@/components/nav/command-palette";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-gradient-mesh">
      <Sidebar />
      <MobileNav />
      <CommandPalette />
      <main className="w-full flex-1 overflow-y-auto p-4 pb-28 md:p-6 md:pb-6">
        <div className="mx-auto w-full max-w-[1440px]">{children}</div>
      </main>
    </div>
  );
}
