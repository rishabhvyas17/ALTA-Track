"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trophy,
  Calendar,
  FileQuestion,
  Users,
  ChevronRight,
  Loader2,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { ChallengeRules, DEFAULT_RULES, renderRulesAsPlainText } from "@/lib/rules";

interface Challenge {
  id: string;
  name: string;
  slug: string;
  totalDays: number;
  rules: ChallengeRules;
  isActive: boolean;
  requiresCompletedChallenge: { id: string; name: string } | null;
  _count: { problems: number; enrollments: number };
  createdAt: string;
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);

  const fetchChallenges = async () => {
    try {
      const res = await fetch("/api/superadmin/challenges");
      const data = await res.json();
      setChallenges(data.challenges || []);
      setAllChallenges(data.challenges || []);
    } catch {
      console.error("Failed to fetch challenges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div className="skeleton w-40 h-8" />
          <div className="skeleton w-32 h-10 rounded-xl" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="alta-card p-6">
            <div className="skeleton w-48 h-6 mb-3" />
            <div className="skeleton w-64 h-4 mb-2" />
            <div className="skeleton w-32 h-4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#0d1e56]">Challenges</h1>
          <p className="text-sm text-[#64748b]">
            Manage DSA challenge programs and their rules
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="alta-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Challenge
        </button>
      </div>

      {/* Challenge Cards */}
      {challenges.length === 0 ? (
        <div className="alta-card p-12 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-[#e2e8f0]" />
          <h3 className="text-lg font-bold text-[#0d1e56] mb-2">
            No challenges yet
          </h3>
          <p className="text-sm text-[#64748b] mb-4">
            Create your first DSA challenge to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="alta-btn-primary"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Create Challenge
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {challenges.map((challenge) => (
            <Link
              key={challenge.id}
              href={`/superadmin/challenges/${challenge.id}`}
              className="alta-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: challenge.isActive
                        ? "linear-gradient(135deg, rgba(59,195,226,0.15), rgba(60,204,139,0.1))"
                        : "rgba(100,116,139,0.1)",
                    }}
                  >
                    <Trophy
                      className="w-5 h-5"
                      style={{
                        color: challenge.isActive ? "#3bc3e2" : "#94a3b8",
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-[#0d1e56]">
                        {challenge.name}
                      </h3>
                      <span
                        className={`badge ${
                          challenge.isActive ? "badge-success" : "badge-neutral"
                        }`}
                      >
                        {challenge.isActive ? "Active" : "Archived"}
                      </span>
                    </div>
                    {challenge.requiresCompletedChallenge && (
                      <p className="text-xs text-[#64748b]">
                        Requires:{" "}
                        <span className="font-semibold">
                          {challenge.requiresCompletedChallenge.name}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-3 text-xs text-[#64748b]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {challenge.totalDays} days
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileQuestion className="w-3.5 h-3.5" />
                    {challenge._count.problems} problems loaded
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {challenge._count.enrollments} enrollments
                  </span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-[#cbd5e1] group-hover:text-[#3bc3e2] transition-colors shrink-0 hidden sm:block" />
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateChallengeModal
          existingChallenges={allChallenges}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchChallenges();
          }}
        />
      )}
    </div>
  );
}

// ─── Create Challenge Modal ─────────────────────────────────────────────────

function CreateChallengeModal({
  existingChallenges,
  onClose,
  onCreated,
}: {
  existingChallenges: Challenge[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [totalDays, setTotalDays] = useState(111);
  const [prerequisiteId, setPrerequisiteId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [rules, setRules] = useState<ChallengeRules>({ ...DEFAULT_RULES });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRulesPreview, setShowRulesPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/superadmin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          totalDays,
          rules,
          requiresCompletedChallengeId: prerequisiteId || null,
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      onCreated();
    } catch {
      setError("Failed to create challenge");
      setLoading(false);
    }
  };

  const previewRules = renderRulesAsPlainText(rules, { name: name || "Challenge", totalDays });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-scale-in"
        style={{ border: "1px solid #e2e8f0" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e2e8f0] px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="text-lg font-extrabold text-[#0d1e56]">
            Create New Challenge
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#f1f5f9] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-[#64748b]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Basic Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="alta-label">Challenge Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. "APEX 151"'
                required
                className="alta-input"
              />
            </div>
            <div>
              <label className="alta-label">Total Days</label>
              <input
                type="number"
                value={totalDays}
                onChange={(e) => setTotalDays(Number(e.target.value))}
                min={1}
                required
                className="alta-input"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="alta-label">Prerequisite Challenge</label>
              <select
                value={prerequisiteId}
                onChange={(e) => setPrerequisiteId(e.target.value)}
                className="alta-select"
              >
                <option value="">None</option>
                {existingChallenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className="cursor-pointer"
                >
                  {isActive ? (
                    <ToggleRight className="w-8 h-8 text-[#3ccc8b]" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-[#94a3b8]" />
                  )}
                </button>
                <span className="text-sm font-semibold text-[#0d1e56]">
                  {isActive ? "Active" : "Inactive"}
                </span>
              </label>
            </div>
          </div>

          {/* Rules Form */}
          <div className="border-t border-[#e2e8f0] pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-[#0d1e56]">
                Challenge Rules
              </h3>
              <button
                type="button"
                onClick={() => setShowRulesPreview(!showRulesPreview)}
                className="text-xs font-semibold text-[#3bc3e2] hover:underline cursor-pointer"
              >
                {showRulesPreview ? "Hide Preview" : "Preview Rules Text"}
              </button>
            </div>

            {showRulesPreview && (
              <div className="mb-4 p-4 rounded-xl bg-[#f0f7fb] border border-[#e2e8f0]">
                <p className="text-xs font-bold text-[#64748b] mb-2 uppercase tracking-wider">
                  Students will see:
                </p>
                <ul className="space-y-1.5">
                  {previewRules.map((line, i) => (
                    <li key={i} className="text-sm text-[#0d1e56] flex items-start gap-2">
                      <span className="text-[#3bc3e2] mt-0.5">•</span>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="alta-label">Grace Days / Month</label>
                <input
                  type="number"
                  value={rules.graceDaysPerMonth}
                  onChange={(e) =>
                    setRules({ ...rules, graceDaysPerMonth: Number(e.target.value) })
                  }
                  min={0}
                  max={10}
                  className="alta-input"
                />
              </div>
              <div>
                <label className="alta-label">Grace Days Reset</label>
                <select
                  value={rules.graceDaysResetPolicy}
                  onChange={(e) =>
                    setRules({
                      ...rules,
                      graceDaysResetPolicy: e.target.value as "calendar_month" | "rolling_30_days",
                    })
                  }
                  className="alta-select"
                >
                  <option value="calendar_month">Calendar Month</option>
                  <option value="rolling_30_days">Rolling 30 Days</option>
                </select>
              </div>
              <div>
                <label className="alta-label">On Missing a Day</label>
                <select
                  value={rules.missedDayAction}
                  onChange={(e) =>
                    setRules({
                      ...rules,
                      missedDayAction: e.target.value as "restart_to_day_1" | "pause_streak_only",
                    })
                  }
                  className="alta-select"
                >
                  <option value="restart_to_day_1">Restart to Day 1</option>
                  <option value="pause_streak_only">Pause Streak Only</option>
                </select>
              </div>
              <div>
                <label className="alta-label">Proof Required</label>
                <select
                  value={rules.proofRequired}
                  onChange={(e) =>
                    setRules({
                      ...rules,
                      proofRequired: e.target.value as "linkedin_post" | "any_link",
                    })
                  }
                  className="alta-select"
                >
                  <option value="linkedin_post">LinkedIn Post</option>
                  <option value="any_link">Any Link</option>
                </select>
              </div>
            </div>

            {/* Toggle options */}
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              {[
                {
                  key: "allowOutOfOrderSubmission" as const,
                  label: "Allow Out-of-Order Submissions",
                },
                {
                  key: "supportingLinkRequired" as const,
                  label: "Require Supporting Link",
                },
                {
                  key: "resubmissionAllowedOnReject" as const,
                  label: "Allow Resubmission on Rejection",
                },
                {
                  key: "streakBreakGraceWindow" as const,
                  label: "Streak Break Grace Window",
                },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#e2e8f0] cursor-pointer hover:bg-[#f8fafc] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setRules({ ...rules, [key]: !rules[key] })
                    }
                    className="cursor-pointer"
                  >
                    {rules[key] ? (
                      <ToggleRight className="w-7 h-7 text-[#3ccc8b]" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-[#94a3b8]" />
                    )}
                  </button>
                  <span className="text-sm font-semibold text-[#0d1e56]">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#e2e8f0] text-sm font-bold text-[#64748b] hover:bg-[#f8fafc] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 alta-btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Challenge
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
