import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, Upload, Eye, EyeOff, Package } from "lucide-react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import usePageTitle from "@/hooks/usePageTitle";

const AdminCategories = () => {
  usePageTitle("Admin — Categories");
  const [categories, setCategories] = useState<any[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: "" });
  const { toast } = useToast();

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data || []);

    // Fetch product counts per category
    const { data: products } = await supabase.from("products").select("category_id").eq("is_active", true);
    const counts: Record<string, number> = {};
    (products || []).forEach((p: any) => {
      if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    });
    setProductCounts(counts);
  };

  useEffect(() => { fetchCategories(); }, []);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `categories/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
      setEditing({ ...editing, image_url: publicUrl });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!editing || !editing.name) { toast({ title: "Name is required", variant: "destructive" }); return; }
    const slug = editing.slug || generateSlug(editing.name);
    const payload = {
      name: editing.name,
      slug,
      description: editing.description || null,
      image_url: editing.image_url || null,
      is_visible: editing.is_visible ?? true,
    };

    if (isNew) {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Category created!" });
    } else {
      const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Category updated!" });
    }
    setEditing(null);
    setIsNew(false);
    fetchCategories();
  };

  const handleDelete = async () => {
    await supabase.from("categories").delete().eq("id", deleteModal.id);
    toast({ title: "Category deleted" });
    setDeleteModal({ open: false, id: "" });
    fetchCategories();
  };

  const toggleVisibility = async (cat: any) => {
    await supabase.from("categories").update({ is_visible: !cat.is_visible }).eq("id", cat.id);
    toast({ title: `Category ${!cat.is_visible ? "shown" : "hidden"}` });
    fetchCategories();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl">Categories</h3>
          <p className="font-body text-xs text-muted-foreground mt-1">{categories.length} categories</p>
        </div>
        <Button onClick={() => { setEditing({ name: "", slug: "", description: "", image_url: null, is_visible: true }); setIsNew(true); }} className="rounded-xl gap-2">
          <Plus size={16} /> Add Category
        </Button>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-display text-lg">{isNew ? "New Category" : "Edit Category"}</h4>
            <button onClick={() => { setEditing(null); setIsNew(false); }}><X size={20} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-body text-xs tracking-widest uppercase">Name *</Label>
              <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value, slug: generateSlug(e.target.value) })} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="font-body text-xs tracking-widest uppercase">Slug</Label>
              <Input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} className="mt-1 rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <Label className="font-body text-xs tracking-widest uppercase">Description</Label>
              <Input value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} className="mt-1 rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <Label className="font-body text-xs tracking-widest uppercase">Category Image</Label>
              <div className="mt-1 flex items-center gap-4">
                {editing.image_url && <img src={editing.image_url} alt="" className="w-24 h-24 object-cover rounded-xl" />}
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border hover:border-primary transition-colors">
                  <Upload size={16} />
                  <span className="font-body text-sm">{uploading ? "Uploading..." : "Upload Image"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <p className="font-body text-xs text-muted-foreground mt-1">Appears on homepage category section</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={editing.is_visible ?? true} onChange={e => setEditing({ ...editing, is_visible: e.target.checked })} />
              <Label className="font-body text-sm">Visible on website</Label>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl" onClick={() => { setEditing(null); setIsNew(false); }}>Cancel</Button>
            <Button onClick={handleSave} variant="hero" className="rounded-xl">Save Category</Button>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className={`glass-card rounded-xl overflow-hidden ${cat.is_visible === false ? "opacity-60" : ""}`}>
            {cat.image_url ? (
              <div className="h-32 overflow-hidden relative">
                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-2 left-3">
                  <span className="flex items-center gap-1 font-body text-xs text-white/80">
                    <Package size={11} />
                    {productCounts[cat.id] || 0} products
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-20 bg-muted flex items-center justify-center">
                <span className="flex items-center gap-1 font-body text-xs text-muted-foreground">
                  <Package size={14} />
                  {productCounts[cat.id] || 0} products
                </span>
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-lg line-clamp-1">{cat.name}</h4>
                  <p className="font-body text-xs text-muted-foreground">{cat.slug}</p>
                  {cat.description && <p className="font-body text-xs text-muted-foreground mt-1 line-clamp-1">{cat.description}</p>}
                </div>
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  <button
                    onClick={() => toggleVisibility(cat)}
                    className={`p-2 transition-colors ${cat.is_visible === false ? "text-muted-foreground hover:text-primary" : "text-primary hover:text-muted-foreground"}`}
                    title={cat.is_visible === false ? "Show" : "Hide"}
                  >
                    {cat.is_visible === false ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => { setEditing(cat); setIsNew(false); }} className="p-2 hover:text-primary transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleteModal({ open: true, id: cat.id })} className="p-2 hover:text-destructive transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full font-body text-[10px] ${cat.is_visible === false ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                  {cat.is_visible === false ? "Hidden" : "Visible"}
                </span>
                {!cat.image_url && (
                  <span className="font-body text-[10px] text-muted-foreground">No image</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={deleteModal.open}
        title="Delete Category?"
        message="This category will be permanently deleted. Products in this category will become uncategorized."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, id: "" })}
      />
    </div>
  );
};

export default AdminCategories;
