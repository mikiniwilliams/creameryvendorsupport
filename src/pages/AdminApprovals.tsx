import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Building2, Users, Globe } from "lucide-react";

interface PendingVendor {
  id: string;
  name: string;
  vendor_website: string | null;
  status: string;
  created_at: string;
  created_by_user_id: string | null;
}

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  status: string;
  vendor_id: string | null;
}

const AdminApprovals = () => {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<PendingVendor[]>([]);
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [vendorsRes, usersRes] = await Promise.all([
      supabase.from("vendors").select("*").eq("status", "pending").order("created_at"),
      supabase.from("profiles").select("*").eq("status", "pending").order("created_at"),
    ]);
    if (vendorsRes.data) setVendors(vendorsRes.data as PendingVendor[]);
    if (usersRes.data) setUsers(usersRes.data as PendingUser[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const approveVendor = async (vendorId: string) => {
    const { error } = await supabase.rpc("approve_vendor", { _vendor_id: vendorId });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Vendor approved" }); fetchData(); }
  };

  const disableVendor = async (vendorId: string) => {
    const { error } = await supabase.rpc("disable_vendor", { _vendor_id: vendorId });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Vendor disabled" }); fetchData(); }
  };

  const approveUser = async (userId: string) => {
    const { error } = await supabase.rpc("approve_user", { _user_id: userId });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "User approved" }); fetchData(); }
  };

  const disableUser = async (userId: string) => {
    const { error } = await supabase.rpc("disable_user", { _user_id: userId });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "User disabled" }); fetchData(); }
  };

  if (loading) {
    return <AppLayout><div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-2xl font-bold">Approvals Queue</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Pending Vendors ({vendors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No pending vendor requests.</p>
            ) : (
              <div className="space-y-3">
                {vendors.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium text-sm">{v.name}</p>
                      {v.vendor_website && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Globe className="h-3 w-3" /> {v.vendor_website}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">Submitted {new Date(v.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveVendor(v.id)} className="gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => disableVendor(v.id)} className="gap-1 text-destructive hover:text-destructive">
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Pending Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No pending users.</p>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium text-sm">{u.full_name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveUser(u.user_id)} className="gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => disableUser(u.user_id)} className="gap-1 text-destructive hover:text-destructive">
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminApprovals;
