"use client";

import { useEffect, useState } from "react";
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

interface QueueSubmission {
  id: string;
  dayNumber: number;
  linkedinPostUrl?: string | null;
  supportingLink: string | null;
  githubLink: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  enrollment: {
    user: {
      name: string;
      email: string;
      year: number;
      campus?: { name: string };
    };
    challenge: { name: string };
  };
  problem: {
    title: string;
    topic: string;
    difficulty: string;
  };
}

export default function VerificationQueuePage() {
  const [submissions, setSubmissions] = useState<QueueSubmission[]>([]);
  const [adminAssignedYear, setAdminAssignedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/submissions");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
        setAdminAssignedYear(data.adminAssignedYear ?? null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (
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

      if (!res.ok) throw new Error("Failed to review");
      fetchQueue();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = submissions.filter((s) => {
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    const matchesSearch =
      s.enrollment.user.name.toLowerCase().includes(search.toLowerCase()) ||
      s.problem.title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-[var(--color-accent-cyan)]" />
            Verification Queue
          </h1>
          <p className="text-xs text-[var(--color-neutral-silver)] mt-1">
            Review student daily solution proof links for your campus.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student or problem..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="alta-input pl-9 text-xs w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="alta-input text-xs text-white bg-[var(--color-navy-dark)]"
          >
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ALL">All Submissions</option>
          </select>
        </div>
      </div>

      {/* Cohort Notification Banner */}
      {adminAssignedYear ? (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-xs text-cyan-200">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 font-extrabold shrink-0 flex items-center gap-1.5">
            🎓 Year {adminAssignedYear} Cohort
          </div>
          <div>
            <p className="font-bold text-white">Year-Specific Verification Queue</p>
            <p className="text-cyan-300/80 text-[11px] mt-0.5">
              You are signed in as the <strong className="text-cyan-200">Year {adminAssignedYear} Campus Coordinator</strong>. You have verification authority exclusively over daily problem submissions submitted by {adminAssignedYear === 1 ? "1st" : adminAssignedYear === 2 ? "2nd" : adminAssignedYear === 3 ? "3rd" : "4th"} year students.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-blue-200">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 font-extrabold shrink-0 flex items-center gap-1.5">
            🏛️ All Cohorts
          </div>
          <div>
            <p className="font-bold text-white">Campus-Wide General Queue</p>
            <p className="text-blue-300/80 text-[11px] mt-0.5">
              Showing student submissions across all academic years (1st through 4th year) on your campus.
            </p>
          </div>
        </div>
      )}

      {/* Submissions Queue Cards / Table */}
      <div className="alta-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckSquare className="w-12 h-12 text-gray-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Pending Submissions</h3>
            <p className="text-xs text-gray-400">
              Queue is clear for this filter criteria. Great job!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-dark)] bg-white/[0.02] text-xs font-bold text-[var(--color-neutral-silver)] uppercase tracking-wider">
                  <th className="p-4 pl-6">Student</th>
                  <th className="p-4">Track & Day</th>
                  <th className="p-4">Problem</th>
                  <th className="p-4">Proof Submissions</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-dark)] text-sm">
                {paginated.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{s.enrollment.user.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Year {s.enrollment.user.year}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {s.enrollment.user.email}
                      </div>
                    </td>

                    <td className="p-4 font-semibold text-[var(--color-accent-cyan)]">
                      {s.enrollment.challenge.name} — <span className="text-white">Day {s.dayNumber}</span>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-gray-200">{s.problem.title}</div>
                      <div className="text-xs text-gray-400">Topic: {s.problem.topic}</div>
                    </td>

                    <td className="p-4 space-y-1">
                      {s.linkedinPostUrl && (
                        <div>
                          <a
                            href={s.linkedinPostUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[var(--color-primary-cyan)] hover:underline font-semibold"
                          >
                            LinkedIn Post <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {s.supportingLink && (
                        <div>
                          <a
                            href={s.supportingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[var(--color-accent-green)] hover:underline"
                          >
                            Proof Link <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {s.githubLink && (
                        <div>
                          <a
                            href={s.githubLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
                          >
                            GitHub Solution <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${
                          s.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : s.status === "REJECTED"
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {s.status === "APPROVED" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {s.status === "REJECTED" && <XCircle className="w-3.5 h-3.5" />}
                        {s.status === "PENDING" && <Clock className="w-3.5 h-3.5" />}
                        {s.status}
                      </span>
                    </td>

                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {s.status !== "APPROVED" && (
                          <button
                            onClick={() => handleReview(s.id, "APPROVED")}
                            disabled={processingId === s.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {s.status !== "REJECTED" && (
                          <button
                            onClick={() => {
                              const reason = prompt("Reason for rejection:");
                              if (reason) handleReview(s.id, "REJECTED", reason);
                            }}
                            disabled={processingId === s.id}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[var(--color-border-dark)] flex items-center justify-between text-xs text-gray-400">
            <span>
              Showing Page {currentPage} of {totalPages} ({filtered.length} total)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
