import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Plus, Building2, Users, Bell, LogOut,
  CheckCircle, Ticket, BookOpen
} from "lucide-react";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navClass = (path: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive(path)
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
    }`;

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-sidebar-background border-r border-sidebar-border">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Ticket className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground text-sm">VendorCare</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link to="/" className={navClass("/")}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>

          {role === "vendor" && (
            <Link to="/tickets/new" className={navClass("/tickets/new")}>
              <Plus className="h-4 w-4" /> New Ticket
            </Link>
          )}

          {role === "admin" && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold">Admin</p>
              </div>
              <Link to="/admin/approvals" className={navClass("/admin/approvals")}>
                <CheckCircle className="h-4 w-4" /> Approvals
              </Link>
              <Link to="/admin/tickets" className={navClass("/admin/tickets")}>
                <Ticket className="h-4 w-4" /> All Tickets
              </Link>
              <Link to="/vendors" className={navClass("/vendors")}>
                <Building2 className="h-4 w-4" /> Vendors
              </Link>
              <Link to="/users" className={navClass("/users")}>
                <Users className="h-4 w-4" /> Users
              </Link>
            </>
          )}

          <div className="pt-4 pb-1 px-3">
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold">Other</p>
          </div>
          <Link to="/notifications" className={navClass("/notifications")}>
            <Bell className="h-4 w-4" /> Notifications
          </Link>
          <Link to="/knowledge-base" className={navClass("/knowledge-base")}>
            <BookOpen className="h-4 w-4" /> Knowledge Base
          </Link>
        </nav>

        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-medium">
              {(profile?.full_name || "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{profile?.full_name || "User"}</p>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-sidebar-border text-sidebar-foreground/60">
                {role || "vendor"}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}
            className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </Button>
        </div>
      </aside>
      <main className="ml-60 flex-1 p-6">{children}</main>
    </div>
  );
};

export default AppLayout;
