import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, Upload, ToggleLeft, ToggleRight, Eye } from "lucide-react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import usePageTitle from "@/hooks/usePageTitle";

const AdminBanners = () => {
  usePageTitle("Admin — Banners");
  const [banners, setBanners] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: "" });
  const [preview, setPreview] = useState<any>(null);
  const { toast } = useToast();

  const fetchBanners = async () => {
    const { data } = await supabase.from("banners").select("*").order("sort_order");
    setBanners(data || []);
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `banners/${Date.now()}.${ext}`;
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
    if (!editing || !editing.title) { toast({ title: "Title is required", variant: "destructive" }); return; }
    const payload = {
      title: editing.title,
      subtitle: editing.subtitle || null,
      image_url: editing.image_url || null,
      link_url: editing.link_url || null,
      is_active: editing.is_active,
      sort_order: editing.sort_order || 0,
    };

    if (isNew) {
      const { error } = await supabase.from("banners").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Banner created!" });
    } else {
      const { error } = await supabase.from("banners").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Banner updated!" });
    }
    setEditing(null);
    setIsNew(false);
    fetchBanners();
  };

  const handleDelete = async () => {
    await supabase.from("banners").delete().eq("id", deleteModal.id);
    toast({ title: "Banner deleted" });
    setDeleteModal({ open: false, id: "" });
    fetchBanners();
  };

  const toggleActive = async (banner: any) => {
    await supabase.from("banners").update({ is_active: !banner.is_active }).eq("id", banner.id);
    toast({ title: `Banner ${!banner.is_active ? "activated" : "deactivated"}` });
    fetchBanners();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl">Banners</h3>
          <p className="font-body text-xs text-muted-foreground mt-1">{banners.filter(b => b.is_active).length} active of {banners.length}</p>
        </div>
        <Button onClick={() => { setEditing({ title: "", subtitle: "", image_url: "", link_url: "", is_active: true, sort_order: banners.length }); setIsNew(true); }} className="rounded-xl gap-2">
          <Plus size={16} /> Add Banner
        </Button>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-display text-lg">{isNew ? "New Banner" : "Edit Banner"}</h4>
            <button onClick={() => { setEditing(null); setIsNew(false); }}><X size={20} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-body text-xs tracking-widest uppercase">Title *</Label>
              <Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="font-body text-xs tracking-widest uppercase">Subtitle</Label>
              <Input value={editing.subtitle || ""} onChange={e => setEditing({ ...editing, subtitle: e.target.value })} className="mt-1 rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <Label className="font-body text-xs tracking-widest uppercase">Banner Image</Label>
              <div className="mt-1 flex items-center gap-4">
                {editing.image_url && <img src={editing.image_url} alt="" className="w-32 h-20 object-cover rounded-xl" />}
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border hover:border-primary transition-colors">
                  <Upload size={16} />
                  <span className="font-body text-sm">{uploading ? "Uploading..." : "Upload Image"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
            <div>
              <Label className="font-body text-xs tracking-widest uppercase">Link URL</Label>
              <Input value={editing.link_url || ""} onChange={e => setEditing({ ...editing, link_url: e.target.value })} placeholder="/shop" className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="font-body text-xs tracking-widest uppercase">Sort Order</Label>
              <Input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) })} className="mt-1 rounded-xl" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
              <Label className="font-body text-sm">Active</Label>
            </div>
          </div>

          {/* Live Preview */}
          {editing.image_url && (
            <div>
              <p className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-2">Live Preview</p>
              <div className="relative rounded-2xl overflow-hidden h-48">
                <img src={editing.image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                <div className="absolute inset-0 flex items-center px-8">
                  <div>
                    <p className="font-body text-[10px] uppercase text-white/60 tracking-widest mb-2">✦ Special Offer ✦</p>
                    <h3 className="font-display text-2xl text-white mb-1">{editing.title || "Banner Title"}</h3>
                    {editing.subtitle && <p className="font-body text-sm text-white/70">{editing.subtitle}</p>}
                    {editing.link_url && (
                      <div className="mt-3 inline-block px-4 py-1.5 rounded-full border border-white/40 font-body text-xs text-white">
                        Shop Now →
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl" onClick={() => { setEditing(null); setIsNew(false); }}>Cancel</Button>
            <Button onClick={handleSave} variant="hero" className="rounded-xl">Save Banner</Button>
          </div>
        </div>
      )}

      {/* Banner Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-6" onClick={() => setPreview(null)}>
          <div className="w-full max-w-3xl">
            <div className="relative rounded-2xl overflow-hidden h-64 md:h-80">
              <img src={preview.image_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex items-center px-10">
                <div>
                  <p className="font-body text-xs uppercase text-white/60 tracking-widest mb-3">✦ Special Offer ✦</p>
                  <h3 className="font-display text-4xl text-white mb-2">{preview.title}</h3>
                  {preview.subtitle && <p className="font-body text-base text-white/70">{preview.subtitle}</p>}
                </div>
              </div>
              <button onClick={() => setPreview(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banners List */}
      <div className="space-y-3">
        {banners.length === 0 ? (
          <p className="font-body text-muted-foreground text-center py-8">No banners yet.</p>
        ) : banners.map(banner => (
          <div key={banner.id} className={`glass-card rounded-xl overflow-hidden ${!banner.is_active ? "opacity-60" : ""}`}>
            <div className="flex items-center gap-4 p-4">
              {banner.image_url ? (
                <img src={banner.image_url} alt="" className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-24 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="font-body text-xs text-muted-foreground">No image</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-display text-lg line-clamp-1">{banner.title}</h4>
                <p className="font-body text-xs text-muted-foreground line-clamp-1">{banner.subtitle || "No subtitle"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full font-body text-[10px] ${banner.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {banner.is_active ? "Active" : "Inactive"}
                  </span>
                  <span className="font-body text-[10px] text-muted-foreground">Order: {banner.sort_order}</span>
                  {banner.link_url && <span className="font-body text-[10px] text-muted-foreground">→ {banner.link_url}</span>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {banner.image_url && (
                  <button onClick={() => setPreview(banner)} className="p-2 hover:text-primary transition-colors" title="Preview">
                    <Eye size={15} />
                  </button>
                )}
                <button onClick={() => toggleActive(banner)} className="p-2 transition-colors" title={banner.is_active ? "Deactivate" : "Activate"}>
                  {banner.is_active
                    ? <ToggleRight size={18} className="text-primary" />
                    : <ToggleLeft size={18} className="text-muted-foreground" />
                  }
                </button>
                <button onClick={() => { setEditing(banner); setIsNew(false); }} className="p-2 hover:text-primary transition-colors">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setDeleteModal({ open: true, id: banner.id })} className="p-2 hover:text-destructive transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={deleteModal.open}
        title="Delete Banner?"
        message="This banner will be permanently deleted."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, id: "" })}
      />
    </div>
  );
};

export default AdminBanners;
