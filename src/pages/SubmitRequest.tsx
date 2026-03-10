import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Ticket, CalendarIcon, CheckCircle2 } from "lucide-react";

const issueTypes = [
  "Product Issue",
  "Non-Delivery",
  "Billing Dispute",
  "Rude/Unprofessional Behavior",
  "Other",
];

const SubmitRequest = () => {
  const [submitted, setSubmitted] = useState(false);
  const [ticketRef, setTicketRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [transactionDate, setTransactionDate] = useState<Date | undefined>();
  const [vendorName, setVendorName] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [resolution, setResolution] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !vendorName.trim() || !issueType || !description.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (description.length > 1000) {
      setError("Description must be 1000 characters or less.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("submit_public_ticket", {
      _customer_name: name.trim(),
      _customer_email: email.trim(),
      _vendor_name: vendorName.trim(),
      _issue_type: issueType,
      _description: description.trim(),
      _resolution_request: resolution.trim() || null,
      _transaction_date: transactionDate ? format(transactionDate, "yyyy-MM-dd") : null,
    });

    if (rpcError) {
      setError("Something went wrong. Please try again or contact us directly.");
      setLoading(false);
      return;
    }

    const refId = typeof data === "string" ? data.slice(-6).toUpperCase() : "XXXXXX";
    setTicketRef(refId);
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-[640px] animate-fade-in">
          <CardContent className="py-16 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Your request has been submitted!</h2>
            <p className="text-muted-foreground">
              Reference #{ticketRef}
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Our admin team will review it and follow up within 1 business day.
              You do not need to create an account.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => {
              setSubmitted(false);
              setName(""); setEmail(""); setTransactionDate(undefined);
              setVendorName(""); setIssueType(""); setDescription(""); setResolution("");
            }}>
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[640px] animate-fade-in">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Ticket className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">The Creamery Vendor Support</CardTitle>
          <CardDescription className="text-sm max-w-md mx-auto">
            Had an issue with a vendor? Submit your request below and our admin team
            will follow up within 1 business day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name <span className="text-destructive">*</span></Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" maxLength={100} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Your Email Address <span className="text-destructive">*</span></Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" maxLength={255} required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor Name <span className="text-destructive">*</span></Label>
                <Input id="vendor" value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder="Type the vendor's name" maxLength={200} required />
              </div>
              <div className="space-y-2">
                <Label>Order/Transaction Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !transactionDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {transactionDate ? format(transactionDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={transactionDate}
                      onSelect={setTransactionDate}
                      disabled={date => date > new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Issue Type <span className="text-destructive">*</span></Label>
              <Select value={issueType} onValueChange={setIssueType} required>
                <SelectTrigger><SelectValue placeholder="Select issue type" /></SelectTrigger>
                <SelectContent>
                  {issueTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="description">Description of Issue <span className="text-destructive">*</span></Label>
                <span className={cn("text-xs", description.length > 1000 ? "text-destructive" : "text-muted-foreground")}>
                  {description.length}/1000
                </span>
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Please describe the issue in detail..."
                rows={3}
                maxLength={1000}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution">How would you like this resolved?</Label>
              <Textarea
                id="resolution"
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                placeholder="Optional — e.g., refund, replacement, apology..."
                rows={2}
                maxLength={500}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting…" : "Submit Support Request"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your email is used for follow-up only and is not shared publicly.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmitRequest;
