"use client";

import { useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Loader2,
  Save,
  X,
  FileQuestion,
  Upload,
  Download,
  BookOpen,
  Video,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { parseDsaSheetCsv, ParsedProblemRow } from "@/lib/dsaSheetParser";

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

export default function ProblemsManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [challengeName, setChallengeName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [chapterFilter, setChapterFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Add / Edit Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);

  // Form State
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [chapter, setChapter] = useState("");
  const [companies, setCompanies] = useState("");
  const [difficulty, setDifficulty] = useState<string>("Easy");
  const [externalLink, setExternalLink] = useState("");
  const [articleLink, setArticleLink] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // CSV Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedProblemRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchChallengeAndProblems();
  }, [id]);

  const fetchChallengeAndProblems = async () => {
    try {
      setLoading(true);
      // Fetch challenge details
      const cRes = await fetch(`/api/superadmin/challenges`);
      if (cRes.ok) {
        const cData = await cRes.json();
        const current = cData.challenges?.find((c: any) => c.id === id);
        if (current) setChallengeName(current.name);
      }

      // Fetch problems
      const pRes = await fetch(`/api/superadmin/challenges/${id}/problems`);
      if (!pRes.ok) throw new Error("Failed to load problems");
      const pData = await pRes.json();
      setProblems(pData.problems || []);

      const maxDay = pData.problems?.reduce(
        (max: number, p: Problem) => (p.dayNumber > max ? p.dayNumber : max),
        0
      );
      setDayNumber((maxDay || 0) + 1);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProblem(null);
    setTitle("");
    setTopic("");
    setChapter("Foundations");
    setCompanies("");
    setDifficulty("Easy");
    setExternalLink("");
    setArticleLink("");
    setVideoLink("");
    const maxDay = problems.reduce(
      (max, p) => (p.dayNumber > max ? p.dayNumber : max),
      0
    );
    setDayNumber(maxDay + 1);
    setShowAddModal(true);
  };

  const openEditModal = (p: Problem) => {
    setEditingProblem(p);
    setDayNumber(p.dayNumber);
    setTitle(p.title);
    setTopic(p.topic);
    setChapter(p.chapter || "Foundations");
    setCompanies(p.companies || "");
    setDifficulty(p.difficulty);
    setExternalLink(p.externalLink);
    setArticleLink(p.articleLink || "");
    setVideoLink(p.videoLink || "");
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (editingProblem) {
        // Update problem
        const res = await fetch(`/api/superadmin/problems/${editingProblem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dayNumber: Number(dayNumber),
            title,
            topic,
            chapter,
            companies,
            difficulty,
            externalLink,
            articleLink: articleLink || null,
            videoLink: videoLink || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update problem");
        setSuccess("Problem updated successfully!");
      } else {
        // Create problem
        const res = await fetch(`/api/superadmin/challenges/${id}/problems`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dayNumber: Number(dayNumber),
            title,
            topic,
            chapter,
            companies,
            difficulty,
            externalLink,
            articleLink: articleLink || null,
            videoLink: videoLink || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create problem");
        setSuccess("Problem added successfully!");
      }

      setShowAddModal(false);
      fetchChallengeAndProblems();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (problemId: string, pDay: number) => {
    if (!confirm(`Are you sure you want to delete problem for Day ${pDay}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/superadmin/problems/${problemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete problem");
      }

      setProblems(problems.filter((p) => p.id !== problemId));
      setSuccess(`Problem for Day ${pDay} deleted.`);
    } catch (err: any) {
      setError(err.message || "Failed to delete problem");
    }
  };

  // CSV Upload handlers
  const handleFileSelect = (file: File) => {
    setCsvFile(file);
    setCsvErrors([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const result = parseDsaSheetCsv(text);
        setParsedPreview(result.problems);
        setCsvErrors(result.errors);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = async () => {
    if (parsedPreview.length === 0) return;
    setUploadingBulk(true);
    setError("");

    try {
      const res = await fetch(`/api/superadmin/challenges/${id}/problems/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problems: parsedPreview }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import problems");

      setSuccess(`Imported ${data.count} problems successfully! Total challenge days updated.`);
      setShowUploadModal(false);
      setParsedPreview([]);
      setCsvFile(null);
      fetchChallengeAndProblems();
    } catch (err: any) {
      setError(err.message || "Failed to upload problems");
    } finally {
      setUploadingBulk(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      "Day,Problem Name,Difficulty,Chapter,Topic,Companies,External Link,Article Link,Video Link\n" +
      '1,Move Zeroes,Easy,Foundations,Arrays,"Meta, Google, Amazon",https://leetcode.com/problems/move-zeroes/,, \n' +
      '2,Majority Element,Easy,Foundations,Arrays,"Amazon, Google, Bloomberg",https://leetcode.com/problems/majority-element/,, \n' +
      '3,Two Sum,Easy,Foundations,Hashing,"Amazon, Google, Microsoft",https://leetcode.com/problems/two-sum/,, \n';

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "alta_dsa_sheet_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDifficultyBadge = (diff: string) => {
    const d = diff.toUpperCase();
    if (d.includes("EASY")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
    if (d.includes("HARD")) {
      return "bg-red-500/10 text-red-400 border-red-500/30";
    }
    return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  };

  // Distinct chapters for filtering
  const distinctChapters = useMemo(() => {
    const set = new Set<string>();
    problems.forEach((p) => {
      if (p.chapter) set.add(p.chapter);
    });
    return Array.from(set);
  }, [problems]);

  // Filtered problems
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.companies && p.companies.toLowerCase().includes(searchQuery.toLowerCase())) ||
        String(p.dayNumber).includes(searchQuery);

      const matchChapter =
        chapterFilter === "ALL" || p.chapter === chapterFilter;

      const matchDiff =
        difficultyFilter === "ALL" ||
        p.difficulty.toUpperCase().includes(difficultyFilter.toUpperCase());

      return matchSearch && matchChapter && matchDiff;
    });
  }, [problems, searchQuery, chapterFilter, difficultyFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProblems.length / pageSize) || 1;
  const paginatedProblems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProblems.slice(start, start + pageSize);
  }, [filteredProblems, currentPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3bc3e2]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href={`/superadmin/challenges/${id}`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Challenge Details
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <FileQuestion className="w-8 h-8 text-[#3bc3e2]" />
            DSA Sheet for <span className="text-[#3bc3e2]">{challengeName || "Challenge"}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Total <span className="text-white font-bold">{problems.length}</span> problems loaded across{" "}
            <span className="text-white font-bold">{distinctChapters.length || 1}</span> chapters.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3bc3e2]/20 to-[#60ec8c]/20 hover:from-[#3bc3e2]/30 hover:to-[#60ec8c]/30 text-white border border-[#3bc3e2]/40 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10"
          >
            <Upload className="w-4 h-4 text-[#3bc3e2]" /> Upload DSA Sheet (CSV)
          </button>

          <button
            onClick={openAddModal}
            className="alta-button flex items-center gap-2 cursor-pointer text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> Add Problem
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </span>
          <button onClick={() => setSuccess("")} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="alta-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search problem, company, topic..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="alta-input w-full pl-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Chapter Filter */}
          <select
            value={chapterFilter}
            onChange={(e) => {
              setChapterFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="alta-input text-xs"
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
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="alta-input text-xs"
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <span className="text-xs text-slate-400 whitespace-nowrap">
            Showing {filteredProblems.length} results
          </span>
        </div>
      </div>

      {/* Problems Table */}
      <div className="alta-card overflow-hidden">
        {problems.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <FileQuestion className="w-12 h-12 text-gray-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Problems Added Yet</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Upload your full DSA Sheet via CSV (such as the ALTA APEX 151 sheet) or add problems manually.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="alta-button inline-flex items-center gap-2 text-xs"
              >
                <Upload className="w-4 h-4" /> Upload DSA Sheet CSV
              </button>
              <button
                onClick={openAddModal}
                className="alta-button-secondary inline-flex items-center gap-2 text-xs"
              >
                <Plus className="w-4 h-4" /> Add Problem Manually
              </button>
            </div>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            No problems match your current search/filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6 w-20">Day #</th>
                  <th className="p-4 min-w-[220px]">Problem Name</th>
                  <th className="p-4">Difficulty</th>
                  <th className="p-4">Chapter & Topic</th>
                  <th className="p-4 min-w-[180px]">Top Companies</th>
                  <th className="p-4 min-w-[180px]">Resources</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm">
                {paginatedProblems.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="p-4 pl-6 font-extrabold text-[#3bc3e2]">
                      Day {p.dayNumber}
                    </td>
                    <td className="p-4 font-bold text-white">
                      <a
                        href={p.externalLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 hover:text-[#3bc3e2] transition-colors group-hover:underline"
                        title="Open on LeetCode / External Platform"
                      >
                        {p.title}
                        <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
                      </a>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full border text-xs font-bold ${getDifficultyBadge(
                          p.difficulty
                        )}`}
                      >
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {p.chapter && (
                          <span className="text-[11px] font-semibold text-slate-400">
                            {p.chapter}
                          </span>
                        )}
                        <span className="inline-block px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-gray-200 w-fit">
                          {p.topic}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {p.companies ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.companies.split(",").map((c, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-medium"
                            >
                              {c.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {p.articleLink && (
                          <a
                            href={p.articleLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-[#3bc3e2] border border-cyan-500/20 text-xs flex items-center gap-1 transition-colors"
                            title="Read Article Solution"
                          >
                            <BookOpen className="w-3.5 h-3.5" /> Article
                          </a>
                        )}
                        {p.videoLink && (
                          <a
                            href={p.videoLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs flex items-center gap-1 transition-colors"
                            title="Watch Video Solution"
                          >
                            <Video className="w-3.5 h-3.5" /> Video
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
                          title="Edit Problem"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.dayNumber)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                          title="Delete Problem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="alta-card max-w-3xl w-full p-6 sm:p-8 space-y-6 relative border border-[#3bc3e2]/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#3bc3e2]" /> Upload DSA Sheet (CSV)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Upload the official DSA sheet (such as ALTA APEX 151). All students will immediately see these problems.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download & Hint */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white">Supported columns:</span> Day/Sequence, Problem Name, Difficulty, Chapter, Topic, Top Companies, External Link, Article Link, Video Link.
              </div>
              <button
                onClick={downloadSampleTemplate}
                className="text-xs font-semibold text-[#3bc3e2] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download Sample CSV
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer ${
                dragActive
                  ? "border-[#3bc3e2] bg-[#3bc3e2]/5"
                  : "border-white/15 hover:border-white/30 bg-black/30"
              }`}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".csv";
                input.onchange = (e: any) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                };
                input.click();
              }}
            >
              <Upload className="w-10 h-10 text-[#3bc3e2] mx-auto mb-3 opacity-80" />
              <p className="text-sm font-bold text-white mb-1">
                {csvFile ? csvFile.name : "Click to select or drag and drop your CSV file"}
              </p>
              <p className="text-xs text-slate-400">
                Supports ALTA APEX 151 sheet, custom spreadsheets, or CSV exports
              </p>
            </div>

            {/* Parse Warnings / Errors */}
            {csvErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {csvErrors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}

            {/* Preview Section */}
            {parsedPreview.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Ready to import {parsedPreview.length} problems
                  </span>
                  <span className="text-xs text-slate-400">
                    Max Day: {parsedPreview[parsedPreview.length - 1]?.dayNumber || parsedPreview.length}
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto border border-white/10 rounded-xl bg-black/40 text-xs">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-neutral-900 border-b border-white/10 text-slate-400 font-bold">
                      <tr>
                        <th className="p-2.5 pl-3">Day</th>
                        <th className="p-2.5">Problem</th>
                        <th className="p-2.5">Difficulty</th>
                        <th className="p-2.5">Chapter</th>
                        <th className="p-2.5">Topic</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {parsedPreview.slice(0, 15).map((p, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="p-2.5 pl-3 text-[#3bc3e2] font-bold">#{p.dayNumber}</td>
                          <td className="p-2.5 text-white font-medium">{p.title}</td>
                          <td className="p-2.5">{p.difficulty}</td>
                          <td className="p-2.5 text-slate-300">{p.chapter}</td>
                          <td className="p-2.5 text-slate-300">{p.topic}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedPreview.length > 15 && (
                  <p className="text-[11px] text-slate-400 text-center">
                    + {parsedPreview.length - 15} more problems in the sheet
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setParsedPreview([]);
                  setCsvFile(null);
                }}
                className="alta-button-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={parsedPreview.length === 0 || uploadingBulk}
                onClick={handleBulkUpload}
                className="alta-button text-xs font-bold flex items-center gap-2"
              >
                {uploadingBulk ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Importing Sheet...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Import {parsedPreview.length || ""} Problems
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Single Problem Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="alta-card max-w-xl w-full p-6 sm:p-8 space-y-6 relative border border-[#3bc3e2]/30 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
              <FileQuestion className="w-5 h-5 text-[#3bc3e2]" />
              {editingProblem ? `Edit Day ${editingProblem.dayNumber} Problem` : "Add Daily Problem"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Day Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={dayNumber}
                    onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)}
                    className="alta-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Difficulty <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="alta-input w-full text-xs"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Problem Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Move Zeroes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="alta-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Chapter
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Foundations, Linear Structures"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    className="alta-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Topic / Pattern <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arrays, Two Pointers"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="alta-input w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Top Companies
                </label>
                <input
                  type="text"
                  placeholder="e.g. Meta, Google, Amazon"
                  value={companies}
                  onChange={(e) => setCompanies(e.target.value)}
                  className="alta-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  External Problem Link (LeetCode) <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://leetcode.com/problems/move-zeroes/"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  className="alta-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Article Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://takeuforward.org/..."
                    value={articleLink}
                    onChange={(e) => setArticleLink(e.target.value)}
                    className="alta-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Video Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    className="alta-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="alta-button-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="alta-button text-xs font-bold"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingProblem ? (
                    "Save Changes"
                  ) : (
                    "Add Problem"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
