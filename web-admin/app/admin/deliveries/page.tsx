"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "in-transit" | "delayed" | "unassigned" | "completed";

interface ActiveDelivery {
  id: string;
  status: "in-transit" | "delayed";
  title: string;
  estArrival: string;
  arrivalUrgent?: boolean;
  driver: string;
  driverInitials: string;
}

interface PendingDelivery {
  id: string;
  title: string;
  requestedTime: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const ACTIVE_DELIVERIES: ActiveDelivery[] = [
  {
    id: "#MP-1024",
    status: "in-transit",
    title: "Emergency Medical Supplies - St Vincents",
    estArrival: "Oct 12 • 14:30",
    driver: "J. Smith",
    driverInitials: "JS",
  },
  {
    id: "#MP-1025",
    status: "in-transit",
    title: "Surgical Kits - Royal Melbourne",
    estArrival: "Oct 12 • 15:15",
    driver: "A. Chen",
    driverInitials: "AC",
  },
  {
    id: "#MP-1027",
    status: "delayed",
    title: "O Negative Blood Units - Mercy Hospital",
    estArrival: "Oct 12 • 13:00",
    arrivalUrgent: true,
    driver: "M. Davis",
    driverInitials: "MD",
  },
];

const PENDING_DELIVERIES: PendingDelivery[] = [
  { id: "#MP-1030", title: "PPE Restock - Northside Clinic", requestedTime: "Oct 12 • 16:00" },
  { id: "#MP-1031", title: "Ventilator Parts - General Hosp.", requestedTime: "Oct 13 • 09:00" },
];

// ─── Icon components ──────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M5.5 1v9M1 5.5h9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="5" stroke="#5C403B" strokeWidth="1.3" />
      <path d="M10 10l3 3" stroke="#5C403B" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="8"
      viewBox="0 0 12 8"
      fill="none"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M1 1.5l5 4.5 5-4.5"
        stroke="#1B1B22"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Status,
  { dot: string; bg: string; text: string; label: string }
> = {
  "in-transit": {
    dot: "bg-[#11183C]",
    bg: "bg-[rgba(17,24,60,0.1)]",
    text: "text-[#11183C]",
    label: "In Transit",
  },
  delayed: {
    dot: "bg-[#B9100B]",
    bg: "bg-[rgba(185,16,11,0.1)]",
    text: "text-[#B9100B]",
    label: "Delayed",
  },
  unassigned: {
    dot: "bg-[#B9100B]",
    bg: "bg-[rgba(185,16,11,0.1)]",
    text: "text-[#B9100B]",
    label: "Unassigned",
  },
  completed: {
    dot: "bg-[#2E7D32]",
    bg: "bg-[rgba(46,125,50,0.1)]",
    text: "text-[#2E7D32]",
    label: "Completed",
  },
};

function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 ${c.bg}`}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      <span className={`text-[11px] font-bold leading-[16.5px] ${c.text}`}>{c.label}</span>
    </span>
  );
}

// ─── Count Badge ──────────────────────────────────────────────────────────────

function CountBadge({
  count,
  bg,
  textColor,
}: {
  count: number;
  bg: string;
  textColor: string;
}) {
  return (
    <span
      className={`rounded-sm px-2 py-0.5 text-[12px] font-bold ${bg} ${textColor}`}
    >
      {count}
    </span>
  );
}

// ─── Accordion Section ────────────────────────────────────────────────────────

function AccordionSection({
  title,
  dotColor,
  countBg,
  countText,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  dotColor: string;
  countBg: string;
  countText: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded"
      style={{ border: "1px solid #E5BDB7" }}
    >
      {/* Header button */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-4"
        style={{ background: "#F5F2FC" }}
      >
        <div className="flex items-center gap-3">
          <span className={`size-3 rounded-full ${dotColor}`} />
          <span className="text-[20px] font-semibold leading-7 text-[#1B1B22]">{title}</span>
          <CountBadge count={count} bg={countBg} textColor={countText} />
        </div>
        <ChevronIcon open={open} />
      </button>

      {/* Collapsible content */}
      {open && <div>{children}</div>}
    </div>
  );
}

// ─── Table Header ─────────────────────────────────────────────────────────────

function ActiveTableHeader() {
  return (
    <div
      className="grid grid-cols-12 gap-4 px-3 py-3"
      style={{ background: "#F8F9FA", borderBottom: "1px solid #E5BDB7" }}
    >
      <div className="col-span-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]">
        Delivery ID
      </div>
      <div className="col-span-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]">
        Status
      </div>
      <div className="col-span-4 text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]">
        Title / Destination
      </div>
      <div className="col-span-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]">
        Est. Arrival
      </div>
      <div className="col-span-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]">
        Driver
      </div>
    </div>
  );
}

function PendingTableHeader() {
  return (
    <div
      className="grid grid-cols-12 gap-4 px-3 py-3"
      style={{ background: "#F8F9FA", borderBottom: "1px solid #E5BDB7" }}
    >
      <div className="col-span-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]">
        Delivery ID
      </div>
      <div className="col-span-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]">
        Status
      </div>
      <div className="col-span-4 text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]">
        Title / Destination
      </div>
      <div className="col-span-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]">
        Requested Time
      </div>
      <div className="col-span-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]">
        Action
      </div>
    </div>
  );
}

// ─── Row Components ───────────────────────────────────────────────────────────

function ActiveRow({
  delivery,
  isFirst,
}: {
  delivery: ActiveDelivery;
  isFirst: boolean;
}) {
  const isDelayed = delivery.status === "delayed";
  return (
    <div
      className="grid grid-cols-12 items-center gap-4 px-3 py-3"
      style={{
        background: "#FFFFFF",
        borderTop: isFirst ? undefined : "1px solid #E5BDB7",
        borderLeft: isDelayed ? "2px solid #B9100B" : undefined,
      }}
    >
      {/* ID */}
      <div className="col-span-2 text-[12px] font-bold leading-4 text-[#1B1B22]">
        {delivery.id}
      </div>

      {/* Status */}
      <div className="col-span-2 flex items-center">
        <StatusBadge status={delivery.status} />
      </div>

      {/* Title */}
      <div
        className={`col-span-4 text-[13px] leading-[18px] ${
          isDelayed ? "font-semibold text-[#1B1B22]" : "font-normal text-[#1B1B22]"
        }`}
      >
        {delivery.title}
      </div>

      {/* Arrival */}
      <div
        className={`col-span-2 text-[13px] leading-[18px] ${
          delivery.arrivalUrgent
            ? "font-semibold text-[#BA1A1A]"
            : "font-normal text-[#5C403B]"
        }`}
      >
        {delivery.estArrival}
      </div>

      {/* Driver */}
      <div className="col-span-2 flex items-center gap-2">
        <div
          className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#E5BDB7] bg-[#BEC4F1] text-[10px] font-semibold text-[#11183C]"
        >
          {delivery.driverInitials}
        </div>
        <span className="text-[12px] font-medium leading-4 text-[#1B1B22]">
          {delivery.driver}
        </span>
      </div>
    </div>
  );
}

function PendingRow({
  delivery,
  isFirst,
}: {
  delivery: PendingDelivery;
  isFirst: boolean;
}) {
  return (
    <div
      className="grid grid-cols-12 items-center gap-4 px-3 py-3"
      style={{
        background: "#FFFFFF",
        borderTop: isFirst ? undefined : "1px solid #E5BDB7",
      }}
    >
      {/* ID */}
      <div className="col-span-2 text-[12px] font-bold leading-4 text-[#1B1B22]">
        {delivery.id}
      </div>

      {/* Status */}
      <div className="col-span-2 flex items-center">
        <StatusBadge status="unassigned" />
      </div>

      {/* Title */}
      <div className="col-span-4 text-[13px] font-normal leading-[18px] text-[#1B1B22]">
        {delivery.title}
      </div>

      {/* Requested time */}
      <div className="col-span-2 text-[13px] font-normal leading-[18px] text-[#5C403B]">
        {delivery.requestedTime}
      </div>

      {/* Action */}
      <div className="col-span-2 flex items-center">
        <button
          type="button"
          className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#8F0002] transition-opacity hover:opacity-70"
        >
          Assign Driver
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DeliveriesPage() {
  const [activeOpen, setActiveOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] font-bold leading-10 tracking-[-0.02em] text-[#1B1B22]">
          Deliveries Management
        </h1>
        <p className="text-[14px] font-normal leading-5 text-[#5C403B]">
          Track, manage, and dispatch medical supplies across the network.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Filter buttons */}
        <button
          type="button"
          className="flex h-10 items-center justify-center rounded-sm px-4 text-[12px] font-medium text-[#1B1B22] transition-colors hover:bg-[rgba(17,24,60,0.05)]"
          style={{ border: "1px solid #E5BDB7", background: "#FBF8FF" }}
        >
          Today
        </button>
        <button
          type="button"
          className="flex h-10 items-center justify-center rounded-sm px-4 text-[12px] font-medium text-[#1B1B22] transition-colors hover:bg-[rgba(17,24,60,0.05)]"
          style={{ border: "1px solid #E5BDB7", background: "#FBF8FF" }}
        >
          This Week
        </button>

        {/* New Delivery */}
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-sm bg-[#B9100B] px-4 text-[16px] font-normal leading-6 text-white transition-opacity hover:opacity-90"
        >
          <PlusIcon />
          New Delivery
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID or destination..."
            className="h-10 w-64 rounded-sm py-1.5 pl-8 pr-3 text-[12px] font-medium placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#11183C]"
            style={{ background: "#FBF8FF", border: "1px solid #E5BDB7" }}
          />
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center">
            <SearchIcon />
          </span>
        </div>
      </div>

      {/* Accordion sections */}
      <div className="flex flex-col gap-4">
        {/* ── Active (In Transit) ── */}
        <AccordionSection
          title="Active (In Transit)"
          dotColor="bg-[#11183C]"
          countBg="bg-[rgba(17,24,60,0.1)]"
          countText="text-[#11183C]"
          count={ACTIVE_DELIVERIES.length}
          open={activeOpen}
          onToggle={() => setActiveOpen((v) => !v)}
        >
          <ActiveTableHeader />
          {ACTIVE_DELIVERIES.map((d, i) => (
            <ActiveRow key={d.id} delivery={d} isFirst={i === 0} />
          ))}
        </AccordionSection>

        {/* ── Pending Driver Assignment ── */}
        <AccordionSection
          title="Pending Driver Assignment"
          dotColor="bg-[#B9100B]"
          countBg="bg-[rgba(185,16,11,0.1)]"
          countText="text-[#B9100B]"
          count={PENDING_DELIVERIES.length}
          open={pendingOpen}
          onToggle={() => setPendingOpen((v) => !v)}
        >
          <PendingTableHeader />
          {PENDING_DELIVERIES.map((d, i) => (
            <PendingRow key={d.id} delivery={d} isFirst={i === 0} />
          ))}
        </AccordionSection>

        {/* ── Completed (Today) ── */}
        <AccordionSection
          title="Completed (Today)"
          dotColor="bg-[#2E7D32]"
          countBg="bg-[rgba(46,125,50,0.1)]"
          countText="text-[#2E7D32]"
          count={4}
          open={completedOpen}
          onToggle={() => setCompletedOpen((v) => !v)}
        >
          <div className="px-3 py-6 text-center text-[13px] text-[#5C403B]">
            Completed delivery records would appear here.
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}
