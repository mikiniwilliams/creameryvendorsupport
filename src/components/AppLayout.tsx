import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Ticket, LayoutDashboard, Building2, LogOut, Plus } from "lucide-react";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Ticket className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-primary-foreground">DeskFlow</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link to="/">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${isActive("/") ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/tickets/new">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${isActive("/tickets/new") ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}
            >
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </Link>
          {role === "admin" && (
            <Link to="/vendors">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${isActive("/vendors") ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}
              >
                <Building2 className="h-4 w-4" />
                Vendors
              </Button>
            </Link>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-sidebar-primary-foreground truncate">{profile?.full_name || "User"}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{role || "no role"}</p>
          </div>
          <Button variant="ghost" onClick={signOut} className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
