"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  Users,
  Trophy,
  Flame,
  TrendingUp,
  Loader2,
  Building2,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Layers,
  Award,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Briefcase,
  Gift,
  Filter,
  ArrowUpRight,
  HelpCircle,
  Mail,
  UserCheck,
  Linkedin,
  Github,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

interface CampusMetric {
  id: string;
  name: string;
  region?: string;
  admins: { id: string; name: string; email: string }[];
  studentCount: number;
  enrolledCount: number;
  activeStreakCount: number;
  avgStreak: number;
  maxStreak: number;
  totalSubmissions: number;
  approvedSubmissions: number;
  pendingSubmissions: number;
  rejectedSubmissions: number;
  approvalRate: number;
  yearDistribution: { year: number; label: string; count: number }[];
  difficultyBreakdown: { Easy: number; Medium: number; Hard: number };
  topStudents: {
    id: string;
    name: string;
    year: number | null;
    streak: number;
    currentDay: number;
    challengeName: string;
  }[];
  topStudent: {
    id: string;
    name: string;
    year: number | null;
    streak: number;
    currentDay: number;
    challengeName: string;
  } | null;
  recentSubmissions: {
    id: string;
    studentName: string;
    dayNumber: number;
    problemTitle: string;
    difficulty: string;
    status: string;
    submittedAt: string;
    linkedinPostUrl: string | null;
    githubLink?: string | null;
  }[];
}

interface StatsApiResponse {
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
  campusMetrics: CampusMetric[];
  yearDistribution: {
    year: number;
    label: string;
    totalStudents: number;
    activeCount: number;
    avgStreak: number;
  }[];
  difficultyCount: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  recentActivity: {
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
    linkedinPostUrl: string | null;
    githubLink?: string | null;
  }[];
}

const PIE_COLORS = ["#38bdf8", "#34d399", "#fbbf24", "#a855f7"];
const DIFF_COLORS = {
  Easy: "#10b981",
  Medium: "#f59e0b",
  Hard: "#f43f5e",
};

