"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Trophy,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Eye,
  Loader2,
  Trash2,
  ListOrdered,
} from "lucide-react";
import { renderRulesAsPlainText, ChallengeRules } from "@/lib/rules";

interface Challenge {
  id: string;
  name: string;
  slug: string;
  totalDays: number;
  isActive: boolean;
  requiresCompletedChallengeId: string | null;
  rules: any;
  _count?: {
    problems: number;
    enrollments: number;
  };
}

export default function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [totalDays, setTotalDays] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [requiresCompletedChallengeId, setRequiresCompletedChallengeId] =
    useState("");

  // Labeled Rules Form State
  const [graceDaysPerMonth, setGraceDaysPerMonth] = useState(1);
  const [graceDaysResetPolicy, setGraceDaysResetPolicy] =
    useState<"calendar_month" | "rolling_30_days">("calendar_month");
  const [missedDayAction, setMissedDayAction] =
    useState<"restart_to_day_1" | "pause_streak_only">("restart_to_day_1");
  const [linkedinRequired, setLinkedinRequired] = useState(true);
  const [requireHashtag, setRequireHashtag] = useState("#ALTAChallenge");
  const [requireCodeScreenshot, setRequireCodeScreenshot] = useState(true);
  const [interviewEligibleAtDay, setInterviewEligibleAtDay] = useState(25);
  const [goodiesEligibleAtDay, setGoodiesEligibleAtDay] = useState(30);

  useEffect(() => {
    fetchChallenge();
    fetchOtherChallenges();
  }, [id]);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/superadmin/challenges`);
      if (!res.ok) throw new Error("Failed to load challenges");
      const data = await res.json();
      const current = data.challenges?.find((c: Challenge) => c.id === id);
      if (!current) {
        setError("Challenge not found");
        return;
      }

      setName(current.name);
      setSlug(current.slug);
      setTotalDays(current.totalDays);
      setIsActive(current.isActive);
      setRequiresCompletedChallengeId(
        current.requiresCompletedChallengeId || ""
      );

      // Parse rules
      const r = current.rules || {};
      setGraceDaysPerMonth(r.graceDaysPerMonth ?? 1);
      setGraceDaysResetPolicy(r.graceDaysResetPolicy ?? "calendar_month");
      setMissedDayAction(r.missedDayAction ?? "restart_to_day_1");
      setLinkedinRequired(r.linkedinPostRequired ?? true);
      setRequireHashtag(r.requireHashtag ?? "#ALTAChallenge");
      setRequireCodeScreenshot(r.requireCodeScreenshot ?? true);
      setInterviewEligibleAtDay(r.interviewEligibleAtDay ?? 25);
      setGoodiesEligibleAtDay(r.goodiesEligibleAtDay ?? 30);
    } catch (err: any) {
      setError(err.message || "Failed to load challenge details");
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherChallenges = async () => {
    try {
      const res = await fetch("/api/superadmin/challenges");
      if (res.ok) {
        const data = await res.json();
        setAllChallenges(
          (data.challenges || []).filter((c: Challenge) => c.id !== id)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentRulesObject: any = {
    graceDaysPerMonth,
    graceDaysResetPolicy,
    missedDayAction,
    allowOutOfOrderSubmission: false,
    proofRequired: linkedinRequired ? "linkedin_post" : "any_link",
    supportingLinkRequired: requireCodeScreenshot,
    supportingLinkTypes: ["leetcode_gfg", "github"],
    resubmissionAllowedOnReject: true,
    streakBreakGraceWindow: false,
  };

  const plainTextRules = renderRulesAsPlainText(currentRulesObject, {
    name: name || "Challenge",
    totalDays: totalDays || 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/superadmin/challenges/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          totalDays: Number(totalDays),
          isActive,
          requiresCompletedChallengeId: requiresCompletedChallengeId || null,
          rules: currentRulesObject,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update challenge");

      setSuccess("Challenge updated successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this challenge? This will remove all associated problems and submissions!"
      )
    )
      return;

    try {
      const res = await fetch(`/api/superadmin/challenges/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete challenge");
      }
      router.push("/superadmin/challenges");
    } catch (err: any) {
      setError(err.message || "Failed to delete challenge");
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
            href="/superadmin/challenges"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-neutral-silver)] hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Challenges
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[var(--color-accent-cyan)]" />
            Edit Challenge: <span className="text-[var(--color-primary-cyan)]">{name}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/superadmin/challenges/${id}/problems`}
            className="alta-button-secondary flex items-center gap-2 text-sm"
          >
            <ListOrdered className="w-4 h-4" /> Manage Problems
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Challenge Config */}
        <div className="alta-card p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-[var(--color-border-dark)] pb-4">
            <Trophy className="w-5 h-5 text-[var(--color-accent-cyan)]" /> General Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Challenge Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)+/g, "")
                  );
                }}
                className="alta-input w-full"
                placeholder="e.g. BASE 111"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                URL Slug
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="alta-input w-full"
                placeholder="e.g. base-111"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                required
                value={totalDays}
                onChange={(e) => setTotalDays(Number(e.target.value))}
                className="alta-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Prerequisite Challenge (Optional)
              </label>
              <select
                value={requiresCompletedChallengeId}
                onChange={(e) => setRequiresCompletedChallengeId(e.target.value)}
                className="alta-input w-full text-white bg-[var(--color-navy-dark)]"
              >
                <option value="">None (Open to all students)</option>
                {allChallenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    Must complete {c.name} first
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-dark)]">
            <div>
              <h3 className="text-base font-semibold text-white">Active Status</h3>
              <p className="text-xs text-[var(--color-neutral-silver)]">
                Inactive challenges are hidden from student onboarding.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className="text-2xl transition-colors cursor-pointer"
            >
              {isActive ? (
                <ToggleRight className="w-10 h-10 text-[var(--color-accent-cyan)]" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {/* Labeled Rules Form + Rules Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rules Editor Form */}
          <div className="alta-card p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-[var(--color-border-dark)] pb-4">
              <Calendar className="w-5 h-5 text-[var(--color-accent-cyan)]" /> Rules Engine Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-neutral-silver)] uppercase tracking-wider mb-1">
                  Grace Days per Month
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={graceDaysPerMonth}
                  onChange={(e) => setGraceDaysPerMonth(Number(e.target.value))}
                  className="alta-input w-full"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Number of missed days forgiven per calendar month.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-neutral-silver)] uppercase tracking-wider mb-1">
                  Missed Day Action
                </label>
                <select
                  value={missedDayAction}
                  onChange={(e: any) => setMissedDayAction(e.target.value)}
                  className="alta-input w-full text-white bg-[var(--color-navy-dark)]"
                >
                  <option value="restart_to_day_1">Restart to Day 1</option>
                  <option value="freeze_streak">Freeze Streak (Pause progress)</option>
                  <option value="deduct_points">Deduct Points (Keep day count)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[var(--color-border-dark)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-300">
                    LinkedIn Post Required for Submission?
                  </span>
                  <input
                    type="checkbox"
                    checked={linkedinRequired}
                    onChange={(e) => setLinkedinRequired(e.target.checked)}
                    className="w-5 h-5 accent-[var(--color-accent-cyan)] rounded cursor-pointer"
                  />
                </div>

                {linkedinRequired && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-neutral-silver)] uppercase tracking-wider mb-1">
                      Required Hashtag
                    </label>
                    <input
                      type="text"
                      value={requireHashtag}
                      onChange={(e) => setRequireHashtag(e.target.value)}
                      className="alta-input w-full"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-semibold text-gray-300">
                    Require Code Screenshot / Link?
                  </span>
                  <input
                    type="checkbox"
                    checked={requireCodeScreenshot}
                    onChange={(e) => setRequireCodeScreenshot(e.target.checked)}
                    className="w-5 h-5 accent-[var(--color-accent-cyan)] rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-border-dark)] grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-neutral-silver)] uppercase tracking-wider mb-1">
                    Interview Eligible Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={interviewEligibleAtDay}
                    onChange={(e) =>
                      setInterviewEligibleAtDay(Number(e.target.value))
                    }
                    className="alta-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-neutral-silver)] uppercase tracking-wider mb-1">
                    Goodies Eligible Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={goodiesEligibleAtDay}
                    onChange={(e) =>
                      setGoodiesEligibleAtDay(Number(e.target.value))
                    }
                    className="alta-input w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rules Live Preview */}
          <div className="alta-card p-6 sm:p-8 space-y-6 flex flex-col">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-[var(--color-border-dark)] pb-4">
              <Eye className="w-5 h-5 text-[var(--color-accent-green)]" /> Live Rules Preview (Student View)
            </h2>

            <p className="text-xs text-[var(--color-neutral-silver)]">
              This preview is dynamically generated using the shared Rules Engine renderer. Students will see this exact list on their dashboard.
            </p>

            <div className="flex-1 p-6 rounded-2xl bg-[var(--color-navy-dark)]/60 border border-[var(--color-border-cyan)]/30 space-y-3">
              <h3 className="font-bold text-[var(--color-accent-cyan)] text-base flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Challenge Rules & Guidelines
              </h3>

              <ul className="space-y-2.5">
                {plainTextRules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-cyan)] mt-2 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link
            href="/superadmin/challenges"
            className="alta-button-secondary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="alta-button flex items-center gap-2 px-8"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
