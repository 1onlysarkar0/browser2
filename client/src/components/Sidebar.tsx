import { Link, useLocation } from "wouter";
import { LayoutDashboard, PlusCircle, Settings, Box, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrowserHealth } from "@/hooks/use-automations";

export function Sidebar() {
  const [location] = useLocation();
  const { data: health } = useBrowserHealth();

  const isBrowserRunning = health?.browser === "running";

  return (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col shadow-xl z-20">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Box className="w-6 h-6 text-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">AutoPilot</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1">
        <NavLink href="/" active={location === "/"} icon={LayoutDashboard}>
          Dashboard
        </NavLink>
        <NavLink href="/create" active={location.startsWith("/create") || location.startsWith("/edit")} icon={PlusCircle}>
          New Automation
        </NavLink>
        <NavLink href="/settings" active={location === "/settings"} icon={Settings}>
          Settings
        </NavLink>
      </div>

      <div className="p-4 border-t border-border/50">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2.5 h-2.5 rounded-full animate-pulse",
              isBrowserRunning ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500"
            )} />
            <span className="text-sm font-medium">
              Browser: {health?.browser || "Checking..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavLink({ href, active, icon: Icon, children }: { href: string, active: boolean, icon: any, children: React.ReactNode }) {
  return (
    <Link href={href} className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
      active 
        ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}>
      <Icon className={cn(
        "w-5 h-5 transition-colors",
        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
      )} />
      {children}
    </Link>
  );
}
