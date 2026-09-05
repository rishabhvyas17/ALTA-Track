"use client";

import { useEffect, useState } from "react";
import {
  Gift,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  Loader2,
} from "lucide-react";

interface GoodiesClaimItem {
  id: string;
  status: "ELIGIBLE" | "CLAIMED" | "SHIPPED";
  shippingName: string | null;
  shippingAddress: string | null;
  phone: string | null;
  claimedAt: string | null;
  user: {
    name: string;
    email: string;
    campus?: { name: string };
  };
  challenge: { name: string };
}

export default function SuperAdminGoodiesPage() {
  const [claims, setClaims] = useState<GoodiesClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/superadmin/goodies");
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "CLAIMED" | "SHIPPED") => {
    try {
      setProcessingId(id);
      const res = await fetch("/api/superadmin/goodies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) fetchClaims();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <Gift className="w-8 h-8 text-[var(--color-accent-green)]" />
          Goodies Fulfillment Tracker
        </h1>
        <p className="text-xs text-[var(--color-neutral-silver)] mt-1">
          Track shipping addresses and update fulfillment status for student swag claims.
        </p>
      </div>

      {/* Claims Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {claims.map((claim) => (
          <div
            key={claim.id}
            className="alta-card p-6 space-y-4 border border-[var(--color-border-dark)] hover:border-[var(--color-accent-green)]/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[var(--color-accent-green)]/10 text-[var(--color-accent-green)] text-xs font-bold border border-[var(--color-accent-green)]/20">
                  {claim.challenge.name}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${
                    claim.status === "SHIPPED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : claim.status === "CLAIMED"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-white/5 text-gray-400 border-white/10"
                  }`}
                >
                  {claim.status === "SHIPPED" && <Truck className="w-3.5 h-3.5" />}
                  {claim.status === "CLAIMED" && <Clock className="w-3.5 h-3.5" />}
                  {claim.status}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--color-accent-cyan)]" />
                  {claim.shippingName || claim.user.name}
                </h3>
                <p className="text-xs text-gray-400">
                  {claim.user.campus?.name || "Global Campus"} ({claim.user.email})
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5 text-xs text-gray-300">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{claim.shippingAddress || "No address provided"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 pt-1">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{claim.phone || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--color-border-dark)] flex items-center justify-end gap-2">
              {claim.status !== "SHIPPED" && (
                <button
                  onClick={() => handleUpdateStatus(claim.id, "SHIPPED")}
                  disabled={processingId === claim.id}
                  className="alta-button py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Truck className="w-4 h-4" /> Mark as Shipped
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
