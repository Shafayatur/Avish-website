import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Package, Tag, ShoppingCart, Users, Image, MessageSquare, LogOut, Menu, X } from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Products", path: "/admin/products", icon: Package },
  { label: "Categories", path: "/admin/categories", icon: Tag },
  { label: "Orders", path: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Banners", path: "/admin/banners", icon: Image },
  { label: "Reviews", path: "/admin/reviews", icon: MessageSquare },
];

const AdminLayout = () => {
  const { isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/admin-login");
  }, [isAdmin, loading, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="font-body text-muted-foreground">Loading...</p></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-foreground text-background transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6">
          <h1 className="font-display text-2xl tracking-[0.2em] mb-8">AVISH</h1>
          <p className="font-body text-xs text-background/40 tracking-widest uppercase mb-6">Admin Panel</p>
          <nav className="space-y-1">
            {navItems.map(item => (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-body text-sm transition-colors ${
                  location.pathname === item.path ? "bg-background/10 text-background" : "text-background/60 hover:text-background hover:bg-background/5"
                }`}>
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <button onClick={() => { signOut(); navigate("/"); }} className="flex items-center gap-3 px-4 py-3 rounded-lg font-body text-sm text-background/60 hover:text-background hover:bg-background/5 w-full transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
          <Link to="/" className="block mt-2 px-4 py-2 font-body text-xs text-background/40 hover:text-background/60 transition-colors">
            ← Back to Store
          </Link>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h2 className="font-display text-xl">{navItems.find(i => i.path === location.pathname)?.label || "Admin"}</h2>
          <div />
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
