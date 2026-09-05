"use client";

import { useEffect, useState } from "react";
import {
  Video,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Loader2,
  Edit2,
  X,
  Save,
} from "lucide-react";

interface InterviewApp {
  id: string;
  appliedAt: string;
  status: "QUEUED" | "SCHEDULED" | "PASSED" | "FAILED";
  scheduledAt: string | null;
  notes: string | null;
  user: {
    name: string;
    email: string;
    campus?: { name: string };
  };
  challenge: { name: string };
  interviewer?: { name: string; email: string };
}

export default function SuperAdminInterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingApp, setEditingApp] = useState<InterviewApp | null>(null);

  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState<"QUEUED" | "SCHEDULED" | "PASSED" | "FAILED">("SCHEDULED");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/superadmin/interviews");
      if (res.ok) {
        const data = await res.json();
        setInterviews(data.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (app: InterviewApp) => {
    setEditingApp(app);
    setStatus(app.status);
    setScheduledAt(app.scheduledAt ? app.scheduledAt.substring(0, 16) : "");
    setNotes(app.notes || "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/interviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingApp.id,
          status,
          scheduledAt: scheduledAt || undefined,
          notes,
        }),
      });

      if (!res.ok) throw new Error("Failed to update interview");

      setEditingApp(null);
      fetchInterviews();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
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
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <Video className="w-8 h-8 text-[var(--color-accent-cyan)]" />
          Mock Interview Queue
        </h1>
        <p className="text-xs text-[var(--color-neutral-silver)] mt-1">
          Schedule and evaluate verification interviews for eligible 25+ streak students.
        </p>
      </div>

      {/* Applications Table */}
      <div className="alta-card overflow-hidden">
        {interviews.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No interview applications submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-dark)] bg-white/[0.02] text-xs font-bold text-[var(--color-neutral-silver)] uppercase tracking-wider">
                  <th className="p-4 pl-6">Student</th>
                  <th className="p-4">Track</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Scheduled Date</th>
                  <th className="p-4">Interviewer</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-dark)] text-sm">
                {interviews.map((app) => (
                  <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-white">{app.user.name}</div>
                      <div className="text-xs text-[var(--color-accent-cyan)]">
                        {app.user.campus?.name || "Global Campus"} ({app.user.email})
                      </div>
                    </td>

                    <td className="p-4 font-semibold text-gray-200">{app.challenge.name}</td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${
                          app.status === "PASSED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : app.status === "FAILED"
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : app.status === "SCHEDULED"
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {app.status === "PASSED" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {app.status === "FAILED" && <XCircle className="w-3.5 h-3.5" />}
                        {app.status === "SCHEDULED" && <Calendar className="w-3.5 h-3.5" />}
                        {app.status === "QUEUED" && <Clock className="w-3.5 h-3.5" />}
                        {app.status}
                      </span>
                    </td>

                    <td className="p-4 text-xs text-gray-300">
                      {app.scheduledAt
                        ? new Date(app.scheduledAt).toLocaleString()
                        : "Not Scheduled"}
                    </td>

                    <td className="p-4 text-xs text-gray-300">
                      {app.interviewer?.name || "Unassigned"}
                    </td>

                    <td className="p-4 text-right pr-6">
                      <button
                        onClick={() => openEditModal(app)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="alta-card max-w-md w-full p-6 sm:p-8 space-y-6 relative border border-[var(--color-border-cyan)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-dark)] pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-[var(--color-accent-cyan)]" /> Manage Interview
              </h3>
              <button
                onClick={() => setEditingApp(null)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Interview Status
                </label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="alta-input w-full text-white bg-[var(--color-navy-dark)]"
                >
                  <option value="QUEUED">QUEUED</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="alta-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Interviewer Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="alta-input w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-dark)]">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="alta-button-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="alta-button text-xs font-bold flex items-center gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Schedule
                    </>
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
