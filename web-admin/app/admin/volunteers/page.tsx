"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type VolunteerStatus = "pending_vetting" | "active" | "inactive";

interface Volunteer {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  status: VolunteerStatus;
  completed_trips_count: number;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }) +
    " • " +
    d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
}

function initials(name: string | null): string {
  if (!name) return "?";
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
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0 text-[#6b7280]">
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

function ChevronDownIcon({ open }: Readonly<{ open: boolean }>) {
  return (
    <svg
      width="12"
      height="8"
      viewBox="0 0 12 8"
      fill="none"
      style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M1 1.5l5 5 5-5" stroke="#1b1b22" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: Readonly<{ status: VolunteerStatus }>) {
  const cfg: Record<VolunteerStatus, { dot: string; bg: string; text: string; label: string }> = {
    active: {
      dot: "bg-[#11183c]",
      bg: "bg-[rgba(17,24,60,0.1)]",
      text: "text-[#11183c]",
      label: "Active",
    },
    pending_vetting: {
      dot: "bg-[#b9100b]",
      bg: "bg-[rgba(185,16,11,0.1)]",
      text: "text-[#b9100b]",
      label: "Pending",
    },
    inactive: {
      dot: "bg-[#5c403b]",
      bg: "bg-[rgba(92,64,59,0.1)]",
      text: "text-[#5c403b]",
      label: "Inactive",
    },
  };
  const c = cfg[status];
  return (
    <div className={`flex items-center gap-1.5 rounded-[2px] px-2 py-1 ${c.bg}`}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      <span className={`text-[11px] font-bold leading-[16.5px] ${c.text}`}>{c.label}</span>
    </div>
  );
}

function NameAvatar({ name }: Readonly<{ name: string | null }>) {
  return (
    <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#e5bdb7] bg-[#BEC4F1] text-[9px] font-semibold text-[#11183c]">
      {initials(name)}
    </div>
  );
}

function AccordionHeader({
  dotColor,
  title,
  count,
  countBg,
  countColor,
  open,
  onToggle,
}: Readonly<{
  dotColor: string;
  title: string;
  count: number;
  countBg: string;
  countColor: string;
  open: boolean;
  onToggle: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between p-4 text-left"
    >
      <div className="flex items-center gap-3">
        <span className="size-3 shrink-0 rounded-full" style={{ background: dotColor }} />
        <span className="text-[20px] font-semibold leading-7 text-[#1b1b22]">{title}</span>
        <span
          className="rounded-[2px] px-2 py-0.5 text-[12px] font-bold leading-4 tracking-[0.6px]"
          style={{ background: countBg, color: countColor }}
        >
          {count}
        </span>
      </div>
      <ChevronDownIcon open={open} />
    </button>
  );
}

const TABLE_HEADER_CELL = "text-[12px] font-bold uppercase tracking-[0.6px] text-[#5c403b] leading-4";
const TABLE_CELL_BASE = "flex items-center";

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" stroke="#e5bdb7" strokeWidth="1.4" />
        <path d="M12 18.5l4 4 8-9" stroke="#b9100b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-[13px] font-medium text-[#5c403b]">{label}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VolunteersPage() {
  const [activeOpen, setActiveOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [inactiveOpen, setInactiveOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("volunteers")
      .select("id, full_name, email, phone, status, completed_trips_count, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVolunteers(data as Volunteer[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleActivate(vol: Volunteer) {
    setActionLoading(vol.id);
    try {
      const { error } = await supabase
        .from("volunteers")
        .update({ status: "active" })
        .eq("id", vol.id);

      if (error) {
        alert("Failed to activate volunteer: " + error.message);
        return;
      }
      setVolunteers((prev) =>
        prev.map((v) => (v.id === vol.id ? { ...v, status: "active" } : v))
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeactivate(vol: Volunteer) {
    setActionLoading(vol.id);
    try {
      const { error } = await supabase
        .from("volunteers")
        .update({ status: "inactive" })
        .eq("id", vol.id);

      if (error) {
        alert("Failed to deactivate volunteer: " + error.message);
        return;
      }
      setVolunteers((prev) =>
        prev.map((v) => (v.id === vol.id ? { ...v, status: "inactive" } : v))
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(vol: Volunteer) {
    // Rejecting a pending volunteer sets them inactive
    await handleDeactivate(vol);
  }

  const searchLower = search.toLowerCase();

  function filterVols(list: Volunteer[]) {
    if (!searchLower) return list;
    return list.filter(
      (v) =>
        (v.full_name ?? "").toLowerCase().includes(searchLower) ||
        v.email.toLowerCase().includes(searchLower)
    );
  }

  const pendingVols = filterVols(volunteers.filter((v) => v.status === "pending_vetting"));
  const activeVols = filterVols(volunteers.filter((v) => v.status === "active"));
  const inactiveVols = filterVols(volunteers.filter((v) => v.status === "inactive"));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-[14px] text-[#5C403B]">Loading volunteers…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] font-bold leading-10 tracking-[-0.64px] text-[#1b1b22]">
          Volunteer Management
        </h1>
        <p className="text-[14px] leading-5 text-[#5c403b]">
          Review pending applications and manage active volunteers
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className="h-10 w-72 rounded-[2px] border border-[#e5bdb7] bg-[#fbf8ff] pl-8 pr-3 text-[12px] font-medium text-[#1b1b22] placeholder:text-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#b9100b]"
          />
        </div>
        <button
          type="button"
          onClick={load}
          className="flex h-10 items-center rounded-[2px] border border-[#e5bdb7] bg-[#fbf8ff] px-4 text-[12px] font-medium text-[#1b1b22] transition-colors hover:bg-[rgba(17,24,60,0.04)]"
        >
          Refresh
        </button>
      </div>

      {/* Accordion Container */}
      <div className="flex flex-col gap-4">

        {/* ── Pending Approval ── */}
        <div className="overflow-hidden rounded-[4px] border border-[#e5bdb7] bg-white">
          <div className="bg-[#f5f2fc]">
            <AccordionHeader
              dotColor="#b9100b"
              title="Pending Approval"
              count={pendingVols.length}
              countBg="rgba(185,16,11,0.1)"
              countColor="#b9100b"
              open={pendingOpen}
              onToggle={() => setPendingOpen((v) => !v)}
            />
          </div>

          {pendingOpen && (
            <div>
              <div className="grid grid-cols-12 gap-4 border-b border-[#e5bdb7] bg-[#f8f9fa] px-3 py-3">
                <div className="col-span-2"><span className={TABLE_HEADER_CELL}>Status</span></div>
                <div className="col-span-3"><span className={TABLE_HEADER_CELL}>Full Name</span></div>
                <div className="col-span-3"><span className={TABLE_HEADER_CELL}>Email</span></div>
                <div className="col-span-2"><span className={TABLE_HEADER_CELL}>Applied</span></div>
                <div className="col-span-2"><span className={TABLE_HEADER_CELL}>Actions</span></div>
              </div>

              {pendingVols.length === 0 ? (
                <EmptyState label="No pending volunteer requests" />
              ) : (
                pendingVols.map((vol, idx) => (
                  <div
                    key={vol.id}
                    className="grid grid-cols-12 gap-4 px-3 py-3"
                    style={idx > 0 ? { borderTop: "1px solid #e5bdb7" } : {}}
                  >
                    <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                      <StatusBadge status={vol.status} />
                    </div>
                    <div className={`col-span-3 ${TABLE_CELL_BASE} gap-2 overflow-hidden`}>
                      <NameAvatar name={vol.full_name} />
                      <span className="truncate text-[13px] leading-[18px] text-[#1b1b22]">
                        {vol.full_name ?? "—"}
                      </span>
                    </div>
                    <div className={`col-span-3 ${TABLE_CELL_BASE} overflow-hidden`}>
                      <span className="truncate text-[12px] text-[#5c403b]">{vol.email}</span>
                    </div>
                    <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                      <span className="text-[13px] leading-[18px] text-[#5c403b]">
                        {formatDate(vol.created_at)}
                      </span>
                    </div>
                    <div className={`col-span-2 ${TABLE_CELL_BASE} gap-2`}>
                      <button
                        type="button"
                        onClick={() => handleActivate(vol)}
                        disabled={actionLoading === vol.id}
                        title="Approve"
                        className="flex size-7 items-center justify-center rounded-[2px] bg-[#2e7d32] transition-opacity hover:opacity-80 disabled:opacity-50"
                      >
                        <CheckIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(vol)}
                        disabled={actionLoading === vol.id}
                        title="Reject"
                        className="flex size-7 items-center justify-center rounded-[2px] bg-[#b9100b] transition-opacity hover:opacity-80 disabled:opacity-50"
                      >
                        <XIcon />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Active Volunteers ── */}
        <div className="overflow-hidden rounded-[4px] border border-[#e5bdb7] bg-white">
          <div className="bg-[#f5f2fc]">
            <AccordionHeader
              dotColor="#11183c"
              title="Active Volunteers"
              count={activeVols.length}
              countBg="rgba(17,24,60,0.1)"
              countColor="#11183c"
              open={activeOpen}
              onToggle={() => setActiveOpen((v) => !v)}
            />
          </div>

          {activeOpen && (
            <div>
              <div className="grid grid-cols-12 gap-4 border-b border-[#e5bdb7] bg-[#f8f9fa] px-3 py-3">
                <div className="col-span-2"><span className={TABLE_HEADER_CELL}>Status</span></div>
                <div className="col-span-3"><span className={TABLE_HEADER_CELL}>Full Name</span></div>
                <div className="col-span-3"><span className={TABLE_HEADER_CELL}>Email</span></div>
                <div className="col-span-2"><span className={TABLE_HEADER_CELL}>Trips Done</span></div>
                <div className="col-span-2"><span className={TABLE_HEADER_CELL}>Action</span></div>
              </div>

              {activeVols.length === 0 ? (
                <EmptyState label="No active volunteers" />
              ) : (
                activeVols.map((vol, idx) => (
                  <div
                    key={vol.id}
                    className="grid grid-cols-12 gap-4 px-3 py-3"
                    style={idx > 0 ? { borderTop: "1px solid #e5bdb7" } : {}}
                  >
                    <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                      <StatusBadge status={vol.status} />
                    </div>
                    <div className={`col-span-3 ${TABLE_CELL_BASE} gap-2 overflow-hidden`}>
                      <NameAvatar name={vol.full_name} />
                      <span className="truncate text-[13px] leading-[18px] text-[#1b1b22]">
                        {vol.full_name ?? "—"}
                      </span>
                    </div>
                    <div className={`col-span-3 ${TABLE_CELL_BASE} overflow-hidden`}>
                      <span className="truncate text-[12px] text-[#5c403b]">{vol.email}</span>
                    </div>
                    <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                      <span className="text-[13px] leading-[18px] text-[#5c403b]">
                        {vol.completed_trips_count}
                      </span>
                    </div>
                    <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                      <button
                        type="button"
                        disabled={actionLoading === vol.id}
                        onClick={() => handleDeactivate(vol)}
                        className="text-[11px] font-bold tracking-[0.6px] text-[#b9100b] hover:underline disabled:opacity-50"
                      >
                        {actionLoading === vol.id ? "…" : "Deactivate"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Inactive Volunteers ── */}
        <div className="overflow-hidden rounded-[4px] border border-[#e5bdb7] bg-white">
          <div className="bg-[#f5f2fc]">
            <AccordionHeader
              dotColor="#5c403b"
              title="Inactive Volunteers"
              count={inactiveVols.length}
              countBg="rgba(92,64,59,0.1)"
              countColor="#5c403b"
              open={inactiveOpen}
              onToggle={() => setInactiveOpen((v) => !v)}
            />
          </div>

          {inactiveOpen && (
            <div>
              <div className="grid grid-cols-12 gap-4 border-b border-[#e5bdb7] bg-[#f8f9fa] px-3 py-3">
                <div className="col-span-2"><span className={TABLE_HEADER_CELL}>Status</span></div>
                <div className="col-span-4"><span className={TABLE_HEADER_CELL}>Full Name</span></div>
                <div className="col-span-4"><span className={TABLE_HEADER_CELL}>Email</span></div>
                <div className="col-span-2"><span className={TABLE_HEADER_CELL}>Action</span></div>
              </div>

              {inactiveVols.length === 0 ? (
                <EmptyState label="No inactive volunteers" />
              ) : (
                inactiveVols.map((vol, idx) => (
                  <div
                    key={vol.id}
                    className="grid grid-cols-12 gap-4 px-3 py-3"
                    style={idx > 0 ? { borderTop: "1px solid #e5bdb7" } : {}}
                  >
                    <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                      <StatusBadge status={vol.status} />
                    </div>
                    <div className={`col-span-4 ${TABLE_CELL_BASE} gap-2 overflow-hidden`}>
                      <NameAvatar name={vol.full_name} />
                      <span className="truncate text-[13px] leading-[18px] text-[#1b1b22]">
                        {vol.full_name ?? "—"}
                      </span>
                    </div>
                    <div className={`col-span-4 ${TABLE_CELL_BASE} overflow-hidden`}>
                      <span className="truncate text-[12px] text-[#5c403b]">{vol.email}</span>
                    </div>
                    <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                      <button
                        type="button"
                        disabled={actionLoading === vol.id}
                        onClick={() => handleActivate(vol)}
                        className="text-[11px] font-bold tracking-[0.6px] text-[#2e7d32] hover:underline disabled:opacity-50"
                      >
                        {actionLoading === vol.id ? "…" : "Reactivate"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
