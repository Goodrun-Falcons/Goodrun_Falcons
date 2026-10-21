"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SignupRequest {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="7" stroke="#6b7280" strokeWidth="1.5" />
      <path d="M14 14l4 4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
      <path d="M1 4.5l3 3 6-7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M1 1l8 8M9 1L1 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Org Avatar ───────────────────────────────────────────────────────────────

function OrgAvatar({ name }: { name: string }) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e5bdb7] bg-[#BEC4F1] text-[10px] font-semibold text-[#11183c]">
      {initials(name)}
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({
  req,
  actionLoading,
  onApprove,
  onReject,
}: {
  req: SignupRequest;
  actionLoading: string | null;
  onApprove: (req: SignupRequest) => void;
  onReject: (req: SignupRequest) => void;
}) {
  const busy = actionLoading === req.id;
  return (
    <div
      className="flex flex-col gap-4 rounded-[4px] bg-white p-5"
      style={{ border: "1px solid #E5BDB7" }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <OrgAvatar name={req.name} />
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <span className="truncate text-[15px] font-semibold text-[#1b1b22]">{req.name}</span>
          <span className="text-[12px] text-[#5c403b]">{req.email}</span>
        </div>
        <span className="ml-auto shrink-0 rounded-[2px] bg-[rgba(185,16,11,0.1)] px-2 py-0.5 text-[11px] font-bold text-[#b9100b]">
          Pending
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1.5 rounded-[4px] bg-[#fbf8ff] p-3" style={{ border: "1px solid #E5BDB7" }}>
        {req.phone && (
          <div className="flex gap-2 text-[12px]">
            <span className="w-16 shrink-0 font-bold uppercase tracking-[0.05em] text-[#5c403b]">Phone</span>
            <span className="text-[#1b1b22]">{req.phone}</span>
          </div>
        )}
        {req.address && (
          <div className="flex gap-2 text-[12px]">
            <span className="w-16 shrink-0 font-bold uppercase tracking-[0.05em] text-[#5c403b]">Address</span>
            <span className="text-[#1b1b22]">{req.address}</span>
          </div>
        )}
        <div className="flex gap-2 text-[12px]">
          <span className="w-16 shrink-0 font-bold uppercase tracking-[0.05em] text-[#5c403b]">Applied</span>
          <span className="text-[#1b1b22]">{formatDate(req.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onReject(req)}
          className="flex h-9 items-center gap-1.5 rounded-[4px] bg-[#b9100b] px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <XIcon />
          Reject
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onApprove(req)}
          className="flex h-9 items-center gap-1.5 rounded-[4px] bg-[#2e7d32] px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <CheckIcon />
          {busy ? "Processing…" : "Approve"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountApprovalPage() {
  const [pending, setPending] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("signup_requests")
      .select("id, auth_user_id, name, email, phone, address, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (data) setPending(data as SignupRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(req: SignupRequest) {
    setActionLoading(req.id);
    try {
      const { error } = await supabase.rpc("approve_signup_request", {
        p_request_id: req.id,
      });

      if (error) {
        alert("Failed to approve signup request: " + error.message);
        return;
      }

      setPending((prev) => prev.filter((r) => r.id !== req.id));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(req: SignupRequest) {
    const reason = window.prompt(
      `Reject ${req.name}? Optionally give a reason - the organisation will see it when they try to log in.`,
      ""
    );
    if (reason === null) return;

    setActionLoading(req.id);
    try {
      const { error } = await supabase.rpc("reject_signup_request", {
        p_request_id: req.id,
        p_reason: reason,
      });

      if (error) {
        alert("Failed to reject signup request: " + error.message);
        return;
      }

      setPending((prev) => prev.filter((r) => r.id !== req.id));
    } finally {
      setActionLoading(null);
    }
  }

  const searchLower = search.toLowerCase();
  const filtered = pending.filter(
    (r) =>
      r.name.toLowerCase().includes(searchLower) ||
      r.email.toLowerCase().includes(searchLower)
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] font-bold leading-10 tracking-[-0.64px] text-[#1b1b22]">
          Account Approval
        </h1>
        <p className="text-[14px] leading-5 text-[#5c403b]">
          Review and approve or reject new organisation signup requests.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="h-10 w-64 rounded-[2px] border border-[#e5bdb7] bg-[#fbf8ff] pl-8 pr-3 text-[12px] font-medium text-[#1b1b22] placeholder:text-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#b9100b]"
          />
        </div>

        <span className="ml-auto rounded-[2px] bg-[rgba(185,16,11,0.1)] px-3 py-1.5 text-[12px] font-bold text-[#b9100b]">
          {filtered.length} pending
        </span>

        <button
          type="button"
          onClick={load}
          className="flex h-10 items-center rounded-[2px] border border-[#e5bdb7] bg-[#fbf8ff] px-4 text-[12px] font-medium text-[#1b1b22] transition-colors hover:bg-[rgba(17,24,60,0.04)]"
        >
          Refresh
        </button>
      </div>

      {/* Request cards */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <span className="text-[14px] text-[#5c403b]">Loading requests…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22" stroke="#e5bdb7" strokeWidth="1.5" />
            <path
              d="M16 24.5l5.5 5.5 10.5-12"
              stroke="#2e7d32"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-[15px] font-semibold text-[#1b1b22]">All caught up!</p>
          <p className="text-[13px] text-[#5c403b]">No pending signup requests right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              actionLoading={actionLoading}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
