import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Vendor {
  id: string;
  name: string;
  status: string;
}

interface AdminUser {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface TicketTemplate {
  id: string;
  name: string;
  title: string;
  description: string | null;
  priority: string;
  issue_type: string;
}

const NewTicket = () => {
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [issueType, setIssueType] = useState("general");
  const [loading, setLoading] = useState(false);

  // Admin-specific state
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorUsers, setVendorUsers] = useState<AdminUser[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAdminData = async () => {
      const [vendorsRes, templatesRes] = await Promise.all([
        supabase.from("vendors").select("id, name, status").eq("status", "active").order("name"),
        supabase.from("ticket_templates").select("id, name, title, description, priority, issue_type").order("name"),
      ]);
      setVendors(vendorsRes.data || []);
      setTemplates((templatesRes.data as TicketTemplate[]) || []);
    };
    fetchAdminData();
  }, [isAdmin]);

  const applyTemplate = (templateId: string) => {
    const t = templates.find((tpl) => tpl.id === templateId);
    if (!t) return;
    setTitle(t.title);
    setDescription(t.description || "");
    setPriority(t.priority);
    setIssueType(t.issue_type);
  };

  // Fetch users belonging to selected vendor
  useEffect(() => {
    if (!isAdmin || !selectedVendorId) {
      setVendorUsers([]);
      setAssignedTo("");
      return;
    }
    const fetchVendorUsers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .eq("vendor_id", selectedVendorId)
        .eq("status", "active");
      setVendorUsers((data as AdminUser[]) || []);
    };
    fetchVendorUsers();
  }, [isAdmin, selectedVendorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    const vendorId = isAdmin ? selectedVendorId : profile?.vendor_id;
    if (!vendorId) {
      toast({
        title: "Error",
        description: isAdmin ? "Please select a vendor." : "You must be associated with a vendor.",
        variant: "destructive",
      });
      return;
    }

    if (title.trim().length > 200) {
      toast({ title: "Error", description: "Title must be 200 characters or less.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("tickets").insert({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      issue_type: issueType,
      vendor_id: vendorId,
      created_by: user.id,
      assigned_to: isAdmin && assignedTo ? assignedTo : null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ticket created" });
      navigate(isAdmin ? "/admin/tickets" : "/");
    }
    setLoading(false);
  };

  if (!isAdmin && !profile?.vendor_id) {
    return (
      <AppLayout>
        <div>
          <h1 className="text-2xl font-bold mb-2">New Ticket</h1>
          <p className="text-muted-foreground">You must be associated with a vendor to create tickets.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Create New Ticket</h1>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief summary of the issue" required />
              </div>

              {isAdmin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vendor *</Label>
                    <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                      <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                      <SelectContent>
                        {vendors.map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign To</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo} disabled={!selectedVendorId}>
                      <SelectTrigger><SelectValue placeholder={selectedVendorId ? "Select user" : "Select vendor first"} /></SelectTrigger>
                      <SelectContent>
                        {vendorUsers.map((u) => (
                          <SelectItem key={u.user_id} value={u.user_id}>
                            {u.full_name || u.email || "Unknown"}
                          </SelectItem>
                        ))}
                        {vendorUsers.length === 0 && selectedVendorId && (
                          <SelectItem value="__none" disabled>No active users</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issue Type</Label>
                  <Select value={issueType} onValueChange={setIssueType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide details about the issue…" rows={5} />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating…" : "Create Ticket"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default NewTicket;
