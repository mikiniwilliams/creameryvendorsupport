import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, UserCheck } from "lucide-react";

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  vendor_id: string;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => { fetchData(); }, [id]);

  const updateTicket = async (field: string, value: string) => {
    if (!id) return;
    const { error } = await supabase.from("tickets").update({ [field]: value }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setTicket((prev) => prev ? { ...prev, [field]: value } : prev);
      toast({ title: "Ticket updated" });
    }
  };

  const addComment = async () => {
    if (!id || !user || !newComment.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      ticket_id: id,
      user_id: user.id,
      content: newComment.trim(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewComment("");
      fetchData();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      </AppLayout>
    );
  }

  if (!ticket) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Ticket not found.</p>
          <Button variant="ghost" onClick={() => navigate("/")} className="mt-4">Go back</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl">{ticket.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Created {new Date(ticket.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className={`ticket-status-${ticket.status}`}>{ticket.status.replace("_", " ")}</Badge>
                <Badge variant="outline" className={`priority-${ticket.priority}`}>{ticket.priority}</Badge>
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

            {/* Admin controls */}
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Comments ({comments.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg border p-4">
                <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(c.created_at).toLocaleString()}</p>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment…"
                rows={2}
                className="flex-1"
              />
              <Button onClick={addComment} disabled={submitting || !newComment.trim()} size="icon" className="shrink-0 self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TicketDetail;
