import { Suspense, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ScrollText,
  ScanLine,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { cx, Spinner } from "./ui";

const NAV = [
  {
    section: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    section: "Directory",
    items: [
      { to: "/admin/people", label: "People", icon: Users },
      { to: "/admin/register", label: "Register person", icon: UserPlus },
    ],
  },
  {
    section: "Records",
    items: [{ to: "/admin/logs", label: "Access logs", icon: ScrollText }],
  },
];

function SidebarContent({ onNavigate }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-16 px-5 flex items-center border-b border-line shrink-0">
        <Logo subtitle="Admin console" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-2.5 mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-subtle">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cx(
                      "flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[13.5px] font-medium transition-colors",
                      isActive
                        ? "bg-surface-2 text-fg"
                        : "text-muted hover:text-fg hover:bg-surface-2/70"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} className={isActive ? "text-accent" : ""} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-line space-y-2 shrink-0">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[13.5px] font-medium text-muted hover:text-fg hover:bg-surface-2/70 transition-colors"
        >
          <ScanLine size={16} />
          Open check-in desk
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[13.5px] font-medium text-muted hover:text-fg hover:bg-surface-2/70 transition-colors"
        >
          <LogOut size={16} />
          Log out
        </button>
        <ThemeToggle className="w-full" />
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-app">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[248px] bg-surface border-r border-line z-30">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-surface/95 backdrop-blur border-b border-line flex items-center justify-between px-4">
        <Logo subtitle={null} />
        <button
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9 -mr-1.5 rounded-lg flex items-center justify-center text-muted hover:text-fg hover:bg-surface-2"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[272px] max-w-[85vw] bg-surface border-r border-line shadow-pop">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3.5 h-9 w-9 rounded-lg flex items-center justify-center text-muted hover:text-fg hover:bg-surface-2"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <main className="lg:pl-[248px]">
        <div key={location.pathname} className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-6 lg:py-9 animate-fade-in">
          <Suspense
            fallback={
              <div className="flex justify-center py-32">
                <Spinner size={22} />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
