import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  ScanLine,
  LayoutDashboard,
  UserPlus,
  Users,
  ScrollText,
  Shield,
  Menu,
  X,
} from "lucide-react";

const links = [
  { to: "/", label: "Check In", icon: ScanLine },
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/register", label: "Register", icon: UserPlus },
  { to: "/admin/people", label: "People", icon: Users },
  { to: "/admin/logs", label: "Logs", icon: ScrollText },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  const logoRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Navbar entrance animation
  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { y: -60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
    );
    gsap.fromTo(
      logoRef.current,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.7, delay: 0.2, ease: "power3.out" }
    );
  }, []);

  // Mobile menu open/close animation
  useEffect(() => {
    if (!mobileMenuRef.current) return;

    if (menuOpen) {
      gsap.fromTo(
        mobileMenuRef.current,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.35, ease: "power3.out" }
      );

      // Stagger the links in
      const items = mobileMenuRef.current.querySelectorAll(".mobile-link");
      gsap.fromTo(
        items,
        { x: -16, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          stagger: 0.06,
          duration: 0.3,
          delay: 0.1,
          ease: "power2.out",
        }
      );
    } else {
      gsap.to(mobileMenuRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.25,
        ease: "power3.in",
      });
    }
  }, [menuOpen]);

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-white/5"
    >
      {/* Main bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        
        {/* Logo */}
        <div ref={logoRef} className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            School<span className="text-pink-400">ID</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1 text-sm flex-1 ml-8">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/" || l.to === "/admin"}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-pink-600/15 text-pink-400 border border-pink-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                <Icon size={15} />
                {l.label}
              </NavLink>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Online badge — desktop only */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-500">System Online</span>
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg bg-gray-900 border border-white/5 
              text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <div
        ref={mobileMenuRef}
        className="md:hidden overflow-hidden h-0 opacity-0 border-t border-white/5"
      >
        <div className="px-4 py-3 space-y-1 bg-gray-950/95">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/" || l.to === "/admin"}
                className={({ isActive }) =>
                  `mobile-link flex items-center gap-3 px-4 py-3 rounded-xl 
                  font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-pink-600/15 text-pink-400 border border-pink-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                <Icon size={16} />
                {l.label}
              </NavLink>
            );
          })}

          {/* Online badge in mobile menu */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-white/5 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-500">System Online</span>
          </div>
        </div>
      </div>
    </nav>
  );
}