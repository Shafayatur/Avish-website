import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminCustomers = () => {
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => setProfiles(data || []));
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="font-display text-xl">Customers ({profiles.length})</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3">Name</th>
              <th className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3">Phone</th>
              <th className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3">City</th>
              <th className="text-left font-body text-xs tracking-widest uppercase text-muted-foreground py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="py-3 font-body text-sm">{p.full_name || "—"}</td>
                <td className="py-3 font-body text-sm">{p.phone || "—"}</td>
                <td className="py-3 font-body text-sm">{p.city || "—"}</td>
                <td className="py-3 font-body text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCustomers;
