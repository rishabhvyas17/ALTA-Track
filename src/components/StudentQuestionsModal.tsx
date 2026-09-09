"use client";

import { useEffect, useState, useMemo } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Flame,
  ExternalLink,
  Search,
  BookOpen,
  Calendar,
  Linkedin,
  Github,
  Award,
  Filter,
} from "lucide-react";

interface SubmissionItem {
  id: string;
  dayNumber: number;
  challengeId: string;
  challengeName: string;
  problemId: string;
  problemTitle: string;
  difficulty: string;
  topic: string;
  chapter?: string | null;
  externalLink?: string | null;
  status: "APPROVED" | "PENDING" | "REJECTED";
  submittedAt: string;
  rejectionReason?: string | null;
  linkedinPostUrl?: string | null;
  githubLink?: string | null;
  supportingLink?: string | null;
}

interface StudentDetailsData {
  student: {
    id: string;
    name: string;
    email: string;
    year: number | null;
    campus?: { id: string; name: string; region: string } | null;
    createdAt: string;
  };
  stats: {
    totalAttempted: number;
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
    activeStreak: number;
    longestStreak: number;
  };
  enrollments: Array<{
    id: string;
    challengeName: string;
    totalDays: number;
    currentDay: number;
    streakCount: number;
    longestStreak: number;
    status: string;
  }>;
  submissions: SubmissionItem[];
}

interface StudentQuestionsModalProps {
  studentId: string | null;
  onClose: () => void;
}

