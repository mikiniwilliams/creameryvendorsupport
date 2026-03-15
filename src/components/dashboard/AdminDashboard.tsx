import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, Building2, CheckCircle, AlertTriangle, Clock, Flame, TrendingUp } from "lucide-react";
import DashboardAnalytics from "./DashboardAnalytics";

const getTicketAge = (createdAt: string, status: string) => {
  if (status === "resolved" || status === "closed") return null;
  const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (hours >= 73) return "overdue";
  if (hours >= 25) return "aging";
  return null;
};

const TicketAgeIndicator = ({ age }: { age: string | null }) => {
  if (!age) return null;
  if (age === "overdue") return (
    <span className="inline-flex items-center gap-1 text-xs text-red-600">
      <Flame className="h-3 w-3" /> Overdue
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-600">
      <Clock className="h-3 w-3" /> Aging
    </span>
  );
};

const priorityLeftClass = (priority: string, status: string) => {
  if (status === "resolved" || status === "closed") return "priority-left-resolved";
  return `priority-left-${priority}`;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalTickets: 0, openTickets: 0, pendingVendors: 0, pendingUsers: 0, activeVendors: 0, archivedCount: 0 });
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [ticketsRes, archivedRes, vendorsRes, profilesRes] = await Promise.all([
        supabase.from("tickets").select("*").eq("is_archived", false).order("created_at", { ascending: false }),
        supabase.from("tickets").select("id", { count: "exact", head: true }).eq("is_archived", true),
        supabase.from("vendors").select("id, status"),
        supabase.from("profiles").select("status"),
      ]);
      const tickets = ticketsRes.data || [];
      const vendors = (vendorsRes.data || []) as any[];
      const profiles = (profilesRes.data || []) as any[];
      setAllTickets(tickets);
      setStats({
        totalTickets: tickets.length,
        openTickets: tickets.filter((t: any) => ["open", "in_progress", "pending_vendor_response"].includes(t.status)).length,
        pendingVendors: vendors.filter(v => v.status === "pending").length,
        pendingUsers: profiles.filter(p => p.status === "pending").length,
        activeVendors: vendors.filter(v => v.status === "active").length,
        archivedCount: archivedRes.count || 0,
      });
      setRecentTickets(tickets.slice(0, 5));
      setLoading(false);
    };
    fetchData();
  }, []);

  const resolutionRate = useMemo(() => {
    if (allTickets.length === 0) return 0;
    const resolved = allTickets.filter((t: any) => t.status === "resolved" || t.status === "closed").length;
    return Math.round((resolved / allTickets.length) * 100);
  }, [allTickets]);

  const resolutionColor = resolutionRate >= 50 ? "#2E7D32" : resolutionRate >= 25 ? "#854F0B" : "#A32D2D";

  const formatStatus = (s: string) => s.replace(/_/g, " ");

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium">Admin Dashboard</h1>

      {(stats.pendingVendors > 0 || stats.pendingUsers > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm font-medium text-amber-800 flex-1">
            {stats.pendingVendors > 0 && `${stats.pendingVendors} vendor(s) `}
            {stats.pendingVendors > 0 && stats.pendingUsers > 0 && "and "}
            {stats.pendingUsers > 0 && `${stats.pendingUsers} user(s) `}
            awaiting approval
          </p>
          <Link to="/admin/approvals"><Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">Review</Button></Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <div className="h-[2px] bg-[#E8A020]" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8A020]/10">
              <Ticket className="h-5 w-5 text-[#E8A020]" />
            </div>
            <div>
              <p className="text-2xl font-medium">{stats.totalTickets}</p>
              <p className="text-xs text-muted-foreground">Total Tickets</p>
              {stats.archivedCount > 0 && (
                <p className="text-[10px] text-muted-foreground/60">+{stats.archivedCount} archived</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="h-[2px] bg-[#378ADD]" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#378ADD]/10">
              <Clock className="h-5 w-5 text-[#378ADD]" />
            </div>
            <div><p className="text-2xl font-medium">{stats.openTickets}</p><p className="text-xs text-muted-foreground">Open / Active</p></div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="h-[2px] bg-[#1D9E75]" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1D9E75]/10">
              <Building2 className="h-5 w-5 text-[#1D9E75]" />
            </div>
            <div><p className="text-2xl font-medium">{stats.activeVendors}</p><p className="text-xs text-muted-foreground">Active Vendors</p></div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="h-[2px] bg-[#E24B4A]" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E24B4A]/10">
              <CheckCircle className="h-5 w-5 text-[#E24B4A]" />
            </div>
            <div><p className="text-2xl font-medium">{stats.pendingVendors + stats.pendingUsers}</p><p className="text-xs text-muted-foreground">Pending Approvals</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Rate KPI */}
      <Card className="overflow-hidden">
        <div className="h-[2px]" style={{ backgroundColor: resolutionColor }} />
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${resolutionColor}15` }}>
            <TrendingUp className="h-5 w-5" style={{ color: resolutionColor }} />
          </div>
          <div>
            <p className="text-2xl font-medium" style={{ color: resolutionColor }}>{resolutionRate}%</p>
            <p className="text-xs text-muted-foreground">Resolution Rate</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Recent Tickets</CardTitle>
          <Link to="/admin/tickets"><Button variant="link" size="sm" className="text-[#E8A020] hover:text-[#c98a18] p-0 h-auto">View All →</Button></Link>
        </CardHeader>
        <CardContent>
          {recentTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tickets yet.</p>
          ) : (
            <div className="space-y-2">
              {recentTickets.map((t: any) => (
                <Link key={t.id} to={`/tickets/${t.id}`} className={`flex items-center justify-between rounded-lg border border-[#e8e3d8] p-3 hover:bg-muted/50 transition-colors ${priorityLeftClass(t.priority, t.status)}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono" style={{ color: "#9CA3AF" }}>#{(t.short_id || t.id.slice(-6)).toUpperCase()}</span>
                      {" · "}{t.issue_type || "general"} · {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <TicketAgeIndicator age={getTicketAge(t.created_at, t.status)} />
                    <Badge variant="outline" className={`status-badge-${t.status} text-xs capitalize`}>{formatStatus(t.status)}</Badge>
                    <Badge variant="outline" className={`priority-badge-${t.priority} text-xs`}>{t.priority}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DashboardAnalytics tickets={allTickets} />
    </div>
  );
};

export default AdminDashboard;
