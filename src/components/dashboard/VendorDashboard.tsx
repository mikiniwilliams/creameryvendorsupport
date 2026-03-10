import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, Clock, CheckCircle } from "lucide-react";

const VendorDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  useEffect(() => {
    const fetchTickets = async () => {
      const { data } = await supabase
        .from("tickets")
        .select("*")
        .order("updated_at", { ascending: false });
      if (data) setTickets(data);
      setLoading(false);
    };
    fetchTickets();
  }, []);

  const openCount = tickets.filter(t => ["open", "in_progress", "pending_vendor_response"].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

  const filtered = tickets.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const formatStatus = (s: string) => s.replace(/_/g, " ");

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold">My Tickets</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Ticket className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{tickets.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><Clock className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-2xl font-bold">{openCount}</p><p className="text-xs text-muted-foreground">Open</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
          <div><p className="text-2xl font-bold">{resolvedCount}</p><p className="text-xs text-muted-foreground">Resolved</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">All Tickets</CardTitle>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
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
              <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No tickets match your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Title</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground">Priority</th>
                    <th className="pb-3 font-medium text-muted-foreground">Created</th>
                    <th className="pb-3 font-medium text-muted-foreground">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t: any) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer" onClick={() => window.location.href = `/tickets/${t.id}`}>
                      <td className="py-3 pr-4">
                        <Link to={`/tickets/${t.id}`} className="text-primary hover:underline font-medium">{t.title}</Link>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className={`status-badge-${t.status} text-xs capitalize`}>{formatStatus(t.status)}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className={`priority-badge-${t.priority} text-xs capitalize`}>{t.priority}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="py-3 text-muted-foreground text-xs">{new Date(t.updated_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorDashboard;
