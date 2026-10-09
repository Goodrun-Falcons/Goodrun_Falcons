"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveVolunteer {
  id: string;
  status: "Active";
  name: string;
  nameInitials: string;
  location: string;
  dateJoined: string;
}

interface PendingVolunteer {
  id: string;
  status: "Pending";
  name: string;
  nameInitials: string;
  location: string;
  requestDate: string;
}

// ─── Static seed data ─────────────────────────────────────────────────────────

const SEED_ACTIVE: ActiveVolunteer[] = [
  {
    id: "#VOL-0001",
    status: "Active",
    name: "Sarah Mitchell",
    nameInitials: "SM",
    location: "Sydney, NSW",
    dateJoined: "Oct 12 • 14:30",
  },
  {
    id: "#VOL-0002",
    status: "Active",
    name: "James Okafor",
    nameInitials: "JO",
    location: "Melbourne, VIC",
    dateJoined: "Oct 12 • 15:15",
  },
  {
    id: "#VOL-0003",
    status: "Active",
    name: "Priya Nair",
    nameInitials: "PN",
    location: "Brisbane, QLD",
    dateJoined: "Oct 13 • 09:00",
  },
];

const SEED_PENDING: PendingVolunteer[] = [
  {
    id: "#VOL-0077",
    status: "Pending",
    name: "Tom Beaumont",
    nameInitials: "TB",
    location: "Lismore, NSW",
    requestDate: "Oct 14 • 10:00",
  },
  {
    id: "#VOL-0078",
    status: "Pending",
    name: "Anika Weston",
    nameInitials: "AW",
    location: "Cairns, QLD",
    requestDate: "Oct 14 • 11:30",
  },
  {
    id: "#VOL-0079",
    status: "Pending",
    name: "Marcus Leung",
    nameInitials: "ML",
    location: "Perth, WA",
    requestDate: "Oct 15 • 08:45",
  },
];

// ─── Icon components ──────────────────────────────────────────────────────────

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

