import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, Building2, CheckCircle, XCircle } from "lucide-react";

interface Profile {
  id: string; user_id: string; full_name: string | null;
  email: string | null; vendor_id: string | null; status: string;
}
interface UserRole { id: string; user_id: string; role: "admin" | "vendor"; }
interface Vendor { id: string; name: string; }

const UserManagement = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [profilesRes, rolesRes, vendorsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("vendors").select("id, name").order("name"),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    if (rolesRes.data) setRoles(rolesRes.data as UserRole[]);
    if (vendorsRes.data) setVendors(vendorsRes.data as Vendor[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getUserRole = (userId: string) => roles.find(r => r.user_id === userId);
  const getVendorName = (vendorId: string | null) => vendors.find(v => v.id === vendorId)?.name;

  const setUserRole = async (userId: string, newRole: string) => {
    const existing = getUserRole(userId);
    if (newRole === "none") {
      if (existing) {
        const { error } = await supabase.from("user_roles").delete().eq("id", existing.id);
        if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      }
    } else if (existing) {
      const { error } = await supabase.from("user_roles").update({ role: newRole as "admin" | "vendor" }).eq("id", existing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as "admin" | "vendor" });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: "Role updated" }); fetchData();
  };

  const setUserVendor = async (userId: string, vendorId: string) => {
    const value = vendorId === "none" ? null : vendorId;
    const { error } = await supabase.from("profiles").update({ vendor_id: value }).eq("user_id", userId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Vendor updated" }); fetchData(); }
  };

  const approveUser = async (userId: string) => {
    const { error } = await supabase.rpc("approve_user", { _user_id: userId });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "User approved" }); fetchData(); }
  };

  const disableUser = async (userId: string) => {
    const { error } = await supabase.rpc("disable_user", { _user_id: userId });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "User disabled" }); fetchData(); }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> User Management</h1>

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-base">All Users ({profiles.length})</CardTitle></CardHeader>
            <CardContent>
              {profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
              ) : (
                <div className="space-y-3">
                  {profiles.map((profile) => {
                    const userRole = getUserRole(profile.user_id);
                    return (
                      <div key={profile.id} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border p-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{profile.full_name || "Unnamed"}</p>
                            <Badge variant="outline" className={`status-badge-${profile.status} text-xs capitalize`}>{profile.status}</Badge>
                            {userRole && <Badge variant="outline" className="text-xs">{userRole.role}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{profile.email || "No email"}</p>
                          {profile.vendor_id && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {getVendorName(profile.vendor_id)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Role</label>
                            <Select value={userRole?.role || "none"} onValueChange={(v) => setUserRole(profile.user_id, v)}>
                              <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No role</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="vendor">Vendor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" /> Vendor</label>
                            <Select value={profile.vendor_id || "none"} onValueChange={(v) => setUserVendor(profile.user_id, v)}>
                              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No vendor</SelectItem>
                                {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-1 pt-4">
                            {profile.status !== "active" && (
                              <Button size="sm" variant="outline" onClick={() => approveUser(profile.user_id)} className="gap-1 h-8">
                                <CheckCircle className="h-3 w-3" /> Activate
                              </Button>
                            )}
                            {profile.status !== "disabled" && (
                              <Button size="sm" variant="outline" onClick={() => disableUser(profile.user_id)} className="gap-1 h-8 text-destructive hover:text-destructive">
                                <XCircle className="h-3 w-3" /> Disable
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default UserManagement;
