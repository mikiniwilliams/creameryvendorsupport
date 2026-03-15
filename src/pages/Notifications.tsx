import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCheck, Ticket, Trash2, BellOff } from "lucide-react";

interface Notification {
  id: string; title: string; message: string; type: string | null;
  ticket_id: string | null; is_read: boolean; created_at: string;
}

const notifTypeStyles: Record<string, { border: string; badgeClass: string; badgeLabel: string }> = {
  assignment: { border: "#378ADD", badgeClass: "bg-[#E6F1FB] text-[#185FA5]", badgeLabel: "Assignment" },
  status_change: { border: "#E8A020", badgeClass: "bg-[#FAEEDA] text-[#854F0B]", badgeLabel: "Status Change" },
  new_ticket: { border: "#E24B4A", badgeClass: "bg-[#FCEBEB] text-[#A32D2D]", badgeLabel: "New Ticket" },
  comment: { border: "#1D9E75", badgeClass: "bg-[#EAF3DE] text-[#3B6D11]", badgeLabel: "Comment" },
};

const getNotifStyle = (type: string | null) => {
  if (type && notifTypeStyles[type]) return notifTypeStyles[type];
  return { border: "transparent", badgeClass: "bg-[#F1EFE8] text-[#5F5E5A]", badgeLabel: type ? type.replace(/_/g, " ") : "General" };
};

const Notifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    if (!user) return;
    const channel = supabase.channel(`notif-page-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast({ title: "All marked as read" });
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" /> Notifications
            {unreadCount > 0 && <Badge className="ml-1">{unreadCount}</Badge>}
          </h1>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
              <CheckCheck className="h-4 w-4" /> Mark All Read
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F1EFE8] mx-auto mb-4">
                  <BellOff className="h-8 w-8 text-[#b8b0a0]" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">You're all caught up!</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Notifications will appear here when tickets are assigned to you or updated.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((n) => {
                  const style = getNotifStyle(n.type);
                  return (
                    <div key={n.id} className={`flex items-start gap-3 p-4 ${!n.is_read ? "bg-primary/5" : ""} hover:bg-muted/50 transition-colors`}
                      style={{ borderLeft: `3px solid ${style.border}` }}>
                      <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${!n.is_read ? "bg-primary" : "bg-transparent"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                          <Badge variant="outline" className={`${style.badgeClass} text-[10px] capitalize border-0`}>{style.badgeLabel}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {n.ticket_id && (
                          <Link to={`/tickets/${n.ticket_id}`}>
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="View Ticket" onClick={() => markRead(n.id)}>
                              <Ticket className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}
                        <ConfirmDialog
                          trigger={
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          }
                          title="Delete notification?"
                          description="This notification will be removed."
                          confirmLabel="Delete"
                          onConfirm={() => deleteNotification(n.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Notifications;
