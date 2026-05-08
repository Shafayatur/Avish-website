import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react";

import usePageTitle from "@/hooks/usePageTitle";
const AdminCategories = () => {
  usePageTitle("Admin — Categories");
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data || []);
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
    if (!editing) return;
    const slug = editing.slug || generateSlug(editing.name);
    const payload = { name: editing.name, slug, description: editing.description || null, image_url: editing.image_url || null };

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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    toast({ title: "Category deleted" });
    fetchCategories();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl">Categories ({categories.length})</h3>
        <Button onClick={() => { setEditing({ name: "", slug: "", description: "", image_url: null }); setIsNew(true); }} className="rounded-xl gap-2">
          <Plus size={16} /> Add Category
        </Button>
      </div>

      {editing && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-display text-lg">{isNew ? "New Category" : "Edit Category"}</h4>
            <button onClick={() => { setEditing(null); setIsNew(false); }}><X size={20} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-body text-xs tracking-widest uppercase">Name</Label>
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
              <p className="font-body text-xs text-muted-foreground mt-1">This image will appear on the homepage category section</p>
            </div>
          </div>
          <Button onClick={handleSave} variant="hero" className="rounded-xl">Save Category</Button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="glass-card rounded-xl overflow-hidden">
            {cat.image_url && (
              <div className="h-32 overflow-hidden">
                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-display text-lg">{cat.name}</h4>
                <p className="font-body text-xs text-muted-foreground">{cat.slug}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(cat); setIsNew(false); }} className="p-2 hover:text-primary transition-colors"><Pencil size={16} /></button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 hover:text-destructive transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCategories;
