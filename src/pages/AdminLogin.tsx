import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import usePageTitle from "@/hooks/usePageTitle";
const AdminLogin = () => {
  usePageTitle("Admin Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Check admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Authentication error", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      await supabase.auth.signOut();
      toast({ title: "Access denied", description: "You are not an administrator.", variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Welcome, Admin!" });
    navigate("/admin");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-foreground flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="text-primary" size={28} />
          </div>
          <h1 className="font-display text-3xl tracking-[0.2em] text-background">AVISH ADMIN</h1>
          <p className="font-body text-sm text-background/50 mt-2">Administrator Access</p>
        </div>

        <div className="bg-background/5 border border-background/10 rounded-2xl p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="font-body text-xs tracking-widest uppercase text-background/70">Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@avish.com" className="mt-1.5 rounded-xl bg-background/10 border-background/20 text-background placeholder:text-background/30" required />
            </div>
            <div>
              <Label className="font-body text-xs tracking-widest uppercase text-background/70">Password</Label>
              <div className="relative mt-1.5">
                <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="rounded-xl bg-background/10 border-background/20 text-background placeholder:text-background/30 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-background/50 hover:text-background">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="hero" className="w-full rounded-xl" disabled={loading}>
              {loading ? "Authenticating..." : "Admin Login"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
