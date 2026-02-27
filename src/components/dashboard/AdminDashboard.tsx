import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, Building2, Users, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import DashboardAnalytics from "./DashboardAnalytics";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalTickets: 0, openTickets: 0, pendingVendors: 0, pendingUsers: 0, activeVendors: 0 });
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [ticketsRes, vendorsRes, profilesRes] = await Promise.all([
        supabase.from("tickets").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("vendors").select("id, status"),
        supabase.from("profiles").select("status"),
      ]);
      const tickets = ticketsRes.data || [];
      const vendors = (vendorsRes.data || []) as any[];
      const profiles = (profilesRes.data || []) as any[];
      setStats({
        totalTickets: tickets.length,
        openTickets: tickets.filter((t: any) => t.status === "open" || t.status === "in_progress").length,
        pendingVendors: vendors.filter(v => v.status === "pending").length,
        pendingUsers: profiles.filter(p => p.status === "pending").length,
        activeVendors: vendors.filter(v => v.status === "active").length,
      });
      setRecentTickets(tickets.slice(0, 5));
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

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
        <Card><CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Ticket className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{stats.totalTickets}</p><p className="text-xs text-muted-foreground">Total Tickets</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><Clock className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-2xl font-bold">{stats.openTickets}</p><p className="text-xs text-muted-foreground">Open / In Progress</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50"><Building2 className="h-5 w-5 text-emerald-600" /></div>
          <div><p className="text-2xl font-bold">{stats.activeVendors}</p><p className="text-xs text-muted-foreground">Active Vendors</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50"><CheckCircle className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-2xl font-bold">{stats.pendingVendors + stats.pendingUsers}</p><p className="text-xs text-muted-foreground">Pending Approvals</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Tickets</CardTitle>
          <Link to="/admin/tickets"><Button variant="outline" size="sm">View All</Button></Link>
        </CardHeader>
        <CardContent>
          {recentTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tickets yet.</p>
          ) : (
            <div className="space-y-2">
              {recentTickets.map((t: any) => (
                <Link key={t.id} to={`/tickets/${t.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.issue_type || "general"} · {new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Badge variant="outline" className={`status-badge-${t.status} text-xs`}>{t.status.replace("_", " ")}</Badge>
                    <Badge variant="outline" className={`priority-badge-${t.priority} text-xs`}>{t.priority}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
