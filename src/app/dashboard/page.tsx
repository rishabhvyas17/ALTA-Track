"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
  Search,
  Lock,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Building2,
  HelpCircle,
  GraduationCap,
  Layers,
  ArrowRight,
  Github,
  Linkedin,
  Filter,
  Eye,
  Calendar,
  ShieldCheck,
  FileCode,
  Medal,
  Crown,
  FileText,
} from "lucide-react";
import { getBase111ProblemDescription } from "@/lib/base111-descriptions";

interface Problem {
  id: string;
  dayNumber: number;
  title: string;
  topic: string;
  difficulty: string;
  externalLink: string;
  articleLink?: string | null;
  videoLink?: string | null;
  companies?: string | null;
  chapter?: string | null;
}

interface Submission {
  id: string;
  dayNumber: number;
  problemId: string;
  linkedinPostUrl: string | null;
  supportingLink: string | null;
  githubLink: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  submittedAt?: string;
}

interface EnrolledTrack {
  id: string;
  challengeId: string;
  challengeName: string;
  slug: string;
  totalDays: number;
}

interface AvailableTrack {
  id: string;
  name: string;
  slug: string;
  totalDays: number;
  problemsCount: number;
  enrollmentsCount: number;
  isEnrolled: boolean;
  isEligible: boolean;
  ineligibilityReason: string | null;
}

interface DashboardData {
  student?: {
    id: string;
    name: string;
    year: number | null;
    campusId?: string | null;
    campus?: { id: string; name: string; region?: string } | null;
  };
  allCampuses?: { id: string; name: string; region?: string }[];
  enrollment: {
    id: string;
    challengeId: string;
    currentDay: number;
    streakCount: number;
    longestStreak: number;
    graceDaysUsedThisMonth: number;
    status: string;
  } | null;
  challenge: {
    id: string;
    name: string;
    slug: string;
    totalDays: number;
    rulesFormatted: string[];
    template?: {
      templateText: string;
      requiredHashtag: string;
    };
  } | null;
  allUserEnrollments: EnrolledTrack[];
  availableTracks: AvailableTrack[];
  currentProblem: Problem | null;
  allProblems?: Problem[];
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

  // Navigation View Tab: "SHEET" | "LEADERBOARDS"
  const [currentView, setCurrentView] = useState<"SHEET" | "LEADERBOARDS">("SHEET");

  // Track Selector & Explorer Modal State
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [enrollingTrackId, setEnrollingTrackId] = useState<string | null>(null);

