"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  MapPin,
  Users,
  FileText,
  TrendingUp,
  Flame,
  Plus,
  ChevronRight,
  Share2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Video,
  Gift,
  HelpCircle,
  ExternalLink,
  Layers,
  GraduationCap,
  Activity,
  ArrowUpRight,
  School,
  FileQuestion,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface SuperAdminStats {
  summary: {
    totalStudents: number;
    totalCampuses: number;
    totalChallenges: number;
    activeChallenges: number;
    totalProblems: number;
    activeEnrollments: number;
    submissionsToday: number;
    totalSubmissions: number;
    pendingSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    approvalRate: number;
  };
  streakMilestones: {
    streak7Plus: number;
    streak14Plus: number;
    streak25Plus: number;
    streak50Plus: number;
  };
  interviews: {
    total: number;
    queued: number;
    scheduled: number;
    passed: number;
    failed: number;
  };
  goodies: {
    total: number;
    eligible: number;
    claimed: number;
    shipped: number;
  };
  campusMetrics: Array<{
    id: string;
    name: string;
    region: string;
    studentCount: number;
    enrolledCount: number;
    activeStreakCount: number;
    avgStreak: number;
    maxStreak: number;
    totalSubmissions: number;
    approvedSubmissions: number;
    pendingSubmissions: number;
    topStudent: {
      name: string;
      streak: number;
      currentDay: number;
    } | null;
  }>;
  yearDistribution: Array<{
    year: number;
    label: string;
    totalStudents: number;
    activeCount: number;
    avgStreak: number;
  }>;
  difficultyCount: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  recentActivity: Array<{
    id: string;
    studentName: string;
    campusName: string;
    year: number | null;
    challengeName: string;
    dayNumber: number;
    problemTitle: string;
    difficulty: string;
    submittedAt: string;
    status: string;
    linkedinPostUrl: string;
  }>;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"campuses" | "analytics" | "feed">("campuses");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/superadmin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch superadmin stats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-fade-in">
        <div className="alta-card p-8 border border-white/10 space-y-4">
          <div className="skeleton w-48 h-6 bg-white/5 rounded" />
          <div className="skeleton w-96 h-10 bg-white/5 rounded" />
          <div className="skeleton w-full h-4 bg-white/5 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="alta-card p-6 border border-white/10 h-32">
              <div className="skeleton w-32 h-4 bg-white/5 rounded mb-3" />
              <div className="skeleton w-16 h-8 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { summary, streakMilestones, interviews, goodies, campusMetrics, yearDistribution, difficultyCount, recentActivity } = stats;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Hero Welcome Banner */}
      <div className="alta-card p-6 sm:p-8 relative overflow-hidden bg-gradient-to-br from-[#0c1b48] via-[#071130] to-[#050c24] border border-[#3bc3e2]/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#3bc3e2]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3bc3e2]/15 text-[#3bc3e2] border border-[#3bc3e2]/30 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#fcc032]" />
              Super Admin Operations Desk
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Platform Intelligence & Oversight 📊
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Real-time minute tracking across all <strong className="text-white">5 official partner campuses</strong>. Monitor student streaks, submission verification throughput, and placement milestones.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={fetchStats}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#3bc3e2]" : ""}`} />
              Refresh
            </button>

            <Link
              href="/superadmin/challenges"
              className="alta-button px-4 py-2.5 text-xs font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Manage Tracks
            </Link>
          </div>
        </div>

        {/* Pro Tip Hint Banner */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-3 text-xs text-slate-300 bg-black/20 p-3.5 rounded-xl border border-white/5">
          <div className="w-6 h-6 rounded-lg bg-[#3bc3e2]/20 border border-[#3bc3e2]/30 flex items-center justify-center text-[#3bc3e2] shrink-0 font-bold">
            💡
          </div>
          <div className="flex-1">
            <span className="font-bold text-white">How Track Eligibility Works:</span> When creating a challenge or uploading a DSA sheet, configure <span className="text-[#3bc3e2]">Target Years</span> (1st–4th) and <span className="text-[#3bc3e2]">Target Campuses</span> (5 colleges) so only eligible cohorts enroll.
          </div>
        </div>
      </div>

      {/* Core KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Students */}
        <div className="alta-card p-5 space-y-3 border border-white/10 hover:border-[#3bc3e2]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[#3bc3e2]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-white">
              {summary.totalStudents}
            </div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Across 5 Colleges
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Active enrollments:</span>
            <span className="text-white font-bold">{summary.activeEnrollments}</span>
          </div>
        </div>

        {/* Active Daily Streaks */}
        <div className="alta-card p-5 space-y-3 border border-white/10 hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Daily Streaks
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-white">
              {summary.activeEnrollments}
            </div>
            <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
              Live 🔥
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>25+ Days milestone:</span>
            <span className="text-white font-bold">{streakMilestones.streak25Plus}</span>
          </div>
        </div>

        {/* Submissions Today & Total */}
        <div className="alta-card p-5 space-y-3 border border-white/10 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Submissions Today
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-white">
              {summary.submissionsToday}
            </div>
            <span className="text-[11px] font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded-full">
              {summary.totalSubmissions} Total
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Pending campus review:</span>
            <span className={`font-bold ${summary.pendingSubmissions > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {summary.pendingSubmissions}
            </span>
          </div>
        </div>

        {/* Verification Rate */}
        <div className="alta-card p-5 space-y-3 border border-white/10 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Verification Health
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-white">
              {summary.approvalRate}%
            </div>
            <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
              Approved
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Total problems in system:</span>
            <span className="text-white font-bold">{summary.totalProblems}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("campuses")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "campuses"
              ? "bg-[#3bc3e2]/20 text-[#3bc3e2] border border-[#3bc3e2]/30 shadow-lg shadow-cyan-500/10"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <School className="w-4 h-4" /> 5-Campus Matrix
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "analytics"
              ? "bg-[#3bc3e2]/20 text-[#3bc3e2] border border-[#3bc3e2]/30 shadow-lg shadow-cyan-500/10"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Activity className="w-4 h-4" /> Cohorts & Difficulty
        </button>

        <button
          onClick={() => setActiveTab("feed")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "feed"
              ? "bg-[#3bc3e2]/20 text-[#3bc3e2] border border-[#3bc3e2]/30 shadow-lg shadow-cyan-500/10"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Share2 className="w-4 h-4" /> Live Submissions Feed
        </button>
      </div>

      {/* TAB 1: 5-CAMPUS MATRIX */}
      {activeTab === "campuses" && (
        <div className="space-y-6">
          <div className="alta-card overflow-hidden">
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.01]">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <School className="w-5 h-5 text-[#3bc3e2]" /> The 5 Official Partner Campuses
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time side-by-side performance benchmarks for partner engineering institutes.
                </p>
              </div>

              <Link
                href="/superadmin/campuses"
                className="text-xs font-bold text-[#3bc3e2] hover:underline flex items-center gap-1"
              >
                Manage Campus Admins <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Campus</th>
                    <th className="p-4">Region</th>
                    <th className="p-4">Students</th>
                    <th className="p-4">Active Streaks</th>
                    <th className="p-4">Avg Streak</th>
                    <th className="p-4">Submissions</th>
                    <th className="p-4">Pending Review</th>
                    <th className="p-4 pr-6">Top Performer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-xs">
                  {campusMetrics.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-extrabold text-white text-sm">
                          {c.name}
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">
                        {c.region}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-white text-sm">
                          {c.studentCount}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold">
                          {c.activeStreakCount} 🔥
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-200">
                        {c.avgStreak} Days
                      </td>
                      <td className="p-4">
                        <span className="text-white font-bold">{c.totalSubmissions}</span>
                        <span className="text-slate-400 text-[10px] ml-1">({c.approvedSubmissions} approved)</span>
                      </td>
                      <td className="p-4">
                        {c.pendingSubmissions > 0 ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                            {c.pendingSubmissions} queue
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Clear
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6">
                        {c.topStudent ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{c.topStudent.name}</span>
                            <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[#3bc3e2] font-extrabold text-[10px]">
                              Day {c.topStudent.currentDay}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Guidance Hint */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3 text-xs text-slate-300">
            <HelpCircle className="w-5 h-5 text-[#3bc3e2] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Campus Review Policy:</span> Campus Admins are tasked with approving their local students&apos; LinkedIn solution submissions daily. A clear queue means students get streak credit without delay.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COHORTS & DIFFICULTY */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Year Distribution */}
          <div className="alta-card p-6 space-y-5">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#3bc3e2]" /> Year-Wise Student Distribution
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Student enrollment and streak performance across college years.
              </p>
            </div>

            <div className="space-y-4">
              {yearDistribution.map((yr) => (
                <div key={yr.year} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{yr.label}</span>
                    <span className="text-slate-400">
                      {yr.totalStudents} Students ({yr.activeCount} Active) • Avg Streak:{" "}
                      <strong className="text-orange-400">{yr.avgStreak}d</strong>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#3bc3e2] to-[#60ec8c]"
                      style={{
                        width: `${Math.min(100, Math.max(10, yr.totalStudents * 25))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty Breakdown */}
          <div className="alta-card p-6 space-y-5">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#3bc3e2]" /> Solved Problems by Difficulty
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Breakdown of verified student submissions across LeetCode tiers.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-1">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Easy
                </span>
                <div className="text-2xl font-black text-white">
                  {difficultyCount.Easy}
                </div>
                <span className="text-[10px] text-slate-400">Solved</span>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center space-y-1">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Medium
                </span>
                <div className="text-2xl font-black text-white">
                  {difficultyCount.Medium}
                </div>
                <span className="text-[10px] text-slate-400">Solved</span>
              </div>

              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-center space-y-1">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                  Hard
                </span>
                <div className="text-2xl font-black text-white">
                  {difficultyCount.Hard}
                </div>
                <span className="text-[10px] text-slate-400">Solved</span>
              </div>
            </div>

            {/* Streak Milestones */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Streak Milestone Achievements
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 flex items-center justify-between">
                  <span className="text-slate-300">7+ Days Consistency</span>
                  <span className="font-extrabold text-orange-400">{streakMilestones.streak7Plus}</span>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 flex items-center justify-between">
                  <span className="text-slate-300">14+ Days Habit</span>
                  <span className="font-extrabold text-orange-400">{streakMilestones.streak14Plus}</span>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 flex items-center justify-between">
                  <span className="text-slate-300">25+ Days (Mock Interview)</span>
                  <span className="font-extrabold text-[#3bc3e2]">{streakMilestones.streak25Plus}</span>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 flex items-center justify-between">
                  <span className="text-slate-300">30+ Days (Goodies Pack)</span>
                  <span className="font-extrabold text-emerald-400">{goodies.eligible}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE SUBMISSIONS FEED */}
      {activeTab === "feed" && (
        <div className="alta-card overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#3bc3e2]" /> Real-Time Submissions Feed
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest student daily solutions submitted across all partner colleges.
              </p>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No submissions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3.5 pl-6">Student</th>
                    <th className="p-3.5">Campus</th>
                    <th className="p-3.5">Challenge & Day</th>
                    <th className="p-3.5">Problem</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-6 text-right">LinkedIn Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {recentActivity.map((act) => (
                    <tr key={act.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 pl-6 font-bold text-white">
                        {act.studentName}
                        {act.year && (
                          <span className="text-[10px] text-slate-400 block">
                            Year {act.year}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-300 font-medium">
                        {act.campusName}
                      </td>
                      <td className="p-3.5">
                        <span className="text-[#3bc3e2] font-bold">
                          {act.challengeName}
                        </span>
                        <span className="text-slate-400 ml-1 font-semibold">
                          Day {act.dayNumber}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-white font-medium block">
                          {act.problemTitle}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {act.difficulty}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {act.status === "APPROVED" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
                            Approved
                          </span>
                        ) : act.status === "PENDING" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[11px]">
                            Pending
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-[11px]">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 pr-6 text-right">
                        <a
                          href={act.linkedinPostUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#3bc3e2] hover:underline"
                        >
                          View Post <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
