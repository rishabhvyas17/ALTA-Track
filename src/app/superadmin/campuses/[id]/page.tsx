"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Users,
  Flame,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  UserPlus,
  ArrowLeft,
  Loader2,
  AlertCircle,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  Trophy,
  Linkedin,
  Github,
  X,
  UserCheck,
  Pencil,
  Trash2,
  Key,
} from "lucide-react";

interface CampusDetails {
  id: string;
  name: string;
  region: string;
  createdAt: string;
  admins: { id: string; name: string; email: string; year?: number | null; createdAt?: string }[];
  studentCount: number;
  enrolledCount?: number;
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

export default function CampusDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campusId = params?.id as string;

  const [campus, setCampus] = useState<CampusDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State for Adding Campus Admin
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminYear, setAdminYear] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Modal State for Editing Campus Admin
  const [editingAdmin, setEditingAdmin] = useState<{
    id: string;
    name: string;
    email: string;
    year?: number | null;
  } | null>(null);
  const [editName, setEditName] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [updatingAdmin, setUpdatingAdmin] = useState(false);
  const [editModalError, setEditModalError] = useState("");
  const [editModalSuccess, setEditModalSuccess] = useState("");

  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState("");

  useEffect(() => {
    if (campusId) {
      fetchCampusData();
    }
  }, [campusId]);

  const fetchCampusData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch base campus record with complete admin roster
      const campusRes = await fetch(`/api/superadmin/campuses/${campusId}`);
      if (!campusRes.ok) throw new Error("Campus not found");
      const campusData = await campusRes.json();
      const baseCampus = campusData.campus;

      // Fetch stats for live performance analytics
      const statsRes = await fetch("/api/superadmin/stats");
      const statsData = statsRes.ok ? await statsRes.json() : null;
      const matched = statsData?.campusMetrics?.find((c: any) => c.id === campusId);

      setCampus({
        id: baseCampus.id,
        name: baseCampus.name,
        region: baseCampus.region,
        createdAt: baseCampus.createdAt,
        admins: baseCampus.users || [],
        studentCount: matched ? matched.studentCount : (baseCampus._count?.users || 0),
        enrolledCount: matched?.enrolledCount ?? (matched ? matched.studentCount : 0),
        activeStreakCount: matched?.activeStreakCount || 0,
        avgStreak: matched?.avgStreak || 0,
        maxStreak: matched?.maxStreak || 0,
        totalSubmissions: matched?.totalSubmissions || 0,
        approvedSubmissions: matched?.approvedSubmissions || 0,
        pendingSubmissions: matched?.pendingSubmissions || 0,
        rejectedSubmissions: matched?.rejectedSubmissions || 0,
        approvalRate: matched?.totalSubmissions > 0
          ? Math.round((matched.approvedSubmissions / matched.totalSubmissions) * 100)
          : 100,
        yearDistribution: matched?.yearDistribution || [],
        difficultyBreakdown: matched?.difficultyBreakdown || { Easy: 0, Medium: 0, Hard: 0 },
        topStudents: matched?.topStudents || (matched?.topStudent ? [matched.topStudent] : []),
        recentSubmissions: matched?.recentSubmissions || [],
      });
    } catch (err: any) {
      setError(err.message || "Failed to load campus details");
    } finally {
      setLoading(false);
    }
  };

  const openEditAdminModal = (adm: { id: string; name: string; email: string; year?: number | null }) => {
    setEditingAdmin(adm);
    setEditName(adm.name);
    setEditYear(adm.year !== null && adm.year !== undefined ? String(adm.year) : "");
    setEditPassword("");
    setEditModalError("");
    setEditModalSuccess("");
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campus || !editingAdmin) return;

    setUpdatingAdmin(true);
    setEditModalError("");
    setEditModalSuccess("");

    try {
      const res = await fetch(`/api/superadmin/campuses/${campus.id}/admins/${editingAdmin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          year: editYear ? Number(editYear) : null,
          password: editPassword.trim() ? editPassword : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update admin account");

      setEditModalSuccess("Campus Admin updated successfully!");
      fetchCampusData();
      setTimeout(() => {
        setEditingAdmin(null);
        setEditModalSuccess("");
      }, 900);
    } catch (err: any) {
      setEditModalError(err.message || "Failed to update campus admin");
    } finally {
      setUpdatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!campus) return;
    if (
      !confirm(
        `Are you sure you want to remove ${adminName} as Campus Admin? This will revoke their administrative credentials.`
      )
    ) {
      return;
    }

    try {
      setDeletingAdminId(adminId);
      const res = await fetch(`/api/superadmin/campuses/${campus.id}/admins/${adminId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete admin");

      setActionNotice(`Campus Admin ${adminName} was removed successfully.`);
      fetchCampusData();
      setTimeout(() => setActionNotice(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to remove admin");
    } finally {
      setDeletingAdminId(null);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campus) return;

    setCreatingAdmin(true);
    setModalError("");
    setModalSuccess("");

    try {
      const res = await fetch(`/api/superadmin/campuses/${campus.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          year: adminYear ? Number(adminYear) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign admin account");

      setModalSuccess(
        data.message || `Campus Admin privileges granted to ${adminEmail}!`
      );
      fetchCampusData();
      setTimeout(() => {
        setShowAddAdminModal(false);
        setAdminName("");
        setAdminEmail("");
        setAdminPassword("");
        setAdminYear("");
        setModalSuccess("");
      }, 1500);
    } catch (err: any) {
      setModalError(err.message || "Failed to assign admin account");
    } finally {
      setCreatingAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 text-[#3bc3e2] animate-spin" />
        <p className="text-xs text-slate-400 font-semibold">Loading campus metrics...</p>
      </div>
    );
  }

  if (error || !campus) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Link
          href="/superadmin/campuses"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#3bc3e2] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Campuses
        </Link>
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <h3 className="font-extrabold text-base">Campus Not Found</h3>
          <p className="text-xs text-slate-400">{error || "Could not retrieve metrics for this campus."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/superadmin/campuses"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#3bc3e2]" /> Back to All Campuses
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setShowAddAdminModal(true);
              setAdminName("");
              setAdminEmail("");
              setAdminPassword("");
              setAdminYear("");
              setModalError("");
              setModalSuccess("");
            }}
            className="px-3.5 py-2 rounded-xl bg-[#3bc3e2]/15 hover:bg-[#3bc3e2]/25 text-[#3bc3e2] text-xs font-bold border border-[#3bc3e2]/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> + Add Campus Admin
          </button>
          <Link
            href={`/superadmin/stats?campusId=${campus.id}`}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition-all flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> Stats Deep Dive
          </Link>
        </div>
      </div>

      {/* Campus Header Banner */}
      <div className="alta-card p-6 sm:p-7 border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-[var(--color-surface-card)] to-blue-950/30 space-y-4 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[11px] font-black uppercase tracking-wider">
                Partner Institution
              </span>
              <span className="text-xs text-gray-400">{campus.region || "Official College"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{campus.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> {campus.studentCount} Active Students
            </span>
          </div>
        </div>

        {/* Admins Contact Bar & Management */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Assigned Campus Admins ({campus.admins?.length || 0}):
            </span>
            <button
              onClick={() => {
                setShowAddAdminModal(true);
                setAdminName("");
                setAdminEmail("");
                setAdminPassword("");
                setAdminYear("");
                setModalError("");
                setModalSuccess("");
              }}
              className="text-xs text-[#3bc3e2] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> + Add Another Admin
            </button>
          </div>

          {actionNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold animate-fadeIn">
              {actionNotice}
            </div>
          )}

          {campus.admins && campus.admins.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {campus.admins.map((adm) => (
                <div
                  key={adm.id}
                  className="p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-2"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{adm.name}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                          adm.year
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {adm.year ? `Year ${adm.year}` : "All Years"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{adm.email}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      title="Edit Admin"
                      onClick={() => openEditAdminModal(adm)}
                      className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete Admin"
                      disabled={deletingAdminId === adm.id}
                      onClick={() => handleDeleteAdmin(adm.id, adm.name)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {deletingAdminId === adm.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> No Admin Assigned (Click "+ Add Campus Admin" to provision a campus coordinator)
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="alta-card p-4 space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Students</span>
          <div className="text-2xl font-black text-white">{campus.studentCount}</div>
          <p className="text-[11px] text-cyan-400 font-semibold">{campus.enrolledCount ?? campus.studentCount} Enrolled</p>
        </div>

        <div className="alta-card p-4 space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Active Streaks</span>
          <div className="text-2xl font-black text-orange-400 flex items-center gap-1">
            {campus.activeStreakCount} <Flame className="w-4 h-4 fill-orange-400 inline" />
          </div>
          <p className="text-[11px] text-gray-400">Avg {campus.avgStreak} days streak</p>
        </div>

        <div className="alta-card p-4 space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Questions Solved</span>
          <div className="text-2xl font-black text-emerald-400">{campus.approvedSubmissions}</div>
          <p className="text-[11px] text-emerald-400 font-semibold">{campus.totalSubmissions} proofs total</p>
        </div>

        <div className="alta-card p-4 space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Pending Review</span>
          <div className="text-2xl font-black text-amber-400">{campus.pendingSubmissions}</div>
          <p className="text-[11px] text-gray-400">Awaiting admin review</p>
        </div>

        <div className="alta-card p-4 space-y-1 col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Approval Rate</span>
          <div className="text-2xl font-black text-emerald-400">{campus.approvalRate}%</div>
          <p className="text-[11px] text-gray-400">Verification health</p>
        </div>
      </div>

      {/* Two Column Layout: Difficulty Breakdown & Year Cohorts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Difficulty Breakdown */}
        <div className="alta-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Solved Questions by Difficulty
            </h3>
            <span className="text-xs text-emerald-400 font-bold">{campus.approvedSubmissions} Solved</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-xs font-bold text-emerald-400 block">Easy (1 pt)</span>
              <span className="text-2xl font-black text-white mt-1 block">
                {campus.difficultyBreakdown?.Easy ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-xs font-bold text-amber-400 block">Medium (2 pts)</span>
              <span className="text-2xl font-black text-white mt-1 block">
                {campus.difficultyBreakdown?.Medium ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
              <span className="text-xs font-bold text-rose-400 block">Hard (3 pts)</span>
              <span className="text-2xl font-black text-white mt-1 block">
                {campus.difficultyBreakdown?.Hard ?? 0}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            Reflects problems solved and approved exclusively by students from {campus.name}.
          </p>
        </div>

        {/* Year Distribution */}
        <div className="alta-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" /> Cohort Enrollment by Year
            </h3>
            <span className="text-xs text-cyan-400 font-bold">{campus.studentCount} Students</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((yr) => {
              const match = campus.yearDistribution?.find((y) => y.year === yr);
              return (
                <div key={yr} className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-center">
                  <span className="text-[11px] text-gray-400 font-bold block">Year {yr}</span>
                  <span className="text-xl font-black text-white mt-0.5 block">{match?.count ?? 0}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Students</span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400">
            Tracks distribution of undergraduate students participating across different academic years.
          </p>
        </div>
      </div>

      {/* Top Students Roster */}
      <div className="alta-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Top Streakers from {campus.name}
          </h3>
          <span className="text-xs text-gray-400 font-medium">Top 5 performers</span>
        </div>

        {campus.topStudents && campus.topStudents.length > 0 ? (
          <div className="divide-y divide-white/5">
            {campus.topStudents.map((st, idx) => (
              <div key={`${st.id}-${idx}`} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-300">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                  </span>
                  <div>
                    <p className="font-bold text-white text-sm">{st.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {st.year ? `Year ${st.year} • ` : ""}
                      {st.challengeName} (Day {st.currentDay})
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-orange-400 text-sm flex items-center justify-end gap-1">
                    {st.streak} <Flame className="w-3.5 h-3.5 fill-orange-400 inline" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 py-4 text-center">No active student streakers found yet.</p>
        )}
      </div>

      {/* Recent Submissions Feed */}
      <div className="alta-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Recent Submissions from {campus.name}
          </h3>
          <span className="text-xs text-gray-400 font-medium">Live campus feed</span>
        </div>

        {campus.recentSubmissions && campus.recentSubmissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[11px] text-gray-400 uppercase font-bold">
                  <th className="p-3">Student</th>
                  <th className="p-3">Problem</th>
                  <th className="p-3">Difficulty</th>
                  <th className="p-3">Proof Links</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campus.recentSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-bold text-white">{sub.studentName}</td>
                    <td className="p-3 text-gray-300">
                      Day {sub.dayNumber}: {sub.problemTitle}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.difficulty.includes("Easy")
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : sub.difficulty.includes("Hard")
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {sub.difficulty}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {sub.linkedinPostUrl && (
                          <a
                            href={sub.linkedinPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#3bc3e2] hover:underline"
                            title="LinkedIn Proof"
                          >
                            <Linkedin className="w-3 h-3" /> Post <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {sub.githubLink && (
                          <a
                            href={sub.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-gray-300 hover:text-white hover:underline"
                            title="GitHub Code Proof"
                          >
                            <Github className="w-3 h-3" /> Code <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {!sub.linkedinPostUrl && !sub.githubLink && (
                          <span className="text-gray-500">No link</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-400 py-4 text-center">No submissions recorded for this campus yet.</p>
        )}
      </div>

      {/* Add Admin Modal (With in-modal error and success feedback!) */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="alta-card p-6 sm:p-7 max-w-md w-full space-y-5 relative border border-[#3bc3e2]/40 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#3bc3e2]" /> Assign Campus Admin
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assign a student or coordinator for {campus.name}.
                </p>
              </div>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-Modal Feedback Alert */}
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-200">
              💡 <strong>Dedicated Role:</strong> Campus Admin accounts are dedicated faculty or college coordinator credentials separate from student accounts. Campus Admins verify daily DSA problem submissions and oversee campus cohorts.
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@campus.edu"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                  Assigned Year Cohort
                </label>
                <select
                  value={adminYear}
                  onChange={(e) => setAdminYear(e.target.value)}
                  className="alta-input w-full"
                >
                  <option value="">All Years (General Campus Admin)</option>
                  <option value="1">1st Year Students Only</option>
                  <option value="2">2nd Year Students Only</option>
                  <option value="3">3rd Year Students Only</option>
                  <option value="4">4th Year Students Only</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  This admin will exclusively verify daily problem submissions from students in the selected year.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="alta-button-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="alta-button text-xs font-extrabold flex items-center gap-2"
                >
                  {creatingAdmin ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Assign Admin Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Campus Admin */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="alta-card w-full max-w-md p-6 sm:p-8 space-y-6 relative border-[#3bc3e2]/40 shadow-2xl">
            <button
              onClick={() => setEditingAdmin(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#3bc3e2]/20 text-[#3bc3e2] text-[10px] font-black uppercase tracking-wider">
                  Campus Coordinator
                </span>
                <span className="text-xs text-slate-400">{campus.name}</span>
              </div>
              <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[#3bc3e2]" /> Edit Campus Admin
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Update coordinator details, academic year cohort scope, or reset password.
              </p>
            </div>

            {editModalError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                {editModalError}
              </div>
            )}

            {editModalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {editModalSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={editingAdmin.email}
                  className="alta-input w-full opacity-60 cursor-not-allowed bg-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">Email address is fixed to preserve audit logs.</p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                  Assigned Year Cohort
                </label>
                <select
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  className="alta-input w-full"
                >
                  <option value="">All Years (General Campus Admin)</option>
                  <option value="1">1st Year Students Only</option>
                  <option value="2">2nd Year Students Only</option>
                  <option value="3">3rd Year Students Only</option>
                  <option value="4">4th Year Students Only</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Controls which cohort this admin can see and verify in the queue.
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" /> Reset Password (Optional)
                </label>
                <input
                  type="password"
                  minLength={6}
                  placeholder="Leave blank to keep existing password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="alta-button-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingAdmin}
                  className="alta-button text-xs font-extrabold flex items-center gap-2 cursor-pointer"
                >
                  {updatingAdmin ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
