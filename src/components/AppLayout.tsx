import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import NotificationBell from "@/components/NotificationBell";
import {
  LayoutDashboard, Building2, Users, Bell, LogOut,
  CheckCircle, Ticket, BookOpen, FileText, Plus, LinkIcon, Copy, Check, Archive, User, Trash2
} from "lucide-react";

const ADMIN_PAGE_TITLES: Record<string, string> = {
  "/": "Admin Dashboard",
  "/tickets/new": "Create Ticket",
  "/admin/approvals": "Approvals",
  "/admin/tickets": "Ticket Command Center",
  "/admin/tickets/archived": "Archived Tickets",
  "/admin/tickets/deleted": "Deleted Tickets",
  "/admin/templates": "Ticket Templates",
  "/vendors": "Vendors",
  "/users": "User Management",
  "/notifications": "Notifications",
  "/knowledge-base": "Knowledge Base",
};

const VENDOR_PAGE_TITLES: Record<string, string> = {
  "/": "My Dashboard",
  "/notifications": "Notifications",
  "/knowledge-base": "Knowledge Base",
  "/profile": "My Profile",
};

const getPageTitle = (pathname: string, role: string | null) => {
  const titles = role === "vendor" ? VENDOR_PAGE_TITLES : ADMIN_PAGE_TITLES;
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/tickets/")) return role === "vendor" ? "Ticket Response" : "Ticket Detail";
  if (pathname.startsWith("/vendors/")) return "Vendor Profile";
  return "VendorCare Connect";
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [vendorStats, setVendorStats] = useState({ open: 0, resolved: 0, total: 0 });

  const isActive = (path: string) => location.pathname === path || (path !== "/admin/tickets" && location.pathname.startsWith(path + "/")) || (path === "/admin/tickets" && location.pathname === "/admin/tickets");
  const publicFormUrl = `${window.location.origin}/submit-request`;
  const pageTitle = getPageTitle(location.pathname, role);
  const isDashboard = location.pathname === "/";

  // Fetch vendor info for sidebar identity card
  useEffect(() => {
    if (role !== "vendor" || !profile?.vendor_id) return;
    const fetchVendorInfo = async () => {
      const [vendorRes, ticketsRes] = await Promise.all([
        supabase.from("vendors").select("name").eq("id", profile.vendor_id!).single(),
        supabase.from("tickets").select("status").eq("is_archived", false),
      ]);
      if (vendorRes.data) setVendorName(vendorRes.data.name);
      if (ticketsRes.data) {
        const tickets = ticketsRes.data;
        const open = tickets.filter((t: any) => ["open", "in_progress", "pending_vendor_response"].includes(t.status)).length;
        const resolved = tickets.filter((t: any) => t.status === "resolved" || t.status === "closed").length;
        setVendorStats({ open, resolved, total: tickets.length });
      }
    };
    fetchVendorInfo();
  }, [role, profile?.vendor_id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicFormUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navClass = (path: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive(path)
        ? "bg-[#E8A020]/14 text-[#E8A020] border-l-[3px] border-[#E8A020] -ml-[3px]"
        : "text-[#b8b0a0] hover:bg-white/5 hover:text-[#d4cbbf]"
    }`;

  const resolutionRate = vendorStats.total > 0 ? Math.round((vendorStats.resolved / vendorStats.total) * 100) : 0;

  const navContent = (
    <>
      <div className="flex items-center gap-2 px-5 py-5 border-b border-[#2a2118]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8A020]">
          <Ticket className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-white text-sm">VendorCare</span>
      </div>

      {/* Vendor Identity Card */}
      {role === "vendor" && (
        <div className="mx-3 mt-4 rounded-lg p-[10px_12px]" style={{ background: "rgba(232,160,32,0.08)", border: "0.5px solid rgba(232,160,32,0.2)" }}>
          <p className="text-white text-xs font-medium leading-tight">{profile?.full_name || "Vendor User"}</p>
          <p className="text-[10px] text-[#8a8070] mt-0.5">{vendorName || "Loading..."}</p>
          <div className="flex gap-2 mt-2">
            <div className="flex-1 rounded-md px-2 py-1.5 text-center" style={{ background: "rgba(232,160,32,0.1)" }}>
              <p className="text-xs font-medium" style={{ color: "#E8A020" }}>{vendorStats.open}</p>
              <p className="text-[9px] text-[#8a8070]">Open</p>
            </div>
            <div className="flex-1 rounded-md px-2 py-1.5 text-center" style={{ background: "rgba(232,160,32,0.1)" }}>
              <p className="text-xs font-medium" style={{ color: "#E8A020" }}>{resolutionRate}%</p>
              <p className="text-[9px] text-[#8a8070]">Resolved</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <Link to="/" className={navClass("/")}>
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </Link>

        {role === "admin" && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] uppercase tracking-wider text-[#6b6156] font-semibold">Admin</p>
            </div>
            <Link to="/tickets/new" className={navClass("/tickets/new")}>
              <Plus className="h-4 w-4" /> Create Ticket
            </Link>
            <Link to="/admin/approvals" className={navClass("/admin/approvals")}>
              <CheckCircle className="h-4 w-4" /> Approvals
            </Link>
            <Link to="/admin/tickets" className={navClass("/admin/tickets")}>
              <Ticket className="h-4 w-4" /> All Tickets
            </Link>
            <Link to="/admin/tickets/archived" className={navClass("/admin/tickets/archived")}>
              <Archive className="h-4 w-4 text-[#6b6156]" /> Archived
            </Link>
            <Link to="/admin/tickets/deleted" className={navClass("/admin/tickets/deleted")}>
              <Trash2 className="h-4 w-4 text-[#6b6156]" /> Deleted
            </Link>
            <Link to="/admin/templates" className={navClass("/admin/templates")}>
              <FileText className="h-4 w-4" /> Templates
            </Link>
            <Link to="/vendors" className={navClass("/vendors")}>
              <Building2 className="h-4 w-4" /> Vendors
            </Link>
            <Link to="/users" className={navClass("/users")}>
              <Users className="h-4 w-4" /> Users
            </Link>

            <div className="pt-4 pb-1 px-3">
              <div className="border-t border-[#E8A020]/20 mb-3" />
              <p className="text-[10px] uppercase tracking-wider text-[#6b6156] font-semibold flex items-center gap-1.5">
                <LinkIcon className="h-3 w-3" /> Public Form
              </p>
            </div>
            <div className="px-1">
              <div className="rounded-lg bg-[#0f0a05] p-2.5 space-y-2" style={{ border: '0.5px solid #E8A020' }}>
                <div className="flex gap-1">
                  <Input
                    readOnly
                    value={publicFormUrl}
                    className="h-7 text-[10px] bg-transparent border-none text-[#E8A020]/80 px-2 focus-visible:ring-0"
                  />
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0 text-[#6b6156] hover:text-[#E8A020]" onClick={handleCopyLink}
                    title={copied ? "Copied!" : "Copy URL"}>
                    {copied ? <Check className="h-3 w-3 text-[#E8A020]" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="pt-4 pb-1 px-3">
          <p className="text-[10px] uppercase tracking-wider text-[#6b6156] font-semibold">
            {role === "vendor" ? "Help" : "Other"}
          </p>
        </div>
        <Link to="/notifications" className={navClass("/notifications")}>
          <Bell className="h-4 w-4" /> Notifications
        </Link>
        <Link to="/knowledge-base" className={navClass("/knowledge-base")}>
          <BookOpen className="h-4 w-4" /> Knowledge Base
        </Link>
        {role === "vendor" && (
          <Link to="/profile" className={navClass("/profile")}>
            <User className="h-4 w-4" /> My Profile
          </Link>
        )}
      </nav>

      <div className="border-t border-[#2a2118] px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8A020]/20 text-[#E8A020] text-xs font-medium">
            {(profile?.full_name || "U")[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">{profile?.full_name || "User"}</p>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-[#2a2118] text-[#8a8070]">
              {role || "vendor"}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}
          className="w-full justify-start gap-2 text-[#6b6156] hover:text-white hover:bg-white/5">
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#f5f4f0]">
      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-[#18120a] border-r border-[#2a2118] ${isMobile ? "w-48" : "w-60"}`}>
        {navContent}
      </aside>
      <div className={`${isMobile ? "ml-48" : "ml-60"} flex-1`}>
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#e8e3d8] bg-white/80 backdrop-blur-sm px-6 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium text-foreground">{pageTitle}</h2>
            {isDashboard && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <Link to="/tickets/new">
                <Button size="sm" className="gap-1.5 bg-[#E8A020] hover:bg-[#c98a18] text-white h-8 text-xs">
                  <Plus className="h-3.5 w-3.5" /> New Ticket
                </Button>
              </Link>
            )}
            <NotificationBell />
          </div>
        </header>
        <main className={`${isMobile ? "p-3" : "p-6"}`}>{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
