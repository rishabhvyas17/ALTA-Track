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
  GraduationCap,
  School,
  HelpCircle,
} from "lucide-react";
import { renderRulesAsPlainText, ChallengeRules } from "@/lib/rules";

interface CampusOption {
  id: string;
  name: string;
  region: string;
}

interface Challenge {
  id: string;
  name: string;
  slug: string;
  totalDays: number;
  isActive: boolean;
  requiresCompletedChallengeId: string | null;
  eligibleYears?: number[] | null;
  eligibleCampusIds?: string[] | null;
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
  const [campuses, setCampuses] = useState<CampusOption[]>([]);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [totalDays, setTotalDays] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [requiresCompletedChallengeId, setRequiresCompletedChallengeId] =
    useState("");
  const [eligibleYears, setEligibleYears] = useState<number[]>([1, 2, 3, 4]);
  const [eligibleCampusIds, setEligibleCampusIds] = useState<string[]>([]);

  // Labeled Rules Form State
  const [graceDaysPerMonth, setGraceDaysPerMonth] = useState(1);
  const [graceDaysResetPolicy, setGraceDaysResetPolicy] =
    useState<"calendar_month" | "rolling_30_days">("calendar_month");
  const [missedDayAction, setMissedDayAction] =
    useState<"restart_to_day_1" | "pause_streak_only">("restart_to_day_1");
  const [linkedinRequired, setLinkedinRequired] = useState(true);
  const [requireHashtag, setRequireHashtag] = useState("#ALTAChallenge");
  const [requireCodeScreenshot, setRequireCodeScreenshot] = useState(true);

