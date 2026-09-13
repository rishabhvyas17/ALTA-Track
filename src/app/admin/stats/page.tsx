"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  Trophy,
  Flame,
  CheckCircle2,
  TrendingUp,
  Loader2,
  GraduationCap,
  Layers,
  Sparkles,
  Building2,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

interface StatsPayload {
  campus: {
    id: string;
    name: string;
    region?: string;
  };
  kpis: {
    totalStudents: number;
    enrolledStudents?: number;
    activeStreakers: number;
    avgStreak: number;
    maxStreak: number;
    submissionsToday: number;
    totalSubmissions: number;
    pendingSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    approvalRate: number;
  };
  streakMilestones: {
    streak7Plus: number;
    streak14Plus: number;
    streak25Plus: number;
    streak50Plus: number;
  };
  difficultyCount: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  yearDistribution: {
    year: number;
    label: string;
    totalStudents: number;
    activeStreakers: number;
    avgStreak: number;
    totalSubmissions: number;
    approvedSubmissions: number;
  }[];
}

const DIFF_COLORS = {
  Easy: "#10b981",
  Medium: "#f59e0b",
  Hard: "#f43f5e",
};

export default function CampusStatsPage() {
  const [data, setData] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampusStats();
  }, []);

  const fetchCampusStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[var(--color-accent-cyan)] animate-spin" />
        <p className="text-xs text-[var(--color-neutral-silver)] font-medium">
          Loading campus performance analytics...
        </p>
      </div>
    );
  }

  const { campus, kpis, streakMilestones, difficultyCount, yearDistribution } = data;

  const difficultyChartData = [
    { name: "Easy", count: difficultyCount.Easy, fill: DIFF_COLORS.Easy },
    { name: "Medium", count: difficultyCount.Medium, fill: DIFF_COLORS.Medium },
    { name: "Hard", count: difficultyCount.Hard, fill: DIFF_COLORS.Hard },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
            {campus.name}
          </span>
          <span className="text-xs text-gray-400">{campus.region}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3 mt-1">
          <BarChart3 className="w-8 h-8 text-[var(--color-accent-cyan)]" />
          Campus Cohorts & Performance Analytics
        </h1>
        <p className="text-xs text-[var(--color-neutral-silver)] mt-1">
          In-depth statistics for student retention, daily problem streaks, and year-wise participation.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="alta-card p-5 space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Students</span>
          <div className="text-3xl font-black text-white">{kpis.totalStudents}</div>
          <p className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {kpis.enrolledStudents ?? kpis.totalStudents} Enrolled
          </p>
        </div>

        <div className="alta-card p-5 space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Daily Streakers</span>
          <div className="text-3xl font-black text-orange-400 flex items-center gap-1">
            {kpis.activeStreakers} <Flame className="w-5 h-5 fill-orange-400 inline" />
          </div>
          <p className="text-[11px] text-gray-400">Avg {kpis.avgStreak} days streak</p>
        </div>

        <div className="alta-card p-5 space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Verified Solutions</span>
          <div className="text-3xl font-black text-emerald-400">{kpis.approvedSubmissions}</div>
          <p className="text-[11px] text-emerald-400 font-semibold">{kpis.approvalRate}% approval rate</p>
        </div>

        <div className="alta-card p-5 space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Highest Streak</span>
          <div className="text-3xl font-black text-cyan-400">{kpis.maxStreak} Days</div>
          <p className="text-[11px] text-gray-400">Campus benchmark record</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Year-wise Student Cohorts Bar Chart */}
        <div className="alta-card p-6 space-y-4">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2 border-b border-[var(--color-border-dark)] pb-3">
            <GraduationCap className="w-4 h-4 text-cyan-400" /> Year-wise Cohort Participation
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d1e56",
                    borderColor: "rgba(59,195,226,0.3)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="totalStudents" name="Enrolled" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="activeStreakers" name="Active Streakers" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Difficulty Distribution Pie Chart */}
        <div className="alta-card p-6 space-y-4">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2 border-b border-[var(--color-border-dark)] pb-3">
            <Layers className="w-4 h-4 text-emerald-400" /> Solved Difficulty Distribution
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {difficultyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d1e56",
                    borderColor: "rgba(59,195,226,0.3)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-emerald-400 font-bold block">Easy</span>
              <span className="font-black text-white">{difficultyCount.Easy}</span>
            </div>
            <div>
              <span className="text-amber-400 font-bold block">Medium</span>
              <span className="font-black text-white">{difficultyCount.Medium}</span>
            </div>
            <div>
              <span className="text-rose-400 font-bold block">Hard</span>
              <span className="font-black text-white">{difficultyCount.Hard}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Retention Milestones */}
      <div className="alta-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-border-dark)] pb-3">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Streak Milestones & Rewards Eligibility
          </h3>
          <span className="text-xs text-cyan-400 font-bold">25+ Days for Mock Interviews</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
            <span className="text-xs font-bold text-cyan-400 block">7+ Days Streak</span>
            <span className="text-2xl font-black text-white">{streakMilestones.streak7Plus}</span>
            <p className="text-[10px] text-gray-400 mt-1">Consistency habit formed</p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-xs font-bold text-emerald-400 block">14+ Days Streak</span>
            <span className="text-2xl font-black text-white">{streakMilestones.streak14Plus}</span>
            <p className="text-[10px] text-gray-400 mt-1">2 weeks continuous</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-xs font-bold text-amber-400 block">25+ Days Streak</span>
            <span className="text-2xl font-black text-white">{streakMilestones.streak25Plus}</span>
            <p className="text-[10px] text-amber-400/90 font-bold mt-1">Mock Interview Ready 🎓</p>
          </div>

          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <span className="text-xs font-bold text-purple-400 block">50+ Days Streak</span>
            <span className="text-2xl font-black text-white">{streakMilestones.streak50Plus}</span>
            <p className="text-[10px] text-purple-400/90 font-bold mt-1">Elite Performer 👑</p>
          </div>
        </div>
      </div>
    </div>
  );
}
