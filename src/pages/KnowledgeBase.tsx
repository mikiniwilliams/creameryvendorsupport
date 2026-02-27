import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, BookOpen, Plus, Pencil, Trash2 } from "lucide-react";

interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ["general", "billing", "technical", "account", "integrations"];

const KnowledgeBase = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KBArticle | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "general" });
  const [saving, setSaving] = useState(false);

  const fetchArticles = async () => {
    const { data } = await supabase
      .from("kb_articles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setArticles(data as KBArticle[]);
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, []);

  const filtered = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const grouped = filtered.reduce<Record<string, KBArticle[]>>((acc, article) => {
    if (!acc[article.category]) acc[article.category] = [];
    acc[article.category].push(article);
    return acc;
  }, {});

  const openCreate = () => {
    setEditingArticle(null);
    setForm({ title: "", content: "", category: "general" });
    setDialogOpen(true);
  };

  const openEdit = (article: KBArticle) => {
    setEditingArticle(article);
    setForm({ title: article.title, content: article.content, category: article.category });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Error", description: "Title and content are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editingArticle) {
      const { error } = await supabase.from("kb_articles").update(form).eq("id", editingArticle.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Article updated" });
    } else {
      const { error } = await supabase.from("kb_articles").insert(form);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Article created" });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("kb_articles").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Article deleted" });
      fetchArticles();
    }
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Knowledge Base</h1>
          </div>
          {role === "admin" && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> New Article
            </Button>
          )}
        </div>

        <p className="text-muted-foreground">
          Search our knowledge base for answers before creating a support ticket.
        </p>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search articles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">
                {search ? "No articles match your search." : "No articles yet."}
              </p>
              {search && (
                <p className="text-sm text-muted-foreground mt-2">
                  Can't find what you need?{" "}
                  <a href="/tickets/new" className="text-primary underline">Create a ticket</a>.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <Badge variant="secondary" className="capitalize text-xs mb-1">{category}</Badge>
              <Card>
                <CardContent className="p-0">
                  <Accordion type="multiple">
                    {items.map((article) => (
                      <AccordionItem key={article.id} value={article.id}>
                        <AccordionTrigger className="px-5 hover:no-underline">
                          <span className="text-left font-medium">{article.title}</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5">
                          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground/80">
                            {article.content}
                          </div>
                          <p className="text-xs text-muted-foreground mt-4">
                            Last updated: {new Date(article.updated_at).toLocaleDateString()}
                          </p>
                          {role === "admin" && (
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" variant="outline" onClick={() => openEdit(article)} className="gap-1">
                                <Pencil className="h-3 w-3" /> Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(article.id)} className="gap-1">
                                <Trash2 className="h-3 w-3" /> Delete
                              </Button>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          ))
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingArticle ? "Edit Article" : "New Article"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. How to reset your password" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write your article content…" rows={8} />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Saving…" : editingArticle ? "Update Article" : "Create Article"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default KnowledgeBase;
