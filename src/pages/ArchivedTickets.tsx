import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Archive, RotateCcw, Trash2 } from "lucide-react";

interface ArchivedTicket {
  id: string; title: string; status: string; priority: string;
  issue_type: string; vendor_id: string; created_at: string;
  archived_at: string | null; archived_by: string | null;
}
interface Vendor { id: string; name: string; }
interface ProfileUser { user_id: string; full_name: string | null; email: string | null; }

const ArchivedTickets = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<ArchivedTicket[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [archivers, setArchivers] = useState<ProfileUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [ticketsRes, vendorsRes] = await Promise.all([
      supabase.from("tickets").select("id, title, status, priority, issue_type, vendor_id, created_at, archived_at, archived_by").eq("is_archived", true).order("archived_at", { ascending: false }),
      supabase.from("vendors").select("id, name"),
    ]);
    const tix = (ticketsRes.data || []) as ArchivedTicket[];
    setTickets(tix);
    if (vendorsRes.data) setVendors(vendorsRes.data as Vendor[]);

    const archiverIds = [...new Set(tix.map(t => t.archived_by).filter(Boolean))] as string[];
    if (archiverIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", archiverIds);
      if (profiles) setArchivers(profiles as ProfileUser[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getVendorName = (id: string) => vendors.find(v => v.id === id)?.name || "Unknown";
  const getArchiverName = (id: string | null) => {
    if (!id) return "Unknown";
    const p = archivers.find(a => a.user_id === id);
    return p?.full_name || p?.email || "Unknown";
  };
  const formatStatus = (s: string) => s.replace(/_/g, " ");

  const handleRestore = async (ticketId: string) => {
    const { error } = await supabase.from("tickets").update({ is_archived: false, archived_at: null, archived_by: null }).eq("id", ticketId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setTickets(prev => prev.filter(t => t.id !== ticketId));
    toast({ title: "Ticket restored" });
  };

  const handlePermanentDelete = async (ticketId: string) => {
    // Delete associated data first, then the ticket
    await Promise.all([
      supabase.from("comments").delete().eq("ticket_id", ticketId),
      supabase.from("internal_notes").delete().eq("ticket_id", ticketId),
      supabase.from("ticket_activity").delete().eq("ticket_id", ticketId),
      supabase.from("notifications").delete().eq("ticket_id", ticketId),
    ]);
    const { error } = await supabase.from("tickets").delete().eq("id", ticketId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setTickets(prev => prev.filter(t => t.id !== ticketId));
    toast({ title: "Ticket permanently deleted" });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Archive className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-medium">Archived Tickets</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Archived ({tickets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No archived tickets.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Title</th>
                      <th className="pb-3 font-medium text-muted-foreground">Vendor</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 font-medium text-muted-foreground">Priority</th>
                      <th className="pb-3 font-medium text-muted-foreground">Archived On</th>
                      <th className="pb-3 font-medium text-muted-foreground">Archived By</th>
                      <th className="pb-3 font-medium text-muted-foreground w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(t => (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 pr-4">
                          <Link to={`/tickets/${t.id}`} className="text-primary hover:underline font-medium">{t.title}</Link>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{getVendorName(t.vendor_id)}</td>
                        <td className="py-3 pr-4"><Badge variant="outline" className={`status-badge-${t.status} text-xs capitalize`}>{formatStatus(t.status)}</Badge></td>
                        <td className="py-3 pr-4"><Badge variant="outline" className={`priority-badge-${t.priority} text-xs`}>{t.priority}</Badge></td>
                        <td className="py-3 pr-4 text-muted-foreground text-xs">{t.archived_at ? new Date(t.archived_at).toLocaleDateString() : "—"}</td>
                        <td className="py-3 pr-4 text-muted-foreground text-xs">{getArchiverName(t.archived_by)}</td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7 text-emerald-600 border-emerald-200 hover:bg-emerald-50" title="Restore" onClick={() => handleRestore(t.id)}>
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                            <ConfirmDialog
                              trigger={
                                <Button variant="outline" size="icon" className="h-7 w-7 text-destructive border-red-200 hover:bg-red-50" title="Delete forever">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              }
                              title="Permanently delete this ticket?"
                              description="This will permanently delete the ticket and all associated comments, activity, and notifications. This cannot be undone."
                              confirmLabel="Delete Forever"
                              variant="destructive"
                              onConfirm={() => handlePermanentDelete(t.id)}
                            />
                          </div>
                        </td>
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

export default ArchivedTickets;
