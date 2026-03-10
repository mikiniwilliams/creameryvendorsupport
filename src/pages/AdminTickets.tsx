import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Ticket, Search, Download, Clock, Flame } from "lucide-react";

interface TicketRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  issue_type: string;
  vendor_id: string;
  assigned_to: string | null;
  created_at: string;
  source?: string;
}

interface Vendor { id: string; name: string; }
interface AdminUser { user_id: string; full_name: string | null; email: string | null; }

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
      <Flame className="h-3.5 w-3.5" /> Overdue
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-600">
      <Clock className="h-3.5 w-3.5" /> Aging
    </span>
  );
};

const AdminTickets = () => {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterVendor, setFilterVendor] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [ticketsRes, vendorsRes, adminRolesRes] = await Promise.all([
        supabase.from("tickets").select("*").order("created_at", { ascending: false }),
        supabase.from("vendors").select("id, name").order("name"),
        supabase.from("user_roles").select("user_id").eq("role", "admin"),
      ]);
      if (ticketsRes.data) setTickets(ticketsRes.data as TicketRow[]);
      if (vendorsRes.data) setVendors(vendorsRes.data as Vendor[]);
      if (adminRolesRes.data && adminRolesRes.data.length > 0) {
        const ids = adminRolesRes.data.map((r: any) => r.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", ids);
        if (profiles) setAdmins(profiles as AdminUser[]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const getVendorName = (id: string) => vendors.find(v => v.id === id)?.name || "Unknown";
  const getAssignedName = (id: string | null) => {
    if (!id) return "Unassigned";
    const a = admins.find(a => a.user_id === id);
    return a?.full_name || a?.email || "Unassigned";
  };

  const filtered = tickets.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterVendor !== "all" && t.vendor_id !== filterVendor) return false;
    if (filterType !== "all" && t.issue_type !== filterType) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatStatus = (s: string) => s.replace(/_/g, " ");

  const exportCsv = () => {
    const headers = ["Title", "Vendor", "Type", "Status", "Priority", "Assigned To", "Created"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = filtered.map(t => [
      escape(t.title),
      escape(getVendorName(t.vendor_id)),
      escape(t.issue_type),
      escape(t.status),
      escape(t.priority),
      escape(getAssignedName(t.assigned_to)),
      escape(new Date(t.created_at).toLocaleDateString()),
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Ticket className="h-6 w-6" /> Ticket Command Center</h1>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tickets…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending_vendor_response">Pending Vendor</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterVendor} onValueChange={setFilterVendor}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Vendor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tickets ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tickets match your filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Title</th>
                      <th className="pb-3 font-medium text-muted-foreground">Vendor</th>
                      <th className="pb-3 font-medium text-muted-foreground">Type</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 font-medium text-muted-foreground">Priority</th>
                      <th className="pb-3 font-medium text-muted-foreground">Assigned</th>
                      <th className="pb-3 font-medium text-muted-foreground">Age</th>
                      <th className="pb-3 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 pr-4">
                          <Link to={`/tickets/${t.id}`} className="text-primary hover:underline font-medium">{t.title}</Link>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{getVendorName(t.vendor_id)}</td>
                        <td className="py-3 pr-4"><Badge variant="outline" className="text-xs capitalize">{t.issue_type}</Badge></td>
                        <td className="py-3 pr-4"><Badge variant="outline" className={`status-badge-${t.status} text-xs capitalize`}>{formatStatus(t.status)}</Badge></td>
                        <td className="py-3 pr-4"><Badge variant="outline" className={`priority-badge-${t.priority} text-xs`}>{t.priority}</Badge></td>
                        <td className="py-3 pr-4 text-muted-foreground text-xs">{getAssignedName(t.assigned_to)}</td>
                        <td className="py-3 pr-4"><TicketAgeIndicator age={getTicketAge(t.created_at, t.status)} /></td>
                        <td className="py-3 text-muted-foreground text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminTickets;
