import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

interface DeletedTicket {
  id: string; title: string; status: string; priority: string;
  issue_type: string; vendor_id: string; created_at: string;
  deleted_at: string | null; short_id?: string;
}
interface Vendor { id: string; name: string; }

const getShortId = (t: DeletedTicket) => t.short_id || t.id.slice(-6).toUpperCase();

const DeletedTickets = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<DeletedTicket[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    const ticketsQuery = supabase.from("tickets").select("*") as any;
    const [ticketsRes, vendorsRes] = await Promise.all([
      ticketsQuery.eq("is_deleted", true).order("deleted_at", { ascending: false }),
      supabase.from("vendors").select("id, name"),
    ]);
    if (ticketsRes.data) setTickets(ticketsRes.data as DeletedTicket[]);
    if (vendorsRes.data) setVendors(vendorsRes.data as Vendor[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getVendorName = (id: string) => vendors.find(v => v.id === id)?.name || "Unknown";
  const formatStatus = (s: string) => s.replace(/_/g, " ");

  const handleRecover = async (ticketIds: string[]) => {
    const promises = ticketIds.map(id =>
      supabase.from("tickets").update({
        is_deleted: false as any,
        deleted_at: null as any,
      }).eq("id", id)
    );
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      toast({ title: "Error", description: `Failed to recover ${errors.length} ticket(s)`, variant: "destructive" });
      return;
    }
    setTickets(prev => prev.filter(t => !ticketIds.includes(t.id)));
    setSelectedIds(new Set());
    toast({ title: `${ticketIds.length} ticket(s) recovered`, description: "Restored to the active ticket list." });
  };

  const handlePermanentDelete = async (ticketIds: string[]) => {
    for (const ticketId of ticketIds) {
      await Promise.all([
        supabase.from("comments").delete().eq("ticket_id", ticketId),
        supabase.from("internal_notes").delete().eq("ticket_id", ticketId),
        supabase.from("ticket_activity").delete().eq("ticket_id", ticketId),
        supabase.from("notifications").delete().eq("ticket_id", ticketId),
      ]);
      await supabase.from("tickets").delete().eq("id", ticketId);
    }
    setTickets(prev => prev.filter(t => !ticketIds.includes(t.id)));
    setSelectedIds(new Set());
    toast({ title: `${ticketIds.length} ticket(s) permanently deleted` });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tickets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tickets.map(t => t.id)));
    }
  };

  const allSelected = tickets.length > 0 && selectedIds.size === tickets.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < tickets.length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-medium flex items-center gap-2">
            <Trash2 className="h-6 w-6" /> Deleted Tickets
          </h1>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleRecover(Array.from(selectedIds))}>
                  <RotateCcw className="h-4 w-4" /> Recover {selectedIds.size}
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Trash2 className="h-4 w-4" /> Delete {selectedIds.size} Forever
                    </Button>
                  }
                  title={`Permanently delete ${selectedIds.size} ticket(s)?`}
                  description="This will permanently delete the selected tickets and all associated comments, notes, and activity logs. This action cannot be undone."
                  confirmLabel="Delete Forever"
                  variant="destructive"
                  onConfirm={() => handlePermanentDelete(Array.from(selectedIds))}
                />
              </>
            )}
          </div>
        </div>

        {tickets.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              Deleted tickets can be recovered or permanently removed. Permanent deletion cannot be undone.
            </p>
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">
              Trash ({tickets.length})
              {selectedIds.size > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  · {selectedIds.size} selected
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No deleted tickets. Trash is empty.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-2 w-8">
                        <Checkbox
                          checked={allSelected ? true : someSelected ? "indeterminate" : false}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground w-[90px]">Ref #</th>
                      <th className="pb-3 font-medium text-muted-foreground">Title</th>
                      <th className="pb-3 font-medium text-muted-foreground">Vendor</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 font-medium text-muted-foreground">Priority</th>
                      <th className="pb-3 font-medium text-muted-foreground">Deleted</th>
                      <th className="pb-3 font-medium text-muted-foreground w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(t => (
                      <tr key={t.id} className={`border-b last:border-0 hover:bg-muted/50 ${selectedIds.has(t.id) ? "bg-muted/30" : ""}`}>
                        <td className="py-3 pr-2">
                          <Checkbox
                            checked={selectedIds.has(t.id)}
                            onCheckedChange={() => toggleSelect(t.id)}
                            aria-label={`Select ticket ${getShortId(t)}`}
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-block rounded-full px-2 py-0.5 text-[11px] font-mono text-muted-foreground" style={{ background: "#F1EFE8" }}>#{getShortId(t)}</span>
                        </td>
                        <td className="py-3 pr-4 font-medium">{t.title}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{getVendorName(t.vendor_id)}</td>
                        <td className="py-3 pr-4"><Badge variant="outline" className={`status-badge-${t.status} text-xs capitalize`}>{formatStatus(t.status)}</Badge></td>
                        <td className="py-3 pr-4"><Badge variant="outline" className={`priority-badge-${t.priority} text-xs`}>{t.priority}</Badge></td>
                        <td className="py-3 pr-4 text-muted-foreground text-xs">
                          {t.deleted_at ? new Date(t.deleted_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Recover ticket" onClick={() => handleRecover([t.id])}>
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                            <ConfirmDialog
                              trigger={
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Delete permanently">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              }
                              title="Permanently delete this ticket?"
                              description="This will permanently delete the ticket and all associated data. This cannot be undone."
                              confirmLabel="Delete Forever"
                              variant="destructive"
                              onConfirm={() => handlePermanentDelete([t.id])}
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

export default DeletedTickets;
