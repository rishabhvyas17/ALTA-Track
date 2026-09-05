"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Plus,
  Users,
  Building,
  ChevronRight,
  Loader2,
  X,
  UserPlus,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Campus {
  id: string;
  name: string;
  region: string;
  _count: {
    users: number;
  };
  users: AdminUser[];
}

export default function CampusesPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create Campus Modal State
  const [showCreateCampusModal, setShowCreateCampusModal] = useState(false);
  const [campusName, setCampusName] = useState("");
  const [campusRegion, setCampusRegion] = useState("");
  const [creatingCampus, setCreatingCampus] = useState(false);

  // Create Admin Account Modal State
  const [selectedCampusForAdmin, setSelectedCampusForAdmin] =
    useState<Campus | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  useEffect(() => {
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/superadmin/campuses");
      if (!res.ok) throw new Error("Failed to load campuses");
      const data = await res.json();
      setCampuses(data.campuses || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCampus(true);
    setError("");

    try {
      const res = await fetch("/api/superadmin/campuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campusName,
          region: campusRegion,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create campus");

      setSuccess(`Campus "${campusName}" created!`);
      setShowCreateCampusModal(false);
      setCampusName("");
      setCampusRegion("");
      fetchCampuses();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to create campus");
    } finally {
      setCreatingCampus(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampusForAdmin) return;
    setCreatingAdmin(true);
    setError("");

    try {
      const res = await fetch(
        `/api/superadmin/campuses/${selectedCampusForAdmin.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: adminName,
            email: adminEmail,
            password: adminPassword,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create admin account");

      setSuccess(`Campus Admin account created for ${adminEmail}!`);
      setSelectedCampusForAdmin(null);
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      fetchCampuses();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to create admin account");
    } finally {
      setCreatingAdmin(false);
    }
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
            <MapPin className="w-8 h-8 text-[var(--color-accent-cyan)]" />
            Campus Management
          </h1>
          <p className="text-xs text-[var(--color-neutral-silver)] mt-1">
            Manage partner institution campuses and provision Campus Admin accounts.
          </p>
        </div>

        <button
          onClick={() => setShowCreateCampusModal(true)}
          className="alta-button flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" /> Add Campus
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

      {/* Campuses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campuses.map((campus) => {
          const admins = campus.users?.filter((u) => u.role === "CAMPUS_ADMIN") || [];
          return (
            <div
              key={campus.id}
              className="alta-card p-6 flex flex-col justify-between space-y-6 hover:border-[var(--color-accent-cyan)]/50 transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-cyan)]/10 border border-[var(--color-accent-cyan)]/30 flex items-center justify-center text-[var(--color-accent-cyan)] font-bold">
                    <Building className="w-5 h-5" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-gray-300">
                    {campus.region}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[var(--color-accent-cyan)] transition-colors">
                    {campus.name}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-neutral-silver)] mt-2">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
                      {campus._count?.users || 0} Students
                    </span>
                    <span className="flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5 text-[var(--color-accent-green)]" />
                      {admins.length} Admins
                    </span>
                  </div>
                </div>

                {/* Assigned Admins */}
                <div className="pt-3 border-t border-[var(--color-border-dark)]">
                  <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Campus Admins
                  </p>
                  {admins.length === 0 ? (
                    <p className="text-xs text-amber-400 italic">No admin assigned yet</p>
                  ) : (
                    <div className="space-y-1.5">
                      {admins.map((adm) => (
                        <div key={adm.id} className="text-xs text-gray-300 flex items-center justify-between">
                          <span className="font-semibold">{adm.name}</span>
                          <span className="text-gray-500">{adm.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[var(--color-border-dark)] flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedCampusForAdmin(campus)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-accent-cyan)]/10 hover:bg-[var(--color-accent-cyan)]/20 text-[var(--color-accent-cyan)] text-xs font-semibold border border-[var(--color-accent-cyan)]/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + Admin Account
                </button>

                <Link
                  href={`/superadmin/campuses/${campus.id}`}
                  className="text-xs font-semibold text-[var(--color-neutral-silver)] hover:text-white transition-colors flex items-center gap-1"
                >
                  Details <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Campus Modal */}
      {showCreateCampusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="alta-card max-w-md w-full p-6 sm:p-8 space-y-6 relative border border-[var(--color-border-cyan)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-dark)] pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-[var(--color-accent-cyan)]" /> Add New Campus
              </h3>
              <button
                onClick={() => setShowCreateCampusModal(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Campus / Institution Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IIT Delhi"
                  value={campusName}
                  onChange={(e) => setCampusName(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Region / Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Delhi, India"
                  value={campusRegion}
                  onChange={(e) => setCampusRegion(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-dark)]">
                <button
                  type="button"
                  onClick={() => setShowCreateCampusModal(false)}
                  className="alta-button-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCampus}
                  className="alta-button text-sm flex items-center gap-2"
                >
                  {creatingCampus ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Campus"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Campus Admin Account Modal */}
      {selectedCampusForAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="alta-card max-w-md w-full p-6 sm:p-8 space-y-6 relative border border-[var(--color-border-cyan)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-dark)] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[var(--color-accent-green)]" /> Create Campus Admin
                </h3>
                <p className="text-xs text-[var(--color-neutral-silver)]">
                  For campus: <span className="text-[var(--color-accent-cyan)]">{selectedCampusForAdmin.name}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedCampusForAdmin(null)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@campus.edu"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-dark)]">
                <button
                  type="button"
                  onClick={() => setSelectedCampusForAdmin(null)}
                  className="alta-button-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="alta-button text-sm flex items-center gap-2"
                >
                  {creatingAdmin ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Provision Account"
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
