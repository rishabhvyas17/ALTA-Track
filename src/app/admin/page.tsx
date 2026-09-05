"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  Loader2,
  LogOut,
  Sparkles,
} from "lucide-react";

interface Submission {
  id: string;
  dayNumber: number;
  linkedinPostUrl: string;
  supportingLink: string | null;
  githubLink: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  submittedAt: string;
  enrollment: {
    user: {
      id: string;
      name: string;
      email: string;
      year: number;
    };
    challenge: {
      name: string;
    };
  };
  problem: {
    title: string;
    topic: string;
  };
}

export default function CampusAdminDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/submissions");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/");
          return;
        }
        throw new Error("Failed to load submissions");
      }
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (err: any) {
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

      if (!res.ok) throw new Error("Failed to update submission");
      fetchSubmissions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const filtered = submissions.filter((s) => {
    const matchesStatus = filterStatus === "ALL" || s.status === filterStatus;
    const matchesSearch =
      s.enrollment.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.enrollment.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.problem.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-navy-dark)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[var(--color-primary-cyan)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-navy-dark)] text-white pb-20">
      {/* Header */}
      <header className="border-b border-[var(--color-border-dark)] bg-black/30 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--color-accent-cyan)] to-[var(--color-primary-cyan)] flex items-center justify-center text-white font-extrabold text-xl shadow-lg">
              A
            </div>
            <div>
              <h1 className="font-black text-xl tracking-wider text-white">
                ALTA <span className="text-[var(--color-accent-cyan)]">TRACK</span>
              </h1>
              <p className="text-[10px] uppercase font-bold text-[var(--color-accent-green)] tracking-widest">
                Campus Admin Portal
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-[var(--color-accent-cyan)]" /> Submission Verification
            </h2>
            <p className="text-xs text-[var(--color-neutral-silver)] mt-1">
              Verify student daily LinkedIn posts, screenshots, and repository submissions for your campus.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student or problem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="alta-input pl-9 text-xs w-64"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="alta-input text-xs text-white bg-[var(--color-navy-dark)]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Submissions List */}
        <div className="alta-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              No submissions match your current criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border-dark)] bg-white/[0.02] text-xs font-bold text-[var(--color-neutral-silver)] uppercase tracking-wider">
                    <th className="p-4 pl-6">Student</th>
                    <th className="p-4">Challenge & Day</th>
                    <th className="p-4">Problem</th>
                    <th className="p-4">Proof Links</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-dark)] text-sm">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-white">{s.enrollment.user.name}</div>
                        <div className="text-xs text-gray-400">{s.enrollment.user.email} (Year {s.enrollment.user.year})</div>
                      </td>
                      <td className="p-4 font-semibold text-[var(--color-accent-cyan)]">
                        {s.enrollment.challenge.name} — <span className="text-white">Day {s.dayNumber}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-200">{s.problem.title}</div>
                        <div className="text-xs text-gray-400">{s.problem.topic}</div>
                      </td>
                      <td className="p-4 space-y-1">
                        <div>
                          <a
                            href={s.linkedinPostUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[var(--color-primary-cyan)] hover:underline"
                          >
                            LinkedIn Post <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        {s.supportingLink && (
                          <div>
                            <a
                              href={s.supportingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[var(--color-accent-green)] hover:underline"
                            >
                              Proof Screenshot <ExternalLink className="w-3 h-3" />
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
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20 transition-all cursor-pointer"
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
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-all cursor-pointer"
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
        </div>
      </main>
    </div>
  );
}
