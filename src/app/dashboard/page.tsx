"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Flame,
  Trophy,
  ExternalLink,
  Share2,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Send,
  Loader2,
  AlertCircle,
  Video,
  Gift,
  ChevronDown,
  ChevronUp,
  LogOut,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface Problem {
  id: string;
  dayNumber: number;
  title: string;
  topic: string;
  difficulty: string;
  externalLink: string;
}

interface Submission {
  id: string;
  dayNumber: number;
  linkedinPostUrl: string;
  supportingLink: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
}

interface DashboardData {
  enrollment: {
    id: string;
    currentDay: number;
    streakCount: number;
    longestStreak: number;
    graceDaysUsedThisMonth: number;
    status: string;
  };
  challenge: {
    id: string;
    name: string;
    totalDays: number;
    rulesFormatted: string[];
    template?: {
      templateText: string;
      requiredHashtag: string;
    };
  };
  currentProblem: Problem | null;
  todaySubmission: Submission | null;
  submissions: Submission[];
  interviewApp: any;
  goodiesClaim: any;
  isEligibleForInterview: boolean;
  isEligibleForGoodies: boolean;
}

export default function StudentDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  // Submission Form State
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [supportingLink, setSupportingLink] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Copy template state
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Modals for Interview & Goodies
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewNotes, setInterviewNotes] = useState("");
  const [applyingInterview, setApplyingInterview] = useState(false);

  const [showGoodiesModal, setShowGoodiesModal] = useState(false);
  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [claimingGoodies, setClaimingGoodies] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/student/dashboard");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/");
          return;
        }
        throw new Error("Failed to load dashboard");
      }

      const result = await res.json();
      if (!result.enrollment) {
        router.push("/onboarding");
        return;
      }

      setData(result);
      if (result.todaySubmission) {
        setLinkedinUrl(result.todaySubmission.linkedinPostUrl || "");
        setSupportingLink(result.todaySubmission.supportingLink || "");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTemplate = () => {
    if (!data?.challenge?.template || !data?.currentProblem) return;
    const { templateText, requiredHashtag } = data.challenge.template;
    const formatted = templateText
      .replace("{day}", data.enrollment.currentDay.toString())
      .replace("{problemTitle}", data.currentProblem.title)
      .replace("{difficulty}", data.currentProblem.difficulty)
      .replace("{topic}", data.currentProblem.topic)
      .replace("{hashtag}", requiredHashtag);

    navigator.clipboard.writeText(formatted);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.enrollment || !data?.currentProblem) return;

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const res = await fetch("/api/student/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: data.enrollment.id,
          dayNumber: data.enrollment.currentDay,
          problemId: data.currentProblem.id,
          linkedinPostUrl: linkedinUrl,
          supportingLink: supportingLink || undefined,
          githubLink: githubLink || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Submission failed");

      setSubmitSuccess("Solution submitted successfully! Streak incremented 🔥");
      fetchDashboard();
      setTimeout(() => setSubmitSuccess(""), 4000);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit solution");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.challenge) return;
    setApplyingInterview(true);

    try {
      const res = await fetch("/api/student/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: data.challenge.id,
          notes: interviewNotes,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to apply");

      setShowInterviewModal(false);
      fetchDashboard();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setApplyingInterview(false);
    }
  };

  const handleClaimGoodies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.challenge) return;
    setClaimingGoodies(true);

    try {
      const res = await fetch("/api/student/goodies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: data.challenge.id,
          shippingName,
          shippingAddress,
          phone,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to claim");

      setShowGoodiesModal(false);
      fetchDashboard();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setClaimingGoodies(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-navy-dark)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[var(--color-primary-cyan)] animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--color-navy-dark)] flex items-center justify-center p-4">
        <div className="alta-card max-w-md w-full p-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Error Loading Dashboard</h2>
          <p className="text-sm text-gray-400">{error || "No active challenge found."}</p>
          <button onClick={fetchDashboard} className="alta-button inline-flex items-center gap-2">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { enrollment, challenge, currentProblem, todaySubmission } = data;
  const progressPct = Math.round((enrollment.streakCount / challenge.totalDays) * 100);

  return (
    <div className="min-h-screen bg-[var(--color-navy-dark)] text-white relative pb-20">
      {/* Glow Backdrop */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-[var(--color-primary-cyan)]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Student Header */}
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
                Student Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Streak & Track Banner */}
        <div className="alta-card p-6 sm:p-8 bg-gradient-to-br from-[var(--color-navy-dark)] via-black/40 to-black/60 border border-[var(--color-border-cyan)]/30 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)] border border-[var(--color-accent-cyan)]/20 text-xs font-bold uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" /> Track: {challenge.name}
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Day {enrollment.currentDay} of {challenge.totalDays}
              </h2>
              <p className="text-xs text-[var(--color-neutral-silver)]">
                Grace days remaining this month: <strong className="text-white">{1 - enrollment.graceDaysUsedThisMonth}</strong>
              </p>
            </div>

            {/* Streak Counter Badge */}
            <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-black font-black text-2xl shadow-lg shadow-amber-500/20 animate-pulse">
                <Flame className="w-8 h-8 text-orange-600 fill-orange-600" />
              </div>
              <div>
                <div className="text-3xl font-black text-white">{enrollment.streakCount} Days</div>
                <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                  Current Streak 🔥
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-6 border-t border-[var(--color-border-dark)] space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[var(--color-neutral-silver)]">Overall Progress</span>
              <span className="text-[var(--color-accent-cyan)]">{progressPct}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-green)] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Milestones / Rewards Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mock Interview Eligibility */}
          <div className="alta-card p-6 flex items-center justify-between gap-4 border-l-4 border-l-[var(--color-accent-cyan)]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-[var(--color-accent-cyan)]" />
                <h3 className="font-bold text-white text-base">Mock Interview Milestone</h3>
              </div>
              <p className="text-xs text-[var(--color-neutral-silver)]">
                Unlocked at 25-day streak. Get interviewed by top engineers.
              </p>
            </div>

            {data.interviewApp ? (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                Applied ({data.interviewApp.status})
              </span>
            ) : data.isEligibleForInterview ? (
              <button
                onClick={() => setShowInterviewModal(true)}
                className="alta-button px-4 py-2 text-xs font-bold cursor-pointer"
              >
                Apply Now
              </button>
            ) : (
              <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-500 text-xs font-bold">
                {enrollment.streakCount}/25 Days
              </span>
            )}
          </div>

          {/* ALTA Goodies Eligibility */}
          <div className="alta-card p-6 flex items-center justify-between gap-4 border-l-4 border-l-[var(--color-accent-green)]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[var(--color-accent-green)]" />
                <h3 className="font-bold text-white text-base">ALTA Swag & Goodies</h3>
              </div>
              <p className="text-xs text-[var(--color-neutral-silver)]">
                Unlocked on completing 30 days! Claim t-shirt & badges.
              </p>
            </div>

            {data.goodiesClaim ? (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                Claimed!
              </span>
            ) : data.isEligibleForGoodies ? (
              <button
                onClick={() => setShowGoodiesModal(true)}
                className="alta-button px-4 py-2 text-xs font-bold cursor-pointer"
              >
                Claim Goodies
              </button>
            ) : (
              <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-500 text-xs font-bold">
                {enrollment.streakCount}/30 Days
              </span>
            )}
          </div>
        </div>

        {/* Challenge Rules Accordion */}
        <div className="alta-card p-4 sm:p-6 space-y-4">
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full flex items-center justify-between text-left font-bold text-white hover:text-[var(--color-accent-cyan)] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 text-base">
              <BookOpen className="w-5 h-5 text-[var(--color-accent-cyan)]" /> Challenge Rules & Submission Policy
            </span>
            {showRules ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showRules && (
            <div className="pt-4 border-t border-[var(--color-border-dark)] space-y-2 text-xs text-gray-300 animate-fade-in">
              <ul className="space-y-2">
                {challenge.rulesFormatted.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-cyan)] mt-1.5 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Main Grid: Problem & Submission */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Problem Card */}
          <div className="alta-card p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border-dark)] pb-4">
                <span className="px-3 py-1 rounded-full bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)] font-extrabold text-xs">
                  DAY {enrollment.currentDay} PROBLEM
                </span>
                {currentProblem && (
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300">
                    {currentProblem.difficulty}
                  </span>
                )}
              </div>

              {currentProblem ? (
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white">{currentProblem.title}</h3>
                  <div className="inline-block px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 font-semibold">
                    Topic: {currentProblem.topic}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  No problem assigned for Day {enrollment.currentDay} yet. Please check back soon!
                </p>
              )}
            </div>

            {currentProblem && (
              <div className="pt-6 border-t border-[var(--color-border-dark)]">
                <a
                  href={currentProblem.externalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="alta-button w-full flex items-center justify-center gap-2 py-3 cursor-pointer text-sm font-bold"
                >
                  Solve on LeetCode / Platform <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* Submission & Template Generator */}
          <div className="alta-card p-6 sm:p-8 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-[var(--color-border-dark)] pb-4">
              <Share2 className="w-5 h-5 text-[var(--color-accent-cyan)]" /> Submit Daily Progress
            </h3>

            {/* LinkedIn Template Generator */}
            {challenge.template && (
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-accent-cyan)] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> LinkedIn Post Generator
                  </span>
                  <button
                    onClick={handleCopyTemplate}
                    className="px-3 py-1 rounded-lg bg-[var(--color-accent-cyan)]/10 hover:bg-[var(--color-accent-cyan)]/20 text-[var(--color-accent-cyan)] text-xs font-semibold border border-[var(--color-accent-cyan)]/30 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedTemplate ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Post Text
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Copy the template, share your post on LinkedIn with hashtag{" "}
                  <code className="text-cyan-400 font-bold">{challenge.template.requiredHashtag}</code>, and paste the post link below.
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitSolution} className="space-y-4">
              {submitError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  {submitSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  LinkedIn Post URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.linkedin.com/posts/..."
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="alta-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Code Screenshot / Proof Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://imgur.com/..."
                  value={supportingLink}
                  onChange={(e) => setSupportingLink(e.target.value)}
                  className="alta-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  GitHub Solution Repo / File (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={githubLink}
                  onChange={(e) => setGithubLink(e.target.value)}
                  className="alta-input w-full text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="alta-button w-full flex items-center justify-center gap-2 py-3 text-sm font-bold cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Solution & Maintain Streak
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Mock Interview Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="alta-card max-w-md w-full p-6 sm:p-8 space-y-6 relative border border-[var(--color-border-cyan)]">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-[var(--color-border-dark)] pb-4">
              <Video className="w-5 h-5 text-[var(--color-accent-cyan)]" /> Apply for Mock Interview
            </h3>

            <p className="text-xs text-[var(--color-neutral-silver)]">
              Congratulations on reaching a 25-day streak! You are eligible for a 1-on-1 technical mock interview with an ALTA senior mentor.
            </p>

            <form onSubmit={handleApplyInterview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Preferred Schedule / Notes for Interviewer
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Available weekdays post 6 PM. Interested in Data Structures focus."
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  className="alta-input w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-dark)]">
                <button
                  type="button"
                  onClick={() => setShowInterviewModal(false)}
                  className="alta-button-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyingInterview}
                  className="alta-button text-xs font-bold"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goodies Claim Modal */}
      {showGoodiesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="alta-card max-w-md w-full p-6 sm:p-8 space-y-6 relative border border-[var(--color-border-cyan)]">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-[var(--color-border-dark)] pb-4">
              <Gift className="w-5 h-5 text-[var(--color-accent-green)]" /> Claim ALTA Goodies Swag Pack
            </h3>

            <form onSubmit={handleClaimGoodies} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  className="alta-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Complete Shipping Address
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="House/Hostel No, Street, City, Pincode"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="alta-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="alta-input w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-dark)]">
                <button
                  type="button"
                  onClick={() => setShowGoodiesModal(false)}
                  className="alta-button-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimingGoodies}
                  className="alta-button text-xs font-bold"
                >
                  Confirm Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
