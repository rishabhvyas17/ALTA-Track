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
  Linkedin,
  Github,
  Search,
  Eye,
  Building2,
  BookOpen,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import StudentQuestionsModal from "@/components/StudentQuestionsModal";

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
    admins?: Array<{ id: string; name: string; email: string; year?: number | null }>;
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
    linkedinPostUrl?: string | null;
    githubLink?: string | null;
  }>;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"campuses" | "students" | "analytics" | "feed">("campuses");
  const [refreshing, setRefreshing] = useState(false);

  // Student Directory State
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<"ALL" | 1 | 2 | 3 | 4>("ALL");
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(studentSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const params = new URLSearchParams();
      if (selectedCampus !== "ALL") params.set("campusId", selectedCampus);
      if (selectedYear !== "ALL") params.set("year", selectedYear.toString());
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const res = await fetch(`/api/superadmin/students?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setStudents(json.students || []);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "students") {
      fetchStudents();
    }
  }, [activeTab, selectedCampus, selectedYear, debouncedSearch]);

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
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "students"
              ? "bg-[#3bc3e2]/20 text-[#3bc3e2] border border-[#3bc3e2]/30 shadow-lg shadow-cyan-500/10 font-black"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users className="w-4 h-4" /> Students Directory
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
          {/* Partner Campus Cards with Admin Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {campusMetrics.map((c) => (
              <div
                key={c.id}
                className="alta-card p-5 space-y-4 border border-white/10 hover:border-[#3bc3e2]/50 transition-all bg-[#0b1842]/90 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#3bc3e2]/10 border border-[#3bc3e2]/30 text-[10px] font-bold text-[#3bc3e2] truncate max-w-[170px]">
                      {c.region || "Official Campus"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-extrabold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> {c.admins?.length || 0} Admins
                    </span>
                  </div>

                  <Link href={`/superadmin/campuses/${c.id}`} className="block group/title">
                    <h3 className="text-base font-black text-white group-hover/title:text-[#3bc3e2] transition-colors flex items-center justify-between">
                      {c.name}
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover/title:text-[#3bc3e2] group-hover/title:translate-x-0.5 transition-all" />
                    </h3>
                  </Link>

                  <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1 text-[#3bc3e2]">
                      <Users className="w-3.5 h-3.5" /> {c.studentCount} Students
                    </span>
                    <span className="flex items-center gap-1 text-orange-400">
                      <Flame className="w-3.5 h-3.5 fill-orange-400" /> {c.activeStreakCount} Streaks
                    </span>
                  </div>

                  {/* Assigned Admins Roster */}
                  <div className="pt-2.5 border-t border-white/10 text-xs">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Assigned Campus Admins:
                    </span>
                    {c.admins && c.admins.length > 0 ? (
                      <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                        {c.admins.map((adm) => (
                          <div key={adm.id} className="text-[11px] text-slate-200 flex items-center justify-between font-semibold">
                            <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                              <span className="truncate">{adm.name}</span>
                              <span
                                className={`px-1.5 py-0.2 text-[9px] font-black rounded ${
                                  adm.year
                                    ? "bg-[#3bc3e2]/20 text-[#3bc3e2] border border-[#3bc3e2]/30"
                                    : "bg-slate-700/60 text-slate-300"
                                }`}
                              >
                                {adm.year ? `Y${adm.year}` : "All"}
                              </span>
                            </div>
                            <span className="text-slate-400 text-[10px] truncate max-w-[120px]">{adm.email}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-400 italic font-semibold">No admin assigned yet</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {c.approvedSubmissions} Solved
                  </span>
                  <Link
                    href={`/superadmin/campuses/${c.id}`}
                    className="text-xs font-bold text-[#3bc3e2] hover:underline flex items-center gap-1"
                  >
                    Manage Campus &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="alta-card overflow-hidden">
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.01]">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <School className="w-5 h-5 text-[#3bc3e2]" /> The 5 Official Partner Campuses Benchmark
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time side-by-side performance benchmarks for partner engineering institutes.
                </p>
              </div>

              <Link
                href="/superadmin/campuses"
                className="text-xs font-bold text-[#3bc3e2] hover:underline flex items-center gap-1"
              >
                Provision Admins <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Campus</th>
                    <th className="p-4">Region</th>
                    <th className="p-4">Admins</th>
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
                        <Link href={`/superadmin/campuses/${c.id}`} className="font-extrabold text-white text-sm hover:text-[#3bc3e2] transition-colors">
                          {c.name}
                        </Link>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">
                        {c.region}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5 w-fit">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {c.admins?.length || 0} Admins
                          </span>
                          {c.admins && c.admins.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {c.admins.map((a) => (
                                <span
                                  key={a.id}
                                  className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                    a.year
                                      ? "bg-[#3bc3e2]/20 text-[#3bc3e2] border border-[#3bc3e2]/30"
                                      : "bg-slate-800 text-slate-300"
                                  }`}
                                  title={`${a.name} (${a.year ? `Year ${a.year}` : "All Years"})`}
                                >
                                  {a.year ? `Y${a.year}` : "All"}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
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

      {/* TAB 2: CAMPUS & YEAR STUDENTS DIRECTORY */}
      {activeTab === "students" && (
        <div className="space-y-6">
          {/* Controls Bar: Campus dropdown, Year toggle, Search input */}
          <div className="alta-card p-5 space-y-4 border border-white/10 bg-[#0b1842]/90">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#3bc3e2]" /> Campus-Wise & Year-Wise Students Directory
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Filter students across partner campuses and cohorts. Click any student row to view every question they attempted.
                </p>
              </div>

              {/* Count badge & Refresh */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#3bc3e2]/10 border border-[#3bc3e2]/30 text-xs font-black text-[#3bc3e2]">
                  {students.length} Students Found
                </span>
                <button
                  onClick={fetchStudents}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Refresh student roster"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${studentsLoading ? "animate-spin text-[#3bc3e2]" : ""}`} />
                </button>
              </div>
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-3">
                {/* Campus Filter */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#3bc3e2]" /> College:
                  </span>
                  <select
                    value={selectedCampus}
                    onChange={(e) => setSelectedCampus(e.target.value)}
                    className="alta-input py-1.5 text-xs w-52 bg-[#071130]"
                  >
                    <option value="ALL">All Partner Campuses</option>
                    {stats?.campusMetrics?.map((camp) => (
                      <option key={camp.id} value={camp.id}>
                        {camp.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Filter */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl text-xs font-bold border border-white/10">
                  {(["ALL", 1, 2, 3, 4] as const).map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setSelectedYear(yr)}
                      className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                        selectedYear === yr
                          ? "bg-[#3bc3e2] text-slate-950 font-black shadow-sm"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {yr === "ALL" ? "All Years" : `Year ${yr}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="alta-input pl-8 py-1.5 text-xs w-full"
                />
              </div>
            </div>
          </div>

          {/* Student Table */}
          <div className="alta-card overflow-hidden border border-white/10 bg-[#0b1842]/90">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="p-3.5 pl-6">Student</th>
                    <th className="p-3.5">Campus</th>
                    <th className="p-3.5">Year</th>
                    <th className="p-3.5">Enrolled Track</th>
                    <th className="p-3.5">Active Streak</th>
                    <th className="p-3.5">Questions Attempted</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {studentsLoading ? (
                    <tr>
                      <td colSpan={8} className="p-16 text-center text-slate-400">
                        <Loader2 className="w-8 h-8 text-[#3bc3e2] animate-spin mx-auto mb-2" />
                        <p className="font-bold text-slate-300">Loading student directory...</p>
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-16 text-center text-slate-400">
                        <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                        <p className="font-bold text-sm text-slate-300">No students found</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Try changing your campus, year filter, or search query.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    students.map((stu) => (
                      <tr
                        key={stu.id}
                        onClick={() => setSelectedStudentId(stu.id)}
                        className="hover:bg-[#3bc3e2]/[0.08] hover:border-cyan-500/20 transition-all cursor-pointer group"
                        title="Click to view attempted questions"
                      >
                        <td className="p-3.5 pl-6">
                          <p className="font-extrabold text-white group-hover:text-[#3bc3e2] transition-colors">
                            {stu.name}
                          </p>
                          <p className="text-[10px] text-slate-400">{stu.email}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 text-[11px] font-semibold border border-sky-500/20">
                            {stu.campus?.name || "Global Campus"}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-300">
                          {stu.year ? `Year ${stu.year}` : "—"}
                        </td>
                        <td className="p-3.5">
                          <span className="font-extrabold text-[#3bc3e2]">{stu.trackName}</span>
                          <span className="text-[10px] text-slate-400 block">Day {stu.currentDay}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-black text-amber-400 text-sm flex items-center gap-1">
                            {stu.streakCount} <Flame className="w-3.5 h-3.5 fill-amber-400 inline" />
                          </span>
                          {stu.longestStreak > stu.streakCount && (
                            <span className="text-[10px] text-slate-400 block">Best: {stu.longestStreak}d</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-white flex items-center gap-1">
                              <span className="text-[#3bc3e2]">{stu.totalAttempted}</span>
                              <span className="text-slate-400 text-[10px] font-normal">attempted</span>
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-400">
                              {stu.approvedCount} approved
                              {stu.pendingCount > 0 && (
                                <span className="text-amber-400 ml-1">({stu.pendingCount} pending)</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              stu.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : stu.status === "COMPLETED"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                            }`}
                          >
                            {stu.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-6 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentId(stu.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#3bc3e2]/10 text-[#3bc3e2] border border-[#3bc3e2]/20 hover:bg-[#3bc3e2] hover:text-black transition-all text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Questions</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {act.linkedinPostUrl && (
                            <a
                              href={act.linkedinPostUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[#3bc3e2] hover:underline"
                              title="LinkedIn Post Proof"
                            >
                              <Linkedin className="w-3 h-3" /> Post <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {act.githubLink && (
                            <a
                              href={act.githubLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-gray-300 hover:text-white hover:underline"
                              title="GitHub Code Proof"
                            >
                              <Github className="w-3 h-3" /> Code <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {!act.linkedinPostUrl && !act.githubLink && (
                            <span className="text-[11px] text-gray-500">No link</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* STUDENT QUESTIONS MODAL */}
      <StudentQuestionsModal
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
}
