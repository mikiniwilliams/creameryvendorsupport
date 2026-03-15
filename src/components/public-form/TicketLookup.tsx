import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TicketResult {
  id: string;
  title: string;
  status: string;
  priority: string;
  issue_type: string;
  vendor_name: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Open", variant: "default" },
  in_progress: { label: "In Progress", variant: "secondary" },
  pending_vendor: { label: "Pending Vendor Response", variant: "outline" },
  resolved: { label: "Resolved", variant: "default" },
  closed: { label: "Closed", variant: "secondary" },
};

const TicketLookup = ({ onBack }: { onBack: () => void }) => {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TicketResult | null>(null);
  const [searched, setSearched] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!reference.trim() || !email.trim()) {
      setError("Please enter both your reference number and email address.");
      return;
    }

    const cleaned = reference.trim().replace("#", "");
    if (cleaned.length < 4) {
      setError("Please enter a valid reference number (at least 4 characters).");
      return;
    }

    setLoading(true);
    setSearched(true);

    const { data, error: rpcError } = await supabase.rpc("lookup_public_ticket", {
      _reference: cleaned,
      _customer_email: email.trim(),
    });

    if (rpcError) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setResult(data as unknown as TicketResult | null);
    setLoading(false);
  };

  const statusInfo = result ? statusConfig[result.status] || { label: result.status, variant: "outline" as const } : null;

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-[640px] animate-fade-in">
        <CardHeader className="text-center space-y-3 pb-2">
          {/* P3: Text header */}
          <p className="text-3xl">🍦</p>
          <CardTitle className="text-xl font-serif">Check Request Status</CardTitle>
          <CardDescription className="text-sm max-w-md mx-auto">
            Enter your reference number and the email you used when submitting your request.
          </CardDescription>
          {/* P8: Reassurance text */}
          <p className="text-xs text-muted-foreground">You'll see your current ticket status and any updates from our team.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ref">Reference Number <span className="text-destructive">*</span></Label>
              <Input
                id="ref"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="e.g. 7B3C75"
                maxLength={10}
                required
              />
              {/* P8: Helper text */}
              <p className="text-xs italic text-muted-foreground">Your 6-character reference number was shown on your confirmation screen.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lookup-email">Email Address <span className="text-destructive">*</span></Label>
              <Input
                id="lookup-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="The email you used when submitting"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Looking up…" : "Look Up Request"}
            </Button>
          </form>

          {/* P8: Inline error for not found */}
          {searched && !loading && !result && !error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center space-y-1">
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
              <p className="text-sm font-medium text-red-700">We couldn't find a request matching that reference number and email.</p>
              <p className="text-xs text-red-500">
                Please double-check your reference number from your confirmation screen.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {result && statusInfo && (
            <div className="rounded-md border border-border bg-muted/30 p-5 space-y-4 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">
                    Reference #{reference.trim().replace("#", "").toUpperCase()}
                  </p>
                  <h3 className="font-semibold text-base truncate">{result.title}</h3>
                </div>
                <Badge
                  variant={statusInfo.variant}
                  className={cn(
                    "shrink-0",
                    result.status === "open" && "bg-blue-500/15 text-blue-700 border-blue-200",
                    result.status === "in_progress" && "bg-amber-500/15 text-amber-700 border-amber-200",
                    result.status === "pending_vendor" && "bg-purple-500/15 text-purple-700 border-purple-200",
                    result.status === "resolved" && "bg-green-500/15 text-green-700 border-green-200",
                    result.status === "closed" && "bg-gray-500/15 text-gray-700 border-gray-200",
                  )}
                >
                  {statusInfo.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {result.vendor_name && (
                  <div>
                    <p className="text-xs text-muted-foreground">Vendor</p>
                    <p className="font-medium">{result.vendor_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Issue Type</p>
                  <p className="font-medium capitalize">{result.issue_type.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="font-medium">{format(new Date(result.created_at), "MMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(result.updated_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button variant="ghost" className="w-full text-muted-foreground" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submit a Request
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketLookup;
