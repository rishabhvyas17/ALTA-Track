"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Loader2,
  Linkedin,
  Github,
} from "lucide-react";

interface Submission {
  id: string;
  dayNumber: number;
  linkedinPostUrl: string | null;
  githubLink: string | null;
  supportingLink: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  enrollment: {
    user: {
      name: string;
      email: string;
      campus?: { name: string };
    };
    challenge: { name: string };
  };
  problem: { title: string };
}

export default function SuperAdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchSubmissions(true);
  }, []);

  const fetchSubmissions = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch("/api/admin/submissions");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleReview = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      setProcessingId(id);
      // Optimistic update so row updates immediately with no full page flicker
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );

      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to review");
      }

      fetchSubmissions(false);
    } catch (err: any) {
      alert(err.message || "Failed to update submission");
      fetchSubmissions(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary-cyan)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-[var(--color-accent-cyan)]" /> Global Submissions Log
          </h1>
          <p className="text-xs text-[var(--color-neutral-silver)] mt-1">
            Review and manage all student daily solution submissions across all campuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="alta-input pl-9 text-xs w-48"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="alta-input text-xs text-white bg-[var(--color-navy-dark)]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      <div className="alta-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border-dark)] bg-white/[0.02] text-xs font-bold text-[var(--color-neutral-silver)] uppercase tracking-wider">
                <th className="p-4 pl-6">Student & Campus</th>
                <th className="p-4">Track & Day</th>
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
                    <div className="text-xs text-[var(--color-accent-cyan)]">
                      {s.enrollment.user.campus?.name || "Global Campus"}
                    </div>
                  </td>
                  <td className="p-4 text-gray-300 font-medium">
                    {s.enrollment.challenge.name} (Day {s.dayNumber})
                  </td>
                  <td className="p-4 font-semibold text-white">{s.problem.title}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.linkedinPostUrl && (
                        <a
                          href={s.linkedinPostUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--color-primary-cyan)] hover:underline"
                          title="LinkedIn Post Proof"
                        >
                          <Linkedin className="w-3.5 h-3.5" /> LinkedIn <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {s.githubLink && (
                        <a
                          href={s.githubLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-gray-300 hover:text-white hover:underline"
                          title="GitHub Code Proof"
                        >
                          <Github className="w-3.5 h-3.5" /> GitHub <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {!s.linkedinPostUrl && !s.githubLink && (
                        <span className="text-xs text-gray-500">No proof link</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-gray-300">
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleReview(s.id, "APPROVED")}
                        disabled={processingId === s.id}
                        className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        {processingId === s.id && <Loader2 className="w-3 h-3 animate-spin" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(s.id, "REJECTED")}
                        disabled={processingId === s.id}
                        className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        {processingId === s.id && <Loader2 className="w-3 h-3 animate-spin" />}
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
