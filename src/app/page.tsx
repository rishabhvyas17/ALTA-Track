"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Target,
  Trophy,
  Users,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Building,
  GraduationCap,
  Sparkles,
  Lock,
  Mail,
  User,
  Code2,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Medal,
  Calendar,
  Github,
  Linkedin,
  Heart,
  ExternalLink,
  X,
  Star,
  Award,
} from "lucide-react";

interface Campus {
  id: string;
  name: string;
  region: string;
}

interface Track {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface LeaderboardUser {
  id: string;
  name: string;
  totalScore: number;
  questionsSolved?: number;
  streakCount?: number;
  campus: { name: string };
}

export default function LandingPage() {
  const router = useRouter();

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [campusId, setCampusId] = useState("");
  const [year, setYear] = useState<number>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCampuses();
    fetchLandingData();
  }, []);

  const fetchCampuses = async () => {
    try {
      const res = await fetch("/api/campuses");
      if (res.ok) {
        const data = await res.json();
        setCampuses(data.campuses || []);
        if (data.campuses?.length > 0) {
          setCampusId(data.campuses[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load campuses:", err);
    }
  };

  const fetchLandingData = async () => {
    try {
      const res = await fetch("/api/landing");
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error("Failed to load landing data:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint =
        authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload =
        authMode === "login"
          ? { email, password }
          : { name, email, password, campusId, year: Number(year) };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Redirect based on user role
      if (data.user.role === "SUPER_ADMIN") {
        router.push("/superadmin");
      } else if (data.user.role === "CAMPUS_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050c24] text-white flex flex-col relative overflow-x-hidden selection:bg-[#3bc3e2] selection:text-black scroll-smooth">
      {/* Background Animated Glow Spheres */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#3bc3e2]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] bg-[#3ccc8b]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#0d1e56] rounded-full blur-[160px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/10 bg-[#050c24]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#3bc3e2] to-[#22acd1] flex items-center justify-center text-[#050c24] font-black text-2xl shadow-lg shadow-[#3bc3e2]/30">
              A
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-wider text-white flex items-center gap-1.5">
                ALTA <span className="text-[#3bc3e2]">TRACK</span>
              </h1>
              <p className="text-[10px] uppercase font-extrabold text-[#3ccc8b] tracking-widest">
                AI-First UG CS DSA Engine
              </p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-7 text-sm font-bold text-slate-300">
            <a href="#tracks" className="hover:text-[#3bc3e2] transition-colors">Tracks</a>
            <a href="#how-it-works" className="hover:text-[#3bc3e2] transition-colors">How it Works</a>
            <a href="#leaderboard" className="hover:text-[#3bc3e2] transition-colors">Leaderboard</a>
            <a href="#about" className="hover:text-[#3bc3e2] transition-colors">About</a>
            <button
              type="button"
              onClick={() => setShowTeamModal(true)}
              className="hover:text-[#3bc3e2] transition-colors flex items-center gap-1.5 text-cyan-300 font-bold cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> Team & Mentors
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#3bc3e2]/15 via-[#3ccc8b]/15 to-[#3bc3e2]/15 border border-[#3bc3e2]/30 text-[#3bc3e2] text-xs font-black uppercase tracking-wider shadow-inner">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0" />
              Made by ALTA Tech Club Indore • For ALTA Students
            </div>

            <div className="space-y-6">
              <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Master DSA. <br/>
                <span className="alta-text-gradient">Build Consistency.</span> <br />
                Win Rewards.
              </h2>
              <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed font-medium">
                Join ALTA's structured coding programs. Solve challenges daily, compete with peers across top campuses, and build an undeniable proof of work.
              </p>
            </div>

            {/* Key Metrics Chips */}
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="p-5 rounded-2xl bg-[#0c1b48]/80 border border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#3bc3e2]/10 flex items-center justify-center">
                  <Building className="w-6 h-6 text-[#3bc3e2]" />
                </div>
                <div>
                  <div className="text-3xl font-black text-white">5</div>
                  <div className="text-xs font-bold text-[#3bc3e2] uppercase tracking-wider">Partner Campuses</div>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-[#0c1b48]/80 border border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#3ccc8b]/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#3ccc8b]" />
                </div>
                <div>
                  <div className="text-3xl font-black text-white">600+</div>
                  <div className="text-xs font-bold text-[#3ccc8b] uppercase tracking-wider">Active Students</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Right Auth Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#3bc3e2] to-[#3ccc8b] rounded-3xl blur opacity-20 animate-pulse" />
            <div className="alta-card p-6 sm:p-8 space-y-6 relative border border-[#3bc3e2]/30 shadow-2xl shadow-[#3bc3e2]/10 bg-[#071130]/95 backdrop-blur-xl rounded-2xl">
              {/* Tab Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#050c24] rounded-2xl border border-white/15">
                <button
                  onClick={() => setAuthMode("login")}
                  className={`py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                    authMode === "login"
                      ? "bg-gradient-to-r from-[#3bc3e2] to-[#22acd1] text-[#050c24] shadow-md"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthMode("signup")}
                  className={`py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                    authMode === "signup"
                      ? "bg-gradient-to-r from-[#3bc3e2] to-[#22acd1] text-[#050c24] shadow-md"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === "signup" && (
                  <div>
                    <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Arjun Patel"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="alta-input pl-11"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="student@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="alta-input pl-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="alta-input pl-11 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {authMode === "signup" && (
                  <>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                        Select Campus
                      </label>
                      <div className="relative">
                        <Building className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
                        <select
                          value={campusId}
                          onChange={(e) => setCampusId(e.target.value)}
                          className="alta-input pl-11 text-white bg-[#071130] appearance-none"
                        >
                          {campuses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.region})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                        Current Academic Year
                      </label>
                      <div className="relative">
                        <GraduationCap className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
                        <select
                          value={year}
                          onChange={(e) => setYear(Number(e.target.value))}
                          className="alta-input pl-11 text-white bg-[#071130] appearance-none"
                        >
                          <option value={1}>1st Year (BASE 111 Eligible)</option>
                          <option value={2}>2nd Year</option>
                          <option value={3}>3rd Year</option>
                          <option value={4}>4th Year</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="alta-button w-full py-3.5 text-base font-black flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : authMode === "login" ? (
                    <>
                      Sign In to Portal <ArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      Create Student Account <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#3bc3e2]/30 to-transparent my-8" />

        {/* Tracks Section */}
        <section id="tracks" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12 space-y-4">
            <h3 className="text-3xl sm:text-4xl font-black text-white">Live <span className="text-[#3bc3e2]">Tracks</span></h3>
            <p className="text-slate-300 font-medium max-w-2xl mx-auto">
              Join active challenges and start your daily streak. Solve DSA problems, build consistency, and level up your skills.
            </p>
          </div>

          {dataLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#3bc3e2]" />
            </div>
          ) : tracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tracks.map(track => (
                <div key={track.id} className="alta-card p-6 flex flex-col hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 rounded-xl bg-[#3bc3e2]/10 flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-[#3bc3e2]" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">{track.title}</h4>
                  <p className="text-sm text-slate-300 mb-6 flex-1 line-clamp-3">{track.description}</p>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#3ccc8b]" />
                      <span>{new Date(track.startDate).toLocaleDateString()}</span>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg">Active</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-slate-400 font-semibold">No active tracks at the moment. Check back soon!</p>
            </div>
          )}
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-[#0c1b48]/30 rounded-[3rem] border border-white/5 my-12">
          <div className="text-center mb-16 space-y-4">
            <h3 className="text-3xl sm:text-4xl font-black text-white">How it <span className="text-[#3ccc8b]">Works</span></h3>
            <p className="text-slate-300 font-medium max-w-2xl mx-auto">
              A simple, verifiable process to build your coding habit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-[#3bc3e2]/20 via-[#3ccc8b]/20 to-[#fcc032]/20" />
            
            <div className="relative text-center space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#050c24] border-4 border-[#3bc3e2] flex items-center justify-center shadow-lg shadow-[#3bc3e2]/20 z-10 relative">
                <Code2 className="w-10 h-10 text-[#3bc3e2]" />
              </div>
              <h4 className="text-xl font-bold text-white">1. Solve Daily</h4>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">Log in every day to find your curated DSA problem. Write code, pass tests, and conquer it.</p>
            </div>

            <div className="relative text-center space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#050c24] border-4 border-[#3ccc8b] flex items-center justify-center shadow-lg shadow-[#3ccc8b]/20 z-10 relative">
                <CheckCircle2 className="w-10 h-10 text-[#3ccc8b]" />
              </div>
              <h4 className="text-xl font-bold text-white">2. Verify Work</h4>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">Submit your solution link (e.g., LeetCode) and provide a verifiable LinkedIn post URL.</p>
            </div>

            <div className="relative text-center space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#050c24] border-4 border-[#fcc032] flex items-center justify-center shadow-lg shadow-[#fcc032]/20 z-10 relative">
                <Flame className="w-10 h-10 text-[#fcc032]" />
              </div>
              <h4 className="text-xl font-bold text-white">3. Build Streak</h4>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">Watch your streak grow, climb the campus leaderboard, and unlock exclusive rewards.</p>
            </div>
          </div>
        </section>

        {/* Leaderboard Snippet */}
        <section id="leaderboard" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div className="space-y-2">
              <h3 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
                <Trophy className="w-8 h-8 text-[#fcc032]" /> 
                Global <span className="text-[#fcc032]">Leaderboard</span>
              </h3>
              <p className="text-slate-300 font-medium">Top performers across all partner campuses.</p>
            </div>
            <button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setAuthMode("signup");
                const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
                if (emailInput) emailInput.focus();
              }}
              className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors inline-flex items-center gap-2 cursor-pointer w-fit"
            >
              Join to Compete <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="alta-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#050c24]/50 text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
                    <th className="p-4 font-extrabold w-24 text-center">Rank</th>
                    <th className="p-4 font-extrabold">Student Name</th>
                    <th className="p-4 font-extrabold">Campus</th>
                    <th className="p-4 font-extrabold text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm font-semibold">
                  {dataLoading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#fcc032] mx-auto" />
                      </td>
                    </tr>
                  ) : leaderboard.length > 0 ? (
                    leaderboard.map((user, index) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-center">
                          {index === 0 ? <Medal className="w-6 h-6 text-yellow-400 mx-auto drop-shadow-md" /> :
                           index === 1 ? <Medal className="w-6 h-6 text-slate-300 mx-auto drop-shadow-md" /> :
                           index === 2 ? <Medal className="w-6 h-6 text-amber-600 mx-auto drop-shadow-md" /> :
                           <span className="text-slate-400 font-black">#{index + 1}</span>}
                        </td>
                        <td className="p-4 text-white font-bold">{user.name}</td>
                        <td className="p-4 text-slate-300">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                            <Building className="w-3.5 h-3.5 text-[#3bc3e2]" />
                            {user.campus.name}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-[#3ccc8b] font-black">{user.totalScore ?? 0} pts</span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {user.questionsSolved ?? 0} solved • {user.streakCount ?? 0}d streak
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        No ranking data available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="alta-card p-8 md:p-12 relative overflow-hidden text-center border-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3bc3e2]/5 via-[#3ccc8b]/5 to-transparent pointer-events-none" />
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3bc3e2]/10 border border-[#3bc3e2]/30 text-[#3bc3e2] text-xs font-bold uppercase tracking-wider mb-4">
              <Zap className="w-3.5 h-3.5" /> Mission & Vision
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-white mb-6">About ALTA Track</h3>
            <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
              ALTA Track is a specialized learning platform designed to bridge the gap between academic curriculum and industry expectations. We partner with top-tier universities to provide structured, AI-assisted Data Structures and Algorithms (DSA) training. Our mission is to cultivate consistency, deep problem-solving skills, and verifiable proof of work for every computer science undergraduate.
            </p>
          </div>
        </section>

        {/* Made by Students & Community Section */}
        <section id="community" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3bc3e2]/10 border border-[#3bc3e2]/30 text-[#3bc3e2] text-xs font-black uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> Student Initiative
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              Made by Students of <span className="alta-text-gradient">ALTA Tech Club Indore</span>
            </h3>
            <p className="text-slate-300 font-medium max-w-2xl mx-auto text-sm sm:text-base">
              Built exclusively for ALTA students to inspire daily problem-solving discipline, consistency, and campus-wide coding excellence.
            </p>
          </div>

          {/* Main ALTA Tech Club Indore Showcase Card */}
          <div className="alta-card p-6 sm:p-10 relative overflow-hidden border-[#3bc3e2]/30 bg-gradient-to-br from-[#0c1b48]/90 via-[#071337] to-[#050c24] space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                  <Code2 className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white">Curated Daily Challenges</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Hand-picked DSA problems mapped to real interview questions, verified daily by campus coordinators to build an authentic problem-solving habit.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                  <Trophy className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white">Campus-Wide Leaderboards</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Dynamic multi-campus rankings with calendar-day streak tracking, year-wise cohort filters, and merit-based proof of work.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white">Rewards & Mock Interviews</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Consistency unlocks exclusive ALTA merchandise and 1-on-1 mock technical interviews to prepare undergraduates for tier-1 company placements.
                </p>
              </div>
            </div>

            {/* Bottom action row */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3bc3e2] to-[#3ccc8b] flex items-center justify-center text-[#050c24] font-black text-lg shadow-md">
                  <Users className="w-5 h-5 text-[#050c24]" />
                </div>
                <div>
                  <p className="text-xs text-white font-bold">Driven by Student Builders & Guided by ALTA Mentors</p>
                  <p className="text-[11px] text-slate-400">Chapter: Indore, Madhya Pradesh • Active Student Collective</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTeamModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3bc3e2] to-[#3ccc8b] hover:opacity-90 text-[#050c24] text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-[#3bc3e2]/20 cursor-pointer self-start sm:self-auto"
              >
                <Users className="w-4 h-4" /> About the Developers & Visionaries &rarr;
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#050c24] py-8 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3bc3e2] to-[#22acd1] flex items-center justify-center text-[#050c24] font-black text-lg">
              A
            </div>
            <span className="font-bold text-white text-sm">ALTA TRACK © {new Date().getFullYear()}</span>
          </div>
          <div className="text-sm text-slate-300 font-medium text-center flex flex-wrap items-center justify-center gap-2">
            <span>
              Made with <Heart className="w-4 h-4 text-rose-400 fill-rose-400 inline" /> by <span className="text-[#3bc3e2] font-bold">ALTA Tech Club Indore</span> for ALTA Students
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <button
              type="button"
              onClick={() => setShowTeamModal(true)}
              className="text-xs text-[#3bc3e2] hover:text-white underline font-bold cursor-pointer transition-colors"
            >
              Meet the Developers & Visionaries &rarr;
            </button>
          </div>
        </div>
      </footer>

      {/* Team & Visionaries Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="alta-card max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-8 relative border-[#3bc3e2]/40 bg-[#071130] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3bc3e2]/15 border border-[#3bc3e2]/30 text-[#3bc3e2] text-[11px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#fcc032]" /> The People Behind ALTA Track
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Developers & Visionaries
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  The student engineers who built it, and the mentors and founders who inspired the mission.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Section 1: Developers */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#3bc3e2]">
                <Code2 className="w-4 h-4" /> Student Developers • ALTA Tech Club Indore
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rishabh Vyas */}
                <div className="p-5 rounded-2xl bg-white/[0.04] border border-cyan-500/30 hover:border-cyan-500/50 transition-colors space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-400 to-sky-500 flex items-center justify-center text-[#050c24] font-black text-lg shadow-md shadow-cyan-500/20">
                          RV
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white">Rishabh Vyas</h4>
                          <span className="text-[11px] font-extrabold text-cyan-300 block">Lead Developer</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-black uppercase">
                        Tech Club Indore
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      Architected and engineered ALTA Track — from the core API engine and calendar-day streak tracking to live multi-campus leaderboards and verification workflows.
                    </p>
                  </div>

                  {/* Connect Links */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    <a
                      href="https://www.linkedin.com/in/rishabh-vyas-/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-[#0077b5]/20 hover:bg-[#0077b5]/30 text-sky-300 text-[11px] font-bold border border-[#0077b5]/40 transition-colors flex items-center gap-1.5"
                    >
                      <Linkedin className="w-3.5 h-3.5" /> LinkedIn <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                    <a
                      href="https://github.com/rishabhvyas17"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[11px] font-bold border border-white/20 transition-colors flex items-center gap-1.5"
                    >
                      <Github className="w-3.5 h-3.5" /> GitHub <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                    <a
                      href="mailto:rishabhvyas222@gmail.com"
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 transition-colors flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </a>
                  </div>
                </div>

                {/* Prince */}
                <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-[#050c24] font-black text-lg shadow-md shadow-emerald-500/20">
                          P
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white">Prince</h4>
                          <span className="text-[11px] font-extrabold text-emerald-300 block">Co-Developer & Peer Collaborator</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase">
                        Tech Club Indore
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      Key peer collaborator instrumental in system testing, refining user journeys, UI/UX feedback, and supporting platform deployment for student cohorts.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[11px] text-slate-400 font-semibold italic">
                      Collaborative engineering partner on ALTA Track.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Visionaries & Mentors */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#fcc032]">
                <Star className="w-4 h-4" /> Visionaries, Mentors & Guiding Lights
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ashish Sir */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-amber-500/20 hover:border-amber-500/40 transition-colors space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-white">Ashish Sir</h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase">
                      Founder, ALTA
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    The visionary catalyst behind ALTA’s mission — revolutionizing computer science education and inspiring students to build tangible, industry-standard engineering capabilities.
                  </p>
                </div>

                {/* Harshit Sir */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-sky-500/20 hover:border-sky-500/40 transition-colors space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-white">Harshit Sir</h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-black uppercase">
                      Founding Member, ALTA
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Founding pillar shaping the academic vision, mentor network, and structured curriculum that bridges university education with high-growth tech careers.
                  </p>
                </div>

                {/* Nitesh Sir */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-emerald-500/20 hover:border-emerald-500/40 transition-colors space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-white">Nitesh Sir</h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase">
                      Mentor
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Guiding engineering mentor providing continuous direction, architectural feedback, and technical mentorship that elevated the quality of ALTA Track.
                  </p>
                </div>

                {/* Santosh Sir */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-purple-500/20 hover:border-purple-500/40 transition-colors space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-white">Santosh Sir</h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase">
                      Inspiration
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    The guiding inspiration whose passion for relentless consistency, rigorous algorithmic practice, and student empowerment sparks our daily drive.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Made with <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 inline mx-0.5" /> for the ALTA Student Community
              </span>
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="alta-button-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
