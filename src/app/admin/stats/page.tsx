"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  Trophy,
  Flame,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface CampusStats {
  totalStudents: number;
  activeEnrollments: number;
  completedCount: number;
  brokenCount: number;
  averageStreak: number;
  completionRate: number;
}

export default function CampusStatsPage() {
  const [stats, setStats] = useState<CampusStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampusStats();
  }, []);

  const fetchCampusStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/submissions");
      if (res.ok) {
        const data = await res.json();
        const subs = data.submissions || [];

        // Derive statistics
        const studentSet = new Set();
        let totalStreak = 0;
        let active = 0;
        let completed = 0;
        let broken = 0;

        subs.forEach((s: any) => {
          if (s.enrollment) {
            studentSet.add(s.enrollment.user.id);
            totalStreak += s.enrollment.streakCount || 0;
            if (s.enrollment.status === "ACTIVE") active++;
            if (s.enrollment.status === "COMPLETED") completed++;
            if (s.enrollment.status === "BROKEN") broken++;
          }
        });

        const totalStudents = studentSet.size || 1;
        const avgStreak = Math.round(totalStreak / (subs.length || 1));
        const rate = Math.round((completed / (subs.length || 1)) * 100);

        setStats({
          totalStudents,
          activeEnrollments: active || subs.length,
          completedCount: completed,
          brokenCount: broken,
          averageStreak: avgStreak,
          completionRate: rate,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary-cyan)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-[var(--color-accent-cyan)]" />
          Campus Analytics & Stats
        </h1>
        <p className="text-xs text-[var(--color-neutral-silver)] mt-1">
          Performance metrics, active streaks, and completion rates for your campus.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="alta-card p-6 space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Active Students</span>
            <Users className="w-5 h-5 text-[var(--color-accent-cyan)]" />
          </div>
          <div className="text-3xl font-black text-white">{stats?.totalStudents || 0}</div>
          <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Enrolled across tracks
          </p>
        </div>

        <div className="alta-card p-6 space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Campus Streak</span>
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">{stats?.averageStreak || 0} Days</div>
          <p className="text-[11px] text-amber-400 font-semibold">Active problem solving streak</p>
        </div>

        <div className="alta-card p-6 space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Track Completion Rate</span>
            <Trophy className="w-5 h-5 text-[var(--color-accent-green)]" />
          </div>
          <div className="text-3xl font-black text-white">{stats?.completionRate || 0}%</div>
          <p className="text-[11px] text-emerald-400 font-semibold">Completed full 111/151 days</p>
        </div>

        <div className="alta-card p-6 space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Broken Streaks</span>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-black text-white">{stats?.brokenCount || 0}</div>
          <p className="text-[11px] text-red-400 font-semibold">Missed grace days window</p>
        </div>
      </div>
    </div>
  );
}
