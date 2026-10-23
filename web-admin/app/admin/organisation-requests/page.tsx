"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRealtimeReload } from "@/lib/useRealtimeReload";

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

interface Organisation {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  active: boolean;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }) +
    " • " +
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
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0 text-[#6b7280]">
      <circle cx="9" cy="9" r="7" stroke="#6b7280" strokeWidth="1.5" />
      <path d="M14 14l4 4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
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

function StatusBadge({ status }: { status: "Active" | "Unapproved" | "Inactive" }) {
  const cfg: Record<typeof status, { dot: string; text: string; bg: string; label: string }> = {
    Active: {
      dot: "bg-[#11183c]",
      text: "text-[#11183c]",
      bg: "bg-[rgba(17,24,60,0.1)]",
      label: "Active",
    },
    Unapproved: {
      dot: "bg-[#b9100b]",
      text: "text-[#b9100b]",
      bg: "bg-[rgba(185,16,11,0.1)]",
      label: "Unapproved",
    },
    Inactive: {
      dot: "bg-[#5c403b]",
      text: "text-[#5c403b]",
      bg: "bg-[rgba(92,64,59,0.1)]",
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

function ContactAvatar({ name }: { name: string }) {
  return (
    <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#E1E3E4] bg-[#BEC4F1] text-[9px] font-semibold text-[#11183c]">
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
}: {
  dotColor: string;
  title: string;
  count: number;
  countBg: string;
  countColor: string;
  open: boolean;
  onToggle: () => void;
}) {
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

const TH = "text-[12px] font-bold uppercase tracking-[0.6px] text-[#5c403b] leading-4";
const TC = "flex items-center";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrganisationRequestsPage() {
  const [activeOpen, setActiveOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [inactiveOpen, setInactiveOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [signupRequests, setSignupRequests] = useState<SignupRequest[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: reqs }, { data: orgs }] = await Promise.all([
      supabase
        .from("signup_requests")
        .select("id, auth_user_id, name, email, phone, address, status, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("organisations")
        .select("id, name, email, phone, address, active, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (reqs) setSignupRequests(reqs as SignupRequest[]);
    if (orgs) setOrganisations(orgs as Organisation[]);
    setLoading(false);
  }, []);

  useRealtimeReload(["signup_requests", "organisations"], load);

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

      await load();
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

      await load();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeactivate(org: Organisation) {
    setActionLoading(org.id);
    try {
      const { error } = await supabase
        .from("organisations")
        .update({ active: false })
        .eq("id", org.id);

      if (error) {
        alert("Failed to deactivate organisation: " + error.message);
        return;
      }

      setOrganisations((prev) =>
        prev.map((o) => (o.id === org.id ? { ...o, active: false } : o))
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReactivate(org: Organisation) {
    setActionLoading(org.id);
    try {
      const { error } = await supabase
        .from("organisations")
        .update({ active: true })
        .eq("id", org.id);

      if (error) {
        alert("Failed to reactivate organisation: " + error.message);
        return;
      }

      setOrganisations((prev) =>
        prev.map((o) => (o.id === org.id ? { ...o, active: true } : o))
      );
    } finally {
      setActionLoading(null);
    }
  }

  const searchLower = search.toLowerCase();

  const activeOrgs = organisations.filter(
    (o) =>
      o.active &&
      (o.name.toLowerCase().includes(searchLower) ||
        o.email.toLowerCase().includes(searchLower))
  );

  const inactiveOrgs = organisations.filter(
    (o) =>
      !o.active &&
      (o.name.toLowerCase().includes(searchLower) ||
        o.email.toLowerCase().includes(searchLower))
  );

  const pendingReqs = signupRequests.filter(
    (r) =>
      r.status === "pending" &&
      (r.name.toLowerCase().includes(searchLower) ||
        r.email.toLowerCase().includes(searchLower))
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-[14px] text-[#5C403B]">Loading organisations…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-[24px] font-bold leading-8 md:text-[32px] md:leading-10 tracking-[-0.64px] text-[#1b1b22]">
          Organisation Management
        </h1>
        <p className="text-[14px] leading-5 text-[#5c403b]">
          Manage organisation approvals and account details
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-auto">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className="h-10 w-full rounded-[2px] sm:w-64 border border-[#E1E3E4] bg-[#F8F9FA] pl-8 pr-3 text-[12px] font-medium text-[#1b1b22] placeholder:text-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#b9100b]"
          />
        </div>
        <button
          type="button"
          onClick={load}
          className="flex h-10 items-center rounded-[2px] border border-[#E1E3E4] bg-[#F8F9FA] px-4 text-[12px] font-medium text-[#1b1b22] transition-colors hover:bg-[rgba(17,24,60,0.04)]"
        >
          Refresh
        </button>
      </div>

      {/* Accordion Container */}
      <div className="flex flex-col gap-4">

        {/* ── Active Organisations ── */}
        <div className="overflow-hidden rounded-[4px] border border-[#E1E3E4] bg-white">
          <div className="bg-[#F3F4F5]">
            <AccordionHeader
              dotColor="#11183c"
              title="Active Organisations"
              count={activeOrgs.length}
              countBg="rgba(17,24,60,0.1)"
              countColor="#11183c"
              open={activeOpen}
              onToggle={() => setActiveOpen((v) => !v)}
            />
          </div>

          {activeOpen && (
            <div className="overflow-x-auto"><div className="min-w-[760px]">
            <div>
              <div className="grid grid-cols-12 gap-4 border-b border-[#E1E3E4] bg-[#f8f9fa] px-3 py-3">
                <div className="col-span-2"><span className={TH}>Status</span></div>
                <div className="col-span-4"><span className={TH}>Org Name</span></div>
                <div className="col-span-3"><span className={TH}>Email</span></div>
                <div className="col-span-2"><span className={TH}>Date Joined</span></div>
                <div className="col-span-1"><span className={TH}>Action</span></div>
              </div>

              {activeOrgs.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-[#5c403b]">No active organisations</div>
              ) : (
                activeOrgs.map((org, idx) => (
                  <div
                    key={org.id}
                    className="grid grid-cols-12 gap-4 px-3 py-3"
                    style={idx > 0 ? { borderTop: "1px solid #E1E3E4" } : {}}
                  >
                    <div className={`col-span-2 ${TC}`}>
                      <StatusBadge status="Active" />
                    </div>
                    <div className={`col-span-4 ${TC} gap-2 overflow-hidden`}>
                      <ContactAvatar name={org.name} />
                      <span className="truncate text-[13px] leading-[18px] text-[#1b1b22]">{org.name}</span>
                    </div>
                    <div className={`col-span-3 ${TC} overflow-hidden`}>
                      <span className="truncate text-[12px] text-[#5c403b]">{org.email}</span>
                    </div>
                    <div className={`col-span-2 ${TC}`}>
                      <span className="text-[13px] leading-[18px] text-[#5c403b]">{formatDate(org.created_at)}</span>
                    </div>
                    <div className={`col-span-1 ${TC}`}>
                      <button
                        type="button"
                        disabled={actionLoading === org.id}
                        onClick={() => handleDeactivate(org)}
                        className="text-[11px] font-bold tracking-[0.6px] text-[#b9100b] hover:underline disabled:opacity-50"
                      >
                        {actionLoading === org.id ? "…" : "Deactivate"}
                      </button>
                    </div>
                  </div>
                ))
              )}
                        </div></div></div>
          )}
        </div>

        {/* ── Pending Approval ── */}
        <div className="overflow-hidden rounded-[4px] border border-[#E1E3E4] bg-white">
          <div className="bg-[#F3F4F5]">
            <AccordionHeader
              dotColor="#b9100b"
              title="Pending Approval"
              count={pendingReqs.length}
              countBg="rgba(185,16,11,0.1)"
              countColor="#b9100b"
              open={pendingOpen}
              onToggle={() => setPendingOpen((v) => !v)}
            />
          </div>

          {pendingOpen && (
            <div className="overflow-x-auto"><div className="min-w-[760px]">
            <div>
              <div className="grid grid-cols-12 gap-4 border-b border-[#E1E3E4] bg-[#f8f9fa] px-3 py-3">
                <div className="col-span-2"><span className={TH}>Status</span></div>
                <div className="col-span-3"><span className={TH}>Org Name</span></div>
                <div className="col-span-3"><span className={TH}>Email</span></div>
                <div className="col-span-2"><span className={TH}>Request Date</span></div>
                <div className="col-span-2"><span className={TH}>Actions</span></div>
              </div>

              {pendingReqs.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-[#5c403b]">No pending signup requests</div>
              ) : (
                pendingReqs.map((req, idx) => (
                  <div
                    key={req.id}
                    className="grid grid-cols-12 gap-4 px-3 py-3"
                    style={idx > 0 ? { borderTop: "1px solid #E1E3E4" } : {}}
                  >
                    <div className={`col-span-2 ${TC}`}>
                      <StatusBadge status="Unapproved" />
                    </div>
                    <div className={`col-span-3 ${TC} overflow-hidden`}>
                      <span className="truncate text-[13px] leading-[18px] text-[#1b1b22]">{req.name}</span>
                    </div>
                    <div className={`col-span-3 ${TC} overflow-hidden`}>
                      <span className="truncate text-[12px] text-[#5c403b]">{req.email}</span>
                    </div>
                    <div className={`col-span-2 ${TC}`}>
                      <span className="text-[13px] leading-[18px] text-[#5c403b]">{formatDate(req.created_at)}</span>
                    </div>
                    <div className={`col-span-2 ${TC} gap-2`}>
                      <button
                        type="button"
                        disabled={actionLoading === req.id}
                        onClick={() => handleApprove(req)}
                        className="flex h-7 items-center rounded-[2px] bg-[#2e7d32] px-2.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                      >
                        {actionLoading === req.id ? "…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading === req.id}
                        onClick={() => handleReject(req)}
                        className="flex h-7 items-center rounded-[2px] bg-[#b9100b] px-2.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                      >
                        {actionLoading === req.id ? "…" : "Reject"}
                      </button>
                    </div>
                  </div>
                ))
              )}
                        </div></div></div>
          )}
        </div>

        {/* ── Inactive Organisations ── */}
        <div className="overflow-hidden rounded-[4px] border border-[#E1E3E4] bg-white">
          <div className="bg-[#F3F4F5]">
            <AccordionHeader
              dotColor="#5c403b"
              title="Inactive Organisations"
              count={inactiveOrgs.length}
              countBg="rgba(92,64,59,0.1)"
              countColor="#5c403b"
              open={inactiveOpen}
              onToggle={() => setInactiveOpen((v) => !v)}
            />
          </div>

          {inactiveOpen && (
            <div className="overflow-x-auto"><div className="min-w-[760px]">
            <div>
              <div className="grid grid-cols-12 gap-4 border-b border-[#E1E3E4] bg-[#f8f9fa] px-3 py-3">
                <div className="col-span-2"><span className={TH}>Status</span></div>
                <div className="col-span-4"><span className={TH}>Org Name</span></div>
                <div className="col-span-4"><span className={TH}>Email</span></div>
                <div className="col-span-2"><span className={TH}>Action</span></div>
              </div>

              {inactiveOrgs.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-[#5c403b]">No inactive organisations</div>
              ) : (
                inactiveOrgs.map((org, idx) => (
                  <div
                    key={org.id}
                    className="grid grid-cols-12 gap-4 px-3 py-3"
                    style={idx > 0 ? { borderTop: "1px solid #E1E3E4" } : {}}
                  >
                    <div className={`col-span-2 ${TC}`}>
                      <StatusBadge status="Inactive" />
                    </div>
                    <div className={`col-span-4 ${TC} overflow-hidden`}>
                      <span className="truncate text-[13px] leading-[18px] text-[#1b1b22]">{org.name}</span>
                    </div>
                    <div className={`col-span-4 ${TC} overflow-hidden`}>
                      <span className="truncate text-[12px] text-[#5c403b]">{org.email}</span>
                    </div>
                    <div className={`col-span-2 ${TC}`}>
                      <button
                        type="button"
                        disabled={actionLoading === org.id}
                        onClick={() => handleReactivate(org)}
                        className="text-[11px] font-bold tracking-[0.6px] text-[#2e7d32] hover:underline disabled:opacity-50"
                      >
                        {actionLoading === org.id ? "…" : "Reactivate"}
                      </button>
                    </div>
                  </div>
                ))
              )}
                        </div></div></div>
          )}
        </div>

      </div>
    </div>
  );
}
