import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, Upload, Search, ChevronLeft, ChevronRight, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import usePageTitle from "@/hooks/usePageTitle";

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
  is_show_stopper?: boolean;
}

const emptyProduct = {
  name: "", slug: "", description: "", price: 0, compare_at_price: null as number | null,
  category_id: null as string | null, image_url: null as string | null,
  images: [] as string[], video_url: null as string | null, stock: 0,
  is_featured: false, is_best_seller: false, is_active: true, is_show_stopper: false,
};

const PAGE_SIZE = 10;

const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Confirm Modal
const ConfirmModal = ({ open, onConfirm, onCancel, productName }: { open: boolean; onConfirm: () => void; onCancel: () => void; productName: string }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card rounded-2xl p-8 max-w-sm w-full text-center"
        >
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={24} className="text-destructive" />
          </div>
          <h3 className="font-display text-xl mb-2">Delete Product?</h3>
          <p className="font-body text-sm text-muted-foreground mb-6">
            <span className="text-foreground font-medium">"{productName}"</span> will be permanently deleted. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onCancel}>Cancel</Button>
            <Button variant="destructive" className="flex-1 rounded-xl" onClick={onConfirm}>Delete</Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const AdminProducts = () => {
  usePageTitle("Admin — Products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<Product | typeof emptyProduct | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });
  const panelRef = useRef<HTMLDivElement>(null);
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

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setEditing(null);
        setIsNew(false);
      }
    };
    if (editing) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [editing]);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isAdditional = false) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `products/${Date.now()}.${ext}`;
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
      toast({ title: "Image uploaded!" });
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
    if (!editing || !editing.name) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
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
    setIsNew(false);
    fetchProducts();
  };

  const handleDelete = async () => {
    await supabase.from("products").delete().eq("id", deleteModal.id);
    toast({ title: "Product deleted" });
    setDeleteModal({ open: false, id: "", name: "" });
    fetchProducts();
  };

  const handleToggleActive = async (product: Product) => {
    await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id);
    toast({ title: `Product ${!product.is_active ? "activated" : "deactivated"}` });
    fetchProducts();
  };

  // Filtering
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || p.category_id === categoryFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? p.is_active : !p.is_active);
    return matchSearch && matchCat && matchStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stockBadge = (stock: number) => {
    if (stock === 0) return <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-body text-[10px]">Out of stock</span>;
    if (stock < 5) return <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-body text-[10px]">{stock} left</span>;
    if (stock < 10) return <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-body text-[10px]">{stock} left</span>;
    return <span className="font-body text-sm">{stock}</span>;
  };

  const exportCSV = () => {
    const rows = [
      ["Name", "Price", "Stock", "Category", "Featured", "Best Seller", "Status"],
      ...filtered.map(p => [
        p.name,
        p.price,
        p.stock,
        categories.find(c => c.id === p.category_id)?.name || "",
        p.is_featured ? "Yes" : "No",
        p.is_best_seller ? "Yes" : "No",
        p.is_active ? "Active" : "Inactive",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "avish-products.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl">Products</h3>
          <p className="font-body text-xs text-muted-foreground mt-1">{filtered.length} of {products.length} products</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </Button>
          <Button onClick={() => { setEditing({ ...emptyProduct }); setIsNew(true); }} className="rounded-xl gap-2">
            <Plus size={16} /> Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="pl-9 rounded-xl"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm font-body"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className="rounded-full font-body text-xs capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              {["Image", "Name", "Price", "Stock", "Category", "Flags", "Status", "Actions"].map(h => (
                <th key={h} className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3 px-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center font-body text-sm text-muted-foreground">
                  No products found
                </td>
              </tr>
            ) : paginated.map(product => (
              <tr key={product.id} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    {product.image_url
                      ? <img src={product.image_url} alt="" className="max-h-full object-contain" />
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </div>
                </td>
                <td className="py-3 px-4">
                  <p className="font-body text-sm font-medium line-clamp-1">{product.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{product.slug}</p>
                </td>
                <td className="py-3 px-4">
                  <p className="font-display text-sm text-primary">Tk {Number(product.price).toFixed(0)}</p>
                  {product.compare_at_price && (
                    <p className="font-body text-xs text-muted-foreground line-through">Tk {Number(product.compare_at_price).toFixed(0)}</p>
                  )}
                </td>
                <td className="py-3 px-4">{stockBadge(product.stock)}</td>
                <td className="py-3 px-4 font-body text-xs text-muted-foreground">
                  {categories.find(c => c.id === product.category_id)?.name || "—"}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {product.is_featured && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-body text-[10px]">Featured</span>}
                    {product.is_best_seller && <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-body text-[10px]">Best Seller</span>}
                    {(product as any).is_show_stopper && <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-body text-[10px]">⭐ Show Stopper</span>}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <button onClick={() => handleToggleActive(product)} className="flex items-center gap-1.5 group">
                    {product.is_active
                      ? <ToggleRight size={20} className="text-primary" />
                      : <ToggleLeft size={20} className="text-muted-foreground" />
                    }
                    <span className={`font-body text-xs ${product.is_active ? "text-primary" : "text-muted-foreground"}`}>
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-1 justify-end">
                    <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer" className="p-2 hover:text-primary transition-colors" title="Preview">
                      <Eye size={15} />
                    </a>
                    <button onClick={() => { setEditing(product); setIsNew(false); }} className="p-2 hover:text-primary transition-colors" title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteModal({ open: true, id: product.id, name: product.name })} className="p-2 hover:text-destructive transition-colors" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="font-body text-xs text-muted-foreground">
            Page {page} of {totalPages} — {filtered.length} products
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button key={p} variant={page === p ? "default" : "outline"} size="sm" className="rounded-xl w-8" onClick={() => setPage(p)}>
                {p}
              </Button>
            ))}
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Slide-over Edit Panel */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
            />
            <motion.div
              ref={panelRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-background shadow-2xl overflow-y-auto"
            >
              <div className="p-6 space-y-5">
                {/* Panel Header */}
                <div className="flex items-center justify-between sticky top-0 bg-background pb-4 border-b border-border">
                  <h4 className="font-display text-xl">{isNew ? "New Product" : "Edit Product"}</h4>
                  <button onClick={() => { setEditing(null); setIsNew(false); }} className="p-2 hover:text-primary transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Basic Info */}
                <div className="space-y-1">
                  <p className="font-body text-xs tracking-widest uppercase text-muted-foreground">Basic Info</p>
                  <div className="glass-card rounded-xl p-4 space-y-4">
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">Name *</Label>
                      <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value, slug: generateSlug(e.target.value) })} className="mt-1 rounded-xl" placeholder="Product name" />
                    </div>
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">Slug</Label>
                      <Input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} className="mt-1 rounded-xl" />
                    </div>
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">Description</Label>
                      <Textarea value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} className="mt-1 rounded-xl" rows={3} />
                    </div>
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">Category</Label>
                      <select value={editing.category_id || ""} onChange={e => setEditing({ ...editing, category_id: e.target.value || null })} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                        <option value="">No Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="space-y-1">
                  <p className="font-body text-xs tracking-widest uppercase text-muted-foreground">Pricing & Stock</p>
                  <div className="glass-card rounded-xl p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-body text-xs tracking-widest uppercase">Price (Tk ) *</Label>
                        <Input type="number" step="0.01" value={editing.price} onChange={e => setEditing({ ...editing, price: Number(e.target.value) })} className="mt-1 rounded-xl" />
                      </div>
                      <div>
                        <Label className="font-body text-xs tracking-widest uppercase">Compare at (Tk )</Label>
                        <Input type="number" step="0.01" value={editing.compare_at_price || ""} onChange={e => setEditing({ ...editing, compare_at_price: e.target.value ? Number(e.target.value) : null })} className="mt-1 rounded-xl" placeholder="Original price" />
                      </div>
                    </div>
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">Stock</Label>
                      <Input type="number" value={editing.stock} onChange={e => setEditing({ ...editing, stock: Number(e.target.value) })} className="mt-1 rounded-xl" />
                    </div>
                    {editing.compare_at_price && editing.price && editing.compare_at_price > editing.price && (
                      <p className="font-body text-xs text-green-600">
                        💸 {Math.round(((editing.compare_at_price - editing.price) / editing.compare_at_price) * 100)}% discount will be shown
                      </p>
                    )}
                  </div>
                </div>

                {/* Media */}
                <div className="space-y-1">
                  <p className="font-body text-xs tracking-widest uppercase text-muted-foreground">Media</p>
                  <div className="glass-card rounded-xl p-4 space-y-4">
                    {/* Main Image */}
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">Main Image</Label>
                      <div className="mt-2 flex items-center gap-3">
                        {editing.image_url && (
                          <div className="relative group">
                            <img src={editing.image_url} alt="" className="w-16 h-16 object-contain rounded-lg bg-muted" />
                            <button onClick={() => setEditing({ ...editing, image_url: null })} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={10} />
                            </button>
                          </div>
                        )}
                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border hover:border-primary transition-colors">
                          <Upload size={14} />
                          <span className="font-body text-sm">{uploading ? "Uploading..." : "Upload"}</span>
                          <input type="file" accept="image/*" onChange={e => handleImageUpload(e, false)} className="hidden" disabled={uploading} />
                        </label>
                      </div>
                    </div>

                    {/* Gallery */}
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">Gallery ({(editing.images || []).length}/5)</Label>
                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        {(editing.images || []).map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={img} alt="" className="w-14 h-14 object-contain rounded-lg bg-muted" />
                            <button onClick={() => removeAdditionalImage(i)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        {(editing.images || []).length < 5 && (
                          <label className="cursor-pointer w-14 h-14 rounded-lg border border-dashed border-border hover:border-primary flex items-center justify-center transition-colors">
                            <Plus size={16} className="text-muted-foreground" />
                            <input type="file" accept="image/*" multiple onChange={e => handleImageUpload(e, true)} className="hidden" disabled={uploading} />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* YouTube Video */}
                    <div>
                      <Label className="font-body text-xs tracking-widest uppercase">YouTube Video (optional)</Label>
                      <div className="mt-2 space-y-2">
                        <Input
                          value={editing.video_url || ""}
                          onChange={e => setEditing({ ...editing, video_url: e.target.value || null })}
                          placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                          className="rounded-xl text-xs"
                        />
                        {editing.video_url && getYouTubeId(editing.video_url) && (
                          <div className="rounded-xl overflow-hidden aspect-video bg-black">
                            <iframe
                              src={"https://www.youtube.com/embed/" + getYouTubeId(editing.video_url)}
                              className="w-full h-full"
                              allowFullScreen
                              title="Product video preview"
                            />
                          </div>
                        )}
                        {editing.video_url && !getYouTubeId(editing.video_url) && (
                          <p className="font-body text-xs text-destructive">Invalid YouTube URL</p>
                        )}
                        <p className="font-body text-xs text-muted-foreground">Paste any YouTube link — it will be embedded on the product page</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flags */}
                <div className="space-y-1">
                  <p className="font-body text-xs tracking-widest uppercase text-muted-foreground">Display Options</p>
                  <div className="glass-card rounded-xl p-4 grid grid-cols-2 gap-3">
                    {[
                      { key: "is_featured", label: "Featured", desc: "Show in Featured section" },
                      { key: "is_best_seller", label: "Best Seller", desc: "Show in Best Sellers" },
                      { key: "is_show_stopper", label: "Show Stopper ⭐", desc: "Spotlight on homepage" },
                      { key: "is_active", label: "Active", desc: "Visible to customers" },
                    ].map(flag => (
                      <label key={flag.key} className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-muted/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={(editing as any)[flag.key] || false}
                          onChange={e => setEditing({ ...editing, [flag.key]: e.target.checked } as any)}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="font-body text-sm">{flag.label}</p>
                          <p className="font-body text-xs text-muted-foreground">{flag.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Save */}
                <div className="flex gap-3 pt-2 sticky bottom-0 bg-background pt-4 border-t border-border">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setEditing(null); setIsNew(false); }}>
                    Cancel
                  </Button>
                  <Button variant="hero" className="flex-1 rounded-xl" onClick={handleSave}>
                    {isNew ? "Create Product" : "Save Changes"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={deleteModal.open}
        productName={deleteModal.name}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, id: "", name: "" })}
      />
    </div>
  );
};

export default AdminProducts;
