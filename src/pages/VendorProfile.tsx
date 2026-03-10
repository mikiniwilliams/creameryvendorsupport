import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Ticket, CheckCircle, Clock, BarChart3 } from "lucide-react";

interface VendorData {
  id: string;
  name: string;
  status: string;
  created_at: string;
  vendor_website: string | null;
}

interface TicketRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  issue_type: string;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  email: string | null;
  full_name: string | null;
}

const VendorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [vendorRes, ticketsRes, profilesRes] = await Promise.all([
        supabase.from("vendors").select("*").eq("id", id).single(),
        supabase.from("tickets").select("id, title, status, priority, issue_type, created_at, updated_at").eq("vendor_id", id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("email, full_name").eq("vendor_id", id).limit(1),
      ]);
      if (vendorRes.data) setVendor(vendorRes.data as VendorData);
      if (ticketsRes.data) setTickets(ticketsRes.data as TicketRow[]);
      if (profilesRes.data && profilesRes.data.length > 0) setContactEmail(profilesRes.data[0].email);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const resolved = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;
    const open = tickets.filter(t => !["resolved", "closed"].includes(t.status)).length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Average response time: time from created to first update (approximation using updated_at vs created_at)
    let avgResponseHours = 0;
    const responseTimes = tickets
      .filter(t => t.updated_at !== t.created_at)
      .map(t => (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60));
    if (responseTimes.length > 0) {
      avgResponseHours = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
    }

    return { total, resolved, open, resolutionRate, avgResponseHours };
  }, [tickets]);

  const formatStatus = (s: string) => s.replace(/_/g, " ");

  if (loading) return <AppLayout><div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></AppLayout>;
  if (!vendor) return <AppLayout><div className="text-center py-20"><p className="text-muted-foreground">Vendor not found.</p></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <Link to="/vendors"><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Vendors</Button></Link>

        {/* Vendor Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{vendor.name}</h1>
                  <Badge variant="outline" className={`status-badge-${vendor.status} capitalize`}>{vendor.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                  <span>Joined {new Date(vendor.created_at).toLocaleDateString()}</span>
                  {contactEmail && <span>Contact: {contactEmail}</span>}
                  {vendor.vendor_website && <span>{vendor.vendor_website}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card><CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Ticket className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Tickets</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold">{stats.resolutionRate}%</p><p className="text-xs text-muted-foreground">Resolution Rate</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><Clock className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{stats.avgResponseHours}h</p><p className="text-xs text-muted-foreground">Avg Response</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50"><BarChart3 className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{stats.open}</p><p className="text-xs text-muted-foreground">Open Tickets</p></div>
          </CardContent></Card>
        </div>

        {/* Ticket History */}
        <Card>
          <CardHeader><CardTitle className="text-base">Ticket History ({tickets.length})</CardTitle></CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tickets for this vendor.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Title</th>
                      <th className="pb-3 font-medium text-muted-foreground">Type</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 font-medium text-muted-foreground">Priority</th>
                      <th className="pb-3 font-medium text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(t => (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 pr-4">
                          <Link to={`/tickets/${t.id}`} className="text-primary hover:underline font-medium">{t.title}</Link>
                        </td>
                        <td className="py-3 pr-4"><Badge variant="outline" className="text-xs capitalize">{t.issue_type}</Badge></td>
                        <td className="py-3 pr-4"><Badge variant="outline" className={`status-badge-${t.status} text-xs capitalize`}>{formatStatus(t.status)}</Badge></td>
                        <td className="py-3 pr-4"><Badge variant="outline" className={`priority-badge-${t.priority} text-xs capitalize`}>{t.priority}</Badge></td>
                        <td className="py-3 text-muted-foreground text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
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

export default VendorProfile;
