import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Globe, CheckCircle, XCircle, Eye } from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  vendor_website: string | null;
  status: string;
  created_at: string;
}

const Vendors = () => {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = async () => {
    const { data } = await supabase.from("vendors").select("*").order("name");
    if (data) setVendors(data as Vendor[]);
    setLoading(false);
  };

  useEffect(() => { fetchVendors(); }, []);

  const approveVendor = async (id: string) => {
    const { error } = await supabase.rpc("approve_vendor", { _vendor_id: id });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Vendor approved" }); fetchVendors(); }
  };

  const disableVendor = async (id: string) => {
    const { error } = await supabase.rpc("disable_vendor", { _vendor_id: id });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Vendor disabled" }); fetchVendors(); }
  };

  const getStatusClass = (status: string) => `status-badge-${status}`;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6" /> Vendor Management</h1>

        <Card>
          <CardHeader><CardTitle className="text-base">All Vendors ({vendors.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
            ) : vendors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No vendors yet.</p>
            ) : (
              <div className="space-y-3">
                {vendors.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{v.name}</p>
                          <Badge variant="outline" className={`${getStatusClass(v.status)} text-xs capitalize`}>{v.status}</Badge>
                        </div>
                        {v.vendor_website && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> {v.vendor_website}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Added {new Date(v.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/vendors/${v.id}`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Eye className="h-3.5 w-3.5" /> View Profile
                        </Button>
                      </Link>
                      {v.status !== "active" && (
                        <Button size="sm" variant="outline" onClick={() => approveVendor(v.id)} className="gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Activate
                        </Button>
                      )}
                      {v.status !== "disabled" && (
                        <Button size="sm" variant="outline" onClick={() => disableVendor(v.id)} className="gap-1 text-destructive hover:text-destructive">
                          <XCircle className="h-3.5 w-3.5" /> Disable
                        </Button>
                      )}
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

export default Vendors;