function StatusBadge({ status }: Readonly<{ status: "Active" | "Pending" }>) {
  if (status === "Active") {
    return (
      <div className="flex items-center gap-1.5 rounded-[2px] bg-[rgba(17,24,60,0.1)] px-2 py-1">
        <span className="size-1.5 rounded-full bg-[#11183c]" />
        <span className="text-[11px] font-bold leading-[16.5px] text-[#11183c]">Active</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 rounded-[2px] bg-[rgba(185,16,11,0.1)] px-2 py-1">
      <span className="size-1.5 rounded-full bg-[#b9100b]" />
      <span className="text-[11px] font-bold leading-[16.5px] text-[#b9100b]">Pending</span>
    </div>
  );
}

function NameAvatar({ initials }: Readonly<{ initials: string }>) {
  return (
    <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#e5bdb7] bg-[#BEC4F1] text-[9px] font-semibold text-[#11183c]">
      {initials}
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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyPending() {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" stroke="#e5bdb7" strokeWidth="1.4" />
        <path d="M12 18.5l4 4 8-9" stroke="#b9100b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-[13px] font-medium text-[#5c403b]">No pending volunteer requests</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VolunteersPage() {
  const [activeOpen, setActiveOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [search, setSearch] = useState("");

  const [activeVolunteers, setActiveVolunteers] = useState<ActiveVolunteer[]>(SEED_ACTIVE);
  const [pendingVolunteers, setPendingVolunteers] = useState<PendingVolunteer[]>(SEED_PENDING);

  function handleApprove(vol: PendingVolunteer) {
    setPendingVolunteers((prev) => prev.filter((v) => v.id !== vol.id));
    setActiveVolunteers((prev) => [
      ...prev,
      {
        id: vol.id,
        status: "Active",
        name: vol.name,
        nameInitials: vol.nameInitials,
        location: vol.location,
        dateJoined: new Date().toLocaleString("en-AU", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).replace(",", " •"),
      },
    ]);
  }

  function handleReject(id: string) {
    setPendingVolunteers((prev) => prev.filter((v) => v.id !== id));
  }

  const searchLower = search.toLowerCase();

  const filteredActive = activeVolunteers.filter(
    (v) =>
      v.id.toLowerCase().includes(searchLower) ||
      v.name.toLowerCase().includes(searchLower) ||
      v.location.toLowerCase().includes(searchLower),
  );

  const filteredPending = pendingVolunteers.filter(
    (v) =>
      v.id.toLowerCase().includes(searchLower) ||
      v.name.toLowerCase().includes(searchLower) ||
      v.location.toLowerCase().includes(searchLower),
  );

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
            placeholder="Search ID, name or location"
            className="h-10 w-72 rounded-[2px] border border-[#e5bdb7] bg-[#fbf8ff] pl-8 pr-3 text-[12px] font-medium text-[#1b1b22] placeholder:text-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#b9100b]"
          />
        </div>
      </div>

      {/* Accordion Container */}
      <div className="flex flex-col gap-4">

        {/* ── Pending Approval ── */}
        <div className="overflow-hidden rounded-[4px] border border-[#e5bdb7] bg-white">
          <div className="bg-[#f5f2fc]">
            <AccordionHeader
              dotColor="#b9100b"
              title="Pending Approval"
              count={pendingVolunteers.length}
              countBg="rgba(185,16,11,0.1)"
              countColor="#b9100b"
              open={pendingOpen}
              onToggle={() => setPendingOpen((v) => !v)}
            />
          </div>

          {pendingOpen && (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 border-b border-[#e5bdb7] bg-[#f8f9fa] px-3 py-3">
                <div className="col-span-2">
                  <span className={TABLE_HEADER_CELL}>Volunteer ID</span>
                </div>
                <div className="col-span-2">
                  <span className={TABLE_HEADER_CELL}>Status</span>
                </div>
                <div className="col-span-3">
                  <span className={TABLE_HEADER_CELL}>Full Name</span>
                </div>
                <div className="col-span-2">
                  <span className={TABLE_HEADER_CELL}>Location</span>
                </div>
                <div className="col-span-2">
                  <span className={TABLE_HEADER_CELL}>Request Date</span>
                </div>
                <div className="col-span-1">
                  <span className={TABLE_HEADER_CELL}>Actions</span>
                </div>
              </div>

              {filteredPending.length === 0 ? (
                <EmptyPending />
              ) : (
                filteredPending.map((vol, idx) => (
                  <div
                    key={vol.id}
                    className="grid grid-cols-12 gap-4 px-3 py-3"
                    style={idx > 0 ? { borderTop: "1px solid #e5bdb7" } : {}}
                  >
                    <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                      <span className="text-[12px] font-bold tracking-[0.6px] text-[#1b1b22]">{vol.id}</span>
                    </div>
                    <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                      <StatusBadge status={vol.status} />
                    </div>
                    <div className={`col-span-3 ${TABLE_CELL_BASE} gap-2 overflow-hidden`}>
                      <NameAvatar initials={vol.nameInitials} />
                      <span className="truncate text-[13px] leading-[18px] text-[#1b1b22]">{vol.name}</span>
                    </div>
                    <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                      <span className="text-[13px] leading-[18px] text-[#5c403b]">{vol.location}</span>
                    </div>
                    <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                      <span className="text-[13px] leading-[18px] text-[#5c403b]">{vol.requestDate}</span>
                    </div>
                    <div className={`col-span-1 ${TABLE_CELL_BASE} gap-2`}>
                      <button
                        type="button"
                        onClick={() => handleApprove(vol)}
                        title="Approve"
                        className="flex size-7 items-center justify-center rounded-[2px] bg-[#2e7d32] transition-opacity hover:opacity-80"
                      >
                        <CheckIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(vol.id)}
                        title="Reject"
                        className="flex size-7 items-center justify-center rounded-[2px] bg-[#b9100b] transition-opacity hover:opacity-80"
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
              count={activeVolunteers.length}
              countBg="rgba(17,24,60,0.1)"
              countColor="#11183c"
              open={activeOpen}
              onToggle={() => setActiveOpen((v) => !v)}
            />
          </div>

          {activeOpen && (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 border-b border-[#e5bdb7] bg-[#f8f9fa] px-3 py-3">
                <div className="col-span-2">
                  <span className={TABLE_HEADER_CELL}>Volunteer ID</span>
                </div>
                <div className="col-span-2">
                  <span className={TABLE_HEADER_CELL}>Status</span>
                </div>
                <div className="col-span-4">
                  <span className={TABLE_HEADER_CELL}>Full Name</span>
                </div>
                <div className="col-span-2">
                  <span className={TABLE_HEADER_CELL}>Location</span>
                </div>
                <div className="col-span-2">
                  <span className={TABLE_HEADER_CELL}>Date Joined</span>
                </div>
              </div>

              {/* Rows */}
              {filteredActive.map((vol, idx) => (
                <div
                  key={vol.id}
                  className="grid grid-cols-12 gap-4 px-3 py-3"
                  style={idx > 0 ? { borderTop: "1px solid #e5bdb7" } : {}}
                >
                  <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                    <span className="text-[12px] font-bold tracking-[0.6px] text-[#1b1b22]">{vol.id}</span>
                  </div>
                  <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                    <StatusBadge status={vol.status} />
                  </div>
                  <div className={`col-span-4 ${TABLE_CELL_BASE} gap-2 overflow-hidden`}>
                    <NameAvatar initials={vol.nameInitials} />
                    <span className="truncate text-[13px] leading-[18px] text-[#1b1b22]">{vol.name}</span>
                  </div>
                  <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                    <span className="text-[13px] leading-[18px] text-[#5c403b]">{vol.location}</span>
                  </div>
                  <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                    <span className="text-[13px] leading-[18px] text-[#5c403b]">{vol.dateJoined}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
