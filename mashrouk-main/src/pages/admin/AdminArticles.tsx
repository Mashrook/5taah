import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/ui/ImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Newspaper } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  category: string;
  author: string | null;
  is_published: boolean;
  published_at: string | null;
  sort_order: number;
  created_at: string;
}

const defaultForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  image_url: "",
  category: "عام",
  author: "فريق التحرير",
  is_published: false,
  sort_order: 0,
};

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [form, setForm] = useState(defaultForm);
  const { toast } = useToast();

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (a: Article) => {
    setEditing(a);
    setForm({
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt || "",
      content: a.content || "",
      image_url: a.image_url || "",
      category: a.category,
      author: a.author || "",
      is_published: a.is_published,
      sort_order: a.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      published_at: form.is_published ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase.from("articles").update(payload).eq("id", editing.id);
      if (error) return toast({ title: "خطأ", description: error.message, variant: "destructive" });
      toast({ title: "تم التحديث" });
    } else {
      const { error } = await supabase.from("articles").insert(payload);
      if (error) return toast({ title: "خطأ", description: error.message, variant: "destructive" });
      toast({ title: "تمت الإضافة" });
    }
    setDialogOpen(false);
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المقال؟")) return;
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) return toast({ title: "خطأ", description: error.message, variant: "destructive" });
    toast({ title: "تم الحذف" });
    fetchArticles();
  };

  const filtered = articles.filter((a) =>
    a.title.includes(search) || a.category.includes(search)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">إدارة المقالات</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 ml-2" /> إضافة مقال</Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالعنوان أو التصنيف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p>لا توجد مقالات بعد. أضف مقالك الأول!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {a.image_url && (
                  <img src={a.image_url} alt={a.title} className="w-16 h-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{a.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{a.category}</span>
                    <span>{a.author}</span>
                    <span className={a.is_published ? "text-green-500" : "text-yellow-500"}>
                      {a.is_published ? "منشور" : "مسودة"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل المقال" : "إضافة مقال جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">العنوان</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الرابط (slug)</label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">المقتطف</label>
              <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">المحتوى</label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} />
            </div>
            <ImageUpload
              label="صورة المقال"
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
              folder="articles"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">التصنيف</label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الكاتب</label>
                <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <label className="text-sm">منشور</label>
            </div>
            <Button onClick={handleSave} className="w-full">{editing ? "حفظ التعديلات" : "إضافة المقال"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
