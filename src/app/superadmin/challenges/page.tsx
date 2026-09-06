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
  GraduationCap,
  School,
  HelpCircle,
} from "lucide-react";
import { ChallengeRules, DEFAULT_RULES, renderRulesAsPlainText } from "@/lib/rules";

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
  rules: ChallengeRules;
  isActive: boolean;
  requiresCompletedChallenge: { id: string; name: string } | null;
  eligibleYears?: number[] | null;
  eligibleCampusIds?: string[] | null;
  _count: { problems: number; enrollments: number };
  createdAt: string;
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [campuses, setCampuses] = useState<CampusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchChallenges = async () => {
    try {
      const [chRes, campRes] = await Promise.all([
        fetch("/api/superadmin/challenges"),
        fetch("/api/superadmin/campuses"),
      ]);

      if (chRes.ok) {
        const data = await chRes.json();
        setChallenges(data.challenges || []);
      }
      if (campRes.ok) {
        const campData = await campRes.json();
        setCampuses(campData.campuses || []);
      }
    } catch {
      console.error("Failed to fetch challenges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const formatYears = (years?: number[] | null) => {
    if (!years || years.length === 0 || years.length === 4) return "All Years (1st–4th)";
    return `Years: ${years.map((y) => `${y}${y === 1 ? "st" : y === 2 ? "nd" : y === 3 ? "rd" : "th"}`).join(", ")}`;
  };

  const formatCampuses = (campusIds?: string[] | null) => {
    if (!campusIds || campusIds.length === 0 || campusIds.length === campuses.length) {
      return "All 5 Partner Campuses";
    }
    const matched = campuses.filter((c) => campusIds.includes(c.id)).map((c) => c.name);
    return `${matched.length} Campuses (${matched.slice(0, 2).join(", ")}${matched.length > 2 ? "..." : ""})`;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div className="skeleton w-40 h-8" />
          <div className="skeleton w-32 h-10 rounded-xl" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="alta-card p-6 border border-white/10">
            <div className="skeleton w-48 h-6 mb-3 bg-white/5 rounded" />
            <div className="skeleton w-64 h-4 mb-2 bg-white/5 rounded" />
            <div className="skeleton w-32 h-4 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">DSA Challenge Tracks</h1>
          <p className="text-sm text-slate-400">
            Configure learning tracks, sheet problem counts, and student cohort eligibility.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="alta-button flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Challenge
        </button>
      </div>

      {/* Info Hint Banner */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3 text-xs text-slate-300">
        <HelpCircle className="w-5 h-5 text-[#3bc3e2] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Target Cohorts & Eligibility:</span> You can restrict any challenge to specific college graduation years (e.g. 3rd & 4th year placement track) or specific campuses among the 5 partner colleges.
        </div>
      </div>

      {/* Challenge Cards */}
      {challenges.length === 0 ? (
        <div className="alta-card p-12 text-center border border-white/10">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-bold text-white mb-2">No challenges yet</h3>
          <p className="text-sm text-slate-400 mb-4">
            Create your first DSA challenge track to get started
          </p>
          <button onClick={() => setShowCreateModal(true)} className="alta-button">
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
              className="alta-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 group hover:border-[#3bc3e2]/40 transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#3bc3e2]/10 border border-[#3bc3e2]/20"
                    style={{
                      background: challenge.isActive
                        ? "rgba(59,195,226,0.1)"
                        : "rgba(255,255,255,0.05)",
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-white">
                        {challenge.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          challenge.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}
                      >
                        {challenge.isActive ? "Active" : "Archived"}
                      </span>
                    </div>
                    {challenge.requiresCompletedChallenge && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Prerequisite:{" "}
                        <span className="font-semibold text-slate-300">
                          {challenge.requiresCompletedChallenge.name}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Eligibility Tags */}
                <div className="flex flex-wrap gap-2 my-2.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-semibold text-[#3bc3e2] flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> {formatYears(challenge.eligibleYears)}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[11px] font-semibold text-purple-300 flex items-center gap-1">
                    <School className="w-3 h-3" /> {formatCampuses(challenge.eligibleCampusIds)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {challenge.totalDays} days
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileQuestion className="w-3.5 h-3.5 text-slate-500" />
                    {challenge._count.problems} problems loaded
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    {challenge._count.enrollments} enrollments
                  </span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-[#3bc3e2] transition-colors shrink-0 hidden sm:block" />
            </Link>
          ))}
        </div>
      )}

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <CreateChallengeModal
          existingChallenges={challenges}
          campuses={campuses}
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

function CreateChallengeModal({
  existingChallenges,
  campuses,
  onClose,
  onCreated,
}: {
  existingChallenges: Challenge[];
  campuses: CampusOption[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [totalDays, setTotalDays] = useState(151);
  const [prerequisiteId, setPrerequisiteId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [eligibleYears, setEligibleYears] = useState<number[]>([1, 2, 3, 4]);
  const [eligibleCampusIds, setEligibleCampusIds] = useState<string[]>(
    campuses.map((c) => c.id)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleYear = (yr: number) => {
    if (eligibleYears.includes(yr)) {
      setEligibleYears(eligibleYears.filter((y) => y !== yr));
    } else {
      setEligibleYears([...eligibleYears, yr].sort());
    }
  };

  const toggleCampus = (cId: string) => {
    if (eligibleCampusIds.includes(cId)) {
      setEligibleCampusIds(eligibleCampusIds.filter((id) => id !== cId));
    } else {
      setEligibleCampusIds([...eligibleCampusIds, cId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/superadmin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          totalDays: Number(totalDays),
          requiresCompletedChallengeId: prerequisiteId || null,
          eligibleYears: eligibleYears.length === 4 ? null : eligibleYears,
          eligibleCampusIds:
            eligibleCampusIds.length === campuses.length ? null : eligibleCampusIds,
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create challenge");
        setLoading(false);
        return;
      }

      onCreated();
    } catch {
      setError("Failed to create challenge");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0c1b48] rounded-2xl shadow-2xl border border-white/10 animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-[#0c1b48]/95 backdrop-blur-md border-b border-white/10 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#3bc3e2]" /> Create New DSA Challenge
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Challenge Name
              </label>
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Total Days
              </label>
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Prerequisite Challenge
              </label>
              <select
                value={prerequisiteId}
                onChange={(e) => setPrerequisiteId(e.target.value)}
                className="alta-input appearance-none bg-[#071130] text-white"
              >
                <option value="">None (Open directly)</option>
                {existingChallenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer h-[46px]">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className="cursor-pointer"
                >
                  {isActive ? (
                    <ToggleRight className="w-8 h-8 text-[#3ccc8b]" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-500" />
                  )}
                </button>
                <span className="text-sm font-semibold text-white">
                  {isActive ? "Active" : "Inactive"}
                </span>
              </label>
            </div>
          </div>

          {/* Cohort Eligibility Configuration */}
          <div className="border-t border-white/10 pt-5 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4 text-[#3bc3e2]" /> Target Graduation Years
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setEligibleYears(eligibleYears.length === 4 ? [] : [1, 2, 3, 4])
                  }
                  className="text-[11px] font-semibold text-[#3bc3e2] hover:underline"
                >
                  {eligibleYears.length === 4 ? "Deselect All" : "Select All Years"}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Students in unselected years will not be able to join this track.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                {[1, 2, 3, 4].map((yr) => {
                  const isChecked = eligibleYears.includes(yr);
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => toggleYear(yr)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        isChecked
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

            <div className="pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
                  <School className="w-4 h-4 text-[#3bc3e2]" /> Eligible Partner Campuses
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
                  className="text-[11px] font-semibold text-[#3bc3e2] hover:underline"
                >
                  {eligibleCampusIds.length === campuses.length
                    ? "Deselect All"
                    : "Select All 5 Campuses"}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Select which of the 5 official partner campuses can access this track.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5">
                {campuses.map((c) => {
                  const isChecked = eligibleCampusIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCampus(c.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left flex items-center justify-between ${
                        isChecked
                          ? "bg-purple-500/20 border-purple-500 text-white"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div>
                        <div className="font-bold">{c.name}</div>
                        <div className="text-[10px] text-slate-400">{c.region}</div>
                      </div>
                      <span className="text-xs">{isChecked ? "✓" : "+"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="alta-button-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="alta-button text-xs font-bold flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Challenge Track
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