export default function StudentQuestionsModal({
  studentId,
  onClose,
}: StudentQuestionsModalProps) {
  const [data, setData] = useState<StudentDetailsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters inside modal
  const [statusFilter, setStatusFilter] = useState<"ALL" | "APPROVED" | "PENDING" | "REJECTED">("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<"ALL" | "EASY" | "MEDIUM" | "HARD">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!studentId) {
      setData(null);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/students/${studentId}`);
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Failed to load student details");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load student details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [studentId]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const filteredSubmissions = useMemo(() => {
    if (!data?.submissions) return [];
    return data.submissions.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (
        difficultyFilter !== "ALL" &&
        s.difficulty?.toUpperCase() !== difficultyFilter
      )
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = s.problemTitle?.toLowerCase().includes(q);
        const matchTopic = s.topic?.toLowerCase().includes(q);
        const matchChallenge = s.challengeName?.toLowerCase().includes(q);
        if (!matchTitle && !matchTopic && !matchChallenge) return false;
      }
      return true;
    });
  }, [data, statusFilter, difficultyFilter, searchQuery]);

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="alta-card w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-white/20 shadow-2xl bg-[#081232]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-white/[0.02]">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg shadow-cyan-500/20">
              {data?.student?.name ? data.student.name.charAt(0).toUpperCase() : "S"}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white truncate">
                  {data?.student?.name || "Student Profile"}
                </h3>
                {data?.student?.year && (
                  <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-cyan-300 text-xs font-bold border border-white/10">
                    Year {data.student.year}
                  </span>
                )}
                {data?.student?.campus?.name && (
                  <span className="px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-300 text-xs font-semibold border border-sky-500/20">
                    {data.student.campus.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {data?.student?.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
              <p className="text-xs font-bold text-gray-400">Loading student attempted questions...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
              <p className="text-sm font-bold text-rose-300">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/20 transition-all"
              >
                Close Window
              </button>
            </div>
          ) : data ? (
            <>
              {/* ENROLLED TRACKS */}
              {data.enrollments && data.enrollments.length > 0 && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                    Enrolled Tracks:
                  </span>
                  {data.enrollments.map((enr) => (
                    <div
                      key={enr.id}
                      className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs"
                    >
                      <span className="font-black text-cyan-300">{enr.challengeName}</span>
                      <span className="text-gray-400">• Day {enr.currentDay}/{enr.totalDays}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          enr.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-gray-500/20 text-gray-300"
                        }`}
                      >
                        {enr.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* STATS OVERVIEW CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* Total Questions Attempted */}
                <div className="alta-card p-3.5 bg-white/[0.03] border-white/10">
                  <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
                    <span>Attempted</span>
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-1">
                    {data.stats.totalAttempted}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Total Questions</p>
                </div>

                {/* Approved Solves */}
                <div className="alta-card p-3.5 bg-emerald-500/[0.05] border-emerald-500/20">
                  <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
                    <span>Approved</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-300 mt-1">
                    {data.stats.approvedCount}
                  </div>
                  <p className="text-[10px] text-emerald-400/80 mt-0.5">
                    {data.stats.totalAttempted > 0
                      ? `${Math.round((data.stats.approvedCount / data.stats.totalAttempted) * 100)}% verified`
                      : "0%"}
                  </p>
                </div>

                {/* Pending Submissions */}
                <div className="alta-card p-3.5 bg-amber-500/[0.05] border-amber-500/20">
                  <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
                    <span>Pending</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-300 mt-1">
                    {data.stats.pendingCount}
                  </div>
                  <p className="text-[10px] text-amber-400/80 mt-0.5">Awaiting Review</p>
                </div>

                {/* Rejected Submissions */}
                <div className="alta-card p-3.5 bg-rose-500/[0.05] border-rose-500/20">
                  <div className="flex items-center justify-between text-rose-400 text-xs font-bold">
                    <span>Rejected</span>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-black text-rose-300 mt-1">
                    {data.stats.rejectedCount}
                  </div>
                  <p className="text-[10px] text-rose-400/80 mt-0.5">Needs Revision</p>
                </div>

                {/* Active Streak */}
                <div className="alta-card p-3.5 bg-orange-500/[0.05] border-orange-500/20 col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-orange-400 text-xs font-bold">
                    <span>Daily Streak</span>
                    <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                  </div>
                  <div className="text-2xl font-black text-orange-300 mt-1">
                    {data.stats.activeStreak}d
                  </div>
                  <p className="text-[10px] text-orange-400/80 mt-0.5">
                    Best: {data.stats.longestStreak}d
                  </p>
                </div>
              </div>

              {/* ATTEMPTED QUESTIONS LIST SECTION */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/10">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-cyan-400" />
                    Attempted Questions Breakdown ({filteredSubmissions.length} of {data.submissions.length})
                  </h4>

                  {/* Difficulty pills */}
                  <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                    <span className="text-emerald-400">{data.stats.easyCount} Easy</span>
                    <span>•</span>
                    <span className="text-amber-400">{data.stats.mediumCount} Med</span>
                    <span>•</span>
                    <span className="text-rose-400">{data.stats.hardCount} Hard</span>
                  </div>
                </div>

                {/* Search and Filters Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/10">
                  {/* Status Toggle */}
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg text-xs font-bold">
                    {(["ALL", "APPROVED", "PENDING", "REJECTED"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                          statusFilter === st
                            ? "bg-cyan-500 text-black font-black shadow-xs"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {st === "ALL" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>

                  {/* Difficulty Toggle */}
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg text-xs font-bold">
                    {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setDifficultyFilter(diff)}
                        className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                          difficultyFilter === diff
                            ? "bg-white text-slate-950 font-black shadow-xs"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {diff === "ALL" ? "All Diff" : diff.charAt(0) + diff.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>

                  {/* Search input */}
                  <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search question or topic..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="alta-input pl-8 py-1 text-xs w-full"
                    />
                  </div>
                </div>

                {/* Submissions Table */}
                {filteredSubmissions.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 bg-white/[0.02] rounded-xl border border-white/5">
                    <BookOpen className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="font-bold text-sm text-gray-300">No attempted questions found</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {data.submissions.length === 0
                        ? "This student hasn't submitted any questions yet."
                        : "No questions match the selected filters."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredSubmissions.map((sub) => {
                      const diffUpper = sub.difficulty?.toUpperCase() || "EASY";
                      return (
                        <div
                          key={sub.id}
                          className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="px-2 py-0.5 rounded-md bg-white/10 text-cyan-400 text-[11px] font-black shrink-0">
                                Day {sub.dayNumber}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-white text-sm truncate">
                                    {sub.problemTitle}
                                  </span>
                                  {sub.externalLink && (
                                    <a
                                      href={sub.externalLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-400 hover:text-cyan-300 transition-colors"
                                      title="Open problem link"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                  <span>{sub.challengeName}</span>
                                  <span>•</span>
                                  <span className="text-gray-300">{sub.topic}</span>
                                  {sub.chapter && (
                                    <>
                                      <span>•</span>
                                      <span className="text-gray-500">{sub.chapter}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                              {/* Difficulty Badge */}
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                  diffUpper === "HARD"
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : diffUpper === "MEDIUM"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                }`}
                              >
                                {sub.difficulty}
                              </span>

                              {/* Status Badge */}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1 ${
                                  sub.status === "APPROVED"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : sub.status === "PENDING"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}
                              >
                                {sub.status === "APPROVED" && (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                {sub.status === "PENDING" && (
                                  <Clock className="w-3.5 h-3.5" />
                                )}
                                {sub.status === "REJECTED" && (
                                  <AlertCircle className="w-3.5 h-3.5" />
                                )}
                                {sub.status}
                              </span>
                            </div>
                          </div>

                          {/* Rejection Reason if any */}
                          {sub.status === "REJECTED" && sub.rejectionReason && (
                            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                              <span className="font-bold">Rejection Note: </span>
                              {sub.rejectionReason}
                            </div>
                          )}

                          {/* Submission Footer: Date & Proof Links */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs text-gray-400">
                            <span className="flex items-center gap-1 text-[11px]">
                              <Calendar className="w-3 h-3 text-gray-500" />
                              Submitted: {new Date(sub.submittedAt).toLocaleDateString()} at{" "}
                              {new Date(sub.submittedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>

                            <div className="flex items-center gap-3">
                              {sub.linkedinPostUrl && (
                                <a
                                  href={sub.linkedinPostUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-bold"
                                >
                                  <Linkedin className="w-3.5 h-3.5 text-[#0a66c2]" /> Proof Post
                                </a>
                              )}
                              {sub.githubLink && (
                                <a
                                  href={sub.githubLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-300 hover:text-white flex items-center gap-1 text-[11px] font-bold"
                                >
                                  <Github className="w-3.5 h-3.5" /> Code Proof
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-xs text-gray-400">
          <span>Click outside or press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-gray-300">Esc</kbd> to close</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
