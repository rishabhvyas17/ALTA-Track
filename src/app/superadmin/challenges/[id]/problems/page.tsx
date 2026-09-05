"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Loader2,
  Save,
  X,
  FileQuestion,
  Layers,
} from "lucide-react";

interface Problem {
  id: string;
  dayNumber: number;
  title: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  externalLink: string;
}

export default function ProblemsManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [challengeName, setChallengeName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal / Inline Add & Edit state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);

  // Form State
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("EASY");
  const [externalLink, setExternalLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchChallengeAndProblems();
  }, [id]);

  const fetchChallengeAndProblems = async () => {
    try {
      setLoading(true);
      // Fetch challenge details
      const cRes = await fetch(`/api/superadmin/challenges`);
      if (cRes.ok) {
        const cData = await cRes.json();
        const current = cData.challenges?.find((c: any) => c.id === id);
        if (current) setChallengeName(current.name);
      }

      // Fetch problems
      const pRes = await fetch(`/api/superadmin/challenges/${id}/problems`);
      if (!pRes.ok) throw new Error("Failed to load problems");
      const pData = await pRes.json();
      setProblems(pData.problems || []);

      // Auto set next day number
      const maxDay = pData.problems?.reduce(
        (max: number, p: Problem) => (p.dayNumber > max ? p.dayNumber : max),
        0
      );
      setDayNumber((maxDay || 0) + 1);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProblem(null);
    setTitle("");
    setTopic("");
    setDifficulty("EASY");
    setExternalLink("");
    const maxDay = problems.reduce(
      (max, p) => (p.dayNumber > max ? p.dayNumber : max),
      0
    );
    setDayNumber(maxDay + 1);
    setShowAddModal(true);
  };

  const openEditModal = (p: Problem) => {
    setEditingProblem(p);
    setDayNumber(p.dayNumber);
    setTitle(p.title);
    setTopic(p.topic);
    setDifficulty(p.difficulty);
    setExternalLink(p.externalLink);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (editingProblem) {
        // Update problem
        const res = await fetch(`/api/superadmin/problems/${editingProblem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dayNumber: Number(dayNumber),
            title,
            topic,
            difficulty,
            externalLink,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update problem");

        setSuccess("Problem updated successfully!");
      } else {
        // Create problem
        const res = await fetch(`/api/superadmin/challenges/${id}/problems`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dayNumber: Number(dayNumber),
            title,
            topic,
            difficulty,
            externalLink,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create problem");

        setSuccess("Problem added successfully!");
      }

      setShowAddModal(false);
      fetchChallengeAndProblems();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save problem");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (problemId: string, dayNum: number) => {
    if (!confirm(`Delete problem for Day ${dayNum}?`)) return;

    try {
      const res = await fetch(`/api/superadmin/problems/${problemId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete problem");

      setProblems(problems.filter((p) => p.id !== problemId));
      setSuccess(`Deleted Day ${dayNum} problem`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to delete problem");
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "EASY":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "HARD":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/superadmin/challenges/${id}`}
            className="inline-flex items-center gap-2 text-sm text-[var(--color-neutral-silver)] hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Challenge Details
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <FileQuestion className="w-8 h-8 text-[var(--color-accent-cyan)]" />
            Problems for <span className="text-[var(--color-primary-cyan)]">{challengeName || "Challenge"}</span>
          </h1>
          <p className="text-xs text-[var(--color-neutral-silver)] mt-1">
            Total {problems.length} daily DSA problems assigned.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="alta-button flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" /> Add Problem
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
          {success}
        </div>
      )}

      {/* Problems Table */}
      <div className="alta-card overflow-hidden">
        {problems.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <FileQuestion className="w-12 h-12 text-gray-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Problems Added Yet</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Start adding daily DSA problems for this challenge. Each day requires a title, topic, difficulty, and external link (LeetCode/HackerRank).
            </p>
            <button onClick={openAddModal} className="alta-button inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add First Problem
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-dark)] bg-white/[0.02] text-xs font-bold text-[var(--color-neutral-silver)] uppercase tracking-wider">
                  <th className="p-4 pl-6">Day #</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Topic</th>
                  <th className="p-4">Difficulty</th>
                  <th className="p-4">Problem Link</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-dark)] text-sm">
                {problems.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="p-4 pl-6 font-extrabold text-[var(--color-accent-cyan)]">
                      Day {p.dayNumber}
                    </td>
                    <td className="p-4 font-bold text-white">{p.title}</td>
                    <td className="p-4 text-gray-300">
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs">
                        {p.topic}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full border text-xs font-bold ${getDifficultyBadge(
                          p.difficulty
                        )}`}
                      >
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="p-4">
                      <a
                        href={p.externalLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-primary-cyan)] hover:underline"
                      >
                        Solve Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
                          title="Edit Problem"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.dayNumber)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                          title="Delete Problem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="alta-card max-w-lg w-full p-6 sm:p-8 space-y-6 relative border border-[var(--color-border-cyan)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-dark)] pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-[var(--color-accent-cyan)]" />
                {editingProblem ? "Edit Problem" : "Add Problem"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Day Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={dayNumber}
                    onChange={(e) => setDayNumber(Number(e.target.value))}
                    className="alta-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e: any) => setDifficulty(e.target.value)}
                    className="alta-input w-full text-white bg-[var(--color-navy-dark)]"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Problem Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Two Sum / Reverse Linked List"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Topic Tag
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arrays, Trees, Dynamic Programming"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  External Problem Link (LeetCode / HackerRank)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://leetcode.com/problems/two-sum/"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-dark)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="alta-button-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="alta-button text-sm flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Problem
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
