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
  ShieldCheck,
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
        <Loader2 className="w-8 h-8 text-[#3bc3e2] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <MapPin className="w-8 h-8 text-[#3bc3e2]" />
            Campus Management
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Manage partner institution campuses and provision Campus Admin accounts.
          </p>
        </div>

        <button
          onClick={() => setShowCreateCampusModal(true)}
          className="alta-button flex items-center gap-2 cursor-pointer self-start sm:self-auto text-sm font-extrabold"
        >
          <Plus className="w-5 h-5" /> Add Campus
        </button>
      </div>

      {/* Partner Campuses Guidance Hint */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3 text-xs text-slate-300">
        <div className="w-5 h-5 rounded-md bg-[#3bc3e2]/20 text-[#3bc3e2] flex items-center justify-center font-bold shrink-0 mt-0.5">
          ℹ️
        </div>
        <div>
          <span className="font-bold text-white">Partner Institutions Architecture:</span> The platform strictly collaborates with <span className="text-[#3bc3e2] font-semibold">SAGE University, ADYPU, IITM, VGU, and DRK Institute</span>. Each partner college assigns campus admins who verify student LinkedIn problem proofs daily to ensure fair streak progression.
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm">
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
              className="alta-card p-6 flex flex-col justify-between space-y-6 border border-white/10 hover:border-[#3bc3e2]/60 transition-all duration-300 bg-[#0c1b48]/90"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-[#3bc3e2]/15 border border-[#3bc3e2]/30 flex items-center justify-center text-[#3bc3e2] shrink-0">
                    <Building className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#3bc3e2]/10 border border-[#3bc3e2]/30 text-[11px] font-bold text-[#3bc3e2] truncate max-w-[180px]">
                    {campus.region}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white group-hover:text-[#3bc3e2] transition-colors">
                    {campus.name}
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-300 mt-2">
                    <span className="flex items-center gap-1.5 text-[#3bc3e2]">
                      <Users className="w-4 h-4" />
                      {campus._count?.users || 0} Students
                    </span>
                    <span className="flex items-center gap-1.5 text-[#3ccc8b]">
                      <ShieldCheck className="w-4 h-4" />
                      {admins.length} Admins
                    </span>
                  </div>
                </div>

                {/* Assigned Admins */}
                <div className="pt-3 border-t border-white/10">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Assigned Campus Admins
                  </p>
                  {admins.length === 0 ? (
                    <p className="text-xs text-amber-400 font-semibold italic">No admin assigned yet</p>
                  ) : (
                    <div className="space-y-1.5">
                      {admins.map((adm) => (
                        <div key={adm.id} className="text-xs text-slate-200 flex items-center justify-between font-semibold">
                          <span>{adm.name}</span>
                          <span className="text-slate-400 text-[11px]">{adm.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedCampusForAdmin(campus)}
                  className="px-3 py-2 rounded-xl bg-[#3bc3e2]/15 hover:bg-[#3bc3e2]/25 text-[#3bc3e2] text-xs font-bold border border-[#3bc3e2]/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + Admin Account
                </button>

                <Link
                  href={`/superadmin/campuses/${campus.id}`}
                  className="text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  Details <ChevronRight className="w-3.5 h-3.5 text-[#3bc3e2]" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Campus Modal */}
      {showCreateCampusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="alta-card max-w-md w-full p-6 sm:p-8 space-y-6 relative border border-[#3bc3e2]/40 bg-[#071130]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-[#3bc3e2]" /> Add New Campus
              </h3>
              <button
                onClick={() => setShowCreateCampusModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampus} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                  Campus / Institution Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SAGE University"
                  value={campusName}
                  onChange={(e) => setCampusName(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                  Region / Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indore, Madhya Pradesh"
                  value={campusRegion}
                  onChange={(e) => setCampusRegion(e.target.value)}
                  className="alta-input w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateCampusModal(false)}
                  className="alta-button-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCampus}
                  className="alta-button text-xs font-extrabold flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="alta-card max-w-md w-full p-6 sm:p-8 space-y-6 relative border border-[#3bc3e2]/40 bg-[#071130]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#3ccc8b]" /> Create Campus Admin
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  For campus: <span className="text-[#3bc3e2] font-bold">{selectedCampusForAdmin.name}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedCampusForAdmin(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
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
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
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
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
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

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedCampusForAdmin(null)}
                  className="alta-button-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="alta-button text-xs font-extrabold flex items-center gap-2"
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
