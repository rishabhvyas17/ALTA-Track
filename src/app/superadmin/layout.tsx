"use client";

import { useState } from "react";
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
  Video,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  Share2,
} from "lucide-react";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const navItems = [
    { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/superadmin/challenges", label: "Challenges", icon: Trophy },
    { href: "/superadmin/campuses", label: "Campuses", icon: MapPin },
    { href: "/superadmin/templates", label: "Templates", icon: Share2 },
    { href: "/superadmin/stats", label: "Statistics", icon: BarChart3 },
    { href: "/superadmin/interviews", label: "Interviews", icon: Video },
    { href: "/superadmin/goodies", label: "Goodies", icon: Gift },
    { href: "/superadmin/submissions", label: "Submissions", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#050c24] text-white flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-[#071130] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#3bc3e2] flex items-center justify-center text-[#050c24] font-black text-lg">
            A
          </div>
          <span className="font-extrabold text-white text-base">ALTA SuperAdmin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#071130] border-r border-white/10 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 space-y-6">
          {/* Logo */}
          <Link href="/superadmin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3bc3e2] to-[#22acd1] flex items-center justify-center text-[#050c24] font-black text-xl shadow-lg shadow-[#3bc3e2]/20">
              A
            </div>
            <div>
              <h1 className="font-black text-lg tracking-wider text-white">
                ALTA <span className="text-[#3bc3e2]">TRACK</span>
              </h1>
              <p className="text-[9px] uppercase font-extrabold text-[#fcc032] tracking-widest flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-[#fcc032]" /> Super Admin Deck
              </p>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/superadmin"
                  ? pathname === "/superadmin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-[#3bc3e2] to-[#22acd1] text-[#050c24] shadow-md shadow-[#3bc3e2]/20 font-black"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#050c24]" : "text-[#3bc3e2]"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 m-4 rounded-2xl bg-[#0c1b48] border border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#3bc3e2]/20 text-[#3bc3e2] font-black text-xs flex items-center justify-center border border-[#3bc3e2]/40">
              SA
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-extrabold text-white truncate">Super Admin</div>
              <div className="text-[10px] text-slate-400 truncate">admin@alta.org</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
