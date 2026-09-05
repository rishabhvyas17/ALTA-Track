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
  ShieldCheck,
  Share2,
} from "lucide-react";

interface Campus {
  id: string;
  name: string;
  region: string;
}

export default function LandingPage() {
  const router = useRouter();

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [campuses, setCampuses] = useState<Campus[]>([]);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [campusId, setCampusId] = useState("");
  const [year, setYear] = useState<number>(1);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCampuses();
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

  const setDemoCredentials = (
    demoEmail: string,
    demoMode: "login" | "signup" = "login"
  ) => {
    setAuthMode(demoMode);
    setEmail(demoEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-screen bg-[#050c24] text-white flex flex-col relative overflow-hidden selection:bg-[#3bc3e2] selection:text-black">
      {/* Background Animated Glow Spheres */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#3bc3e2]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] bg-[#3ccc8b]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[600px] h-[600px] bg-[#0d1e56] rounded-full blur-[160px] pointer-events-none" />

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

          <div className="hidden sm:flex items-center gap-6 text-sm font-bold text-slate-300">
            <a href="#features" className="hover:text-[#3bc3e2] transition-colors">
              Features
            </a>
            <a href="#challenges" className="hover:text-[#3bc3e2] transition-colors">
              Tracks
            </a>
            <a href="#demo" className="hover:text-[#3bc3e2] transition-colors">
              Demo Logins
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Hero Left Content */}
        <div className="lg:col-span-7 space-y-8 text-left">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#3bc3e2]/10 border border-[#3bc3e2]/30 text-[#3bc3e2] text-xs font-black uppercase tracking-wider shadow-inner">
            <Sparkles className="w-4 h-4 text-[#fcc032]" />
            Official ALTA School DSA Track Platform
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Build Your <span className="alta-text-gradient">DSA Streak.</span> <br />
              One Day at a Time.
            </h2>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-medium">
              Join ALTA's structured DSA challenge programs. Solve one problem daily, share verifiable LinkedIn proof, and build unstoppable consistency across 10+ college campuses.
            </p>
          </div>

          {/* Key Metrics Chips */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#0c1b48]/80 border border-white/10 text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-[#3bc3e2]">10+</div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Partner Campuses</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0c1b48]/80 border border-white/10 text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-[#3ccc8b]">151</div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Days Track</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0c1b48]/80 border border-white/10 text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-[#fcc032]">1,000+</div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Students</div>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div id="features" className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Flame className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Daily Streaks</h4>
                <p className="text-xs text-slate-400">Flame progress tracker</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="p-2.5 rounded-lg bg-[#3bc3e2]/10 text-[#3bc3e2]">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">LinkedIn Proof</h4>
                <p className="text-xs text-slate-400">Verifiable post links</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Rewards</h4>
                <p className="text-xs text-slate-400">Interviews & Swag</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Right Auth Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="alta-card p-6 sm:p-8 space-y-6 relative border border-[#3bc3e2]/30 shadow-2xl shadow-[#3bc3e2]/10">
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
              <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs font-semibold">
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
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arjun Patel"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="alta-input pl-10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="student@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="alta-input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="alta-input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                      <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
                      <select
                        value={campusId}
                        onChange={(e) => setCampusId(e.target.value)}
                        className="alta-input pl-10 text-white bg-[#071130]"
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
                      <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
                      <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="alta-input pl-10 text-white bg-[#071130]"
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
                className="alta-button w-full py-3.5 text-base font-black flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : authMode === "login" ? (
                  <>
                    Sign In to Portal <ChevronRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Create Student Account <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Logins Box */}
            <div id="demo" className="pt-4 border-t border-white/10 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                Quick Demo Logins (Click to Autofill):
              </p>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setDemoCredentials("admin@alta.org")}
                  className="px-2 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer text-center"
                >
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials("admin.iitd@alta.org")}
                  className="px-2 py-1.5 rounded-lg bg-[#3bc3e2]/10 hover:bg-[#3bc3e2]/20 text-[#3bc3e2] border border-[#3bc3e2]/30 transition-all cursor-pointer text-center"
                >
                  Campus Admin
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials("student1@iitd.ac.in")}
                  className="px-2 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer text-center"
                >
                  Student
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
