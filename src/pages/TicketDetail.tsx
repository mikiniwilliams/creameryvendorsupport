import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, UserCheck, History, Pencil, Trash2, Check, X } from "lucide-react";
import ActivityTimeline from "@/components/ActivityTimeline";
import { Label } from "@/components/ui/label";

interface Ticket {
  id: string; title: string; description: string | null; status: string;
  priority: string; issue_type: string; vendor_id: string; created_by: string;
  assigned_to: string | null; created_at: string; updated_at: string;
}
interface Comment { id: string; content: string; user_id: string; created_at: string; }
interface ProfileUser { user_id: string; full_name: string | null; email: string | null; }
interface Vendor { id: string; name: string; }

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [vendorUsers, setVendorUsers] = useState<ProfileUser[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const fetchData = async () => {
    if (!id) return;
    const [ticketRes, commentsRes] = await Promise.all([
      supabase.from("tickets").select("*").eq("id", id).single(),
      supabase.from("comments").select("*").eq("ticket_id", id).order("created_at", { ascending: true }),
    ]);
    if (ticketRes.data) setTicket(ticketRes.data as Ticket);
    if (commentsRes.data) setComments(commentsRes.data as Comment[]);
    setLoading(false);
  };

  const fetchAdminUsers = async () => {
    const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    if (adminRoles && adminRoles.length > 0) {
      const ids = adminRoles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", ids);
      if (profiles) setAdminUsers(profiles as AdminUser[]);
    }
  };

  useEffect(() => {
    fetchData();
    if (!id) return;
    const channel = supabase.channel(`ticket-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `id=eq.${id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `ticket_id=eq.${id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => { if (role === "admin") fetchAdminUsers(); }, [role]);

  const updateTicket = async (field: string, value: string | null) => {
    if (!id) return;
    const { error } = await supabase.from("tickets").update({ [field]: value }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setTicket(prev => prev ? { ...prev, [field]: value } : prev); toast({ title: "Ticket updated" }); }
  };

  const addComment = async () => {
    if (!id || !user || !newComment.trim()) return;
    if (newComment.trim().length > 5000) { toast({ title: "Error", description: "Comment too long.", variant: "destructive" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({ ticket_id: id, user_id: user.id, content: newComment.trim() });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setNewComment(""); fetchData(); }
    setSubmitting(false);
  };

  const updateComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    const { error } = await supabase.from("comments").update({ content: editContent.trim() }).eq("id", commentId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setEditingId(null); setEditContent(""); fetchData(); }
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchData();
  };

  if (loading) return <AppLayout><div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></AppLayout>;
  if (!ticket) return <AppLayout><div className="text-center py-20"><p className="text-muted-foreground">Ticket not found.</p><Button variant="ghost" onClick={() => navigate("/")} className="mt-4">Go back</Button></div></AppLayout>;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl">{ticket.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Created {new Date(ticket.created_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`status-badge-${ticket.status}`}>{ticket.status.replace("_", " ")}</Badge>
                <Badge variant="outline" className={`priority-badge-${ticket.priority}`}>{ticket.priority}</Badge>
                <Badge variant="outline" className="capitalize">{ticket.issue_type}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {ticket.description && (
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
              </div>
            )}

            {role === "admin" && (
              <div className="flex flex-wrap gap-4 border-t pt-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <Select value={ticket.status} onValueChange={(v) => updateTicket("status", v)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <Select value={ticket.priority} onValueChange={(v) => updateTicket("priority", v)}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><UserCheck className="h-3 w-3" /> Assign To</label>
                  <Select value={ticket.assigned_to || "unassigned"} onValueChange={(v) => updateTicket("assigned_to", v === "unassigned" ? null : v)}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {adminUsers.map((a) => <SelectItem key={a.user_id} value={a.user_id}>{a.full_name || a.email || "Admin"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><History className="h-4 w-4" /> Activity</CardTitle></CardHeader>
          <CardContent><ActivityTimeline ticketId={ticket.id} key={comments.length} /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Comments ({comments.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
            {comments.map((c) => {
              const isOwn = c.user_id === user?.id;
              const canDelete = isOwn || role === "admin";
              return (
                <div key={c.id} className="rounded-lg border p-4 group">
                  {editingId === c.id ? (
                    <div className="space-y-2">
                      <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={2} className="text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateComment(c.id)} disabled={!editContent.trim()} className="gap-1"><Check className="h-3 w-3" /> Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditContent(""); }} className="gap-1"><X className="h-3 w-3" /> Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm whitespace-pre-wrap flex-1">{c.content}</p>
                        {(isOwn || canDelete) && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {isOwn && (
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(c.id); setEditContent(c.content); }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                            {canDelete && (
                              <ConfirmDialog
                                trigger={
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                }
                                title="Delete comment?"
                                description="This comment will be permanently removed."
                                confirmLabel="Delete"
                                onConfirm={() => deleteComment(c.id)}
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(c.created_at).toLocaleString()}</p>
                    </>
                  )}
                </div>
              );
            })}
            <div className="flex gap-2 pt-2">
              <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment…" rows={2} className="flex-1" />
              <Button onClick={addComment} disabled={submitting || !newComment.trim()} size="icon" className="shrink-0 self-end"><Send className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TicketDetail;
