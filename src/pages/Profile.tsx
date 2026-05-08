import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import usePageTitle from "@/hooks/usePageTitle";
const Profile = () => {
  usePageTitle("My Profile");
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "US",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) setProfile({
        full_name: data.full_name || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zip_code: data.zip_code || "",
        country: data.country || "US",
      });
    });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update(profile).eq("id", user.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-6 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <User size={32} className="text-primary" />
            </div>
            <h1 className="font-display text-4xl font-light">My <span className="italic text-gradient-rose">Profile</span></h1>
            <p className="font-body text-sm text-muted-foreground mt-2">{user?.email}</p>
          </motion.div>

          <div className="glass-card rounded-2xl p-8">
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label className="font-body text-xs tracking-widest uppercase">Full Name</Label>
                <Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="font-body text-xs tracking-widest uppercase">Phone</Label>
                <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="font-body text-xs tracking-widest uppercase">Address</Label>
                <Input value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} className="mt-1.5 rounded-xl" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label className="font-body text-xs tracking-widest uppercase">City</Label>
                  <Input value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label className="font-body text-xs tracking-widest uppercase">State</Label>
                  <Input value={profile.state} onChange={e => setProfile(p => ({ ...p, state: e.target.value }))} className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label className="font-body text-xs tracking-widest uppercase">ZIP Code</Label>
                  <Input value={profile.zip_code} onChange={e => setProfile(p => ({ ...p, zip_code: e.target.value }))} className="mt-1.5 rounded-xl" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" variant="hero" className="rounded-xl flex-1" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" className="rounded-xl gap-2" onClick={handleSignOut}>
                  <LogOut size={16} /> Sign Out
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
