import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2 } from "lucide-react";
import { Navigate } from "react-router-dom";

interface Vendor {
  id: string;
  name: string;
  created_at: string;
}

const Vendors = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  if (role !== "admin") return <Navigate to="/" replace />;

  const fetchVendors = async () => {
    const { data } = await supabase.from("vendors").select("*").order("name");
    if (data) setVendors(data as Vendor[]);
    setLoading(false);
  };

  useEffect(() => { fetchVendors(); }, []);

  const addVendor = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("vendors").insert({ name: newName.trim() });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewName("");
      fetchVendors();
      toast({ title: "Vendor added" });
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
        <h1 className="text-2xl font-bold">Manage Vendors</h1>

        <Card>
          <CardContent className="flex gap-3 p-4">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Vendor name" onKeyDown={(e) => e.key === "Enter" && addVendor()} />
            <Button onClick={addVendor} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">All Vendors</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
            ) : vendors.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">No vendors yet.</p>
            ) : (
              <div className="space-y-2">
                {vendors.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 rounded-lg border p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{v.name}</p>
                      <p className="text-xs text-muted-foreground">Added {new Date(v.created_at).toLocaleDateString()}</p>
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