  useEffect(() => {
    fetchChallenge();
    fetchOtherChallengesAndCampuses();
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

      // Set eligibility
      if (Array.isArray(current.eligibleYears) && current.eligibleYears.length > 0) {
        setEligibleYears(current.eligibleYears);
      } else {
        setEligibleYears([1, 2, 3, 4]);
      }

      if (Array.isArray(current.eligibleCampusIds) && current.eligibleCampusIds.length > 0) {
        setEligibleCampusIds(current.eligibleCampusIds);
      } else {
        setEligibleCampusIds([]);
      }

      // Parse rules
      const r = current.rules || {};
      setGraceDaysPerMonth(r.graceDaysPerMonth ?? 1);
      setGraceDaysResetPolicy(r.graceDaysResetPolicy ?? "calendar_month");
      setMissedDayAction(r.missedDayAction ?? "restart_to_day_1");
      setLinkedinRequired(r.linkedinPostRequired ?? true);
      setRequireHashtag(r.requireHashtag ?? "#ALTAChallenge");
      setRequireCodeScreenshot(r.supportingLinkRequired ?? true);
    } catch (err: any) {
      setError(err.message || "Failed to load challenge");
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherChallengesAndCampuses = async () => {
    try {
      const [chRes, campRes] = await Promise.all([
        fetch("/api/superadmin/challenges"),
        fetch("/api/superadmin/campuses"),
      ]);

      if (chRes.ok) {
        const data = await chRes.json();
        setAllChallenges(
          (data.challenges || []).filter((c: Challenge) => c.id !== id)
        );
      }

      if (campRes.ok) {
        const campData = await campRes.json();
        const campList = campData.campuses || [];
        setCampuses(campList);
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

  const toggleYear = (yr: number) => {
    if (eligibleYears.includes(yr)) {
      setEligibleYears(eligibleYears.filter((y) => y !== yr));
    } else {
      setEligibleYears([...eligibleYears, yr].sort());
    }
  };

  const toggleCampus = (cId: string) => {
    if (eligibleCampusIds.includes(cId)) {
      setEligibleCampusIds(eligibleCampusIds.filter((cid) => cid !== cId));
    } else {
      setEligibleCampusIds([...eligibleCampusIds, cId]);
    }
  };

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
          eligibleYears: eligibleYears.length === 4 ? null : eligibleYears,
          eligibleCampusIds:
            eligibleCampusIds.length === 0 || eligibleCampusIds.length === campuses.length
              ? null
              : eligibleCampusIds,
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
        throw new Error(data.error || "Failed to delete");
      }

      router.push("/superadmin/challenges");
    } catch (err: any) {
      setError(err.message || "Failed to delete challenge");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3bc3e2]" />
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
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Challenges
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#3bc3e2]" />
            Edit Challenge: <span className="text-[#3bc3e2]">{name}</span>
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
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
            <Trophy className="w-5 h-5 text-[#3bc3e2]" /> General Configuration
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
                className="alta-input w-full text-white bg-[#071130] appearance-none"
              >
                <option value="">None (Open directly)</option>
                {allChallenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    Must complete {c.name} first
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div>
              <span className="text-sm font-bold text-white block">Active Status</span>
              <span className="text-xs text-gray-400">
                Inactive tracks will be hidden from new student onboarding.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className="cursor-pointer"
            >
              {isActive ? (
                <ToggleRight className="w-9 h-9 text-[#3ccc8b]" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Cohort Eligibility Card */}
        <div className="alta-card p-6 sm:p-8 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#3bc3e2]" /> Cohort Eligibility (Year & Campuses)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Control which student cohorts can see and enroll in this DSA challenge.
            </p>
          </div>

          <div className="space-y-6">
            {/* Target Years */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Eligible Graduation Years
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setEligibleYears(eligibleYears.length === 4 ? [] : [1, 2, 3, 4])
                  }
                  className="text-xs font-semibold text-[#3bc3e2] hover:underline"
                >
                  {eligibleYears.length === 4 ? "Deselect All" : "Select All 4 Years"}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((yr) => {
                  const isSelected = eligibleYears.includes(yr);
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => toggleYear(yr)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        isSelected
                          ? "bg-[#3bc3e2]/20 border-[#3bc3e2] text-white"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {yr}
                      {yr === 1 ? "st" : yr === 2 ? "nd" : yr === 3 ? "rd" : "th"} Year
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Campuses */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Eligible Partner Campuses
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setEligibleCampusIds(
                      eligibleCampusIds.length === campuses.length
                        ? []
                        : campuses.map((c) => c.id)
                    )
                  }
                  className="text-xs font-semibold text-[#3bc3e2] hover:underline"
                >
                  {eligibleCampusIds.length === campuses.length || eligibleCampusIds.length === 0
                    ? "Restrict to Specific Campuses"
                    : "Open to All 5 Campuses"}
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-3">
                {eligibleCampusIds.length === 0 || eligibleCampusIds.length === campuses.length
                  ? "Currently open to all 5 partner campuses."
                  : `Restricted to ${eligibleCampusIds.length} selected campus(es).`}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {campuses.map((c) => {
                  const isSelected =
                    eligibleCampusIds.length === 0 || eligibleCampusIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCampus(c.id)}
                      className={`p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left flex items-center justify-between ${
                        eligibleCampusIds.includes(c.id)
                          ? "bg-purple-500/20 border-purple-500 text-white"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.region}</div>
                      </div>
                      <span className="text-xs">
                        {eligibleCampusIds.includes(c.id) ? "✓ Selected" : "+ Click to Select"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Rules Engine Configuration */}
        <div className="alta-card p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
            <Calendar className="w-5 h-5 text-[#3bc3e2]" /> Rules Engine & Streak Policies
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Grace Days Granted per Month
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={graceDaysPerMonth}
                onChange={(e) => setGraceDaysPerMonth(Number(e.target.value))}
                className="alta-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Missed Day Action
              </label>
              <select
                value={missedDayAction}
                onChange={(e: any) => setMissedDayAction(e.target.value)}
                className="alta-input w-full text-white bg-[#071130] appearance-none"
              >
                <option value="restart_to_day_1">
                  Restart Streak to Day 1 (Strict)
                </option>
                <option value="pause_streak_only">
                  Pause Streak (Lenient)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Required Social Hashtag
              </label>
              <input
                type="text"
                value={requireHashtag}
                onChange={(e) => setRequireHashtag(e.target.value)}
                className="alta-input w-full"
                placeholder="#ALTAChallenge"
              />
            </div>
          </div>
        </div>

        {/* Live Generated Rules Preview */}
        <div className="alta-card p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#3bc3e2]" /> Live Plain Text Policy Preview
          </h2>
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-300 space-y-2">
            {plainTextRules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3bc3e2] mt-1.5 shrink-0" />
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="submit"
            disabled={saving}
            className="alta-button px-8 py-3 text-sm font-bold flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save All Changes
          </button>
        </div>
      </form>
    </div>
  );
}
