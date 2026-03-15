import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { User, Building2, Mail } from "lucide-react";

const VendorProfilePage = () => {
  const { profile } = useAuth();
  const [vendorName, setVendorName] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.vendor_id) return;
    supabase.from("vendors").select("name").eq("id", profile.vendor_id).single()
      .then(({ data }) => { if (data) setVendorName(data.name); });
  }, [profile?.vendor_id]);

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-lg space-y-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8A020]/15 text-[#E8A020]">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">{profile?.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground">Display Name</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#378ADD]/10 text-[#378ADD]">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{profile?.email || "—"}</p>
                <p className="text-xs text-muted-foreground">Email Address</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1D9E75]/10 text-[#1D9E75]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{vendorName || "—"}</p>
                <p className="text-xs text-muted-foreground">Shop / Vendor</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default VendorProfilePage;
