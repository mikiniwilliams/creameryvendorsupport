import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Clock, CheckCircle, Search, ArrowUpDown, Play, CheckCheck } from "lucide-react";

const statusConfig: Record<string, { label: string; class: string }> = {
  open: { label: "Open", class: "status-badge-open" },
  in_progress: { label: "In Progress", class: "status-badge-in_progress" },
  pending_vendor_response: { label: "Pending Vendor", class: "status-badge-pending_vendor_response" },
  resolved: { label: "Resolved", class: "status-badge-resolved" },
  closed: { label: "Closed", class: "status-badge-closed" },
};

const priorityConfig: Record<string, string> = {
  low: "priority-badge-low",
  medium: "priority-badge-medium",
  high: "priority-badge-high",
  urgent: "priority-badge-urgent",
};

type SortKey = "updated_at" | "created_at" | "priority" | "status";
const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const statusOrder: Record<string, number> = { open: 0, in_progress: 1, pending_vendor_response: 2, resolved: 3, closed: 4 };

const VendorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("updated_at");
  const [sortAsc, setSortAsc] = useState(false);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setTickets(data);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  const openCount = tickets.filter(t => ["open", "in_progress", "pending_vendor_response"].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

  const filtered = tickets
    .filter(t => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !(t.description || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "priority") cmp = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
      else if (sortBy === "status") cmp = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      else cmp = new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime();
      return sortAsc ? cmp : -cmp;
    });

  const handleQuickStatus = async (ticketId: string, newStatus: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { error } = await supabase.from("tickets").update({ status: newStatus }).eq("id", ticketId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated", description: `Ticket moved to ${newStatus.replace(/_/g, " ")}` });
      fetchTickets();
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold">My Tickets</h1>

      {/* Summary cards */}
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

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
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
          <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          {(["updated_at", "created_at", "priority", "status"] as SortKey[]).map(key => (
            <Button
              key={key}
              variant={sortBy === key ? "secondary" : "ghost"}
              size="sm"
              className="h-9 text-xs gap-1"
              onClick={() => toggleSort(key)}
            >
              <ArrowUpDown className="h-3 w-3" />
              {key === "updated_at" ? "Updated" : key === "created_at" ? "Created" : key === "priority" ? "Priority" : "Status"}
            </Button>
          ))}
        </div>
      </div>

      {/* Ticket cards */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Ticket className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground">No tickets match your filters</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((t: any) => {
            const sc = statusConfig[t.status] || { label: t.status, class: "" };
            const canStart = t.status === "open" || t.status === "pending_vendor_response";
            const canResolve = t.status === "in_progress";

            return (
              <Link key={t.id} to={`/tickets/${t.id}`} className="group">
                <Card className="transition-all hover:shadow-md hover:border-primary/30 h-full">
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {t.title}
                      </h3>
                      <Badge variant="outline" className={`${priorityConfig[t.priority] || ""} text-[10px] capitalize shrink-0`}>
                        {t.priority}
                      </Badge>
                    </div>

                    {/* Description preview */}
                    {t.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                    )}

                    {/* Status + dates */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className={`${sc.class} text-[10px] capitalize`}>
                        {sc.label}
                      </Badge>
                      <div className="text-[10px] text-muted-foreground text-right">
                        <span>Created {new Date(t.created_at).toLocaleDateString()}</span>
                        <span className="mx-1">·</span>
                        <span>Updated {new Date(t.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Quick actions */}
                    {(canStart || canResolve) && (
                      <div className="flex gap-2 pt-1">
                        {canStart && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 flex-1"
                            onClick={(e) => handleQuickStatus(t.id, "in_progress", e)}
                          >
                            <Play className="h-3 w-3" /> Start Working
                          </Button>
                        )}
                        {canResolve && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={(e) => handleQuickStatus(t.id, "resolved", e)}
                          >
                            <CheckCheck className="h-3 w-3" /> Mark Resolved
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
