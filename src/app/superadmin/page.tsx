"use client";

import { useEffect, useState } from "react";
import { Trophy, MapPin, Users, FileText, TrendingUp, Flame } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalChallenges: number;
  activeChallenges: number;
  totalCampuses: number;
  totalStudents: number;
  totalAdmins: number;
  totalTemplates: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // Fetch aggregate stats
    Promise.all([
      fetch("/api/superadmin/challenges").then((r) => r.json()),
      fetch("/api/superadmin/campuses").then((r) => r.json()),
      fetch("/api/superadmin/templates").then((r) => r.json()),
    ]).then(([challengesData, campusesData, templatesData]) => {
      const challenges = challengesData.challenges || [];
      const campuses = campusesData.campuses || [];
      const templates = templatesData.templates || [];

      setStats({
        totalChallenges: challenges.length,
        activeChallenges: challenges.filter((c: { isActive: boolean }) => c.isActive).length,
        totalCampuses: campuses.length,
        totalStudents: campuses.reduce(
          (sum: number, c: { _count: { users: number } }) => sum + (c._count?.users || 0),
          0
        ),
        totalAdmins: campuses.reduce(
          (sum: number, c: { users: { id: string }[] }) => sum + (c.users?.length || 0),
          0
        ),
        totalTemplates: templates.length,
      });
    });
  }, []);

  const cards = stats
    ? [
        {
          icon: Trophy,
          label: "Active Challenges",
          value: stats.activeChallenges,
          subtext: `${stats.totalChallenges} total`,
          color: "#3bc3e2",
          href: "/superadmin/challenges",
        },
        {
          icon: MapPin,
          label: "Campuses",
          value: stats.totalCampuses,
          subtext: `${stats.totalAdmins} admins`,
          color: "#3ccc8b",
          href: "/superadmin/campuses",
        },
        {
          icon: Users,
          label: "Total Students",
          value: stats.totalStudents,
          subtext: "across all campuses",
          color: "#fcc032",
          href: "/superadmin/campuses",
        },
        {
          icon: FileText,
          label: "Post Templates",
          value: stats.totalTemplates,
          subtext: "LinkedIn templates",
          color: "#8b5cf6",
          href: "/superadmin/templates",
        },
      ]
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div
        className="rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0d1e56 0%, #1a2d6b 100%)",
        }}
      >
        <div
          className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, #3bc3e2, transparent)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-[#fcc032]" />
            <span className="text-xs font-bold text-[#3bc3e2] uppercase tracking-wider">
              Super Admin Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Manage challenges, campuses, and students across the entire ALTA DSA
            platform from here.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      {stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ icon: Icon, label, value, subtext, color, href }) => (
            <Link
              key={label}
              href={href}
              className="alta-card p-5 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <TrendingUp className="w-4 h-4 text-[#3ccc8b] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-2xl font-black text-[#0d1e56] mb-0.5">
                {value}
              </div>
              <div className="text-xs font-bold text-[#0d1e56]">{label}</div>
              <div className="text-[10px] text-[#64748b] mt-0.5">
                {subtext}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="alta-card p-5">
              <div className="skeleton w-10 h-10 mb-3" />
              <div className="skeleton w-16 h-7 mb-2" />
              <div className="skeleton w-24 h-3 mb-1" />
              <div className="skeleton w-20 h-2.5" />
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-extrabold text-[#0d1e56] mb-3">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              label: "Create Challenge",
              desc: "Set up a new DSA challenge program",
              href: "/superadmin/challenges",
              icon: Trophy,
              color: "#3bc3e2",
            },
            {
              label: "Add Campus",
              desc: "Register a new college campus",
              href: "/superadmin/campuses",
              icon: MapPin,
              color: "#3ccc8b",
            },
            {
              label: "Manage Templates",
              desc: "Edit LinkedIn post templates",
              href: "/superadmin/templates",
              icon: FileText,
              color: "#fcc032",
            },
          ].map(({ label, desc, href, icon: Icon, color }) => (
            <Link
              key={label}
              href={href}
              className="alta-card p-4 flex items-center gap-4 group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0d1e56]">{label}</p>
                <p className="text-xs text-[#64748b]">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#64748b] opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
