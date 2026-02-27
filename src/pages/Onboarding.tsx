import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Clock, LogOut } from "lucide-react";

const Onboarding = () => {
  const { user, profile, status, role, loading, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [vendorName, setVendorName] = useState("");
  const [vendorWebsite, setVendorWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (role === "admin") return <Navigate to="/" replace />;
  if (status === "active") return <Navigate to="/" replace />;

  const hasVendor = !!profile?.vendor_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("create_vendor_request", {
      _vendor_name: vendorName.trim(),
      _vendor_website: vendorWebsite.trim() || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Vendor request submitted", description: "An admin will review your request." });
      await refreshProfile();
    }
    setSubmitting(false);
  };

  if (hasVendor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle className="text-xl mt-4">Pending Approval</CardTitle>
            <CardDescription>
              Your vendor request has been submitted and is awaiting admin approval.
              You'll be able to access the portal once approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl mt-4">Register Your Vendor</CardTitle>
          <CardDescription>
            Submit your vendor details for admin review. Once approved, you'll be able to create support tickets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor / Company Name *</Label>
              <Input id="vendorName" value={vendorName} onChange={(e) => setVendorName(e.target.value)}
                placeholder="Acme Corporation" required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorWebsite">Website (optional)</Label>
              <Input id="vendorWebsite" value={vendorWebsite} onChange={(e) => setVendorWebsite(e.target.value)}
                placeholder="https://example.com" type="url" />
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Contact email:</strong> {profile?.email || user.email}
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Vendor Request"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button type="button" onClick={signOut} className="text-sm text-muted-foreground hover:underline">
              Sign out
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
