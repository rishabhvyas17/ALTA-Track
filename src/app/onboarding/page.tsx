"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Flame,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Calendar,
  Sparkles,
} from "lucide-react";

interface MappedChallenge {
  id: string;
  name: string;
  slug: string;
  totalDays: number;
  isActive: boolean;
  requiresCompletedChallengeId: string | null;
  isEnrolled: boolean;
  isCompleted: boolean;
  isUnlocked: boolean;
  isEligible?: boolean;
  ineligibilityReason?: string | null;
  _count: {
    problems: number;
    enrollments: number;
  };
}

export default function StudentOnboardingPage() {
  const router = useRouter();

  const [challenges, setChallenges] = useState<MappedChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudentChallenges();
  }, []);

  const fetchStudentChallenges = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/student/challenges");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/");
          return;
        }
        throw new Error("Failed to load challenges");
      }

      const data = await res.json();

      // If user has active enrollment already, redirect to dashboard directly
      if (data.activeEnrollmentChallengeId) {
        router.push("/dashboard");
        return;
      }

      setChallenges(data.challenges || []);
    } catch (err: any) {
      setError(err.message || "Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (challengeId: string) => {
    try {
      setEnrollingId(challengeId);
      setError("");

      const res = await fetch("/api/student/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enroll");

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Enrollment failed");
      setEnrollingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-navy-dark)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[var(--color-primary-cyan)] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[var(--color-neutral-silver)]">
            Loading ALTA Challenge Tracks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-navy-dark)] text-white relative overflow-hidden">
      {/* Background Glow Elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[var(--color-primary-cyan)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[var(--color-accent-green)]/10 rounded-full blur-3xl pointer-events-none" />

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
                AI-First UG CS Challenge Engine
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-accent-cyan)]/10 border border-[var(--color-accent-cyan)]/30 text-[var(--color-accent-cyan)] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Welcome Student! Choose Your Challenge Track
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Build Consistency. <span className="alta-text-gradient">Master DSA.</span> Unlock Goodies.
          </h2>
          <p className="text-base text-[var(--color-neutral-silver)]">
            Select an active challenge track below to begin your daily problem-solving streak. Maintain consistency, post your progress, and get eligible for mock interviews and exclusive ALTA goodies.
          </p>
        </div>

        {error && (
          <div className="max-w-xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {/* Challenge Track Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {challenges.map((c) => (
            <div
              key={c.id}
              className={`alta-card p-8 flex flex-col justify-between space-y-6 relative overflow-hidden transition-all duration-300 ${
                !c.isUnlocked
                  ? "opacity-60 border-white/5 bg-white/[0.01]"
                  : "hover:border-[var(--color-accent-cyan)]/60 hover:shadow-2xl"
              }`}
            >
              {/* Top Banner */}
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-accent-cyan)]/20 to-[var(--color-primary-cyan)]/20 border border-[var(--color-accent-cyan)]/40 flex items-center justify-center text-[var(--color-accent-cyan)]">
                  <Trophy className="w-6 h-6" />
                </div>

                {!c.isUnlocked ? (
                  <span className="px-3.5 py-1 rounded-full bg-gray-500/10 border border-gray-500/30 text-xs font-bold text-gray-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Locked
                  </span>
                ) : c.isEligible === false ? (
                  <span className="px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Cohort Restricted
                  </span>
                ) : c.isCompleted ? (
                  <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                  </span>
                ) : (
                  <span className="px-3.5 py-1 rounded-full bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/30 text-xs font-bold text-[var(--color-accent-green)] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" /> Open for You
                  </span>
                )}
              </div>

              {/* Challenge Details */}
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white">{c.name}</h3>
                <div className="flex items-center gap-6 text-sm text-[var(--color-neutral-silver)]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[var(--color-accent-cyan)]" />
                    {c.totalDays} Days Track
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[var(--color-accent-green)]" />
                    {c._count?.problems || 0} Problems Ready
                  </span>
                </div>
              </div>

              {/* Ineligibility Reason */}
              {c.isEligible === false && c.ineligibilityReason && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>{c.ineligibilityReason}</span>
                </div>
              )}

              {/* Prerequisite Info */}
              {c.requiresCompletedChallengeId && !c.isUnlocked && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Prerequisite: Complete BASE 111 track to unlock APEX 151.</span>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-4 border-t border-[var(--color-border-dark)]">
                {c.isUnlocked && c.isEligible !== false ? (
                  <button
                    onClick={() => handleEnroll(c.id)}
                    disabled={enrollingId === c.id}
                    className="alta-button w-full flex items-center justify-center gap-2 py-3.5 cursor-pointer text-base font-extrabold"
                  >
                    {enrollingId === c.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Enroll & Start Challenge <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                ) : c.isEligible === false ? (
                  <button
                    disabled
                    className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" /> Cohort Not Eligible
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" /> Locked Prerequisite
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
