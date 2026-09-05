"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckSquare,
  BarChart3,
  LogOut,
  Sparkles,
} from "lucide-react";

export default function CampusAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: ShieldCheck },
    { href: "/admin/queue", label: "Verification Queue", icon: CheckSquare },
    { href: "/admin/stats", label: "Campus Analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-navy-dark)] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--color-border-dark)] bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--color-accent-cyan)] to-[var(--color-primary-cyan)] flex items-center justify-center text-white font-extrabold text-xl shadow-lg">
                A
              </div>
              <div>
                <h1 className="font-black text-xl tracking-wider text-white">
                  ALTA <span className="text-[var(--color-accent-cyan)]">TRACK</span>
                </h1>
                <p className="text-[10px] uppercase font-bold text-[var(--color-accent-green)] tracking-widest">
                  Campus Admin Portal
                </p>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[var(--color-accent-cyan)] text-black shadow-md shadow-[var(--color-accent-cyan)]/20"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
