"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Share2,
  Trophy,
  Loader2,
  Trash2,
  Edit2,
  X,
  Save,
  Copy,
  Check,
} from "lucide-react";

interface Challenge {
  id: string;
  name: string;
}

interface Template {
  id: string;
  challengeId: string;
  templateText: string;
  requiredHashtag: string;
  isActive: boolean;
  challenge: Challenge;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const [challengeId, setChallengeId] = useState("");
  const [templateText, setTemplateText] = useState("");
  const [requiredHashtag, setRequiredHashtag] = useState("#ALTAChallenge");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplatesAndChallenges();
  }, []);

  const fetchTemplatesAndChallenges = async () => {
    try {
      setLoading(true);
      const [tRes, cRes] = await Promise.all([
        fetch("/api/superadmin/templates"),
        fetch("/api/superadmin/challenges"),
      ]);

      if (tRes.ok) {
        const tData = await tRes.json();
        setTemplates(tData.templates || []);
      }

      if (cRes.ok) {
        const cData = await cRes.json();
        setChallenges(cData.challenges || []);
        if (cData.challenges?.length > 0) {
          setChallengeId(cData.challenges[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setTemplateText(
      "🚀 Day {day} of ALTA DSA Track!\n\nProblem: {problemTitle}\nDifficulty: {difficulty}\nTopic: {topic}\n\nLearning key concepts and building momentum daily with ALTA! 💻⚡\n\n{hashtag}"
    );
    setRequiredHashtag("#ALTAChallenge");
    setIsActive(true);
    if (challenges.length > 0) setChallengeId(challenges[0].id);
    setShowModal(true);
  };

  const openEditModal = (t: Template) => {
    setEditingTemplate(t);
    setChallengeId(t.challengeId);
    setTemplateText(t.templateText);
    setRequiredHashtag(t.requiredHashtag);
    setIsActive(t.isActive);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingTemplate) {
        // Update template
        const res = await fetch(
          `/api/superadmin/templates/${editingTemplate.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              templateText,
              requiredHashtag,
              isActive,
            }),
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update template");

        setSuccess("Template updated!");
      } else {
        // Create template
        const res = await fetch("/api/superadmin/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId,
            templateText,
            requiredHashtag,
            isActive,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create template");

        setSuccess("Template created!");
      }

      setShowModal(false);
      fetchTemplatesAndChallenges();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await fetch(`/api/superadmin/templates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete template");

      setTemplates(templates.filter((t) => t.id !== id));
      setSuccess("Template deleted!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to delete template");
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary-cyan)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Share2 className="w-8 h-8 text-[var(--color-accent-cyan)]" />
            LinkedIn Post Templates
          </h1>
          <p className="text-xs text-[var(--color-neutral-silver)] mt-1">
            Define standardized post templates and required hashtags for student submission sharing.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="alta-button flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" /> Add Template
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
          {success}
        </div>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="alta-card p-6 flex flex-col justify-between space-y-4 hover:border-[var(--color-accent-cyan)]/40 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)] border border-[var(--color-accent-cyan)]/20 text-xs font-bold flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  {tpl.challenge?.name || "Challenge"}
                </span>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  {tpl.requiredHashtag}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                {tpl.templateText}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-border-dark)] flex items-center justify-between">
              <button
                onClick={() => handleCopy(tpl.id, tpl.templateText)}
                className="text-xs font-semibold text-[var(--color-neutral-silver)] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedId === tpl.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Text
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(tpl)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(tpl.id)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="alta-card max-w-lg w-full p-6 sm:p-8 space-y-6 relative border border-[var(--color-border-cyan)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-dark)] pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--color-accent-cyan)]" />
                {editingTemplate ? "Edit Template" : "Add LinkedIn Template"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingTemplate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Select Challenge
                  </label>
                  <select
                    value={challengeId}
                    onChange={(e) => setChallengeId(e.target.value)}
                    className="alta-input w-full text-white bg-[var(--color-navy-dark)]"
                  >
                    {challenges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Required Hashtag
                </label>
                <input
                  type="text"
                  required
                  value={requiredHashtag}
                  onChange={(e) => setRequiredHashtag(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Template Text
                </label>
                <textarea
                  rows={6}
                  required
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  className="alta-input w-full font-mono text-xs"
                  placeholder="Use tags like {day}, {problemTitle}, {difficulty}, {topic}, {hashtag}"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Placeholders: <code className="text-cyan-400">{"{day}"}</code>, <code className="text-cyan-400">{"{problemTitle}"}</code>, <code className="text-cyan-400">{"{hashtag}"}</code>
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-dark)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="alta-button-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="alta-button text-sm flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Template
                    </>
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