  // Submit Proof & Problem Description Modal State
  const [activeProblemForProof, setActiveProblemForProof] = useState<Problem | null>(null);
  const [activeProblemForDescription, setActiveProblemForDescription] = useState<Problem | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofError, setProofError] = useState("");
  const [proofSuccess, setProofSuccess] = useState("");
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Sheet Search & Filters (Excel spreadsheet feel)
  const [sheetSearch, setSheetSearch] = useState("");
  const [sheetChapter, setSheetChapter] = useState("ALL");
  const [sheetDifficulty, setSheetDifficulty] = useState("ALL");
  const [sheetStatus, setSheetStatus] = useState("ALL");
  const [sheetPage, setSheetPage] = useState(1);
  const sheetPageSize = 25;

  // Milestone Modals
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewNotes, setInterviewNotes] = useState("");
  const [applyingInterview, setApplyingInterview] = useState(false);

  const [showGoodiesModal, setShowGoodiesModal] = useState(false);
  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [claimingGoodies, setClaimingGoodies] = useState(false);

  // Leaderboard State: "ALL_CAMPUSES" | "MY_CAMPUS" | "CAMPUS_BENCHMARK"
  const [leaderboardScope, setLeaderboardScope] = useState<"ALL_CAMPUSES" | "MY_CAMPUS" | "CAMPUS_BENCHMARK">("ALL_CAMPUSES");
  const [selectedCampusFilter, setSelectedCampusFilter] = useState<string>("ALL");
  const [leaderboardYearFilter, setLeaderboardYearFilter] = useState<number | "ALL">("ALL");
  const [leaderboardIndividual, setLeaderboardIndividual] = useState<any[]>([]);
  const [leaderboardCampus, setLeaderboardCampus] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // In-memory client caches for instantaneous 0ms track and leaderboard switching
  const trackCacheRef = useRef<Map<string, { data: DashboardData; timestamp: number }>>(new Map());
  const leaderboardCacheRef = useRef<Map<string, { individual: any[]; campus: any[]; timestamp: number }>>(new Map());

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async (challengeId?: string, forceFresh = false) => {
    const cacheKey = challengeId || "default";
    const cached = trackCacheRef.current.get(cacheKey);

    // 1. Instant optimistic swap if cached in memory
    if (cached) {
      setData(cached.data);
      setLoading(false);
      // If cached within 45s and not forced, avoid background network call
      if (!forceFresh && Date.now() - cached.timestamp < 45000) {
        return;
      }
    }

    try {
      // Only show full skeleton on cold start when no data exists
      if (!cached && !data) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const url = challengeId
        ? `/api/student/dashboard?challengeId=${challengeId}`
        : "/api/student/dashboard";
      const res = await fetch(url);
      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load dashboard");
      }
      const json = await res.json();

      // Store in memory cache under both challengeId and actual ID
      const actualTrackId = json.challenge?.id;
      if (actualTrackId) {
        trackCacheRef.current.set(actualTrackId, { data: json, timestamp: Date.now() });
      }
      trackCacheRef.current.set(cacheKey, { data: json, timestamp: Date.now() });

      setData(json);
      setError("");
    } catch (err: any) {
      if (!cached && !data) {
        setError(err.message || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchLeaderboards = async (forceFresh = false) => {
    const currentChallengeId = data?.challenge?.id || "all";
    const myCampusId = data?.student?.campus?.id || data?.student?.campusId;
    const effectiveCampusId =
      leaderboardScope === "MY_CAMPUS"
        ? (myCampusId || "none")
        : (leaderboardScope === "ALL_CAMPUSES" && selectedCampusFilter !== "ALL" ? selectedCampusFilter : "all");
    const effectiveYear = leaderboardYearFilter !== "ALL" ? leaderboardYearFilter.toString() : "all";

    const cacheKey = `${currentChallengeId}_${leaderboardScope}_${effectiveCampusId}_${effectiveYear}`;
    const cached = leaderboardCacheRef.current.get(cacheKey);

    // If cache is fresh (< 30s) and not forced, render immediately without network request
    if (cached && !forceFresh && Date.now() - cached.timestamp < 30000) {
      setLeaderboardIndividual(cached.individual);
      setLeaderboardCampus(cached.campus);
      setLeaderboardLoading(false);
      return;
    }

    // If we have stale cache, populate immediately to prevent layout thrashing
    if (cached) {
      setLeaderboardIndividual(cached.individual);
      setLeaderboardCampus(cached.campus);
    } else {
      setLeaderboardLoading(true);
    }

    try {
      const params = new URLSearchParams();
      if (data?.challenge?.id) params.set("challengeId", data.challenge.id);

      if (leaderboardScope === "MY_CAMPUS") {
        if (myCampusId) {
          params.set("campusId", myCampusId);
        }
      } else if (leaderboardScope === "ALL_CAMPUSES" && selectedCampusFilter !== "ALL") {
        params.set("campusId", selectedCampusFilter);
      }

      if (leaderboardYearFilter !== "ALL") {
        params.set("year", leaderboardYearFilter.toString());
      }

      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const individual = json.individualRankings || [];
        const campus = json.campusRankings || [];
        setLeaderboardIndividual(individual);
        setLeaderboardCampus(campus);
        leaderboardCacheRef.current.set(cacheKey, {
          individual,
          campus,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error("Failed to load leaderboards:", err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === "LEADERBOARDS") {
      fetchLeaderboards();
    }
  }, [
    currentView,
    leaderboardScope,
    selectedCampusFilter,
    leaderboardYearFilter,
    data?.challenge?.id,
    data?.student?.campus?.id,
    data?.student?.campusId,
  ]);

  // Compute student's rank in current view
  const loggedInStudentRank = useMemo(() => {
    if (!data?.student?.id || leaderboardIndividual.length === 0) return null;
    const studentName = data.student.name?.trim().toLowerCase();
    const studentCampusId = data.student.campus?.id || data.student.campusId;
    const idx = leaderboardIndividual.findIndex(
      (item) =>
        item.user?.id === data.student?.id ||
        (Boolean(studentName && item.user?.name) &&
          item.user.name.trim().toLowerCase() === studentName &&
          item.user.campus?.id === studentCampusId)
    );
    return idx !== -1 ? idx + 1 : null;
  }, [leaderboardIndividual, data?.student]);

  // Submissions Map (dayNumber -> Submission)
  const submissionsMap = useMemo(() => {
    const map = new Map<number, Submission>();
    data?.submissions?.forEach((s) => {
      map.set(s.dayNumber, s);
    });
    return map;
  }, [data?.submissions]);

  // Open Proof Modal for a given problem
  const openProofModal = (p: Problem) => {
    setActiveProblemForProof(p);
    const existing = submissionsMap.get(p.dayNumber);
    setLinkedinUrl(existing?.linkedinPostUrl || "");
    setGithubUrl(existing?.githubLink || "");
    setProofError("");
    setProofSuccess("");
  };

  // Copy template handler
  const handleCopyTemplate = (p: Problem) => {
    if (!data?.challenge?.template) return;

    const populated = data.challenge.template.templateText
      .replace("{day_number}", String(p.dayNumber))
      .replace("{total_days}", String(data.challenge.totalDays))
      .replace("{problem_title}", p.title)
      .replace("{difficulty}", p.difficulty)
      .replace("{topic}", p.topic)
      .replace("{external_link}", p.externalLink || "");

    navigator.clipboard.writeText(populated);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  // Handle Proof Submit for ANY problem (LinkedIn OR GitHub link allowed)
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.enrollment || !activeProblemForProof) return;

    const cleanUrl = (url: string) => {
      const t = url.trim();
      if (!t) return undefined;
      return /^https?:\/\//i.test(t) ? t : `https://${t}`;
    };

    const finalLinkedin = cleanUrl(linkedinUrl);
    const finalGithub = cleanUrl(githubUrl);

    if (!finalLinkedin && !finalGithub) {
      setProofError("Please provide either your LinkedIn post link or GitHub code link as proof.");
      return;
    }

    setSubmittingProof(true);
    setProofError("");
    setProofSuccess("");

    try {
      const res = await fetch("/api/student/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: data.enrollment.id,
          dayNumber: activeProblemForProof.dayNumber,
          problemId: activeProblemForProof.id,
          linkedinPostUrl: finalLinkedin,
          githubLink: finalGithub,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to submit solution proof");
      }

      setProofSuccess("Proof submitted successfully! Your campus admin will verify it.");
      setTimeout(() => {
        setActiveProblemForProof(null);
        fetchDashboard(data.challenge?.id, true);
      }, 1500);
    } catch (err: any) {
      setProofError(err.message || "Failed to submit proof");
    } finally {
      setSubmittingProof(false);
    }
  };

  // Enroll in or Switch to a Track
  const handleEnrollOrSwitch = async (challengeId: string) => {
    try {
      setEnrollingTrackId(challengeId);
      const res = await fetch("/api/student/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        alert(resJson.error || "Failed to join track");
        return;
      }

      setShowExploreModal(false);
      fetchDashboard(challengeId, true);
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setEnrollingTrackId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  // Distinct Chapters
  const distinctChapters = useMemo(() => {
    const set = new Set<string>();
    data?.allProblems?.forEach((p) => {
      if (p.chapter) set.add(p.chapter);
    });
    return Array.from(set);
  }, [data?.allProblems]);

  // Solved Stats
  const approvedCount = useMemo(() => {
    return data?.submissions?.filter((s) => s.status === "APPROVED").length || 0;
  }, [data?.submissions]);

  const easySolved = useMemo(() => {
    return (
      data?.submissions?.filter(
        (s) =>
          s.status === "APPROVED" &&
          data.allProblems?.find((p) => p.dayNumber === s.dayNumber)?.difficulty.toLowerCase() === "easy"
      ).length || 0
    );
  }, [data?.submissions, data?.allProblems]);

  const mediumSolved = useMemo(() => {
    return (
      data?.submissions?.filter(
        (s) =>
          s.status === "APPROVED" &&
          data.allProblems?.find((p) => p.dayNumber === s.dayNumber)?.difficulty.toLowerCase() === "medium"
      ).length || 0
    );
  }, [data?.submissions, data?.allProblems]);

  const hardSolved = useMemo(() => {
    return (
      data?.submissions?.filter(
        (s) =>
          s.status === "APPROVED" &&
          data.allProblems?.find((p) => p.dayNumber === s.dayNumber)?.difficulty.toLowerCase() === "hard"
      ).length || 0
    );
  }, [data?.submissions, data?.allProblems]);

  // Filtered problems for the Excel-like sheet
  const filteredProblems = useMemo(() => {
    if (!data?.allProblems) return [];

    return data.allProblems.filter((p) => {
      const matchSearch =
        !sheetSearch ||
        p.title.toLowerCase().includes(sheetSearch.toLowerCase()) ||
        p.topic.toLowerCase().includes(sheetSearch.toLowerCase()) ||
        (p.companies && p.companies.toLowerCase().includes(sheetSearch.toLowerCase())) ||
        String(p.dayNumber).includes(sheetSearch);

      const matchChapter = sheetChapter === "ALL" || p.chapter === sheetChapter;

      const matchDiff =
        sheetDifficulty === "ALL" ||
        p.difficulty.toLowerCase().includes(sheetDifficulty.toLowerCase());

      const sub = submissionsMap.get(p.dayNumber);
      let matchStatus = true;
      if (sheetStatus === "SOLVED") matchStatus = sub?.status === "APPROVED";
      else if (sheetStatus === "IN_REVIEW") matchStatus = sub?.status === "PENDING";
      else if (sheetStatus === "UNSOLVED") matchStatus = !sub || sub.status === "REJECTED";

      return matchSearch && matchChapter && matchDiff && matchStatus;
    });
  }, [data?.allProblems, sheetSearch, sheetChapter, sheetDifficulty, sheetStatus, submissionsMap]);

  const totalPages = Math.ceil(filteredProblems.length / sheetPageSize) || 1;
  const paginatedProblems = useMemo(() => {
    const start = (sheetPage - 1) * sheetPageSize;
    return filteredProblems.slice(start, start + sheetPageSize);
  }, [filteredProblems, sheetPage]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg border border-slate-200 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Unable to load dashboard</h2>
          <p className="text-xs text-slate-600">{error || "Please sign in again."}</p>
          <button
            onClick={() => router.push("/auth/signin")}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const { student, enrollment, challenge, allUserEnrollments, availableTracks } = data;
  const totalProblemsCount = data.allProblems?.length || challenge?.totalDays || 0;
  const progressPercent = totalProblemsCount > 0 ? Math.round((approvedCount / totalProblemsCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Background SWR Refresh Indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 animate-pulse" />
      )}

      {/* Light Theme Clean Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-0 sm:h-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          {/* Top Row: Logo + Actions */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            {/* Logo & Student Badge */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center font-black text-white text-sm sm:text-base shadow-sm shrink-0">
                A
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 whitespace-nowrap">
                    ALTA <span className="text-sky-600">Track</span>
                  </span>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] sm:text-[10px] font-bold hidden xs:inline">
                    Student Deck
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-none">
                  {student?.name || "Student"} • {student?.campus?.name || "Partner College"}{" "}
                  {student?.year ? `(Y${student.year})` : ""}
                </p>
              </div>
            </div>

            {/* Mobile-only: compact action buttons */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <button
                onClick={() => setShowExploreModal(true)}
                className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 cursor-pointer"
                title="All Tracks"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Row: View Switcher + Track Selector (scrollable on mobile) */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {/* View Switcher: DSA Sheet vs Leaderboards */}
            <div className="bg-slate-100 p-0.5 sm:p-1 rounded-xl flex items-center text-[11px] sm:text-xs font-bold shrink-0">
              <button
                onClick={() => setCurrentView("SHEET")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                  currentView === "SHEET"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" /> <span>Sheet</span>
              </button>
              <button
                onClick={() => setCurrentView("LEADERBOARDS")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                  currentView === "LEADERBOARDS"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" /> <span>Ranks</span>
              </button>
            </div>

            {/* Track Switcher Dropdown */}
            {allUserEnrollments && allUserEnrollments.length > 0 && (
              <select
                value={challenge?.id || ""}
                onChange={(e) => fetchDashboard(e.target.value)}
                className="px-2 sm:px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-[11px] sm:text-xs font-bold shadow-xs hover:border-slate-400 cursor-pointer shrink-0 max-w-[140px] sm:max-w-none"
                title="Switch Active Challenge Track"
              >
                {allUserEnrollments.map((enr) => (
                  <option key={enr.challengeId} value={enr.challengeId}>
                    {enr.challengeName} ({enr.totalDays}d)
                  </option>
                ))}
              </select>
            )}

            {/* Desktop-only action buttons */}
            <button
              onClick={() => setShowExploreModal(true)}
              className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors text-xs font-bold items-center gap-1 cursor-pointer hidden sm:flex"
              title="Explore all DSA challenge tracks and join"
            >
              <Layers className="w-3.5 h-3.5" /> All Tracks
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer hidden sm:block"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* If no enrollment exists yet, show welcome prompt */}
        {!enrollment || !challenge ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm text-center space-y-4 max-w-xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Welcome to ALTA Track!</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              You are not currently enrolled in any active challenge track. Browse our curated DSA placement sheets and join any track with one click.
            </p>
            <button
              onClick={() => setShowExploreModal(true)}
              className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4" /> Explore & Join a DSA Track
            </button>
          </div>
        ) : (
          <>
            {/* VIEW 1: THE EXCEL-STYLE DSA SHEET */}
            {currentView === "SHEET" && (
              <div className="space-y-6">
                {/* Stats Ribbon (Light theme) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  {/* Current Streak */}
                  <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex items-center gap-2.5 sm:gap-3.5">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                      <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Streak
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-slate-900">
                        {enrollment.streakCount} <span className="text-[10px] sm:text-xs text-orange-600 font-bold">🔥</span>
                      </div>
                    </div>
                  </div>

                  {/* Solved Verified */}
                  <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex items-center gap-2.5 sm:gap-3.5">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Solved
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-slate-900">
                        {approvedCount}
                        <span className="text-[10px] sm:text-xs text-emerald-600 font-bold">
                          /{totalProblemsCount}
                        </span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block mt-0.5 truncate">
                        {data?.submissions?.filter((s: any) => s.status === "PENDING").length
                          ? `${data.submissions.filter((s: any) => s.status === "PENDING").length} pending`
                          : `${progressPercent}% done`}
                      </span>
                    </div>
                  </div>

                  {/* Active Track Progression */}
                  <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex items-center gap-2.5 sm:gap-3.5">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Track
                      </span>
                      <div className="text-sm sm:text-lg font-black text-slate-900 truncate">
                        {challenge.name}
                      </div>
                    </div>
                  </div>

                  {/* Grace Days */}
                  <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex items-center gap-2.5 sm:gap-3.5">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Grace Days
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-slate-900">
                        {enrollment.graceDaysUsedThisMonth}
                        <span className="text-[10px] sm:text-xs text-slate-500 font-medium">/2</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Milestone Rewards Cards (Light theme) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {/* Mock Interview */}
                  <div className="bg-white rounded-2xl p-3 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
                        <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">1-on-1 Technical Mock Interview</h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">Complete all problems to unlock</p>
                      </div>
                    </div>

                    {data.interviewApp ? (
                      <span className="px-2.5 sm:px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px] sm:text-xs font-bold whitespace-nowrap shrink-0">
                        {data.interviewApp.status}
                      </span>
                    ) : data.isEligibleForInterview ? (
                      <button
                        onClick={() => setShowInterviewModal(true)}
                        className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[10px] sm:text-xs font-bold cursor-pointer shrink-0"
                      >
                        Apply Now
                      </button>
                    ) : (
                      <span className="px-2.5 sm:px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] sm:text-xs font-bold whitespace-nowrap shrink-0">
                        {approvedCount}/{totalProblemsCount} Solved
                      </span>
                    )}
                  </div>

                  {/* Goodies Swag Pack */}
                  <div className="bg-white rounded-2xl p-3 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                        <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">ALTA Goodies & Swag Pack</h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">Pass tech interview to unlock</p>
                      </div>
                    </div>

                    {data.goodiesClaim ? (
                      <span className="px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] sm:text-xs font-bold whitespace-nowrap shrink-0">
                        Claimed!
                      </span>
                    ) : data.isEligibleForGoodies ? (
                      <button
                        onClick={() => setShowGoodiesModal(true)}
                        className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-bold cursor-pointer shrink-0"
                      >
                        Claim Swag
                      </button>
                    ) : data.interviewApp?.status === 'PASSED' ? (
                      <span className="px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] sm:text-xs font-bold whitespace-nowrap shrink-0">
                        ✓ Eligible
                      </span>
                    ) : (
                      <span className="px-2.5 sm:px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] sm:text-xs font-bold whitespace-nowrap shrink-0">
                        {data.interviewApp ? 'Interview ' + data.interviewApp.status : 'Interview Required'}
                      </span>
                    )}
                  </div>
                </div>

                {/* THE EXCEL-STYLE INTERACTIVE SHEET */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Sheet Top Header & Instructions */}
                  <div className="p-3 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-xl font-black text-slate-900 flex items-center gap-1.5 sm:gap-2">
                          <ListOrdered className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 shrink-0" />
                          <span className="truncate">{challenge.name}</span>
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] sm:text-[11px] font-bold whitespace-nowrap">
                          {totalProblemsCount} Questions
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1 hidden sm:block">
                        Use this sheet just like Excel! You can attempt <strong>any problem in any order</strong> and submit your LinkedIn post or GitHub link.
                      </p>
                    </div>

                    {/* Quick Difficulty Breakdown Chips */}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs flex-wrap">
                      <span className="px-2 py-0.5 sm:py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                        E: {easySolved}
                      </span>
                      <span className="px-2 py-0.5 sm:py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                        M: {mediumSolved}
                      </span>
                      <span className="px-2 py-0.5 sm:py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                        H: {hardSolved}
                      </span>
                    </div>
                  </div>

                  {/* Contextual Hint Banner */}
                  <div className="px-3 sm:px-5 py-2 sm:py-3 bg-sky-50/50 border-b border-sky-100 flex items-center gap-2 text-[10px] sm:text-xs text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
                    <span>
                      <strong className="text-slate-900">Tip:</strong> Click any problem to solve it, then <strong>"Submit Proof"</strong> with your LinkedIn or GitHub link.
                    </span>
                  </div>

                  {/* Search & Filter Toolbar */}
                  <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col gap-2 sm:gap-3 bg-white">
                    <div className="relative w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search problem, pattern, company..."
                        value={sheetSearch}
                        onChange={(e) => {
                          setSheetSearch(e.target.value);
                          setSheetPage(1);
                        }}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-sky-500 transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      {/* Chapter Filter */}
                      <select
                        value={sheetChapter}
                        onChange={(e) => {
                          setSheetChapter(e.target.value);
                          setSheetPage(1);
                        }}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] sm:text-xs font-semibold text-slate-700 focus:outline-hidden flex-1 sm:flex-none min-w-0"
                      >
                        <option value="ALL">All Chapters ({distinctChapters.length})</option>
                        {distinctChapters.map((ch) => (
                          <option key={ch} value={ch}>
                            {ch}
                          </option>
                        ))}
                      </select>

                      {/* Difficulty Filter */}
                      <select
                        value={sheetDifficulty}
                        onChange={(e) => {
                          setSheetDifficulty(e.target.value);
                          setSheetPage(1);
                        }}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] sm:text-xs font-semibold text-slate-700 focus:outline-hidden"
                      >
                        <option value="ALL">All Levels</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>

                      {/* Status Filter */}
                      <select
                        value={sheetStatus}
                        onChange={(e) => {
                          setSheetStatus(e.target.value);
                          setSheetPage(1);
                        }}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] sm:text-xs font-semibold text-slate-700 focus:outline-hidden"
                      >
                        <option value="ALL">All Status</option>
                        <option value="SOLVED">Solved</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="UNSOLVED">Unsolved</option>
                      </select>

                      <span className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap ml-auto">
                        {filteredProblems.length} results
                      </span>
                    </div>
                  </div>

                  {/* The Spreadsheet Grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-0">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100/70 text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          <th className="p-2 sm:p-3 pl-3 sm:pl-4 w-10 sm:w-14">#</th>
                          <th className="p-2 sm:p-3 w-20 sm:w-28">Status</th>
                          <th className="p-2 sm:p-3 min-w-[160px] sm:min-w-[240px]">Problem</th>
                          <th className="p-2 sm:p-3 w-16 sm:w-24">Level</th>
                          <th className="p-2 sm:p-3 min-w-[120px] hidden md:table-cell">Chapter & Topic</th>
                          <th className="p-2 sm:p-3 min-w-[120px] hidden lg:table-cell">Companies</th>
                          <th className="p-2 sm:p-3 w-20 sm:min-w-[140px]">Solutions</th>
                          <th className="p-2 sm:p-3 pr-3 sm:pr-4 text-right w-24 sm:min-w-[130px]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px] sm:text-xs">
                        {paginatedProblems.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 sm:p-12 text-center text-slate-400 text-xs">
                              No problems matched your search or filters.
                            </td>
                          </tr>
                        ) : (
                          paginatedProblems.map((p) => {
                            const sub = submissionsMap.get(p.dayNumber);
                            const isApproved = sub?.status === "APPROVED";
                            const isPending = sub?.status === "PENDING";
                            const isRejected = sub?.status === "REJECTED";

                            const diffLower = p.difficulty.toLowerCase();
                            const diffBadgeStyle =
                              diffLower === "easy"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : diffLower === "hard"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200";

                            // Determine track type
                            const isBase111 = challenge?.slug === 'base-111' || challenge?.name?.includes('BASE');
                            const hasValidExternalLink = !isBase111 && Boolean(p.externalLink) && p.externalLink.startsWith('http') && !p.externalLink.includes('/problems/age-estimate') && !p.externalLink.includes('/problems/swap-two-numbers') && !p.externalLink.includes('/problems/check-voting') && !p.externalLink.includes('/problems/toggle-a-boolean');
                            const isLeetCodeLink = !isBase111 && p.externalLink?.includes('leetcode.com');

                            // Auto-generate YouTube search URL for APEX 151 problems
                            const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(p.title + ' leetcode solution')}`;

                            return (
                              <tr
                                key={p.id}
                                className={`hover:bg-sky-50/40 transition-colors group ${
                                  isApproved ? "bg-emerald-50/20" : ""
                                }`}
                              >
                                {/* Index / Day */}
                                <td className="p-2 sm:p-3 pl-3 sm:pl-4 font-bold text-slate-500">
                                  #{p.dayNumber}
                                </td>

                                {/* Status */}
                                <td className="p-2 sm:p-3">
                                  {isApproved ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px] sm:text-xs">
                                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> <span className="hidden sm:inline">Solved</span><span className="sm:hidden">✓</span>
                                    </span>
                                  ) : isPending ? (
                                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-[10px] sm:text-xs">
                                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">In Review</span><span className="sm:hidden">Pending</span>
                                    </span>
                                  ) : isRejected ? (
                                    <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[10px] sm:text-xs" title={sub?.rejectionReason || "Needs revision"}>
                                      <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Retry
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-medium">To-Do</span>
                                  )}
                                </td>

                                {/* Problem Name - links to LeetCode for APEX 151, or opens Question Description Modal for BASE 111 */}
                                <td className="p-2 sm:p-3">
                                  {hasValidExternalLink ? (
                                    <a
                                      href={p.externalLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-bold text-slate-900 hover:text-sky-600 group-hover:underline inline-flex items-center gap-1 sm:gap-1.5"
                                      title="Open problem on LeetCode"
                                    >
                                      <span className="line-clamp-2 sm:line-clamp-1">{p.title}</span>
                                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-sky-600 shrink-0" />
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setActiveProblemForDescription(p)}
                                      className="text-left group/btn cursor-pointer inline-block"
                                      title="Click to view problem description & program requirements"
                                    >
                                      <div className="font-bold text-slate-900 group-hover/btn:text-sky-600 group-hover/btn:underline inline-flex items-center gap-1 sm:gap-1.5">
                                        <span className="line-clamp-2 sm:line-clamp-1">{p.title}</span>
                                        <FileText className="w-3.5 h-3.5 text-sky-500 group-hover/btn:text-sky-700 shrink-0" />
                                      </div>
                                      <span className="text-[10px] text-slate-400 block mt-0.5">{p.topic}</span>
                                    </button>
                                  )}
                                </td>

                                {/* Difficulty */}
                                <td className="p-2 sm:p-3">
                                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-md border text-[10px] sm:text-[11px] font-bold ${diffBadgeStyle}`}>
                                    {p.difficulty}
                                  </span>
                                </td>

                                {/* Chapter & Topic - hidden on mobile */}
                                <td className="p-2 sm:p-3 hidden md:table-cell">
                                  <div className="flex flex-col gap-0.5">
                                    {p.chapter && (
                                      <span className="text-[10px] font-semibold text-slate-400">
                                        {p.chapter}
                                      </span>
                                    )}
                                    <span className="font-semibold text-slate-700">{p.topic}</span>
                                  </div>
                                </td>

                                {/* Companies - hidden on mobile/tablet */}
                                <td className="p-2 sm:p-3 hidden lg:table-cell">
                                  {p.companies ? (
                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                      {p.companies.split(",").slice(0, 3).map((c, i) => (
                                        <span
                                          key={i}
                                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-medium"
                                        >
                                          {c.trim()}
                                        </span>
                                      ))}
                                      {p.companies.split(",").length > 3 && (
                                        <span className="text-[10px] text-slate-400 font-medium">
                                          +{p.companies.split(",").length - 3}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>

                                {/* Solutions (Article, Video, or YouTube Search for APEX 151) */}
                                <td className="p-2 sm:p-3">
                                  <div className="flex items-center gap-1">
                                    {p.articleLink ? (
                                      <a
                                        href={p.articleLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 rounded-md bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                        title="Read Editorial / Article"
                                      >
                                        <BookOpen className="w-3 h-3" /> <span className="hidden sm:inline">Read</span>
                                      </a>
                                    ) : null}
                                    {p.videoLink ? (
                                      <a
                                        href={p.videoLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                        title="Watch Video Solution"
                                      >
                                        <Video className="w-3 h-3" /> <span className="hidden sm:inline">Watch</span>
                                      </a>
                                    ) : !isBase111 ? (
                                      <a
                                        href={youtubeSearchUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                        title="Search YouTube for LeetCode solution"
                                      >
                                        <Video className="w-3 h-3 text-rose-600" /> <span className="hidden sm:inline">YouTube</span><span className="sm:hidden">▶</span>
                                      </a>
                                    ) : (
                                      <span
                                        className="text-[10px] text-slate-400 font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200"
                                        title="Custom manual task — click problem title for description"
                                      >
                                        Practice
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Action / Submit Proof */}
                                <td className="p-2 sm:p-3 pr-3 sm:pr-4 text-right">
                                  <button
                                    onClick={() => openProofModal(p)}
                                    className={`px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs ${
                                      isApproved
                                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                        : "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/10"
                                    }`}
                                  >
                                    {isApproved ? (
                                      <><span className="hidden sm:inline">View / Edit</span><span className="sm:hidden">View</span></>
                                    ) : (
                                      <>
                                        <Share2 className="w-3 h-3" /> <span className="hidden sm:inline">Submit Proof</span><span className="sm:hidden">Submit</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Spreadsheet Pagination */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
                      <span>
                        Page {sheetPage} of {totalPages} ({filteredProblems.length} questions)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSheetPage((p) => Math.max(1, p - 1))}
                          disabled={sheetPage === 1}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Previous
                        </button>
                        <button
                          onClick={() => setSheetPage((p) => Math.min(totalPages, p + 1))}
                          disabled={sheetPage === totalPages}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                        >
                          Next <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 2: INTEGRATED LEADERBOARDS (ALL CAMPUS & MY CAMPUS) */}
            {currentView === "LEADERBOARDS" && (
              <div className="space-y-6">
                {/* Current Student's Standing Banner */}
                <div className="bg-gradient-to-r from-sky-50 via-white to-emerald-50 rounded-2xl p-4 sm:p-5 border border-sky-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-sm shrink-0">
                      {loggedInStudentRank ? `#${loggedInStudentRank}` : "🔥"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                          {data?.student?.name || "Student"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black border border-sky-200 whitespace-nowrap">
                          {leaderboardScope === "MY_CAMPUS" ? "My Campus Rank" : "All-Campus Rank"}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                        {data?.student?.campus?.name || "Partner College"} {data?.student?.year ? `• Year ${data.student.year}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-4 text-xs w-full sm:w-auto">
                    <div className="bg-white p-2 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 text-center shadow-xs">
                      <span className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Position</span>
                      <span className="font-black text-slate-900 text-xs sm:text-sm truncate block">
                        {loggedInStudentRank ? `#${loggedInStudentRank}` : "Unranked"}
                      </span>
                    </div>
                    <div className="bg-white p-2 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 text-center shadow-xs">
                      <span className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Streak</span>
                      <span className="font-black text-orange-600 text-xs sm:text-sm flex items-center justify-center gap-0.5 sm:gap-1">
                        {data?.enrollment?.streakCount || 0} <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-orange-500 text-orange-500 inline" />
                      </span>
                    </div>
                    <div className="bg-white p-2 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 text-center shadow-xs">
                      <span className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Track</span>
                      <span className="font-black text-sky-700 text-xs sm:text-sm truncate block">
                        Day {data?.enrollment?.currentDay || 1}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3.5 sm:p-6 border border-slate-200 shadow-xs space-y-4 sm:space-y-6">
                  {/* Leaderboard Header & Scope Tabs */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4 sm:pb-5">
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" /> Leaderboard Standings
                      </h2>
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                        {leaderboardScope === "MY_CAMPUS"
                          ? `Showing rankings exclusively for students of ${data?.student?.campus?.name || "your college"}`
                          : leaderboardScope === "CAMPUS_BENCHMARK"
                          ? "Comparing aggregated streak points across all 5 partner colleges"
                          : "Showing overall individual rankings across all partner engineering campuses"}
                      </p>
                    </div>

                    {/* Scope Selector: All Campuses vs My Campus vs Campus vs Campus */}
                    <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100 p-1 sm:p-1.5 rounded-xl text-[11px] sm:text-xs font-bold overflow-x-auto max-w-full no-scrollbar">
                      <button
                        onClick={() => {
                          setLeaderboardScope("ALL_CAMPUSES");
                          setSelectedCampusFilter("ALL");
                        }}
                        className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 ${
                          leaderboardScope === "ALL_CAMPUSES"
                            ? "bg-white text-slate-900 shadow-xs font-black"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <span>🌐</span> All Campuses
                      </button>

                      <button
                        onClick={() => setLeaderboardScope("MY_CAMPUS")}
                        className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 ${
                          leaderboardScope === "MY_CAMPUS"
                            ? "bg-white text-sky-700 shadow-xs font-black"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <span>🏫</span> My Campus
                        {data?.student?.campus?.name && (
                          <span className="hidden sm:inline text-[10px] text-sky-600 font-bold bg-sky-50 px-1.5 py-0.2 rounded-md">
                            {data.student.campus.name.split("-")[0].trim()}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => setLeaderboardScope("CAMPUS_BENCHMARK")}
                        className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 ${
                          leaderboardScope === "CAMPUS_BENCHMARK"
                            ? "bg-white text-slate-900 shadow-xs font-black"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <span>📊</span> 5 Campuses Benchmark
                      </button>
                    </div>
                  </div>

                  {/* Filter Row: Campus Selector (on All Campuses) & Year Selector */}
                  {leaderboardScope !== "CAMPUS_BENCHMARK" && (
                    <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
                      {/* Campus Filter (only active on All Campuses scope) */}
                      {leaderboardScope === "ALL_CAMPUSES" ? (
                        <div className="flex items-center gap-2 text-xs font-medium min-w-0">
                          <span className="text-slate-500 font-bold flex items-center gap-1 shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" /> College:
                          </span>
                          <select
                            value={selectedCampusFilter}
                            onChange={(e) => setSelectedCampusFilter(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold text-slate-700 cursor-pointer focus:outline-sky-500 max-w-[180px] sm:max-w-none truncate"
                          >
                            <option value="ALL">All 5 Partner Campuses</option>
                            {data?.allCampuses && data.allCampuses.length > 0 ? (
                              data.allCampuses.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} {c.region ? `(${c.region})` : ""}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="sage">SAGE University - Indore</option>
                                <option value="adypu">ADYPU - Pune</option>
                                <option value="iitm">IITM - Delhi NCR</option>
                                <option value="vgu">VGU - Jaipur</option>
                                <option value="drk">DRK Institute - Hyderabad</option>
                              </>
                            )}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1 text-[11px] sm:text-xs">
                            <ShieldCheck className="w-3.5 h-3.5" /> Filtering for: {data?.student?.campus?.name || "Your Campus"}
                          </span>
                        </div>
                      )}

                      {/* Year Filter Buttons */}
                      <div className="flex items-center gap-1 sm:gap-1.5 text-xs font-bold flex-wrap">
                        <span className="text-slate-500 mr-1 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Year:
                        </span>
                        {(["ALL", 1, 2, 3, 4] as const).map((yr) => (
                          <button
                            key={yr}
                            onClick={() => setLeaderboardYearFilter(yr)}
                            className={`px-2 sm:px-2.5 py-1 rounded-lg border text-[11px] sm:text-xs cursor-pointer transition-all ${
                              leaderboardYearFilter === yr
                                ? "bg-sky-600 text-white border-sky-600 font-extrabold shadow-xs"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {yr === "ALL" ? "All" : `Y${yr}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Leaderboard Tables */}
                  {leaderboardLoading ? (
                    <div className="p-16 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
                      <p className="text-xs text-slate-500 mt-2 font-medium">Loading rankings...</p>
                    </div>
                  ) : leaderboardScope === "CAMPUS_BENCHMARK" ? (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse min-w-[620px] sm:min-w-0">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="p-3.5 pl-4">Rank</th>
                            <th className="p-3.5">Partner Engineering Campus</th>
                            <th className="p-3.5">Total Score</th>
                            <th className="p-3.5">Questions Solved</th>
                            <th className="p-3.5">Enrolled Students</th>
                            <th className="p-3.5 pr-4 text-right">Aggregated Streak Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {leaderboardCampus.map((c, idx) => {
                            const isMyCollege = c.id === data?.student?.campusId || c.id === data?.student?.campus?.id;
                            return (
                              <tr
                                key={c.id}
                                className={`transition-colors ${
                                  isMyCollege ? "bg-sky-50/70 border-l-4 border-sky-600 font-bold" : "hover:bg-slate-50"
                                }`}
                              >
                                <td className="p-3.5 pl-4 font-black text-slate-700">
                                  {idx === 0 ? "🥇 1st" : idx === 1 ? "🥈 2nd" : idx === 2 ? "🥉 3rd" : `#${idx + 1}`}
                                </td>
                                <td className="p-3.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-900">{c.name}</span>
                                    {isMyCollege && (
                                      <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 text-[10px] font-bold">
                                        Your College
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3.5 font-black text-sky-700">
                                  {c.totalScore ?? 0} pts
                                </td>
                                <td className="p-3.5">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-emerald-700 inline-flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      {c.totalQuestionsSolved ?? 0} Solved
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {c.easyCount ?? 0}E • {c.mediumCount ?? 0}M • {c.hardCount ?? 0}H
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3.5 font-semibold text-slate-600">{c.studentCount} students</td>
                                <td className="p-3.5 pr-4 text-right font-black text-orange-600 text-sm">
                                  {c.totalStreak} 🔥
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse min-w-[660px] sm:min-w-0">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="p-3.5 pl-4">Rank</th>
                            <th className="p-3.5">Student</th>
                            <th className="p-3.5">Campus</th>
                            <th className="p-3.5">Track & Progress</th>
                            <th className="p-3.5">Score</th>
                            <th className="p-3.5">Questions Solved</th>
                            <th className="p-3.5 pr-4 text-right">Daily Streak</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {leaderboardIndividual.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-12 text-center text-slate-500">
                                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="font-bold text-slate-700 text-sm">No students found for this filter</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Be the first student to submit proof and top the leaderboard!
                                </p>
                              </td>
                            </tr>
                          ) : (
                            leaderboardIndividual.map((item, idx) => {
                              const studentName = data?.student?.name?.trim().toLowerCase();
                              const studentCampusId = data?.student?.campus?.id || data?.student?.campusId;
                              const isCurrentStudent =
                                item.user?.id === data?.student?.id ||
                                (Boolean(studentName && item.user?.name) &&
                                  item.user.name.trim().toLowerCase() === studentName &&
                                  item.user.campus?.id === studentCampusId);
                              return (
                                <tr
                                  key={item.id}
                                  className={`transition-colors ${
                                    isCurrentStudent
                                      ? "bg-sky-50/80 border-l-4 border-sky-600 font-bold"
                                      : "hover:bg-slate-50/80"
                                  }`}
                                >
                                  <td className="p-3.5 pl-4 font-black text-slate-700">
                                    {idx === 0 ? (
                                      <span className="inline-flex items-center gap-1 text-amber-600 font-black">
                                        🥇 1st
                                      </span>
                                    ) : idx === 1 ? (
                                      <span className="inline-flex items-center gap-1 text-slate-600 font-black">
                                        🥈 2nd
                                      </span>
                                    ) : idx === 2 ? (
                                      <span className="inline-flex items-center gap-1 text-amber-800 font-black">
                                        🥉 3rd
                                      </span>
                                    ) : (
                                      <span className="text-slate-500">#{idx + 1}</span>
                                    )}
                                  </td>
                                  <td className="p-3.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-slate-900">{item.user?.name}</span>
                                      {isCurrentStudent && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black flex items-center gap-1">
                                          <Check className="w-3 h-3" /> You
                                        </span>
                                      )}
                                    </div>
                                    {item.user?.year && (
                                      <span className="text-[10px] text-slate-400 block font-medium">
                                        Year {item.user.year}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-slate-600 font-medium">
                                    <span className="inline-flex items-center gap-1.5">
                                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                      {item.user?.campus?.name || "Partner College"}
                                    </span>
                                  </td>
                                  <td className="p-3.5">
                                    <span className="font-bold text-sky-700">{item.challenge?.name}</span>
                                    <span className="text-slate-400 ml-1.5 font-medium">Day {item.currentDay}</span>
                                  </td>
                                  <td className="p-3.5 font-black text-sky-700">
                                    <span className="inline-flex items-center gap-1">
                                      <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                                      {item.score ?? 0} pts
                                    </span>
                                  </td>
                                  <td className="p-3.5">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-emerald-700 inline-flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        {item.questionsSolved ?? 0} Solved
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        {item.easyCount ?? 0}E • {item.mediumCount ?? 0}M • {item.hardCount ?? 0}H
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3.5 pr-4 text-right">
                                    <span className="font-black text-orange-600 text-sm inline-flex items-center gap-1">
                                      {item.streakCount} <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Micro-hint */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-[11px] text-slate-500">
                    <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>
                      <strong>Leaderboard Policy:</strong> Rankings prioritize total score earned from verified questions solved (Easy: 1 pt, Medium: 2 pts, Hard: 3 pts), followed by daily streak count and challenge progress. Submissions approved by your campus admin earn points and advance your streak.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL 0: QUESTION DESCRIPTION MODAL (FOR BASE 111 / CUSTOM PROBLEMS) */}
      {activeProblemForDescription && (() => {
        const desc = getBase111ProblemDescription(
          activeProblemForDescription.dayNumber,
          activeProblemForDescription.title,
          activeProblemForDescription.topic,
          activeProblemForDescription.chapter || undefined,
          activeProblemForDescription.difficulty
        );
        const diffBadgeStyle =
          desc.difficulty === "Easy"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : desc.difficulty === "Hard"
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : "bg-amber-50 text-amber-700 border-amber-200";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 relative shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="border-b border-slate-200 pb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 uppercase tracking-wider">
                      Day {desc.dayNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${diffBadgeStyle}`}>
                      {desc.difficulty}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {desc.topic}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {desc.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveProblemForDescription(null)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Problem Description Statement */}
              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-600" /> Problem Statement & What to Create
                  </span>
                  <p className="leading-relaxed whitespace-pre-line text-slate-800 font-medium">
                    {desc.description}
                  </p>
                </div>

                {/* Input / Output Formats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Input Format
                    </span>
                    <p className="text-slate-800 font-medium">{desc.inputFormat}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Output Format
                    </span>
                    <p className="text-slate-800 font-medium">{desc.outputFormat}</p>
                  </div>
                </div>

                {/* Sample Input / Output */}
                {(desc.sampleInput !== "N/A" || desc.sampleOutput !== "N/A") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-sans">
                        Sample Input
                      </span>
                      <pre className="whitespace-pre-wrap">{desc.sampleInput}</pre>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-sans">
                        Sample Output
                      </span>
                      <pre className="whitespace-pre-wrap">{desc.sampleOutput}</pre>
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {desc.explanation && (
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-200/60 text-sky-950">
                    <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block mb-1">
                      Explanation
                    </span>
                    <p className="font-medium">{desc.explanation}</p>
                  </div>
                )}

                {/* Hints */}
                {desc.hints && desc.hints.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" /> Implementation Hints
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {desc.hints.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveProblemForDescription(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prob = activeProblemForDescription;
                    setActiveProblemForDescription(null);
                    openProofModal(prob);
                  }}
                  className="px-4 sm:px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5" /> Submit Proof for Day #{desc.dayNumber}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 1: SUBMIT PROOF MODAL (FOR ANY PROBLEM) */}
      {activeProblemForProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-7 space-y-4 sm:space-y-5 relative shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider block">
                  Day {activeProblemForProof.dayNumber} • {activeProblemForProof.topic}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {activeProblemForProof.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveProblemForProof(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Solve Link & Template Generator */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                {!challenge?.slug?.includes('base') && activeProblemForProof.externalLink?.includes('leetcode.com') && !activeProblemForProof.externalLink?.includes('/problems/age-estimate') ? (
                  <a
                    href={activeProblemForProof.externalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-sky-600 hover:underline flex items-center gap-1"
                  >
                    Solve on LeetCode <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const prob = activeProblemForProof;
                      setActiveProblemForProof(null);
                      setActiveProblemForDescription(prob);
                    }}
                    className="font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Problem Requirements
                  </button>
                )}

                {data?.challenge?.template && (
                  <button
                    type="button"
                    onClick={() => handleCopyTemplate(activeProblemForProof)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedTemplate ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" /> Copied Post!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" /> Copy LinkedIn Text
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200/70 flex items-start gap-2.5">
                <span className="text-base">💡</span>
                <p className="text-xs text-sky-900 leading-relaxed font-medium">
                  <strong className="font-bold text-sky-950">Proof Rule:</strong> Submit either your <strong>LinkedIn post link</strong> OR your <strong>GitHub code link</strong> (any one is allowed, or both).
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitProof} className="space-y-4">
              {proofError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {proofError}
                </div>
              )}

              {proofSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                  {proofSuccess}
                </div>
              )}

              {/* LinkedIn Post URL */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5 text-sky-600" /> LinkedIn Post URL
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">(Allowed as proof)</span>
                </div>
                <input
                  type="url"
                  placeholder="https://www.linkedin.com/posts/... or linkedin.com/..."
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-sky-500 transition-colors"
                />
              </div>

              {/* GitHub Repo/Code URL */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-slate-800" /> GitHub Solution Link (Code URL)
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">(Allowed as proof)</span>
                </div>
                <input
                  type="url"
                  placeholder="https://github.com/username/repo/... or github.com/..."
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveProblemForProof(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProof}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  {submittingProof ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Submit Proof
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EXPLORE & JOIN ALL TRACKS */}
      {showExploreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-7 space-y-4 sm:space-y-5 relative shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-600" /> All DSA Challenge Tracks
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enroll in any track of your choice. You can progress on multiple sheets simultaneously.
                </p>
              </div>
              <button
                onClick={() => setShowExploreModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {availableTracks.map((tr) => (
                <div
                  key={tr.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-slate-900 text-sm">{tr.name}</h4>
                      {tr.isEnrolled && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          ✓ Enrolled
                        </span>
                      )}
                      {!tr.isEligible && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          {tr.ineligibilityReason}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {tr.totalDays} Days Track • {tr.problemsCount} Curated Problems • {tr.enrollmentsCount} Students Enrolled
                    </p>
                  </div>

                  <div>
                    {tr.isEnrolled ? (
                      <button
                        onClick={() => {
                          setShowExploreModal(false);
                          fetchDashboard(tr.id);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                      >
                        Switch to Track
                      </button>
                    ) : tr.isEligible ? (
                      <button
                        onClick={() => handleEnrollOrSwitch(tr.id)}
                        disabled={enrollingTrackId === tr.id}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                      >
                        {enrollingTrackId === tr.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            Enroll Now <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed"
                      >
                        Cohort Restricted
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MOCK INTERVIEW APPLICATION */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-sky-600" /> Apply for Mock Interview
            </h3>
            <p className="text-xs text-slate-600">
              Congratulations on completing all problems in this sheet! Enter your preferred schedule or areas of focus below.
            </p>
            <textarea
              rows={4}
              placeholder="e.g. Weekday evenings, focusing on Dynamic Programming and System Design."
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-hidden"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowInterviewModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setApplyingInterview(true);
                  try {
                    await fetch("/api/student/interview", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        challengeId: challenge?.id,
                        notes: interviewNotes,
                      }),
                    });
                    setShowInterviewModal(false);
                    fetchDashboard(challenge?.id, true);
                  } finally {
                    setApplyingInterview(false);
                  }
                }}
                disabled={applyingInterview}
                className="px-5 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold cursor-pointer"
              >
                {applyingInterview ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: GOODIES CLAIM */}
      {showGoodiesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-600" /> Claim ALTA Swag Pack
            </h3>
            <p className="text-xs text-slate-600">
              Congratulations on passing your technical mock interview! Provide your delivery address for your official ALTA merchandise.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Recipient Full Name"
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
              <textarea
                rows={3}
                placeholder="Shipping Address with Pincode"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowGoodiesModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setClaimingGoodies(true);
                  try {
                    await fetch("/api/student/goodies", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        challengeId: challenge?.id,
                        shippingName,
                        shippingAddress,
                        phone,
                      }),
                    });
                    setShowGoodiesModal(false);
                    fetchDashboard(challenge?.id, true);
                  } finally {
                    setClaimingGoodies(false);
                  }
                }}
                disabled={claimingGoodies}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                {claimingGoodies ? "Claiming..." : "Confirm Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
