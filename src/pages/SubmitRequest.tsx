import { useState, useRef } from "react";
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
import { CalendarIcon, CheckCircle2, Search, CheckCircle, Lock, Clock, Ticket } from "lucide-react";
import TicketLookup from "@/components/public-form/TicketLookup";

const issueTypes = [
  "Product Issue",
  "Non-Delivery",
  "Billing Dispute",
  "Wrong Item Received",
  "Rude or Unprofessional Behavior",
  "Other",
];

// P1: Branded header component
const BrandedHeader = () => (
  <div className="w-full" style={{ background: "#18120a" }}>
    <div className="max-w-[700px] mx-auto flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8A020]">
          <Ticket className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-white text-sm font-medium">The Creamery Vendor Support</span>
      </div>
      <span className="text-[10px] text-[#6b6156]">Powered by DAY1044 Solutions</span>
    </div>
  </div>
);

const SubmitRequest = () => {
  const [view, setView] = useState<"form" | "success" | "lookup">("form");
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
  const [honeypot, setHoneypot] = useState("");
  const formLoadTime = useRef(Date.now());

  const resetForm = () => {
    setName(""); setEmail(""); setTransactionDate(undefined);
    setVendorName(""); setIssueType(""); setDescription(""); setResolution("");
    formLoadTime.current = Date.now();
    setView("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (honeypot) { setView("success"); setTicketRef("000000"); return; }
    if (Date.now() - formLoadTime.current < 3000) { setView("success"); setTicketRef("000000"); return; }

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
      if (rpcError.message?.includes("Too many submissions")) {
        setError("You've submitted too many requests recently. Please wait an hour before trying again.");
      } else if (rpcError.message?.includes("Name must be")) {
        setError("Name must be between 2 and 100 characters.");
      } else if (rpcError.message?.includes("Description must be")) {
        setError("Description must be between 10 and 2000 characters.");
      } else {
        setError("Something went wrong. Please try again or contact us directly.");
      }
      setLoading(false);
      return;
    }

    const refId = typeof data === "string" ? data.slice(-6).toUpperCase() : "XXXXXX";
    setTicketRef(refId);
    setView("success");
    setLoading(false);

    supabase.functions.invoke("send-transactional-email", {
      body: {
        customerName: name.trim(),
        customerEmail: email.trim(),
        vendorName: vendorName.trim(),
        issueType,
        description: description.trim(),
        ticketRef: refId,
      },
    }).catch(() => {});
  };

  if (view === "lookup") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#FDF8F0" }}>
        <BrandedHeader />
        <TicketLookup onBack={() => setView("form")} />
      </div>
    );
  }

  if (view === "success") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#FDF8F0" }}>
        <BrandedHeader />
        <div className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-[640px] animate-fade-in">
            <CardContent className="py-16 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Your request has been submitted!</h2>
              <p className="text-muted-foreground">Reference #{ticketRef}</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Our admin team will review your request and follow up within 1 business day.
                You do not need to create an account.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <Button variant="outline" onClick={resetForm}>Submit Another Request</Button>
                <Button variant="ghost" onClick={() => setView("lookup")}>
                  <Search className="h-4 w-4 mr-2" /> Check Request Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FDF8F0" }}>
      <BrandedHeader />
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-[640px] animate-fade-in">
          <CardHeader className="text-center space-y-3 pb-2">
            {/* P3: Text header instead of icon */}
            <p className="text-3xl">🍦</p>
            <CardTitle className="text-xl font-serif">The Creamery</CardTitle>
            <CardDescription className="text-sm max-w-md mx-auto">
              Had an issue with a vendor? Submit your request below and our admin team
              will follow up within 1 business day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* P4: Trust signals */}
            <div className="flex flex-wrap justify-center gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: "#E8F5E9", color: "#2E7D32" }}>
                <CheckCircle className="h-3 w-3" /> No account needed
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: "#E6F1FB", color: "#185FA5" }}>
                <Lock className="h-3 w-3" /> Your info is private
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: "#FAEEDA", color: "#854F0B" }}>
                <Clock className="h-3 w-3" /> Response within 1 business day
              </span>
            </div>

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
                  <p className="text-xs italic text-muted-foreground">Your email is only used for follow-up and will never be shared.</p>
                  <p className="text-xs italic text-muted-foreground">Your contact information may be shared with the vendor to help resolve your issue.</p>
                </div>
              </div>

              {/* P5: Section divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Your Complaint</span>
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
                  {/* P6: Helper text */}
                  <p className="text-xs italic text-muted-foreground">When did this purchase or transaction take place?</p>
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
                {/* P7: Resolution field with counter */}
                <div className="flex justify-between">
                  <Label htmlFor="resolution">How would you like this resolved?</Label>
                  <span className={cn("text-xs", resolution.length > 500 ? "text-destructive" : "text-muted-foreground")}>
                    {resolution.length}/500
                  </span>
                </div>
                <Textarea
                  id="resolution"
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                  placeholder="Optional — e.g., refund, replacement, apology..."
                  rows={2}
                  maxLength={500}
                />
              </div>

              {/* Honeypot */}
              <div className="absolute opacity-0 top-0 left-0 h-0 w-0 -z-10 overflow-hidden" aria-hidden="true" tabIndex={-1}>
                <label htmlFor="website_url">Website</label>
                <input type="text" id="website_url" name="website_url" value={honeypot} onChange={e => setHoneypot(e.target.value)} autoComplete="off" tabIndex={-1} />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting…" : "Submit Support Request"}
              </Button>

              <div className="text-center pt-1">
                <Button type="button" variant="link" className="text-xs text-muted-foreground" onClick={() => setView("lookup")}>
                  <Search className="h-3 w-3 mr-1" />
                  Already submitted? Check your request status
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmitRequest;
