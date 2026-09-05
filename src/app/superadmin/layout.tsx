"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Trophy,
  MapPin,
  FileText,
  BarChart3,
  Users,
  Gift,
  ScrollText,
  LogOut,
  Menu,
  X,
  Target,
  ChevronRight,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const navItems = [
  { href: "/superadmin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/superadmin/challenges", icon: Trophy, label: "Challenges" },
  { href: "/superadmin/campuses", icon: MapPin, label: "Campuses" },
  { href: "/superadmin/templates", icon: FileText, label: "Templates" },
  { href: "/superadmin/stats", icon: BarChart3, label: "Statistics" },
  { href: "/superadmin/interviews", icon: Users, label: "Interviews" },
  { href: "/superadmin/goodies", icon: Gift, label: "Goodies" },
  { href: "/superadmin/submissions", icon: ScrollText, label: "Submissions" },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== "SUPER_ADMIN") {
          router.push("/");
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.push("/"));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/superadmin") return pathname === "/superadmin";
    return pathname.startsWith(href);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f0f7fb" }}>
        <div className="animate-spin w-8 h-8 border-3 border-[#3bc3e2] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#f0f7fb" }}>
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: "260px",
          background: "linear-gradient(180deg, #0d1e56 0%, #12124a 100%)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #3bc3e2, #3ccc8b)",
              }}
            >
              <Target className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-white tracking-tight">
                ALTA Track
              </span>
              <p className="text-[10px] text-[#3bc3e2] font-semibold uppercase tracking-wider">
                Super Admin
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/50 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map(({ href, icon: Icon, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, rgba(59,195,226,0.15), rgba(60,204,139,0.1))"
                      : "transparent",
                    color: active ? "#3bc3e2" : "rgba(255,255,255,0.5)",
                  }}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="flex-1">{label}</span>
                  {active && (
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3bc3e2] to-[#3ccc8b] flex items-center justify-center text-white text-xs font-bold">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-white/40 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-[#e2e8f0]">
          <div className="flex items-center gap-4 px-6 py-3.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-[#0d1e56] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h2 className="text-sm font-extrabold text-[#0d1e56] capitalize">
                {pathname === "/superadmin"
                  ? "Dashboard"
                  : pathname.split("/").pop()?.replace(/-/g, " ")}
              </h2>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
