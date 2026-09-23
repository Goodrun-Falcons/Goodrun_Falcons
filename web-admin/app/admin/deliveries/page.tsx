"use client";

import { useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveStatus = "in-transit" | "delayed" | "pending pickup";
type Status = ActiveStatus | "unassigned" | "completed";

interface ActiveDelivery {
  id: string;
  status: ActiveStatus;
  title: string;
  description?: string;
  estArrival: string;
  arrivalUrgent?: boolean;
  driver: string;
  driverInitials: string;
}

interface PendingDelivery {
  id: string;
  title: string;
  description?: string;
  requestedTime: string;
  date: string;
  time: string;
  urgent?: boolean;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const INITIAL_ACTIVE: ActiveDelivery[] = [
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
    status: "pending pickup",
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

const INITIAL_PENDING: PendingDelivery[] = [
  {
    id: "#MP-1030",
    title: "PPE Restock - Northside Clinic",
    requestedTime: "Oct 12 • 16:00",
    date: "2026-10-12",
    time: "16:00",
  },
  {
    id: "#MP-1031",
    title: "Ventilator Parts - General Hosp.",
    requestedTime: "Oct 13 • 09:00",
    date: "2026-10-13",
    time: "09:00",
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

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

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M1 1l12 12M13 1L1 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { dot: string; bg: string; text: string; label: string }> = {
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
  "pending pickup": {
    dot: "bg-[#B9100B]",
    bg: "bg-[rgba(185,16,11,0.1)]",
    text: "text-[#B9100B]",
    label: "Pending Pickup",
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

function UrgentBadge() {
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-sm bg-[rgba(185,16,11,0.1)] px-1.5 py-0.5">
      <span className="size-1.5 rounded-full bg-[#B9100B]" />
      <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#B9100B]">
        Urgent
      </span>
    </span>
  );
}

function CountBadge({ count, bg, textColor }: { count: number; bg: string; textColor: string }) {
  return (
    <span className={`rounded-sm px-2 py-0.5 text-[12px] font-bold ${bg} ${textColor}`}>
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
    <div className="overflow-hidden rounded" style={{ border: "1px solid #E5BDB7" }}>
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
      {open && <div>{children}</div>}
    </div>
  );
}

// ─── Table Headers ────────────────────────────────────────────────────────────

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
  onClick,
}: {
  delivery: ActiveDelivery;
  isFirst: boolean;
  onClick: () => void;
}) {
  const isDelayed = delivery.status === "delayed";
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-12 cursor-pointer items-center gap-4 px-3 py-3 text-left transition-colors hover:bg-[rgba(17,24,60,0.03)]"
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
      <div className="col-span-2 flex flex-col gap-1">
        <StatusBadge status={delivery.status} />
        {delivery.arrivalUrgent && <UrgentBadge />}
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
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#E5BDB7] bg-[#BEC4F1] text-[10px] font-semibold text-[#11183C]">
          {delivery.driverInitials}
        </div>
        <span className="text-[12px] font-medium leading-4 text-[#1B1B22]">
          {delivery.driver}
        </span>
      </div>
    </button>
  );
}

function PendingRow({
  delivery,
  isFirst,
  onClick,
}: {
  delivery: PendingDelivery;
  isFirst: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-12 cursor-pointer items-center gap-4 px-3 py-3 text-left transition-colors hover:bg-[rgba(185,16,11,0.02)]"
      style={{
        background: "#FFFFFF",
        borderTop: isFirst ? undefined : "1px solid #E5BDB7",
        borderLeft: delivery.urgent ? "2px solid #B9100B" : undefined,
      }}
    >
      {/* ID */}
      <div className="col-span-2 text-[12px] font-bold leading-4 text-[#1B1B22]">
        {delivery.id}
      </div>

      {/* Status + Urgent badge stacked */}
      <div className="col-span-2 flex flex-col gap-1">
        <StatusBadge status="unassigned" />
        {delivery.urgent && <UrgentBadge />}
      </div>

      {/* Title */}
      <div
        className={`col-span-4 text-[13px] leading-[18px] ${
          delivery.urgent ? "font-semibold text-[#1B1B22]" : "font-normal text-[#1B1B22]"
        }`}
      >
        {delivery.title}
      </div>

      {/* Requested time */}
      <div className="col-span-2 text-[13px] font-normal leading-[18px] text-[#5C403B]">
        {delivery.requestedTime}
      </div>

      {/* Action — stop propagation so clicking "Assign Driver" doesn't open the detail modal */}
      <div className="col-span-2 flex items-center">
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#8F0002] transition-opacity hover:opacity-70"
        >
          Assign Driver
        </button>
      </div>
    </button>
  );
}

// ─── Delivery Detail / Edit Modal ─────────────────────────────────────────────

type SelectedDelivery =
  | { kind: "active"; data: ActiveDelivery }
  | { kind: "pending"; data: PendingDelivery };

interface ActiveDetailForm {
  title: string;
  description: string;
  status: ActiveStatus;
  estArrival: string;
  driver: string;
  arrivalUrgent: boolean;
}

interface PendingDetailForm {
  title: string;
  description: string;
  date: string;
  time: string;
  urgent: boolean;
}

function UrgentToggle({
  checked,
  label,
  subLabel,
  onChange,
}: {
  checked: boolean;
  label: string;
  subLabel: string;
  onChange: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-lg px-4 py-3"
      style={{
        background: checked ? "rgba(185,16,11,0.06)" : "#FBF8FF",
        border: `1px solid ${checked ? "#B9100B" : "#E5BDB7"}`,
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-[#1B1B22]">{label}</span>
        <span className="text-[11px] text-[#5C403B]">{subLabel}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#B9100B] focus:ring-offset-1"
        style={{ background: checked ? "#B9100B" : "#D1D5DB" }}
      >
        <span
          className="pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200"
          style={{
            transform: checked ? "translateX(20px)" : "translateX(2px)",
            marginTop: "2px",
          }}
        />
      </button>
    </div>
  );
}

function DeliveryDetailModal({
  selected,
  onClose,
  onSave,
  onDelete,
}: {
  selected: SelectedDelivery;
  onClose: () => void;
  onSave: (updated: SelectedDelivery) => void;
  onDelete: (id: string) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [activeForm, setActiveForm] = useState<ActiveDetailForm>(
    selected.kind === "active"
      ? {
          title: selected.data.title,
          description: selected.data.description ?? "",
          status: selected.data.status,
          estArrival: selected.data.estArrival,
          driver: selected.data.driver,
          arrivalUrgent: selected.data.arrivalUrgent ?? false,
        }
      : {
          title: "",
          description: "",
          status: "in-transit",
          estArrival: "",
          driver: "",
          arrivalUrgent: false,
        }
  );

  const [pendingForm, setPendingForm] = useState<PendingDetailForm>(
    selected.kind === "pending"
      ? {
          title: selected.data.title,
          description: selected.data.description ?? "",
          date: selected.data.date,
          time: selected.data.time,
          urgent: selected.data.urgent ?? false,
        }
      : { title: "", description: "", date: "", time: "", urgent: false }
  );

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selected.kind === "active") {
      onSave({
        kind: "active",
        data: {
          ...selected.data,
          title: activeForm.title,
          description: activeForm.description,
          status: activeForm.status,
          estArrival: activeForm.estArrival,
          driver: activeForm.driver,
          driverInitials: activeForm.driver
            .split(/[\s.]+/)
            .filter(Boolean)
            .map((p) => p[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
          arrivalUrgent: activeForm.arrivalUrgent,
        },
      });
    } else {
      const datePart = pendingForm.date
        ? new Date(pendingForm.date).toLocaleDateString("en-AU", {
            day: "2-digit",
            month: "short",
          })
        : "";
      const requestedTime =
        datePart && pendingForm.time
          ? `${datePart} • ${pendingForm.time}`
          : datePart || pendingForm.time;
      onSave({
        kind: "pending",
        data: {
          ...selected.data,
          title: pendingForm.title,
          description: pendingForm.description,
          date: pendingForm.date,
          time: pendingForm.time,
          requestedTime,
          urgent: pendingForm.urgent,
        },
      });
    }
    onClose();
  }

  function handleDelete() {
    onDelete(selected.data.id);
    onClose();
  }

  const inputClass =
    "h-10 w-full rounded-lg px-3 text-[13px] text-[#1B1B22] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#11183C]";
  const inputStyle: React.CSSProperties = { background: "#FBF8FF", border: "1px solid #E5BDB7" };
  const labelClass = "text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]";
  const statusOptions: { value: ActiveStatus; label: string }[] = [
    { value: "in-transit", label: "In Transit" },
    { value: "delayed", label: "Delayed" },
    { value: "pending pickup", label: "Pending Pickup" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="relative flex max-h-[90vh] w-[520px] flex-col rounded-2xl bg-white shadow-xl"
        style={{ border: "1px solid #E5BDB7" }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-start justify-between rounded-t-2xl px-6 py-5"
          style={{ borderBottom: "1px solid #E5BDB7", background: "#F5F2FC" }}
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]">
              {selected.data.id}
            </span>
            <h2 className="text-[18px] font-semibold leading-6 text-[#1B1B22]">
              Delivery Details
            </h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <StatusBadge
                status={selected.kind === "active" ? selected.data.status : "unassigned"}
              />
              {selected.kind === "pending" && selected.data.urgent && <UrgentBadge />}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full text-[#5C403B] transition-colors hover:bg-[rgba(185,16,11,0.08)] hover:text-[#B9100B]"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Scrollable form body */}
        <form
          onSubmit={handleSave}
          className="flex flex-col gap-5 overflow-y-auto px-6 py-6"
        >
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="detail-title" className={labelClass}>
              Delivery Title
            </label>
            <input
              id="detail-title"
              type="text"
              required
              value={selected.kind === "active" ? activeForm.title : pendingForm.title}
              onChange={(e) =>
                selected.kind === "active"
                  ? setActiveForm((f) => ({ ...f, title: e.target.value }))
                  : setPendingForm((f) => ({ ...f, title: e.target.value }))
              }
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="detail-description" className={labelClass}>
              Item Descriptions
            </label>
            <textarea
              id="detail-description"
              rows={3}
              placeholder="List items included in this delivery…"
              value={
                selected.kind === "active" ? activeForm.description : pendingForm.description
              }
              onChange={(e) =>
                selected.kind === "active"
                  ? setActiveForm((f) => ({ ...f, description: e.target.value }))
                  : setPendingForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full resize-none rounded-lg px-3 py-2.5 text-[13px] leading-[1.6] text-[#1B1B22] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#11183C]"
              style={inputStyle}
            />
          </div>

          {/* ── Pending-specific ── */}
          {selected.kind === "pending" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="detail-date" className={labelClass}>
                    Delivery Date
                  </label>
                  <input
                    id="detail-date"
                    type="date"
                    required
                    min={today}
                    value={pendingForm.date}
                    onChange={(e) =>
                      setPendingForm((f) => ({ ...f, date: e.target.value }))
                    }
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="detail-time" className={labelClass}>
                    Time
                  </label>
                  <input
                    id="detail-time"
                    type="time"
                    required
                    value={pendingForm.time}
                    onChange={(e) =>
                      setPendingForm((f) => ({ ...f, time: e.target.value }))
                    }
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </div>

              <UrgentToggle
                checked={pendingForm.urgent}
                label="Mark as Urgent"
                subLabel="Flags this delivery for priority handling"
                onChange={() => setPendingForm((f) => ({ ...f, urgent: !f.urgent }))}
              />
            </>
          )}

          {/* ── Active-specific ── */}
          {selected.kind === "active" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="detail-status" className={labelClass}>
                  Status
                </label>
                <select
                  id="detail-status"
                  value={activeForm.status}
                  onChange={(e) =>
                    setActiveForm((f) => ({
                      ...f,
                      status: e.target.value as ActiveStatus,
                    }))
                  }
                  className={inputClass}
                  style={inputStyle}
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="detail-arrival" className={labelClass}>
                    Est. Arrival
                  </label>
                  <input
                    id="detail-arrival"
                    type="text"
                    placeholder="e.g. Oct 12 • 14:30"
                    value={activeForm.estArrival}
                    onChange={(e) =>
                      setActiveForm((f) => ({ ...f, estArrival: e.target.value }))
                    }
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="detail-driver" className={labelClass}>
                    Driver
                  </label>
                  <input
                    id="detail-driver"
                    type="text"
                    placeholder="e.g. J. Smith"
                    value={activeForm.driver}
                    onChange={(e) =>
                      setActiveForm((f) => ({ ...f, driver: e.target.value }))
                    }
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </div>

              <UrgentToggle
                checked={activeForm.arrivalUrgent}
                label="Mark Arrival as Urgent"
                subLabel="Highlights the arrival time in red on the list"
                onChange={() =>
                  setActiveForm((f) => ({ ...f, arrivalUrgent: !f.arrivalUrgent }))
                }
              />
            </>
          )}

          {/* Footer */}
          {confirmDelete ? (
            <div
              className="flex flex-col gap-3 rounded-lg px-4 py-4"
              style={{ background: "rgba(185,16,11,0.06)", border: "1px solid #B9100B" }}
            >
              <p className="text-[13px] font-semibold text-[#B9100B]">
                Delete this delivery? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex h-9 flex-1 items-center justify-center rounded-lg text-[13px] font-medium text-[#5C403B] transition-colors hover:bg-[rgba(185,16,11,0.06)]"
                  style={{ border: "1px solid #E5BDB7", background: "#FBF8FF" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex h-9 flex-1 items-center justify-center rounded-lg bg-[#B9100B] text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-between gap-3"
              style={{ borderTop: "1px solid #E5BDB7", paddingTop: "16px" }}
            >
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex h-10 items-center rounded-lg px-4 text-[13px] font-semibold text-[#B9100B] transition-colors hover:bg-[rgba(185,16,11,0.06)]"
                style={{ border: "1px solid #B9100B" }}
              >
                Delete Delivery
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 items-center rounded-lg px-5 text-[13px] font-medium text-[#5C403B] transition-colors hover:bg-[rgba(185,16,11,0.06)]"
                  style={{ border: "1px solid #E5BDB7", background: "#FBF8FF" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex h-10 items-center rounded-lg bg-[#B9100B] px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── New Delivery Modal ───────────────────────────────────────────────────────

interface NewDeliveryForm {
  title: string;
  description: string;
  date: string;
  time: string;
  urgent: boolean;
}

function NewDeliveryModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (form: NewDeliveryForm) => void;
}) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<NewDeliveryForm>({
    title: "",
    description: "",
    date: "",
    time: "",
    urgent: false,
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit(form);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="relative w-[480px] rounded-2xl bg-white shadow-xl"
        style={{ border: "1px solid #E5BDB7" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between rounded-t-2xl px-6 py-5"
          style={{ borderBottom: "1px solid #E5BDB7", background: "#F5F2FC" }}
        >
          <h2 className="text-[20px] font-semibold leading-7 text-[#1B1B22]">New Delivery</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full text-[#5C403B] transition-colors hover:bg-[rgba(185,16,11,0.08)] hover:text-[#B9100B]"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-6">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="delivery-title"
              className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]"
            >
              Delivery Title
            </label>
            <input
              id="delivery-title"
              type="text"
              required
              placeholder="e.g. Emergency Medical Supplies – St Vincents"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="h-10 w-full rounded-lg px-3 text-[13px] text-[#1B1B22] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#11183C]"
              style={{ background: "#FBF8FF", border: "1px solid #E5BDB7" }}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="delivery-description"
              className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]"
            >
              Item Descriptions
            </label>
            <textarea
              id="delivery-description"
              rows={4}
              placeholder="List items included in this delivery…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full resize-none rounded-lg px-3 py-2.5 text-[13px] leading-[1.6] text-[#1B1B22] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#11183C]"
              style={{ background: "#FBF8FF", border: "1px solid #E5BDB7" }}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="delivery-date"
                className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]"
              >
                Delivery Date
              </label>
              <input
                id="delivery-date"
                type="date"
                required
                min={today}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="h-10 w-full rounded-lg px-3 text-[13px] text-[#1B1B22] focus:outline-none focus:ring-2 focus:ring-[#11183C]"
                style={{ background: "#FBF8FF", border: "1px solid #E5BDB7" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="delivery-time"
                className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]"
              >
                Time
              </label>
              <input
                id="delivery-time"
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="h-10 w-full rounded-lg px-3 text-[13px] text-[#1B1B22] focus:outline-none focus:ring-2 focus:ring-[#11183C]"
                style={{ background: "#FBF8FF", border: "1px solid #E5BDB7" }}
              />
            </div>
          </div>

          {/* Urgent */}
          <UrgentToggle
            checked={form.urgent}
            label="Mark as Urgent"
            subLabel="Flags this delivery for priority handling"
            onChange={() => setForm((f) => ({ ...f, urgent: !f.urgent }))}
          />

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3"
            style={{ borderTop: "1px solid #E5BDB7", paddingTop: "16px" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 items-center rounded-lg px-5 text-[13px] font-medium text-[#5C403B] transition-colors hover:bg-[rgba(185,16,11,0.06)]"
              style={{ border: "1px solid #E5BDB7", background: "#FBF8FF" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex h-10 items-center gap-2 rounded-lg bg-[#B9100B] px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <PlusIcon />
              Create Delivery
            </button>
          </div>
        </form>
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
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>(INITIAL_ACTIVE);
  const [pendingDeliveries, setPendingDeliveries] = useState<PendingDelivery[]>(INITIAL_PENDING);
  const [selectedDelivery, setSelectedDelivery] = useState<SelectedDelivery | null>(null);
  const nextId = useRef(1032);

  function handleCreateDelivery(form: NewDeliveryForm) {
    const id = `#MP-${nextId.current++}`;
    const datePart = form.date
      ? new Date(form.date).toLocaleDateString("en-AU", { day: "2-digit", month: "short" })
      : "";
    const requestedTime =
      datePart && form.time ? `${datePart} • ${form.time}` : datePart || form.time;
    setPendingDeliveries((prev) => [
      {
        id,
        title: form.title,
        description: form.description,
        requestedTime,
        date: form.date,
        time: form.time,
        urgent: form.urgent,
      },
      ...prev,
    ]);
    setPendingOpen(true);
  }

  function handleSaveDelivery(updated: SelectedDelivery) {
    if (updated.kind === "active") {
      setActiveDeliveries((prev) =>
        prev.map((d) => (d.id === updated.data.id ? updated.data : d))
      );
    } else {
      setPendingDeliveries((prev) =>
        prev.map((d) => (d.id === updated.data.id ? updated.data : d))
      );
    }
  }

  function handleDeleteDelivery(id: string) {
    setActiveDeliveries((prev) => prev.filter((d) => d.id !== id));
    setPendingDeliveries((prev) => prev.filter((d) => d.id !== id));
  }

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

        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="flex h-10 items-center gap-2 rounded-sm bg-[#B9100B] px-4 text-[16px] font-normal leading-6 text-white transition-opacity hover:opacity-90"
        >
          <PlusIcon />
          New Delivery
        </button>

        <div className="flex-1" />

        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID or destination..."
            className="h-10 w-64 rounded-sm py-1.5 pl-8 pr-3 text-[12px] font-medium text-[#1B1B22] placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#11183C]"
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
          count={activeDeliveries.length}
          open={activeOpen}
          onToggle={() => setActiveOpen((v) => !v)}
        >
          <ActiveTableHeader />
          {activeDeliveries.map((d, i) => (
            <ActiveRow
              key={d.id}
              delivery={d}
              isFirst={i === 0}
              onClick={() => setSelectedDelivery({ kind: "active", data: d })}
            />
          ))}
        </AccordionSection>

        {/* ── Pending Driver Assignment ── */}
        <AccordionSection
          title="Pending Driver Assignment"
          dotColor="bg-[#B9100B]"
          countBg="bg-[rgba(185,16,11,0.1)]"
          countText="text-[#B9100B]"
          count={pendingDeliveries.length}
          open={pendingOpen}
          onToggle={() => setPendingOpen((v) => !v)}
        >
          <PendingTableHeader />
          {pendingDeliveries.map((d, i) => (
            <PendingRow
              key={d.id}
              delivery={d}
              isFirst={i === 0}
              onClick={() => setSelectedDelivery({ kind: "pending", data: d })}
            />
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

      {/* New Delivery Modal */}
      {showNewModal && (
        <NewDeliveryModal
          onClose={() => setShowNewModal(false)}
          onSubmit={handleCreateDelivery}
        />
      )}

      {/* Delivery Detail / Edit Modal */}
      {selectedDelivery && (
        <DeliveryDetailModal
          selected={selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          onSave={handleSaveDelivery}
          onDelete={handleDeleteDelivery}
        />
      )}
    </div>
  );
}
