"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Flame,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  GraduationCap,
  Building2,
  Search,
  Check,
  X,
  Loader2,
  TrendingUp,
  Layers,
  Sparkles,
  Trophy,
  Filter,
  RefreshCw,
  Github,
  Linkedin,
  ArrowRight,
  Eye,
} from "lucide-react";
import StudentQuestionsModal from "@/components/StudentQuestionsModal";

interface CampusInfo {
  id: string;
  name: string;
  region?: string;
  admins: { id: string; name: string; email: string }[];
}

interface StudentRosterItem {
  id: string;
  name: string;
  email: string;
  year: number | null;
  trackName: string;
  currentDay: number;
  streakCount: number;
  longestStreak: number;
  status: string;
  totalSubmissions: number;
  approvedCount: number;
  pendingCount: number;
  lastActiveAt: string;
}

interface PendingSubmission {
  id: string;
  dayNumber: number;
  problemTitle: string;
  difficulty: string;
  topic: string;
  studentName: string;
  studentEmail: string;
  year: number | null;
  challengeName: string;
  submittedAt: string;
  linkedinPostUrl: string | null;
  githubLink: string | null;
  supportingLink: string | null;
  status: string;
}

interface CampusStatsData {
  campus: CampusInfo;
  kpis: {
    totalStudents: number;
    activeStreakers: number;
    avgStreak: number;
    maxStreak: number;
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
  difficultyCount: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  yearDistribution: {
    year: number;
    label: string;
    totalStudents: number;
    activeStreakers: number;
    avgStreak: number;
    totalSubmissions: number;
    approvedSubmissions: number;
    students: StudentRosterItem[];
  }[];
  allStudents: StudentRosterItem[];
  adminAssignedYear?: number | null;
  topStudents: {
    id: string;
    name: string;
    email: string;
    year: number | null;
    challengeName: string;
    streakCount: number;
    currentDay: number;
    status: string;
    questionsSolved?: number;
  }[];
  recentPendingSubmissions: PendingSubmission[];
}

export default function CampusAdminDashboard() {
  const [data, setData] = useState<CampusStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeYearTab, setActiveYearTab] = useState<"ALL" | 1 | 2 | 3 | 4>("ALL");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string>("");

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to load campus data");
      const json = await res.json();
      setData(json);
      if (json.adminAssignedYear) {
        setActiveYearTab(json.adminAssignedYear);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Quick Review Handler for Pending Submissions
  const handleReviewSubmission = async (
    id: string,
    status: "APPROVED" | "REJECTED",
    reason?: string
  ) => {
    try {
      setProcessingId(id);
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          rejectionReason: reason || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to update submission");
      setActionSuccess(`Submission marked as ${status}!`);
      fetchDashboardStats();
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to process submission");
    } finally {
      setProcessingId(null);
    }
  };

  // Filter students based on active year tab and search query
  const filteredStudents = useMemo(() => {
    if (!data) return [];
    let list =
      activeYearTab === "ALL"
        ? data.allStudents
        : data.yearDistribution.find((y) => y.year === activeYearTab)?.students || [];

    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.trackName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, activeYearTab, studentSearch]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[var(--color-accent-cyan)] animate-spin" />
        <p className="text-xs text-[var(--color-neutral-silver)] font-medium">
          Loading campus dashboard, students & analytics...
        </p>
      </div>
    );
  }

  const { campus, kpis, streakMilestones, difficultyCount, yearDistribution, topStudents, recentPendingSubmissions } = data;

