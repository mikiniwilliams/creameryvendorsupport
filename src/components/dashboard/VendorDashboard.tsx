import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Clock, CheckCircle, Search, ArrowUpDown, Play, CheckCheck, X, ExternalLink, Calendar, AlertCircle, AlertTriangle } from "lucide-react";

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

const priorityBorderColor: Record<string, string> = {
  high: "#E24B4A",
  urgent: "#E24B4A",
  medium: "#E8A020",
  low: "#378ADD",
};

type SortKey = "updated_at" | "created_at" | "priority" | "status";
const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const statusOrder: Record<string, number> = { open: 0, in_progress: 1, pending_vendor_response: 2, resolved: 3, closed: 4 };

interface VendorDashboardProps {
  onClosePreview?: () => void;
}

const VendorDashboard = ({ onClosePreview }: VendorDashboardProps = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("updated_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [previewTicket, setPreviewTicket] = useState<any | null>(null);
  const [previewComments, setPreviewComments] = useState<any[]>([]);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("is_archived", false)
      .order("updated_at", { ascending: false });
    if (data) setTickets(data);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  const fetchPreviewComments = useCallback(async (ticketId: string) => {
    const { data } = await supabase.from("comments").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: false }).limit(3);
    if (data) setPreviewComments(data);
  }, []);

  const handleCardHover = useCallback((ticket: any) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => { setPreviewTicket(ticket); fetchPreviewComments(ticket.id); }, 300);
  }, [fetchPreviewComments]);

  const handleCardLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  }, []);

  // V4: Close preview when opening ticket card click
  const handleCardClick = useCallback(() => {
    // Preview will close on navigation anyway
  }, []);

  const openCount = tickets.filter(t => ["open", "in_progress", "pending_vendor_response"].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

  const overdueTickets = useMemo(() => {
    const now = Date.now();
    const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000;
    return tickets.filter(t =>
      ["open", "in_progress"].includes(t.status) &&
      (now - new Date(t.updated_at).getTime()) > SEVENTY_TWO_HOURS
    );
  }, [tickets]);

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
    e.preventDefault(); e.stopPropagation();
    const { error } = await supabase.from("tickets").update({ status: newStatus }).eq("id", ticketId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Status updated", description: `Ticket moved to ${newStatus.replace(/_/g, " ")}` }); fetchTickets(); if (previewTicket?.id === ticketId) setPreviewTicket({ ...previewTicket, status: newStatus }); }
  };

  const toggleSort = (key: SortKey) => { if (sortBy === key) setSortAsc(!sortAsc); else { setSortBy(key); setSortAsc(false); } };
  const daysSince = (date: string) => { const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)); if (days === 0) return "Today"; if (days === 1) return "1 day ago"; return `${days} days ago`; };

  const getCardBorderColor = (ticket: any) => {
    if (ticket.status === "resolved" || ticket.status === "closed") return "#1D9E75";
    return priorityBorderColor[ticket.priority] || "#378ADD";
  };

  return (
    <div className="animate-fade-in space-y-6 relative">
      <h1 className="text-2xl font-bold">My Tickets</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="overflow-hidden">
          <div className="h-[2px] w-full" style={{ background: "#E8A020" }} />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "rgba(232,160,32,0.12)" }}>
              <Ticket className="h-5 w-5" style={{ color: "#E8A020" }} />
            </div>
            <div><p className="text-2xl font-medium">{tickets.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="h-[2px] w-full" style={{ background: "#378ADD" }} />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "rgba(55,138,221,0.12)" }}>
              <Clock className="h-5 w-5" style={{ color: "#378ADD" }} />
            </div>
            <div><p className="text-2xl font-medium">{openCount}</p><p className="text-xs text-muted-foreground">Open</p></div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="h-[2px] w-full" style={{ background: "#1D9E75" }} />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "rgba(29,158,117,0.12)" }}>
              <CheckCircle className="h-5 w-5" style={{ color: "#1D9E75" }} />
            </div>
            <div><p className="text-2xl font-medium">{resolvedCount}</p><p className="text-xs text-muted-foreground">Resolved</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Warning */}
      {overdueTickets.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border px-4 py-3" style={{ background: "#FAEEDA", borderColor: "#E8A020" }}>
          <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: "#854F0B" }} />
          <p className="flex-1 text-sm font-medium" style={{ color: "#854F0B" }}>
            You have {overdueTickets.length} overdue ticket{overdueTickets.length > 1 ? "s" : ""} — please respond to avoid affecting your standing in The Creamery.
          </p>
          <Button size="sm" variant="outline" className="shrink-0 text-xs h-8" style={{ borderColor: "#E8A020", color: "#854F0B" }}
            onClick={() => { setFilterStatus("all"); setSortBy("updated_at"); setSortAsc(true); }}>
            View Overdue
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
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
            <Button key={key} variant={sortBy === key ? "secondary" : "ghost"} size="sm" className="h-9 text-xs gap-1" onClick={() => toggleSort(key)}>
              <ArrowUpDown className="h-3 w-3" />
              {key === "updated_at" ? "Updated" : key === "created_at" ? "Created" : key === "priority" ? "Priority" : "Status"}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className={`transition-all duration-300 ${previewTicket ? "flex-1 min-w-0" : "w-full"}`}>
          {loading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Ticket className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground">No tickets match your filters</p>
            </div>
          ) : (
            <div className={`grid gap-3 ${previewTicket ? "grid-cols-1" : "sm:grid-cols-2"}`}>
              {filtered.map((t: any) => {
                const sc = statusConfig[t.status] || { label: t.status, class: "" };
                const canStart = t.status === "open" || t.status === "pending_vendor_response";
                const canResolve = t.status === "in_progress";
                const isSelected = previewTicket?.id === t.id;
                const borderColor = getCardBorderColor(t);
                return (
                  <Link key={t.id} to={`/tickets/${t.id}`} className="group" onMouseEnter={() => handleCardHover(t)} onMouseLeave={handleCardLeave}>
                    <Card className={`transition-all hover:shadow-md h-full overflow-hidden ${isSelected ? "border-primary shadow-md ring-1 ring-primary/20" : "hover:border-primary/30"}`}>
                      <CardContent className="p-0">
                        <div className="flex h-full">
                          <div className="w-[3px] shrink-0 rounded-l-lg" style={{ background: borderColor }} />
                          <div className="p-4 space-y-3 flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">{t.title}</h3>
                                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">#{(t as any).short_id || t.id.slice(-6).toUpperCase()}</p>
                              </div>
                              <Badge variant="outline" className={`${priorityConfig[t.priority] || ""} text-[10px] capitalize shrink-0`}>{t.priority}</Badge>
                            </div>
                            {!previewTicket && t.description && <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="outline" className={`${sc.class} text-[10px] capitalize`}>{sc.label}</Badge>
                              <div className="text-[11px] text-muted-foreground font-medium text-right">Updated {daysSince(t.updated_at)}</div>
                            </div>
                            {(canStart || canResolve) && (
                              <div className="flex gap-2 pt-1">
                                {canStart && <Button variant="outline" size="sm" className="h-7 text-xs gap-1 flex-1" onClick={(e) => handleQuickStatus(t.id, "in_progress", e)}><Play className="h-3 w-3" /> Start Working</Button>}
                                {canResolve && (
                                  <Button size="sm" className="h-7 text-xs gap-1 flex-1 text-[#18120a] font-medium" style={{ background: "#E8A020" }}
                                    onClick={(e) => handleQuickStatus(t.id, "resolved", e)}>
                                    <CheckCheck className="h-3 w-3" /> Mark Resolved
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {previewTicket && (
          <div className="w-[320px] shrink-0 animate-slide-in-right">
            <Card className="sticky top-20 border-primary/20 shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 pb-3">
                  <h3 className="font-semibold text-sm truncate pr-2">Preview</h3>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setPreviewTicket(null)}><X className="h-3.5 w-3.5" /></Button>
                </div>
                <Separator />
                <div className="p-4 space-y-4">
                  <h4 className="font-medium text-sm leading-tight">{previewTicket.title}</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={`${statusConfig[previewTicket.status]?.class || ""} text-[10px] capitalize`}>{statusConfig[previewTicket.status]?.label || previewTicket.status}</Badge>
                    <Badge variant="outline" className={`${priorityConfig[previewTicket.priority] || ""} text-[10px] capitalize`}>{previewTicket.priority}</Badge>
                  </div>
                  {previewTicket.description && (<><Separator /><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Description</p><p className="text-xs text-muted-foreground leading-relaxed">{previewTicket.description}</p></div></>)}
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3 w-3 shrink-0" /><span>Created: {new Date(previewTicket.created_at).toLocaleDateString()}</span></div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3 w-3 shrink-0" /><span>Updated: {daysSince(previewTicket.updated_at)}</span></div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><AlertCircle className="h-3 w-3 shrink-0" /><span>Type: <span className="capitalize">{previewTicket.issue_type}</span></span></div>
                  </div>
                  {previewComments.length > 0 && (<><Separator /><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Recent Comments ({previewComments.length})</p><div className="space-y-2">{previewComments.map(c => (<div key={c.id} className="rounded-md bg-muted/50 p-2"><p className="text-xs text-foreground line-clamp-2">{c.content}</p><p className="text-[10px] text-muted-foreground mt-1">{daysSince(c.created_at)}</p></div>))}</div></div></>)}
                  <Separator />
                  <Link to={`/tickets/${previewTicket.id}`}><Button variant="default" size="sm" className="w-full gap-1.5 text-xs"><ExternalLink className="h-3 w-3" /> Open Full Detail</Button></Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
