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
} from "lucide-react";

interface Campus {
  id: string;
  name: string;
  region: string;
}

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [campuses, setCampuses] = useState<Campus[]>([]);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [campusId, setCampusId] = useState("");
  const [year, setYear] = useState<number>(1);

  useEffect(() => {
    // Check if already logged in
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          const routes: Record<string, string> = {
            SUPER_ADMIN: "/superadmin",
            CAMPUS_ADMIN: "/admin",
            STUDENT: "/dashboard",
          };
          router.push(routes[data.user.role] || "/dashboard");
        }
      })
      .catch(() => {});

    // Fetch campuses for signup
    fetch("/api/campuses")
      .then((res) => res.json())
      .then((data) => setCampuses(data.campuses || []))
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body =
        mode === "login"
          ? { email, password }
          : { name, email, password, campusId, year };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Redirect based on role
      const routes: Record<string, string> = {
        SUPER_ADMIN: "/superadmin",
        CAMPUS_ADMIN: "/admin",
        STUDENT: "/dashboard",
      };
      router.push(routes[data.user.role] || "/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Hero Section ────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0d1e56 0%, #1a2d6b 50%, #0d1e56 100%)",
          minHeight: "100vh",
        }}
      >
        {/* Animated background orbs */}
        <div
          className="absolute top-[-10%] right-[-5%] rounded-full opacity-20 blur-3xl"
          style={{
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, #3bc3e2, transparent)",
          }}
        />
        <div
          className="absolute bottom-[-10%] left-[-5%] rounded-full opacity-15 blur-3xl"
          style={{
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, #3ccc8b, transparent)",
          }}
        />
        <div
          className="absolute top-[40%] left-[30%] rounded-full opacity-10 blur-3xl"
          style={{
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, #fcc032, transparent)",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-12 sm:mb-20">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #3bc3e2, #3ccc8b)",
                }}
              >
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                ALTA <span className="text-[#3bc3e2]">Track</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-sm text-white/70">
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#challenges" className="hover:text-white transition-colors">
                Challenges
              </a>
            </div>
          </nav>

          {/* Main Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[70vh]">
            {/* Left — Text */}
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm text-[#3bc3e2] font-semibold mb-6 backdrop-blur-sm border border-white/10">
                <Flame className="w-4 h-4" />
                DSA Challenge Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
                Build Your{" "}
                <span
                  className="alta-gradient-text"
                  style={{
                    background: "linear-gradient(135deg, #3bc3e2, #3ccc8b)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  DSA Streak
                </span>
                <br />
                One Day at a Time
              </h1>

              <p className="text-lg text-white/65 leading-relaxed mb-8 max-w-lg">
                Join ALTA&apos;s structured DSA challenge programs. Solve one problem
                daily, post your progress on LinkedIn, and build unstoppable
                consistency across{" "}
                <strong className="text-white/90">10+ college campuses</strong>.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 mb-10">
                {[
                  { icon: Users, label: "Campuses", value: "10+" },
                  { icon: Target, label: "Days of Challenge", value: "151" },
                  { icon: Trophy, label: "Students", value: "1000+" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#3bc3e2]" />
                    </div>
                    <div>
                      <div className="text-xl font-extrabold text-white">
                        {value}
                      </div>
                      <div className="text-xs text-white/50">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Challenge Cards */}
              <div id="challenges" className="flex flex-col sm:flex-row gap-3">
                <div className="px-5 py-3.5 rounded-xl bg-white/8 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#3ccc8b]" />
                    <span className="text-sm font-bold text-white">
                      BASE 111
                    </span>
                  </div>
                  <p className="text-xs text-white/50">
                    111-day beginner challenge — Variables through Intro DSA
                  </p>
                </div>
                <div className="px-5 py-3.5 rounded-xl bg-white/8 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#fcc032]" />
                    <span className="text-sm font-bold text-white">
                      APEX 151
                    </span>
                  </div>
                  <p className="text-xs text-white/50">
                    151-day advanced challenge — Arrays through Segment Trees
                  </p>
                </div>
              </div>
            </div>

            {/* Right — Auth Form */}
            <div
              className="animate-fade-in"
              style={{ animationDelay: "0.15s" }}
            >
              <div
                className="rounded-2xl p-8 max-w-md mx-auto lg:ml-auto"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-xl bg-white/5 mb-6">
                  {(["login", "signup"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setMode(tab);
                        setError("");
                      }}
                      className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer"
                      style={{
                        background:
                          mode === tab
                            ? "linear-gradient(135deg, #3bc3e2, #22acd1)"
                            : "transparent",
                        color: mode === tab ? "white" : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {tab === "login" ? "Sign In" : "Sign Up"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <div>
                      <label className="text-xs font-bold text-white/60 mb-1.5 block">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#3bc3e2] focus:ring-1 focus:ring-[#3bc3e2]/30 transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-white/60 mb-1.5 block">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@college.edu"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#3bc3e2] focus:ring-1 focus:ring-[#3bc3e2]/30 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white/60 mb-1.5 block">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                        minLength={6}
                        className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#3bc3e2] focus:ring-1 focus:ring-[#3bc3e2]/30 transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {mode === "signup" && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-white/60 mb-1.5 block">
                          Campus
                        </label>
                        <select
                          value={campusId}
                          onChange={(e) => setCampusId(e.target.value)}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white text-sm focus:outline-none focus:border-[#3bc3e2] focus:ring-1 focus:ring-[#3bc3e2]/30 transition-all appearance-none cursor-pointer"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 12px center",
                          }}
                        >
                          <option value="" className="bg-[#0d1e56]">
                            Select your campus
                          </option>
                          {campuses.map((campus) => (
                            <option
                              key={campus.id}
                              value={campus.id}
                              className="bg-[#0d1e56]"
                            >
                              {campus.name} ({campus.region})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-white/60 mb-1.5 block">
                          Year
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4].map((y) => (
                            <button
                              key={y}
                              type="button"
                              onClick={() => setYear(y)}
                              className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer"
                              style={{
                                background:
                                  year === y
                                    ? "linear-gradient(135deg, #3bc3e2, #22acd1)"
                                    : "rgba(255,255,255,0.06)",
                                color:
                                  year === y
                                    ? "white"
                                    : "rgba(255,255,255,0.5)",
                                border:
                                  year === y
                                    ? "1px solid transparent"
                                    : "1px solid rgba(255,255,255,0.1)",
                              }}
                            >
                              {y}
                              {y === 1
                                ? "st"
                                : y === 2
                                ? "nd"
                                : y === 3
                                ? "rd"
                                : "th"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {error && (
                    <div className="px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-300 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #3bc3e2, #22acd1)",
                    }}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {mode === "login"
                          ? "Sign In"
                          : "Create Account"}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {mode === "login" && (
                  <p className="text-center text-xs text-white/30 mt-4">
                    Demo: admin@alta.org / password123
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feature strip at bottom */}
        <div
          id="features"
          className="relative z-10 border-t border-white/5 mt-8"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Flame,
                  color: "#fcc032",
                  title: "Build Streaks",
                  desc: "Solve one problem daily and watch your streak grow",
                },
                {
                  icon: Target,
                  color: "#3bc3e2",
                  title: "LinkedIn Proof",
                  desc: "Post your solutions to LinkedIn as verifiable proof",
                },
                {
                  icon: Trophy,
                  color: "#3ccc8b",
                  title: "Earn Recognition",
                  desc: "Complete challenges, earn interviews, and claim goodies",
                },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/4 border border-white/5"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">
                      {title}
                    </h3>
                    <p className="text-xs text-white/40 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
