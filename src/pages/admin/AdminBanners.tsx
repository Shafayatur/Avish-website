import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react";
import ConfirmModal from "@/components/admin/ConfirmModal";

import usePageTitle from "@/hooks/usePageTitle";
const AdminBanners = () => {
  usePageTitle("Admin — Banners");
  const [banners, setBanners] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: "" });
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
    if (!editing) return;
    const payload = { title: editing.title, subtitle: editing.subtitle || null, image_url: editing.image_url || null, link_url: editing.link_url || null, is_active: editing.is_active, sort_order: editing.sort_order || 0 };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl">Banners ({banners.length})</h3>
        <Button onClick={() => { setEditing({ title: "", subtitle: "", image_url: "", link_url: "", is_active: true, sort_order: 0 }); setIsNew(true); }} className="rounded-xl gap-2">
          <Plus size={16} /> Add Banner
        </Button>
      </div>

      {editing && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-display text-lg">{isNew ? "New Banner" : "Edit Banner"}</h4>
            <button onClick={() => { setEditing(null); setIsNew(false); }}><X size={20} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-body text-xs tracking-widest uppercase">Title</Label>
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
          <Button onClick={handleSave} variant="hero" className="rounded-xl">Save Banner</Button>
        </div>
      )}

      <div className="space-y-3">
        {banners.map(banner => (
          <div key={banner.id} className="glass-card rounded-xl overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              {banner.image_url && (
                <img src={banner.image_url} alt="" className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1">
                <h4 className="font-display text-lg">{banner.title}</h4>
                <p className="font-body text-xs text-muted-foreground">{banner.subtitle || "No subtitle"}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full font-body text-xs ${banner.is_active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                  {banner.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(banner); setIsNew(false); }} className="p-2 hover:text-primary transition-colors"><Pencil size={16} /></button>
                <button onClick={() => setDeleteModal({ open: true, id: banner.id })} className="p-2 hover:text-destructive transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <p className="font-body text-muted-foreground text-center py-8">No banners yet. Add your first banner to appear on the homepage.</p>
        )}
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
