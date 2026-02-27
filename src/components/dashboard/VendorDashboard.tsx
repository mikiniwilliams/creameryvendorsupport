import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketIcon, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

const VendorDashboard = () => {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!profile?.vendor_id) { setLoading(false); return; }
      const { data } = await supabase
        .from("tickets")
        .select("*")
        .eq("vendor_id", profile.vendor_id)
        .order("created_at", { ascending: false });
      if (data) setTickets(data as Ticket[]);
      setLoading(false);
    };
    fetchTickets();
  }, [profile]);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved" || t.status === "closed").length,
  };

  if (!profile?.vendor_id) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold mb-2">Vendor Dashboard</h1>
        <p className="text-muted-foreground">You are not associated with a vendor. Contact an admin.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <h1 className="text-2xl font-bold">Your Tickets</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<TicketIcon className="h-5 w-5 text-primary" />} label="Total" value={stats.total} />
        <StatCard icon={<Clock className="h-5 w-5 text-accent" />} label="Open" value={stats.open} />
        <StatCard icon={<AlertTriangle className="h-5 w-5 text-warning" />} label="In Progress" value={stats.inProgress} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-success" />} label="Resolved" value={stats.resolved} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Tickets</CardTitle></CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">No tickets yet.</p>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(ticket.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="outline" className={`ticket-status-${ticket.status}`}>{ticket.status.replace("_", " ")}</Badge>
                      <Badge variant="outline" className={`priority-${ticket.priority}`}>{ticket.priority}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <Card>
    <CardContent className="flex items-center gap-4 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default VendorDashboard;
