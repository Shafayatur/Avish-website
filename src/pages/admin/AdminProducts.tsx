import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  image_url: string | null;
  images: string[] | null;
  video_url: string | null;
  stock: number;
  is_featured: boolean;
  is_best_seller: boolean;
  is_active: boolean;
}

const emptyProduct = {
  name: "", slug: "", description: "", price: 0, compare_at_price: null as number | null,
  category_id: null as string | null, image_url: null as string | null,
  images: [] as string[], video_url: null as string | null, stock: 0,
  is_featured: false, is_best_seller: false, is_active: true, is_show_stopper: false,
};

import usePageTitle from "@/hooks/usePageTitle";
const AdminProducts = () => {
  usePageTitle("Admin — Products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<Product | typeof emptyProduct | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name");
    setCategories(data || []);
  };

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isAdditional = false) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
      if (isAdditional) {
        setEditing({ ...editing, images: [...(editing.images || []), publicUrl] });
      } else {
        setEditing({ ...editing, image_url: publicUrl });
      }
    }
    setUploading(false);
  };

  const removeAdditionalImage = (index: number) => {
    if (!editing) return;
    const imgs = [...(editing.images || [])];
    imgs.splice(index, 1);
    setEditing({ ...editing, images: imgs });
  };

  const handleSave = async () => {
    if (!editing) return;
    const slug = editing.slug || generateSlug(editing.name);
    const payload = { ...editing, slug } as any;
    delete payload.id;

    if (isNew) {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Product created!" });
    } else {
      const { error } = await supabase.from("products").update(payload).eq("id", (editing as Product).id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Product updated!" });
    }
    setEditing(null);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast({ title: "Product deleted" });
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl">Products ({products.length})</h3>
        <Button onClick={() => { setEditing({ ...emptyProduct }); setIsNew(true); }} className="rounded-xl gap-2">
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {editing && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-display text-lg">{isNew ? "New Product" : "Edit Product"}</h4>
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
            <div>
              <Label className="font-body text-xs tracking-widest uppercase">Price (৳)</Label>
              <Input type="number" step="0.01" value={editing.price} onChange={e => setEditing({ ...editing, price: Number(e.target.value) })} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="font-body text-xs tracking-widest uppercase">Compare at Price (৳)</Label>
              <Input type="number" step="0.01" value={editing.compare_at_price || ""} onChange={e => setEditing({ ...editing, compare_at_price: e.target.value ? Number(e.target.value) : null })} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="font-body text-xs tracking-widest uppercase">Stock</Label>
              <Input type="number" value={editing.stock} onChange={e => setEditing({ ...editing, stock: Number(e.target.value) })} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="font-body text-xs tracking-widest uppercase">Category</Label>
              <select value={editing.category_id || ""} onChange={e => setEditing({ ...editing, category_id: e.target.value || null })} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                <option value="">No Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label className="font-body text-xs tracking-widest uppercase">Description</Label>
              <Textarea value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} className="mt-1 rounded-xl" rows={3} />
            </div>

            {/* Main Image */}
            <div className="sm:col-span-2">
              <Label className="font-body text-xs tracking-widest uppercase">Main Image</Label>
              <div className="mt-1 flex items-center gap-4">
                {editing.image_url && <img src={editing.image_url} alt="" className="w-20 h-20 object-contain rounded-lg bg-cream" />}
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border hover:border-primary transition-colors">
                  <Upload size={16} />
                  <span className="font-body text-sm">{uploading ? "Uploading..." : "Upload Main Image"}</span>
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, false)} className="hidden" />
                </label>
              </div>
            </div>

            {/* Additional Images */}
            <div className="sm:col-span-2">
              <Label className="font-body text-xs tracking-widest uppercase">Additional Images (Gallery — up to 5)</Label>
              <div className="mt-1 flex flex-wrap gap-3 items-center">
                {(editing.images || []).map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt="" className="w-20 h-20 object-contain rounded-lg bg-cream" />
                    <button onClick={() => removeAdditionalImage(i)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {(editing.images || []).length < 5 && (
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border hover:border-primary transition-colors">
                    <Plus size={16} />
                    <span className="font-body text-sm">Add Image ({(editing.images || []).length}/5)</span>
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, true)} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Video/GIF URL */}
            <div className="sm:col-span-2">
              <Label className="font-body text-xs tracking-widest uppercase">Video / GIF URL (optional)</Label>
              <Input value={editing.video_url || ""} onChange={e => setEditing({ ...editing, video_url: e.target.value || null })} placeholder="https://... .mp4 / .gif" className="mt-1 rounded-xl" />
              <p className="font-body text-xs text-muted-foreground mt-1">Paste a URL to an .mp4 video or .gif for a product preview</p>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 font-body text-sm">
                <input type="checkbox" checked={editing.is_featured} onChange={e => setEditing({ ...editing, is_featured: e.target.checked })} />
                Featured
              </label>
              <label className="flex items-center gap-2 font-body text-sm">
                <input type="checkbox" checked={editing.is_best_seller} onChange={e => setEditing({ ...editing, is_best_seller: e.target.checked })} />
                Best Seller
              </label>
              <label className="flex items-center gap-2 font-body text-sm">
                <input type="checkbox" checked={(editing as any).is_show_stopper || false} onChange={e => setEditing({ ...editing, is_show_stopper: e.target.checked } as any)} />
                Show Stopper ⭐
              </label>
              <label className="flex items-center gap-2 font-body text-sm">
                <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
                Active
              </label>
            </div>
          </div>
          <Button onClick={handleSave} variant="hero" className="rounded-xl">Save Product</Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3">Image</th>
              <th className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3">Name</th>
              <th className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3">Price</th>
              <th className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3">Stock</th>
              <th className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3">Flags</th>
              <th className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3">Status</th>
              <th className="text-right font-body text-xs tracking-widest uppercase text-muted-foreground py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="py-3">
                  <div className="w-12 h-12 rounded-lg bg-cream flex items-center justify-center overflow-hidden">
                    {product.image_url ? <img src={product.image_url} alt="" className="max-h-full object-contain" /> : <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                </td>
                <td className="py-3 font-body text-sm">{product.name}</td>
                <td className="py-3 font-body text-sm">৳{Number(product.price).toFixed(2)}</td>
                <td className="py-3 font-body text-sm">{product.stock}</td>
                <td className="py-3">
                  <div className="flex gap-1">
                    {product.is_featured && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-body text-[10px]">Featured</span>}
                    {product.is_best_seller && <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-body text-[10px]">Best Seller</span>}
                  </div>
                </td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full font-body text-xs ${product.is_active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setEditing(product); setIsNew(false); }} className="p-2 hover:text-primary transition-colors"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 hover:text-destructive transition-colors"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;
