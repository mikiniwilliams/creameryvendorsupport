import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Ticket, Clock, CheckCircle, Search } from "lucide-react";
import DashboardAnalytics from "./DashboardAnalytics";

const VendorDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      const { data } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
      if (data) setTickets(data);
      setLoading(false);
    };
    fetchTickets();
  }, []);


  const openCount = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;
  const filtered = tickets.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.issue_type || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My Tickets</h1>
        <Link to="/tickets/new"><Button className="gap-2"><Plus className="h-4 w-4" /> New Ticket</Button></Link>
      </div>

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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">All Tickets</CardTitle>
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-3">{search ? "No tickets match your search" : "No tickets yet"}</p>
              {!search && <Link to="/tickets/new"><Button size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" /> Create Your First Ticket</Button></Link>}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((t: any) => (
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

      <DashboardAnalytics tickets={tickets} />
    </div>
  );
};

export default VendorDashboard;