  return (
    <div className="space-y-8 pb-16">
      {/* NO DUPLICATE HEADER: Header is rendered by layout.tsx! */}

      {/* Campus Identity Banner */}
      <div className="alta-card p-6 border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-[var(--color-surface-card)] to-blue-950/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[11px] font-black uppercase tracking-wider">
                {data.adminAssignedYear ? `Year ${data.adminAssignedYear} Campus Coordinator` : "Campus Admin (All Cohorts)"}
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {campus.region || "Institutional Dashboard"}
              </span>
              {data.adminAssignedYear && (
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-cyan-200 text-[10px] font-bold border border-cyan-400/30">
                  Scoped: Year {data.adminAssignedYear} Students Only
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5 flex items-center gap-2">
              <Building2 className="w-7 h-7 text-[var(--color-accent-cyan)]" />
              {campus.name}
            </h1>
            <p className="text-xs text-[var(--color-neutral-silver)] mt-1">
              {data.adminAssignedYear
                ? `Overseeing and verifying daily DSA solutions for ${data.adminAssignedYear === 1 ? "1st" : data.adminAssignedYear === 2 ? "2nd" : data.adminAssignedYear === 3 ? "3rd" : "4th"} year engineering students.`
                : "Local verification console, student tracking, and year-wise cohort analytics across all batches."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardStats}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh Stats</span>
            </button>
            <Link
              href="/admin/queue"
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5"
            >
              Verification Queue ({kpis.pendingSubmissions}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {actionSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {actionSuccess}
          </div>
        )}
      </div>

      {/* Campus KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="alta-card p-4 space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Registered</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{kpis.totalStudents}</div>
          <p className="text-[10px] text-cyan-400 font-semibold">Enrolled Students</p>
        </div>

        <div className="alta-card p-4 space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Streakers</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400 flex items-center gap-1">
            {kpis.activeStreakers} <Flame className="w-4 h-4 fill-orange-400 inline" />
          </div>
          <p className="text-[10px] text-gray-400">Avg {kpis.avgStreak} days streak</p>
        </div>

        <div className="alta-card p-4 space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Review</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{kpis.pendingSubmissions}</div>
          <p className="text-[10px] text-amber-400 font-semibold">Action needed</p>
        </div>

        <div className="alta-card p-4 space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Solves Today</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{kpis.submissionsToday}</div>
          <p className="text-[10px] text-emerald-400 font-semibold">Today&apos;s activity</p>
        </div>

        <div className="alta-card p-4 space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Approved Proofs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{kpis.approvedSubmissions}</div>
          <p className="text-[10px] text-gray-400">{kpis.totalSubmissions} total proofs</p>
        </div>

        <div className="alta-card p-4 space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Approval Rate</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{kpis.approvalRate}%</div>
          <p className="text-[10px] text-emerald-400 font-semibold">Verification health</p>
        </div>
      </div>

      {/* Year-Wise Summary Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cyan-400" /> Year-Wise Cohorts Breakdown
          </h2>
          <span className="text-xs text-gray-400">Students grouped by graduation batch</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {yearDistribution.map((yd) => (
            <div
              key={yd.year}
              onClick={() => setActiveYearTab(yd.year as any)}
              className={`alta-card p-4 space-y-2 cursor-pointer transition-all border ${
                activeYearTab === yd.year
                  ? "border-cyan-400 bg-cyan-950/20 shadow-md shadow-cyan-500/10"
                  : "hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white bg-white/5 px-2.5 py-0.5 rounded-md">
                    {yd.label}
                  </span>
                  {data.adminAssignedYear === yd.year && (
                    <span className="text-[10px] font-black text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-400/30">
                      ★ Your Cohort
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-cyan-400">
                  {yd.totalStudents} Students
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xl font-black text-white">{yd.activeStreakers}</span>
                  <span className="text-[10px] text-gray-400 ml-1">Active Streakers</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-orange-400">{yd.avgStreak}d</span>
                  <span className="text-[10px] text-gray-400 ml-1">Avg</span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                <span>{yd.approvedSubmissions} verified solves</span>
                <span className="text-cyan-400 font-bold hover:underline">View Roster →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK VERIFICATION QUEUE ACTION (If pending submissions exist) */}
      {recentPendingSubmissions.length > 0 && (
        <div className="alta-card p-6 space-y-4 border-amber-500/30 bg-gradient-to-b from-amber-950/10 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border-dark)] pb-4">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Pending Submissions Needing Your Verification
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Review your campus students&apos; solution proofs directly here or via the full queue.
              </p>
            </div>
            <Link
              href="/admin/queue"
              className="text-xs text-cyan-400 font-bold hover:underline inline-flex items-center gap-1"
            >
              Open Full Verification Queue ({kpis.pendingSubmissions}) →
            </Link>
          </div>

          <div className="divide-y divide-[var(--color-border-dark)]/60 text-xs">
            {recentPendingSubmissions.slice(0, 5).map((sub) => (
              <div key={sub.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white">{sub.studentName}</span>
                    {sub.year && (
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-300 text-[10px] font-semibold">
                        Year {sub.year}
                      </span>
                    )}
                    <span className="text-gray-400 text-[11px]">({sub.studentEmail})</span>
                  </div>
                  <p className="text-gray-300 font-medium">
                    <span className="text-cyan-400 font-bold">Day {sub.dayNumber}:</span> {sub.problemTitle}{" "}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-1 ${
                        sub.difficulty.includes("Easy")
                          ? "bg-emerald-500/10 text-emerald-400"
                          : sub.difficulty.includes("Hard")
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {sub.difficulty}
                    </span>
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    {sub.linkedinPostUrl && (
                      <a
                        href={sub.linkedinPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:underline font-bold text-[11px]"
                      >
                        <Linkedin className="w-3 h-3" /> LinkedIn Post <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {sub.githubLink && (
                      <a
                        href={sub.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-gray-300 hover:underline font-bold text-[11px]"
                      >
                        <Github className="w-3 h-3" /> GitHub Solution <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Review Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => handleReviewSubmission(sub.id, "APPROVED")}
                    disabled={processingId === sub.id}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt("Enter reason for rejection (optional):");
                      handleReviewSubmission(sub.id, "REJECTED", reason || undefined);
                    }}
                    disabled={processingId === sub.id}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAILED STUDENT DIRECTORY (YEAR-WISE ROSTER) */}
      <div className="alta-card p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border-dark)] pb-4">
          <div>
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" /> Campus Student Directory & Streaks
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Live tracking of student streaks, active track progress, and verification status.
            </p>
          </div>

          {/* Year Filter Pills & Student Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold">
              {(["ALL", 1, 2, 3, 4] as const).map((yr) => (
                <button
                  key={yr}
                  onClick={() => setActiveYearTab(yr)}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
                    activeYearTab === yr
                      ? "bg-cyan-500 text-slate-950 font-black shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <span>{yr === "ALL" ? "All Years" : `Year ${yr}`}</span>
                  {data.adminAssignedYear === yr && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student or track..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="alta-input pl-8 py-1.5 text-xs w-56"
              />
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border-dark)] text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                <th className="p-3 pl-4">Student</th>
                <th className="p-3">Year</th>
                <th className="p-3">Enrolled Track</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Active Streak</th>
                <th className="p-3">Questions Attempted</th>
                <th className="p-3">Status</th>
                <th className="p-3 pr-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-dark)]/60 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400">
                    <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="font-bold text-gray-300">No students found</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      No students match the selected year filter or search criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => (
                  <tr
                    key={stu.id}
                    onClick={() => setSelectedStudentId(stu.id)}
                    className="hover:bg-cyan-500/[0.07] hover:border-cyan-500/20 transition-all cursor-pointer group"
                    title="Click to view attempted questions"
                  >
                    <td className="p-3 pl-4">
                      <p className="font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                        {stu.name}
                      </p>
                      <p className="text-[10px] text-gray-400">{stu.email}</p>
                    </td>
                    <td className="p-3 font-semibold text-gray-300">
                      {stu.year ? `Year ${stu.year}` : "Unassigned"}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-cyan-400">{stu.trackName}</span>
                    </td>
                    <td className="p-3 text-gray-300 font-medium">Day {stu.currentDay}</td>
                    <td className="p-3">
                      <span className="font-black text-orange-400 text-sm flex items-center gap-1">
                        {stu.streakCount} <Flame className="w-3.5 h-3.5 fill-orange-400 inline" />
                      </span>
                      {stu.longestStreak > stu.streakCount && (
                        <span className="text-[10px] text-gray-400 block">Best: {stu.longestStreak}d</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-white flex items-center gap-1">
                          <span className="text-cyan-300">{stu.totalSubmissions}</span>
                          <span className="text-gray-400 text-[10px] font-normal">attempted</span>
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-400">
                          {stu.approvedCount} approved
                          {stu.pendingCount > 0 && (
                            <span className="text-amber-400 ml-1">({stu.pendingCount} pending)</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          stu.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : stu.status === "COMPLETED"
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                        }`}
                      >
                        {stu.status}
                      </span>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudentId(stu.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500 hover:text-black transition-all text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
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

      {/* CAMPUS LEADERBOARD & DIFFICULTY DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campus Leaderboard Champions */}
        <div className="alta-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border-dark)] pb-3">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> Campus Streak Champions
            </h3>
            <span className="text-xs text-gray-400">Top performers at {campus.name}</span>
          </div>

          {topStudents.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No active streaks recorded yet.</p>
          ) : (
            <div className="divide-y divide-[var(--color-border-dark)]/60 text-xs">
              {topStudents.map((st, idx) => (
                <div
                  key={`${st.id}-${idx}`}
                  onClick={() => setSelectedStudentId(st.id)}
                  className="py-2.5 px-2 rounded-lg flex items-center justify-between hover:bg-cyan-500/[0.08] transition-colors cursor-pointer group"
                  title="Click to view attempted questions"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-black text-gray-400 w-5">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </span>
                    <div>
                      <p className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {st.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {st.year ? `Year ${st.year} • ` : ""}
                        {st.challengeName} (Day {st.currentDay})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-orange-400 text-sm flex items-center justify-end gap-1">
                      {st.streakCount} <Flame className="w-3.5 h-3.5 fill-orange-400 inline" />
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold block">
                      {st.questionsSolved ?? 0} solved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Difficulty Distribution */}
        <div className="alta-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border-dark)] pb-3">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Solved Problems by Difficulty
            </h3>
            <span className="text-xs text-emerald-400 font-bold">{kpis.approvedSubmissions} Solved</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-xs font-bold text-emerald-400 block">Easy</span>
              <span className="text-2xl font-black text-white">{difficultyCount.Easy}</span>
              <p className="text-[10px] text-gray-400 mt-1">Foundational</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-xs font-bold text-amber-400 block">Medium</span>
              <span className="text-2xl font-black text-white">{difficultyCount.Medium}</span>
              <p className="text-[10px] text-gray-400 mt-1">Core Interview</p>
            </div>
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
              <span className="text-xs font-bold text-rose-400 block">Hard</span>
              <span className="text-2xl font-black text-white">{difficultyCount.Hard}</span>
              <p className="text-[10px] text-gray-400 mt-1">Advanced</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <span className="text-gray-300 font-bold">25+ Days Mock Interview Milestone:</span>
            <span className="font-black text-amber-400 text-sm">
              {streakMilestones.streak25Plus} Students Eligible 🎓
            </span>
          </div>
        </div>
      </div>

      {/* STUDENT QUESTIONS MODAL */}
      <StudentQuestionsModal
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
}
