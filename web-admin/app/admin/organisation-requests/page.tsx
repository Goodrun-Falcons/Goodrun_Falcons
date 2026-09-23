"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveOrg {
  id: string;
  status: "Active";
  name: string;
  dateJoined: string;
  contact: string;
  contactInitials: string;
}

interface PendingOrg {
  id: string;
  status: "Unapproved";
  name: string;
  requestDate: string;
}

interface InactiveOrg {
  id: string;
  name: string;
  dateClosed: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const ACTIVE_ORGS: ActiveOrg[] = [
  {
    id: "#ORG-0001",
    status: "Active",
    name: "Regional Community Vet Clinic",
    dateJoined: "Oct 12 • 14:30",
    contact: "J. Smith",
    contactInitials: "JS",
  },
  {
    id: "#ORG-0002",
    status: "Active",
    name: "McIntyre Wildlife Shelter",
    dateJoined: "Oct 12 • 15:15",
    contact: "A. Chen",
    contactInitials: "AC",
  },
  {
    id: "#ORG-0003",
    status: "Active",
    name: "The Dziko Project",
    dateJoined: "Oct 12 • 14:30",
    contact: "M. Davis",
    contactInitials: "MD",
  },
];

const PENDING_ORGS: PendingOrg[] = [
  {
    id: "#ORG-0077",
    status: "Unapproved",
    name: "Northern Rivers Wildlife Hospital",
    requestDate: "Oct 12 • 16:00",
  },
  {
    id: "#ORG-0078",
    status: "Unapproved",
    name: "The Rescue Collective Inc",
    requestDate: "Oct 13 • 09:00",
  },
];

const INACTIVE_ORGS: InactiveOrg[] = [
  { id: "#ORG-0010", name: "Blue Mountains Animal Rescue", dateClosed: "Sep 3 • 09:00" },
  { id: "#ORG-0015", name: "Coastal Wildlife Sanctuary", dateClosed: "Aug 18 • 11:00" },
  { id: "#ORG-0021", name: "Riverland Vet Co-op", dateClosed: "Jul 30 • 13:45" },
  { id: "#ORG-0034", name: "Hunter Valley Fauna Care", dateClosed: "Jul 12 • 10:00" },
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

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M5.5 1v9M1 5.5h9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
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

function StatusBadge({ status }: { status: "Active" | "Unapproved" }) {
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
      <span className="text-[11px] font-bold leading-[16.5px] text-[#b9100b]">Unapproved</span>
    </div>
  );
}

function ContactAvatar({ initials }: { initials: string }) {
  return (
    <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#e5bdb7] bg-[#BEC4F1] text-[9px] font-semibold text-[#11183c]">
      {initials}
    </div>
  );
}

function AccordionHeader({
  dot,
  dotColor,
  title,
  count,
  countBg,
  countColor,
  open,
  onToggle,
}: {
  dot: string;
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

const TABLE_HEADER_CELL = "text-[12px] font-bold uppercase tracking-[0.6px] text-[#5c403b] leading-4";
const TABLE_CELL_BASE = "flex items-center";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrganisationRequestsPage() {
  const [activeOpen, setActiveOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [inactiveOpen, setInactiveOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] font-bold leading-10 tracking-[-0.64px] text-[#1b1b22]">
          Organization Management
        </h1>
        <p className="text-[14px] leading-5 text-[#5c403b]">
          Manage organization approvals and account details
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[2px] bg-[#b9100b] px-4 py-1.5 text-[16px] leading-6 text-white"
        >
          <PlusIcon />
          New Organisation
        </button>

        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID or Organisation"
            className="h-10 w-64 rounded-[2px] border border-[#e5bdb7] bg-[#fbf8ff] pl-8 pr-3 text-[12px] font-medium text-[#1b1b22] placeholder:text-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#b9100b]"
          />
        </div>
      </div>

      {/* Accordion Container */}
      <div className="flex flex-col gap-4">

        {/* ── Active Organisations ── */}
        <div className="overflow-hidden rounded-[4px] border border-[#e5bdb7] bg-white">
          <div className="bg-[#f5f2fc]">
            <AccordionHeader
              dot="#11183c"
              dotColor="#11183c"
              title="Active Organisations"
              count={ACTIVE_ORGS.length}
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
                  <span className={TABLE_HEADER_CELL}>Org ID</span>
                </div>
                <div className="col-span-2">
                  <span className={TABLE_HEADER_CELL}>Status</span>
                </div>
                <div className="col-span-4">
                  <span className={TABLE_HEADER_CELL}>Org Name</span>
                </div>
                <div className="col-span-2">
                  <span className={TABLE_HEADER_CELL}>Date Joined</span>
                </div>
                <div className="col-span-2">
                  <span className={TABLE_HEADER_CELL}>Contact</span>
                </div>
              </div>

              {/* Rows */}
              {ACTIVE_ORGS.map((org, idx) => (
                <div
                  key={org.id}
                  className="grid grid-cols-12 gap-4 px-3 py-3"
                  style={idx > 0 ? { borderTop: "1px solid #e5bdb7" } : {}}
                >
                  <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                    <span className="text-[12px] font-bold tracking-[0.6px] text-[#1b1b22]">{org.id}</span>
                  </div>
                  <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                    <StatusBadge status={org.status} />
                  </div>
                  <div className={`col-span-4 ${TABLE_CELL_BASE} overflow-hidden`}>
                    <span className="truncate text-[13px] leading-[18px] text-[#1b1b22]">{org.name}</span>
                  </div>
                  <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                    <span className="text-[13px] leading-[18px] text-[#5c403b]">{org.dateJoined}</span>
                  </div>
                  <div className={`col-span-2 ${TABLE_CELL_BASE} gap-2`}>
                    <ContactAvatar initials={org.contactInitials} />
                    <span className="text-[12px] font-medium leading-4 text-[#1b1b22]">{org.contact}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Pending Approval ── */}
        <div className="overflow-hidden rounded-[4px] border border-[#e5bdb7] bg-white">
          <div className="bg-[#f5f2fc]">
            <AccordionHeader
              dot="#b9100b"
              dotColor="#b9100b"
              title="Pending Approval"
              count={PENDING_ORGS.length}
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
                  <span className={TABLE_HEADER_CELL}>Org ID</span>
                </div>
                <div className="col-span-2">
                  <span className={TABLE_HEADER_CELL}>Status</span>
                </div>
                <div className="col-span-4">
                  <span className={TABLE_HEADER_CELL}>Org Name</span>
                </div>
                <div className="col-span-2">
                  <span className={TABLE_HEADER_CELL}>Request Date</span>
                </div>
                <div className="col-span-2">
                  <span className={TABLE_HEADER_CELL}>Action</span>
                </div>
              </div>

              {/* Rows */}
              {PENDING_ORGS.map((org, idx) => (
                <div
                  key={org.id}
                  className="grid grid-cols-12 gap-4 px-3 py-3"
                  style={idx > 0 ? { borderTop: "1px solid #e5bdb7" } : {}}
                >
                  <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                    <span className="text-[12px] font-bold tracking-[0.6px] text-[#1b1b22]">{org.id}</span>
                  </div>
                  <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                    <StatusBadge status={org.status} />
                  </div>
                  <div className={`col-span-4 ${TABLE_CELL_BASE} overflow-hidden`}>
                    <span className="truncate text-[13px] leading-[18px] text-[#1b1b22]">{org.name}</span>
                  </div>
                  <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                    <span className="text-[13px] leading-[18px] text-[#5c403b]">{org.requestDate}</span>
                  </div>
                  <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                    <button
                      type="button"
                      className="text-[12px] font-bold tracking-[0.6px] text-[#8f0002]"
                    >
                      Approve / Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Inactive ── */}
        <div className="overflow-hidden rounded-[4px] border border-[#e5bdb7] bg-white">
          <div className="bg-[#f5f2fc]">
            <AccordionHeader
              dot="#2e7d32"
              dotColor="#2e7d32"
              title="Inactive"
              count={INACTIVE_ORGS.length}
              countBg="rgba(46,125,50,0.1)"
              countColor="#2e7d32"
              open={inactiveOpen}
              onToggle={() => setInactiveOpen((v) => !v)}
            />
          </div>

          {inactiveOpen && (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 border-b border-[#e5bdb7] bg-[#f8f9fa] px-3 py-3">
                <div className="col-span-2">
                  <span className={TABLE_HEADER_CELL}>Org ID</span>
                </div>
                <div className="col-span-6">
                  <span className={TABLE_HEADER_CELL}>Org Name</span>
                </div>
                <div className="col-span-4">
                  <span className={TABLE_HEADER_CELL}>Date Closed</span>
                </div>
              </div>

              {/* Rows */}
              {INACTIVE_ORGS.map((org, idx) => (
                <div
                  key={org.id}
                  className="grid grid-cols-12 gap-4 px-3 py-3"
                  style={idx > 0 ? { borderTop: "1px solid #e5bdb7" } : {}}
                >
                  <div className={`col-span-2 ${TABLE_CELL_BASE}`}>
                    <span className="text-[12px] font-bold tracking-[0.6px] text-[#1b1b22]">{org.id}</span>
                  </div>
                  <div className={`col-span-6 ${TABLE_CELL_BASE} overflow-hidden`}>
                    <span className="truncate text-[13px] leading-[18px] text-[#1b1b22]">{org.name}</span>
                  </div>
                  <div className={`col-span-4 ${TABLE_CELL_BASE}`}>
                    <span className="text-[13px] leading-[18px] text-[#5c403b]">{org.dateClosed}</span>
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
