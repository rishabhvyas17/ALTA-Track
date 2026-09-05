"use client";

import { useEffect, useState } from "react";
import { Trophy, MapPin, Users, FileText, TrendingUp, Flame, Plus, ChevronRight, Share2, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalChallenges: number;
  activeChallenges: number;
  totalCampuses: number;
  totalStudents: number;
  totalTemplates: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalChallenges: 0,
    activeChallenges: 0,
    totalCampuses: 0,
    totalStudents: 0,
    totalTemplates: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [challengesRes, campusesRes, templatesRes] = await Promise.all([
        fetch("/api/superadmin/challenges"),
        fetch("/api/superadmin/campuses"),
        fetch("/api/superadmin/templates"),
      ]);

      let cData = { challenges: [] };
      let campData = { campuses: [] };
      let tData = { templates: [] };

      if (challengesRes.ok) cData = await challengesRes.json();
      if (campusesRes.ok) campData = await campusesRes.json();
      if (templatesRes.ok) tData = await templatesRes.json();

      const totalStudents = (campData.campuses || []).reduce(
        (sum: number, c: any) => sum + (c._count?.users || 0),
        0
      );

      setStats({
        totalChallenges: cData.challenges?.length || 0,
        activeChallenges:
          cData.challenges?.filter((c: any) => c.isActive).length || 0,
        totalCampuses: campData.campuses?.length || 0,
        totalStudents,
        totalTemplates: tData.templates?.length || 0,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Hero Welcome Banner */}
      <div className="alta-card p-6 sm:p-8 relative overflow-hidden bg-gradient-to-br from-[#0c1b48] via-[#071130] to-[#050c24] border border-[#3bc3e2]/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#3bc3e2]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3bc3e2]/15 text-[#3bc3e2] border border-[#3bc3e2]/30 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#fcc032]" />
            Super Admin Control Deck
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Welcome back! 👋
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl font-medium">
            Manage challenge tracks, rules engine configurations, campus allocations, and global student progress across all partner institutions.
          </p>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="alta-card p-6 space-y-3 border border-white/10 hover:border-[#3bc3e2]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Active Challenges
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#3bc3e2]/15 border border-[#3bc3e2]/30 flex items-center justify-center text-[#3bc3e2]">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {stats.activeChallenges}
          </div>
          <p className="text-xs font-bold text-slate-400">
            {stats.totalChallenges} Total Created
          </p>
        </div>

        <div className="alta-card p-6 space-y-3 border border-white/10 hover:border-[#3ccc8b]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Campuses
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {stats.totalCampuses}
          </div>
          <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Partner Institutions
          </p>
        </div>

        <div className="alta-card p-6 space-y-3 border border-white/10 hover:border-[#fcc032]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Total Students
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {stats.totalStudents}
          </div>
          <p className="text-xs font-bold text-amber-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-amber-400" /> Active Solvers
          </p>
        </div>

        <div className="alta-card p-6 space-y-3 border border-white/10 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Post Templates
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Share2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {stats.totalTemplates}
          </div>
          <p className="text-xs font-bold text-slate-400">LinkedIn Format Rules</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#3bc3e2]" /> Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/superadmin/challenges"
            className="alta-card p-6 flex items-center justify-between group hover:border-[#3bc3e2] transition-all"
          >
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-base group-hover:text-[#3bc3e2] transition-colors">
                Create Challenge
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Set up a new DSA challenge track
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#3bc3e2]/15 text-[#3bc3e2] flex items-center justify-center group-hover:bg-[#3bc3e2] group-hover:text-[#050c24] transition-all">
              <Plus className="w-5 h-5" />
            </div>
          </Link>

          <Link
            href="/superadmin/campuses"
            className="alta-card p-6 flex items-center justify-between group hover:border-[#3ccc8b] transition-all"
          >
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-base group-hover:text-[#3ccc8b] transition-colors">
                Add Campus
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Register a new college campus
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:bg-[#3ccc8b] group-hover:text-[#050c24] transition-all">
              <Plus className="w-5 h-5" />
            </div>
          </Link>

          <Link
            href="/superadmin/templates"
            className="alta-card p-6 flex items-center justify-between group hover:border-[#fcc032] transition-all"
          >
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-base group-hover:text-[#fcc032] transition-colors">
                Manage Templates
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Edit LinkedIn post templates
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:bg-[#fcc032] group-hover:text-[#050c24] transition-all">
              <Share2 className="w-5 h-5" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