export default function SuperAdminStatsPage() {
  const [data, setData] = useState<StatsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/superadmin/stats");
      if (!res.ok) throw new Error("Failed to fetch statistics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error loading stats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Currently focused campus metric
  const selectedCampus = useMemo(() => {
    if (!data || selectedCampusId === "ALL") return null;
    return data.campusMetrics.find((c) => c.id === selectedCampusId) || null;
  }, [data, selectedCampusId]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[var(--color-accent-cyan)] animate-spin" />
        <p className="text-xs text-[var(--color-neutral-silver)] font-medium">
          Loading platform and campus-wise statistics...
        </p>
      </div>
    );
  }

  const { summary, streakMilestones, campusMetrics, yearDistribution, difficultyCount, recentActivity, interviews, goodies } = data;

  // Chart data for Campus Comparison
  const campusChartData = campusMetrics.map((c) => ({
    name: c.name.split("-")[0].trim(),
    students: c.studentCount,
    submissions: c.totalSubmissions,
    avgStreak: c.avgStreak,
  }));

  // Chart data for Difficulty
  const difficultyChartData = [
    { name: "Easy", count: difficultyCount.Easy, fill: DIFF_COLORS.Easy },
    { name: "Medium", count: difficultyCount.Medium, fill: DIFF_COLORS.Medium },
    { name: "Hard", count: difficultyCount.Hard, fill: DIFF_COLORS.Hard },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Top Header & Campus Drilldown Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border-dark)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-[var(--color-accent-cyan)]" />
              Comprehensive Analytics Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
              Minute-Level Live
            </span>
          </div>
          <p className="text-xs text-[var(--color-neutral-silver)] mt-1.5">
            Deep performance intelligence across all 5 partner engineering colleges and individual campus cohorts.
          </p>
        </div>

        {/* Action Controls: Campus Switcher & Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--color-surface-card)] border border-[var(--color-border-dark)] px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-gray-400">View:</span>
            <select
              value={selectedCampusId}
              onChange={(e) => setSelectedCampusId(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-white cursor-pointer focus:outline-none"
            >
              <option value="ALL" className="bg-[#0b1739] text-white">
                🌐 All Campuses (Platform Overview)
              </option>
              {campusMetrics.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0b1739] text-white">
                  🏫 {c.name} {c.region ? `(${c.region})` : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: CAMPUS SPECIFIC DRILL-DOWN */}
      {selectedCampus ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Campus Drilldown Banner */}
          <div className="alta-card p-6 border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-[var(--color-surface-card)] to-blue-950/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[11px] font-black uppercase tracking-wider">
                    Campus Deep Dive
                  </span>
                  <span className="text-xs text-gray-400">{selectedCampus.region || "Partner Institution"}</span>
                </div>
                <h2 className="text-2xl font-black text-white mt-1">{selectedCampus.name}</h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCampusId("ALL")}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                >
                  ← Back to All Campuses
                </button>
                <Link
                  href="/superadmin/campuses"
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold transition-all flex items-center gap-1"
                >
                  Manage Campus & Admins <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Campus Admins Contact Bar */}
            <div className="pt-3 border-t border-[var(--color-border-dark)]/60 flex flex-wrap items-center gap-4 text-xs">
              <span className="text-gray-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Campus Admin(s):
              </span>
              {selectedCampus.admins.length > 0 ? (
                selectedCampus.admins.map((adm) => (
                  <span
                    key={adm.id}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3 h-3" /> {adm.name} ({adm.email})
                  </span>
                ))
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" /> No Admin Assigned Yet
                </span>
              )}
            </div>
          </div>

          {/* Campus KPI Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="alta-card p-4 space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Students</span>
              <div className="text-2xl font-black text-white">{selectedCampus.studentCount}</div>
              <p className="text-[11px] text-cyan-400 font-semibold">Registered</p>
            </div>

            <div className="alta-card p-4 space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Streaks</span>
              <div className="text-2xl font-black text-orange-400 flex items-center gap-1">
                {selectedCampus.activeStreakCount} <Flame className="w-4 h-4 fill-orange-400 inline" />
              </div>
              <p className="text-[11px] text-gray-400">Avg {selectedCampus.avgStreak} days</p>
            </div>

            <div className="alta-card p-4 space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Submissions</span>
              <div className="text-2xl font-black text-white">{selectedCampus.totalSubmissions}</div>
              <p className="text-[11px] text-emerald-400 font-semibold">{selectedCampus.approvedSubmissions} approved</p>
            </div>

            <div className="alta-card p-4 space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending Review</span>
              <div className="text-2xl font-black text-amber-400">{selectedCampus.pendingSubmissions}</div>
              <p className="text-[11px] text-gray-400">Awaiting campus admin</p>
            </div>

            <div className="alta-card p-4 space-y-1 col-span-2 lg:col-span-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Approval Rate</span>
              <div className="text-2xl font-black text-emerald-400">{selectedCampus.approvalRate}%</div>
              <p className="text-[11px] text-gray-400">Verification health</p>
            </div>
          </div>

          {/* Campus Breakdown Charts (Year Distribution & Solved Difficulty) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campus Year Breakdown */}
            <div className="alta-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border-dark)] pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-cyan-400" /> Year-wise Cohorts in this Campus
                </h3>
                <span className="text-xs text-gray-400">{selectedCampus.studentCount} students total</span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedCampus.yearDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0d1e56",
                        borderColor: "rgba(59,195,226,0.3)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" name="Students" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Campus Difficulty Breakdown */}
            <div className="alta-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border-dark)] pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" /> Approved Solutions by Difficulty
                </h3>
                <span className="text-xs text-emerald-400 font-bold">{selectedCampus.approvedSubmissions} Solved</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-xs font-bold text-emerald-400 block">Easy</span>
                  <span className="text-2xl font-black text-white">{selectedCampus.difficultyBreakdown.Easy}</span>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-xs font-bold text-amber-400 block">Medium</span>
                  <span className="text-2xl font-black text-white">{selectedCampus.difficultyBreakdown.Medium}</span>
                </div>
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <span className="text-xs font-bold text-rose-400 block">Hard</span>
                  <span className="text-2xl font-black text-white">{selectedCampus.difficultyBreakdown.Hard}</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                Reflects problems solved and approved exclusively by students belonging to {selectedCampus.name}.
              </p>
            </div>
          </div>

          {/* Campus Top Performers & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Campus Students */}
            <div className="alta-card p-6 space-y-4">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 border-b border-[var(--color-border-dark)] pb-3">
                <Trophy className="w-4 h-4 text-amber-400" /> Campus Top Streakers
              </h3>
              {selectedCampus.topStudents.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No active streaks recorded yet for this campus.</p>
              ) : (
                <div className="divide-y divide-[var(--color-border-dark)]/60 text-xs">
                  {selectedCampus.topStudents.map((st, idx) => (
                    <div key={st.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-gray-400 w-5">#{idx + 1}</span>
                        <div>
                          <p className="font-bold text-white">{st.name}</p>
                          <p className="text-[10px] text-gray-400">
                            {st.year ? `Year ${st.year} • ` : ""}
                            {st.challengeName} (Day {st.currentDay})
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-orange-400 text-sm flex items-center gap-1">
                        {st.streak} <Flame className="w-3.5 h-3.5 fill-orange-400 inline" />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Submissions for this campus */}
            <div className="alta-card p-6 space-y-4">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 border-b border-[var(--color-border-dark)] pb-3">
                <Clock className="w-4 h-4 text-cyan-400" /> Recent Campus Submissions
              </h3>
              {selectedCampus.recentSubmissions.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No submissions recorded for this campus yet.</p>
              ) : (
                <div className="divide-y divide-[var(--color-border-dark)]/60 text-xs">
                  {selectedCampus.recentSubmissions.map((sub) => (
                    <div key={sub.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-white">
                          Day {sub.dayNumber}: {sub.problemTitle}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          By <span className="text-gray-300 font-semibold">{sub.studentName}</span> •{" "}
                          <span
                            className={
                              sub.difficulty.includes("Easy")
                                ? "text-emerald-400"
                                : sub.difficulty.includes("Hard")
                                ? "text-rose-400"
                                : "text-amber-400"
                            }
                          >
                            {sub.difficulty}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : sub.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {sub.status}
                        </span>
                        {sub.linkedinPostUrl && (
                          <a
                            href={sub.linkedinPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-sky-400 hover:text-white"
                            title="LinkedIn Post Proof"
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {sub.githubLink && (
                          <a
                            href={sub.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                            title="GitHub Code Proof"
                          >
                            <Github className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: OVERALL PLATFORM ANALYTICS */
        <div className="space-y-8 animate-fadeIn">
          {/* Executive KPI Matrix */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="alta-card p-4 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Students</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white">{summary.totalStudents}</div>
              <p className="text-[10px] text-cyan-400 font-semibold">Across 5 Campuses</p>
            </div>

            <div className="alta-card p-4 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Active Streakers</span>
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl font-black text-orange-400">{summary.activeEnrollments}</div>
              <p className="text-[10px] text-gray-400">Solving daily</p>
            </div>

            <div className="alta-card p-4 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Today&apos;s Solves</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">{summary.submissionsToday}</div>
              <p className="text-[10px] text-emerald-400 font-semibold">Submitted today</p>
            </div>

            <div className="alta-card p-4 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Proofs</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">{summary.totalSubmissions}</div>
              <p className="text-[10px] text-gray-400">Lifetime volume</p>
            </div>

            <div className="alta-card p-4 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Pending Review</span>
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">{summary.pendingSubmissions}</div>
              <p className="text-[10px] text-gray-400">Campus admin backlog</p>
            </div>

            <div className="alta-card p-4 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Approval Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{summary.approvalRate}%</div>
              <p className="text-[10px] text-emerald-400 font-semibold">Verification health</p>
            </div>
          </div>

          {/* Retention & Habit Milestones */}
          <div className="alta-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-dark)] pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Student Streak & Retention Funnel
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Habit formation tracking: students crossing 7-day, 14-day, 25-day, and 50-day milestones.
                </p>
              </div>
              <span className="text-xs text-cyan-400 font-bold">Goal: 25+ Days for Mock Interview</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                <span className="text-xs font-bold text-cyan-400 block">7+ Days Streak</span>
                <span className="text-2xl font-black text-white">{streakMilestones.streak7Plus}</span>
                <p className="text-[10px] text-gray-400 mt-1">Consistency habit formed</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-xs font-bold text-emerald-400 block">14+ Days Streak</span>
                <span className="text-2xl font-black text-white">{streakMilestones.streak14Plus}</span>
                <p className="text-[10px] text-gray-400 mt-1">2 weeks unbroken</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-xs font-bold text-amber-400 block">25+ Days Streak</span>
                <span className="text-2xl font-black text-white">{streakMilestones.streak25Plus}</span>
                <p className="text-[10px] text-amber-400/90 font-bold mt-1">Mock Interview Ready 🎓</p>
              </div>

              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                <span className="text-xs font-bold text-purple-400 block">50+ Days Streak</span>
                <span className="text-2xl font-black text-white">{streakMilestones.streak50Plus}</span>
                <p className="text-[10px] text-purple-400/90 font-bold mt-1">Elite Performer 👑</p>
              </div>
            </div>
          </div>

          {/* DETAILED 5-CAMPUS BENCHMARK TABLE */}
          <div className="alta-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border-dark)] pb-4">
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-400" /> 5 Partner Campuses Performance Matrix
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Side-by-side granular breakdown of students, streak volume, verification health, and local admins.
                </p>
              </div>
              <span className="text-xs font-bold text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg">
                Click &quot;Drill Down&quot; on any college to inspect details
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border-dark)] text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                    <th className="p-3 pl-4">Partner Campus</th>
                    <th className="p-3">Registered</th>
                    <th className="p-3">Active Streakers</th>
                    <th className="p-3">Avg Streak</th>
                    <th className="p-3">Max Streak</th>
                    <th className="p-3">Submissions</th>
                    <th className="p-3">Approval Rate</th>
                    <th className="p-3">Local Admin</th>
                    <th className="p-3 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-dark)]/60 text-xs">
                  {campusMetrics.map((camp) => (
                    <tr key={camp.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 pl-4">
                        <p className="font-extrabold text-white">{camp.name}</p>
                        <p className="text-[10px] text-gray-400">{camp.region}</p>
                      </td>
                      <td className="p-3 font-bold text-white">{camp.studentCount}</td>
                      <td className="p-3">
                        <span className="font-extrabold text-orange-400 flex items-center gap-1">
                          {camp.activeStreakCount} <Flame className="w-3.5 h-3.5 fill-orange-400 inline" />
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-gray-300">{camp.avgStreak} days</td>
                      <td className="p-3 font-extrabold text-cyan-400">{camp.maxStreak} days</td>
                      <td className="p-3">
                        <span className="font-bold text-white">{camp.totalSubmissions}</span>
                        {camp.pendingSubmissions > 0 && (
                          <span className="text-[10px] text-amber-400 ml-1 block">
                            ({camp.pendingSubmissions} pending)
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-emerald-400">{camp.approvalRate}%</span>
                      </td>
                      <td className="p-3">
                        {camp.admins.length > 0 ? (
                          <span className="text-emerald-300 font-semibold text-[11px]">
                            {camp.admins[0].name}
                          </span>
                        ) : (
                          <span className="text-rose-400 text-[10px] font-bold">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <button
                          onClick={() => setSelectedCampusId(camp.id)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold text-[11px] border border-cyan-500/30 transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          Drill Down <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Charts: Campus Comparison & Cohort Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Campus Students & Submissions Bar Chart */}
            <div className="alta-card p-6 space-y-4">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 border-b border-[var(--color-border-dark)] pb-3">
                <Building2 className="w-4 h-4 text-cyan-400" /> Campus Activity Comparison
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campusChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0d1e56",
                        borderColor: "rgba(59,195,226,0.3)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="students" name="Students" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="submissions" name="Submissions" fill="#34d399" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Year-wise Distribution Bar Chart */}
            <div className="alta-card p-6 space-y-4">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 border-b border-[var(--color-border-dark)] pb-3">
                <GraduationCap className="w-4 h-4 text-emerald-400" /> Graduation Cohorts Distribution
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0d1e56",
                        borderColor: "rgba(59,195,226,0.3)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="totalStudents" name="Enrolled" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="activeCount" name="Active Daily" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Additional Deep Dives: Difficulty Solved & Mock Interview / Rewards Pipelines */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Difficulty Breakdown */}
            <div className="alta-card p-6 space-y-4">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 border-b border-[var(--color-border-dark)] pb-3">
                <Layers className="w-4 h-4 text-cyan-400" /> Solved Difficulty Distribution
              </h3>
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={difficultyChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {difficultyChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0d1e56",
                        borderColor: "rgba(59,195,226,0.3)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-emerald-400 font-bold block">Easy</span>
                  <span className="font-extrabold text-white">{difficultyCount.Easy}</span>
                </div>
                <div>
                  <span className="text-amber-400 font-bold block">Medium</span>
                  <span className="font-extrabold text-white">{difficultyCount.Medium}</span>
                </div>
                <div>
                  <span className="text-rose-400 font-bold block">Hard</span>
                  <span className="font-extrabold text-white">{difficultyCount.Hard}</span>
                </div>
              </div>
            </div>

            {/* Mock Interview Pipeline */}
            <div className="alta-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border-dark)] pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-400" /> Mock Interview Pipeline
                </h3>
                <span className="text-xs text-amber-400 font-bold">{interviews.total} Total</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                  <span className="text-gray-400">Applications Queued</span>
                  <span className="font-black text-amber-400">{interviews.queued}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                  <span className="text-gray-400">Interviews Scheduled</span>
                  <span className="font-black text-cyan-400">{interviews.scheduled}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                  <span className="text-gray-400">Interviews Cleared (Passed)</span>
                  <span className="font-black text-emerald-400">{interviews.passed}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                  <span className="text-gray-400">Needs Retake (Failed)</span>
                  <span className="font-black text-rose-400">{interviews.failed}</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                Unlocked automatically when a student maintains a 25+ days daily streak.
              </p>
            </div>

            {/* Goodies & Rewards Pipeline */}
            <div className="alta-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border-dark)] pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Gift className="w-4 h-4 text-purple-400" /> Goodies & Swag Kit Status
                </h3>
                <span className="text-xs text-purple-400 font-bold">{goodies.eligible} Eligible</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                  <span className="text-gray-400">30+ Days Eligible Students</span>
                  <span className="font-black text-purple-400">{goodies.eligible}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                  <span className="text-gray-400">Claims Submitted</span>
                  <span className="font-black text-cyan-400">{goodies.claimed}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                  <span className="text-gray-400">Swag Kits Shipped</span>
                  <span className="font-black text-emerald-400">{goodies.shipped}</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                Students reaching Day 30 without grace days can claim an exclusive ALTA swag package.
              </p>
            </div>
          </div>

          {/* Live Recent Platform Submissions */}
          <div className="alta-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-dark)] pb-4">
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" /> Live Verification Activity Across All Campuses
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Real-time problem submission feed across the 5 partner colleges.</p>
              </div>
              <Link
                href="/superadmin/submissions"
                className="text-xs text-cyan-400 font-bold hover:underline flex items-center gap-1"
              >
                View Full Queue <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border-dark)] text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                    <th className="p-3 pl-4">Student</th>
                    <th className="p-3">Partner College</th>
                    <th className="p-3">Problem Solved</th>
                    <th className="p-3">Difficulty</th>
                    <th className="p-3">Proof Link</th>
                    <th className="p-3 pr-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-dark)]/60 text-xs">
                  {recentActivity.map((act) => (
                    <tr key={act.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 pl-4">
                        <p className="font-bold text-white">{act.studentName}</p>
                        {act.year && <p className="text-[10px] text-gray-400">Year {act.year}</p>}
                      </td>
                      <td className="p-3 text-gray-300 font-medium">{act.campusName}</td>
                      <td className="p-3">
                        <span className="font-bold text-cyan-400 block">Day {act.dayNumber}</span>
                        <span className="text-gray-300 text-[11px]">{act.problemTitle}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            act.difficulty.includes("Easy")
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : act.difficulty.includes("Hard")
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {act.difficulty}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {act.linkedinPostUrl && (
                            <a
                              href={act.linkedinPostUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-cyan-400 hover:underline text-[11px]"
                              title="LinkedIn Proof"
                            >
                              <Linkedin className="w-3 h-3" /> Post <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {act.githubLink && (
                            <a
                              href={act.githubLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-gray-300 hover:text-white hover:underline text-[11px]"
                              title="GitHub Code Proof"
                            >
                              <Github className="w-3 h-3" /> Code <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {!act.linkedinPostUrl && !act.githubLink && (
                            <span className="text-gray-500 text-[11px]">No link</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            act.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : act.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
