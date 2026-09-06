"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Flame,
  Building,
  GraduationCap,
  Medal,
  Award,
  Crown,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  year: number;
  campus?: { id: string; name: string; region: string };
}

interface EnrollmentLeaderboardItem {
  id: string;
  currentDay: number;
  streakCount: number;
  longestStreak: number;
  status: string;
  score: number;
  questionsSolved: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  user: UserInfo;
  challenge: { id: string; name: string; totalDays: number };
}

interface CampusRankingItem {
  id: string;
  name: string;
  region?: string;
  totalScore: number;
  totalQuestionsSolved: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  totalStreak: number;
  studentCount: number;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"OVERALL" | "CAMPUS" | "YEAR">("OVERALL");
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [challenges, setChallenges] = useState<{ id: string; name: string }[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");

  const [individualRankings, setIndividualRankings] = useState<EnrollmentLeaderboardItem[]>([]);
  const [campusRankings, setCampusRankings] = useState<CampusRankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedChallengeId, activeTab, selectedYear]);

  const fetchChallenges = async () => {
    try {
      const res = await fetch("/api/student/challenges");
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedChallengeId) params.set("challengeId", selectedChallengeId);
      if (activeTab === "YEAR") params.set("year", selectedYear.toString());

      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setIndividualRankings(data.individualRankings || []);
        setCampusRankings(data.campusRankings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-black font-black text-sm shadow-lg shadow-amber-400/30">
          <Crown className="w-4 h-4 fill-black" />
        </div>
      );
    if (rank === 2)
      return (
        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-black font-black text-sm shadow-md">
          <Medal className="w-4 h-4 text-slate-800" />
        </div>
      );
    if (rank === 3)
      return (
        <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-black text-sm shadow-md">
          <Award className="w-4 h-4 text-amber-200" />
        </div>
      );
    return (
      <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
        #{rank}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-navy-dark)] text-white relative pb-20">
      {/* Glow Backdrop */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[var(--color-primary-cyan)]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-[var(--color-border-dark)] bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--color-accent-cyan)] to-[var(--color-primary-cyan)] flex items-center justify-center text-white font-extrabold text-xl shadow-lg">
                A
              </div>
              <div>
                <h1 className="font-black text-xl tracking-wider text-white">
                  ALTA <span className="text-[var(--color-accent-cyan)]">LEADERBOARD</span>
                </h1>
                <p className="text-[10px] uppercase font-bold text-[var(--color-accent-green)] tracking-widest">
                  Real-time Consistency Hall of Fame
                </p>
              </div>
            </div>
          </div>

          {/* Challenge Filter */}
          <select
            value={selectedChallengeId}
            onChange={(e) => setSelectedChallengeId(e.target.value)}
            className="alta-input text-xs text-white bg-[var(--color-navy-dark)] max-w-xs"
          >
            <option value="">All Challenges</option>
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[var(--color-border-dark)] pb-4">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab("OVERALL")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "OVERALL"
                  ? "bg-[var(--color-accent-cyan)] text-black shadow-lg shadow-[var(--color-accent-cyan)]/20"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Trophy className="w-4 h-4" /> Overall Leaderboard
            </button>

            <button
              onClick={() => setActiveTab("CAMPUS")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "CAMPUS"
                  ? "bg-[var(--color-accent-cyan)] text-black shadow-lg shadow-[var(--color-accent-cyan)]/20"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Building className="w-4 h-4" /> Campus Standings
            </button>

            <button
              onClick={() => setActiveTab("YEAR")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "YEAR"
                  ? "bg-[var(--color-accent-cyan)] text-black shadow-lg shadow-[var(--color-accent-cyan)]/20"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Year-wise
            </button>
          </div>

          {activeTab === "YEAR" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400">Select Year:</span>
              {[1, 2, 3, 4].map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    selectedYear === y
                      ? "bg-[var(--color-accent-green)] text-black border-[var(--color-accent-green)]"
                      : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {y}st/nd/rd/th Year ({y})
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 text-[var(--color-primary-cyan)] animate-spin" />
          </div>
        ) : activeTab === "CAMPUS" ? (
          /* Campus Aggregate Rankings */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campusRankings.map((c, idx) => (
              <div
                key={c.id}
                className="alta-card p-6 flex flex-col justify-between space-y-4 hover:border-[var(--color-accent-cyan)]/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  {getRankBadge(idx + 1)}
                  <span className="px-3 py-1 rounded-full bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)] text-xs font-bold border border-[var(--color-accent-cyan)]/20">
                    {c.studentCount} Active Students
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">{c.name}</h3>
                  {c.region && <div className="text-xs text-gray-400 mt-0.5">{c.region}</div>}

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[var(--color-border-dark)]">
                    <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Score</div>
                      <div className="text-base font-black text-[var(--color-accent-cyan)] flex items-center gap-1 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" /> {c.totalScore} pts
                      </div>
                    </div>
                    <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Questions Solved</div>
                      <div className="text-base font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {c.totalQuestionsSolved}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-amber-400 font-bold mt-3 pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 fill-amber-400" />
                      Total Streak: {c.totalStreak} Days
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {c.easyCount}E • {c.mediumCount}M • {c.hardCount}H
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Individual Rankings Table */
          <div className="alta-card overflow-hidden">
            {individualRankings.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                No rankings available for this view.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border-dark)] bg-white/[0.02] text-xs font-bold text-[var(--color-neutral-silver)] uppercase tracking-wider">
                      <th className="p-4 pl-6">Rank</th>
                      <th className="p-4">Student</th>
                      <th className="p-4">Campus</th>
                      <th className="p-4">Challenge Track</th>
                      <th className="p-4">Score</th>
                      <th className="p-4">Questions Solved</th>
                      <th className="p-4">Current Streak</th>
                      <th className="p-4">Progress Day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-dark)] text-sm">
                    {individualRankings.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-4 pl-6">{getRankBadge(idx + 1)}</td>
                        <td className="p-4">
                          <div className="font-bold text-white">{item.user.name}</div>
                          <div className="text-xs text-gray-400">Year {item.user.year}</div>
                        </td>
                        <td className="p-4 text-xs font-semibold text-[var(--color-accent-cyan)]">
                          {item.user.campus?.name || "Global Campus"}
                        </td>
                        <td className="p-4 font-semibold text-gray-200">
                          {item.challenge.name}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-sm font-black text-[var(--color-primary-cyan)]">
                            <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" /> {item.score} pts
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {item.questionsSolved} Solved
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                              {item.easyCount} Easy • {item.mediumCount} Med • {item.hardCount} Hard
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-sm font-black text-amber-400">
                            <Flame className="w-4 h-4 fill-amber-400" /> {item.streakCount} Days
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                            Day {item.currentDay} / {item.challenge.totalDays}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
