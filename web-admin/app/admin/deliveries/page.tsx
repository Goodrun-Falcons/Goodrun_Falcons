"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { TAG_OPTIONS, tagLabel, type Tag } from "@/lib/tags";
import { geocodeAddress } from "@/lib/geocode";

// ─── DB types ─────────────────────────────────────────────────────────────────

type DbStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "accepted"
  | "in_transit"
  | "delivered";

type Urgency = "low" | "medium" | "high";

interface RequestItem {
  item_type: string;
  quantity: number;
}

interface PickupVolunteer {
  full_name: string | null;
}

interface Pickup {
  volunteers: PickupVolunteer | null;
}

interface Request {
  id: string;
  status: DbStatus;
  tag: Tag | null;
  description: string | null;
  urgency: Urgency;
  created_at: string;
  created_by_admin: boolean;
  organisations: { name: string } | null;
  request_items: RequestItem[];
  pickups: Pickup[];
}

interface OrgOption {
  id: string;
  name: string;
}

interface Volunteer {
  id: string;
  full_name: string | null;
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

function shortId(uuid: string): string {
  return `#${uuid.slice(0, 8).toUpperCase()}`;
}

function requestTitle(req: Request): string {
  const items = req.request_items.map((i) => i.item_type).join(", ");
  const org = req.organisations?.name ?? "Unknown Org";
  return items ? `${items} — ${org}` : org;
}

function nameInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function driverForRequest(req: Request): string | null {
  return req.pickups?.[0]?.volunteers?.full_name ?? null;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path d="M5.5 1v9M1 5.5h9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="#5C403B" strokeWidth="1.3" />
      <path d="M10 10l3 3" stroke="#5C403B" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }: Readonly<{ open: boolean }>) {
  return (
    <svg
      width="12"
      height="8"
      viewBox="0 0 12 8"
      fill="none"
      aria-hidden="true"
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
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
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

const STATUS_CONFIG: Record<DbStatus, { dot: string; bg: string; text: string; label: string }> = {
  pending: {
    dot: "bg-[#B9100B]",
    bg: "bg-[rgba(185,16,11,0.1)]",
    text: "text-[#B9100B]",
    label: "Pending Review",
  },
  approved: {
    dot: "bg-[#B9100B]",
    bg: "bg-[rgba(185,16,11,0.1)]",
    text: "text-[#B9100B]",
    label: "Unassigned",
  },
  rejected: {
    dot: "bg-[#B9100B]",
    bg: "bg-[rgba(185,16,11,0.1)]",
    text: "text-[#B9100B]",
    label: "Rejected",
  },
  accepted: {
    dot: "bg-[#11183C]",
    bg: "bg-[rgba(17,24,60,0.1)]",
    text: "text-[#11183C]",
    label: "Accepted",
  },
  in_transit: {
    dot: "bg-[#11183C]",
    bg: "bg-[rgba(17,24,60,0.1)]",
    text: "text-[#11183C]",
    label: "In Transit",
  },
  delivered: {
    dot: "bg-[#2E7D32]",
    bg: "bg-[rgba(46,125,50,0.1)]",
    text: "text-[#2E7D32]",
    label: "Completed",
  },
};

function StatusBadge({ status }: Readonly<{ status: DbStatus }>) {
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
      <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#B9100B]">Urgent</span>
    </span>
  );
}

function TagBadge({ tag }: Readonly<{ tag: Tag }>) {
  const label = tagLabel(tag);
  return (
    <span className="inline-flex rounded-sm bg-[rgba(17,24,60,0.07)] px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.03em] text-[#11183C]">
      {label}
    </span>
  );
}

function CountBadge({ count, bg, textColor }: Readonly<{ count: number; bg: string; textColor: string }>) {
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
}: Readonly<{
  title: string;
  dotColor: string;
  countBg: string;
  countText: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}>) {
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

const TH = "text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]";
const THEAD_BASE = "grid gap-4 px-3 py-3";
const THEAD_STYLE = { background: "#F8F9FA", borderBottom: "1px solid #E5BDB7" };

function ActiveTableHeader() {
  return (
    <div className={`${THEAD_BASE} grid-cols-12`} style={THEAD_STYLE}>
      <div className={`col-span-2 ${TH}`}>Delivery ID</div>
      <div className={`col-span-2 ${TH}`}>Status</div>
      <div className={`col-span-4 ${TH}`}>Title / Destination</div>
      <div className={`col-span-2 ${TH}`}>Created</div>
      <div className={`col-span-2 ${TH}`}>Driver</div>
    </div>
  );
}

function ApprovedTableHeader() {
  return (
    <div className={`${THEAD_BASE} grid-cols-12`} style={THEAD_STYLE}>
      <div className={`col-span-2 ${TH}`}>Delivery ID</div>
      <div className={`col-span-2 ${TH}`}>Status</div>
      <div className={`col-span-4 ${TH}`}>Title / Destination</div>
      <div className={`col-span-2 ${TH}`}>Requested</div>
      <div className={`col-span-2 ${TH}`}>Action</div>
    </div>
  );
}

function PendingReviewTableHeader() {
  return (
    <div className={`${THEAD_BASE} grid-cols-12`} style={THEAD_STYLE}>
      <div className={`col-span-2 ${TH}`}>Delivery ID</div>
      <div className={`col-span-2 ${TH}`}>Status</div>
      <div className={`col-span-3 ${TH}`}>Title / Destination</div>
      <div className={`col-span-1 ${TH}`}>Tag</div>
      <div className={`col-span-2 ${TH}`}>Submitted</div>
      <div className={`col-span-2 ${TH}`}>Actions</div>
    </div>
  );
}

// ─── Row Components ───────────────────────────────────────────────────────────

const ROW_BASE = "grid grid-cols-12 items-center gap-4 px-3 py-3 bg-white";

function ActiveRow({
  req,
  isFirst,
  onClick,
}: Readonly<{
  req: Request;
  isFirst: boolean;
  onClick: () => void;
}>) {
  const driver = driverForRequest(req);
  const driverInits = driver ? nameInitials(driver) : "?";
  const isUrgent = req.urgency === "high";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${ROW_BASE} w-full cursor-pointer text-left transition-colors hover:bg-[rgba(17,24,60,0.03)]`}
      style={{ borderTop: isFirst ? undefined : "1px solid #E5BDB7" }}
    >
      {/* ID */}
      <div className="col-span-2 text-[12px] font-bold leading-4 text-[#1B1B22]">
        {shortId(req.id)}
      </div>
      {/* Status */}
      <div className="col-span-2 flex flex-col gap-1">
        <StatusBadge status={req.status} />
        {isUrgent && <UrgentBadge />}
      </div>
      {/* Title + Tag */}
      <div className="col-span-4 flex flex-col gap-0.5 overflow-hidden">
        <span className="truncate text-[13px] leading-[18px] text-[#1B1B22]">{requestTitle(req)}</span>
        {req.tag && <TagBadge tag={req.tag} />}
      </div>
      {/* Created */}
      <div className="col-span-2 text-[13px] leading-[18px] text-[#5C403B]">
        {formatDate(req.created_at)}
      </div>
      {/* Driver */}
      <div className="col-span-2 flex items-center gap-2">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#E5BDB7] bg-[#BEC4F1] text-[10px] font-semibold text-[#11183C]">
          {driverInits}
        </div>
        <span className="truncate text-[12px] font-medium leading-4 text-[#1B1B22]">
          {driver ?? "Unassigned"}
        </span>
      </div>
    </button>
  );
}

function ApprovedRow({
  req,
  isFirst,
  onClick,
  onAssign,
}: Readonly<{
  req: Request;
  isFirst: boolean;
  onClick: () => void;
  onAssign: () => void;
}>) {
  const isUrgent = req.urgency === "high";

  return (
    <div
      className={`${ROW_BASE} relative`}
      style={{
        borderTop: isFirst ? undefined : "1px solid #E5BDB7",
        borderLeft: isUrgent ? "2px solid #B9100B" : undefined,
      }}
    >
      {/* Full-row click overlay — semantic button behind the content */}
      <button
        type="button"
        className="absolute inset-0 cursor-pointer transition-colors hover:bg-[rgba(185,16,11,0.02)]"
        aria-label={`View delivery details for ${shortId(req.id)}`}
        onClick={onClick}
      />
      {/* ID */}
      <div className="relative z-10 col-span-2 text-[12px] font-bold leading-4 text-[#1B1B22]">
        {shortId(req.id)}
      </div>
      {/* Status */}
      <div className="relative z-10 col-span-2 flex flex-col gap-1">
        <StatusBadge status={req.status} />
        {isUrgent && <UrgentBadge />}
      </div>
      {/* Title + Tag */}
      <div className="relative z-10 col-span-4 flex flex-col gap-0.5 overflow-hidden">
        <span className="truncate text-[13px] leading-[18px] text-[#1B1B22]">{requestTitle(req)}</span>
        {req.tag && <TagBadge tag={req.tag} />}
      </div>
      {/* Requested */}
      <div className="relative z-10 col-span-2 text-[13px] leading-[18px] text-[#5C403B]">
        {formatDate(req.created_at)}
      </div>
      {/* Action — z-10 sits above the overlay button */}
      <div className="relative z-10 col-span-2 flex items-center">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAssign(); }}
          className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#8F0002] transition-opacity hover:opacity-70"
        >
          Assign Driver
        </button>
      </div>
    </div>
  );
}

function PendingReviewRow({
  req,
  isFirst,
  onClick,
  onApprove,
  onReject,
}: Readonly<{
  req: Request;
  isFirst: boolean;
  onClick: () => void;
  onApprove: () => void;
  onReject: () => void;
}>) {
  const isUrgent = req.urgency === "high";

  return (
    <div
      className={`${ROW_BASE} relative`}
      style={{
        borderTop: isFirst ? undefined : "1px solid #E5BDB7",
        borderLeft: isUrgent ? "2px solid #B9100B" : undefined,
      }}
    >
      {/* Full-row click overlay — semantic button behind the content */}
      <button
        type="button"
        className="absolute inset-0 cursor-pointer transition-colors hover:bg-[rgba(185,16,11,0.02)]"
        aria-label={`View delivery details for ${shortId(req.id)}`}
        onClick={onClick}
      />
      {/* ID */}
      <div className="relative z-10 col-span-2 text-[12px] font-bold leading-4 text-[#1B1B22]">
        {shortId(req.id)}
      </div>
      {/* Status */}
      <div className="relative z-10 col-span-2 flex flex-col gap-1">
        <StatusBadge status={req.status} />
        {isUrgent && <UrgentBadge />}
      </div>
      {/* Title */}
      <div className="relative z-10 col-span-3 overflow-hidden">
        <span className="block truncate text-[13px] leading-[18px] text-[#1B1B22]">{requestTitle(req)}</span>
      </div>
      {/* Tag */}
      <div className="relative z-10 col-span-1">
        {req.tag ? <TagBadge tag={req.tag} /> : <span className="text-[11px] text-[#9CA3AF]">—</span>}
      </div>
      {/* Submitted */}
      <div className="relative z-10 col-span-2 text-[13px] leading-[18px] text-[#5C403B]">
        {formatDate(req.created_at)}
      </div>
      {/* Actions — z-10 sits above the overlay button */}
      <div className="relative z-10 col-span-2 flex items-center gap-2">
        <button
          type="button"
          onClick={onApprove}
          className="flex h-7 items-center rounded-[2px] bg-[#2E7D32] px-2.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-80"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={onReject}
          className="flex h-7 items-center rounded-[2px] bg-[#B9100B] px-2.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-80"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

// ─── Urgent Toggle (shared by both modals) ────────────────────────────────────

function UrgentToggle({
  checked,
  label,
  subLabel,
  onChange,
}: Readonly<{
  checked: boolean;
  label: string;
  subLabel: string;
  onChange: () => void;
}>) {
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

// ─── Delivery Detail Modal ─────────────────────────────────────────────────────

function DeliveryDetailModal({
  req,
  onClose,
  onApprove,
  onReject,
  onTagChange,
}: Readonly<{
  req: Request;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onTagChange: (id: string, tag: Tag | null) => Promise<void>;
}>) {
  const [localTag, setLocalTag] = useState<Tag | null>(req.tag);
  const [tagDirty, setTagDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const driver = driverForRequest(req);
  const isPending = req.status === "pending";
  const canEditTag = req.status === "pending" || req.status === "approved";
  const labelClass = "text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]";
  const inputStyle: React.CSSProperties = { background: "#FBF8FF", border: "1px solid #E5BDB7" };

  async function handleApprove() {
    setSaving(true);
    await onApprove(req.id);
    setSaving(false);
    onClose();
  }

  async function handleReject() {
    setSaving(true);
    await onReject(req.id);
    setSaving(false);
    onClose();
  }

  async function handleSaveTag() {
    setSaving(true);
    await onTagChange(req.id, localTag);
    setTagDirty(false);
    setSaving(false);
    onClose();
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      {/* Backdrop — close on click */}
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[90vh] w-[520px] flex-col rounded-2xl bg-white shadow-xl"
        style={{ border: "1px solid #E5BDB7" }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-start justify-between rounded-t-2xl px-6 py-5"
          style={{ borderBottom: "1px solid #E5BDB7", background: "#F5F2FC" }}
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]">
              {shortId(req.id)}
            </span>
            <h2 className="text-[18px] font-semibold leading-6 text-[#1B1B22]">Delivery Details</h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={req.status} />
              {req.urgency === "high" && <UrgentBadge />}
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

        {/* Scrollable body */}
        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-6">
          {/* Org */}
          <div className="flex flex-col gap-1">
            <span className={labelClass}>Organisation</span>
            <span className="text-[14px] text-[#1B1B22]">{req.organisations?.name ?? "—"}</span>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Items Requested</span>
            {req.request_items.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {req.request_items.map((item, i) => (
                  <li
                    key={`${item.item_type}-${i}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: "#F5F2FC", border: "1px solid #E5BDB7" }}
                  >
                    <span className="text-[13px] text-[#1B1B22]">{item.item_type}</span>
                    <span className="text-[12px] font-semibold text-[#5C403B]">×{item.quantity}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-[13px] text-[#9CA3AF]">No items recorded.</span>
            )}
          </div>

          {/* Description */}
          {req.description && (
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Description</span>
              <p className="text-[13px] leading-relaxed text-[#1B1B22]">{req.description}</p>
            </div>
          )}

          {/* Driver (active deliveries) */}
          {(req.status === "accepted" || req.status === "in_transit") && (
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Assigned Driver</span>
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#E5BDB7] bg-[#BEC4F1] text-[10px] font-semibold text-[#11183C]">
                  {nameInitials(driver)}
                </div>
                <span className="text-[13px] text-[#1B1B22]">{driver ?? "Unassigned"}</span>
              </div>
            </div>
          )}

          {/* Tag */}
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Tag</span>
            {canEditTag ? (
              <select
                value={localTag ?? ""}
                onChange={(e) => {
                  setLocalTag((e.target.value as Tag) || null);
                  setTagDirty(true);
                }}
                className="h-10 w-full rounded-lg px-3 text-[13px] text-[#1B1B22] focus:outline-none focus:ring-2 focus:ring-[#11183C]"
                style={inputStyle}
              >
                <option value="">— No tag —</option>
                {TAG_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <span className="text-[13px] text-[#1B1B22]">{req.tag ? tagLabel(req.tag) : "—"}</span>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3"
            style={{ borderTop: "1px solid #E5BDB7", paddingTop: "16px" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 items-center rounded-lg px-5 text-[13px] font-medium text-[#5C403B] hover:bg-[rgba(185,16,11,0.06)]"
              style={{ border: "1px solid #E5BDB7", background: "#FBF8FF" }}
            >
              Close
            </button>

            {tagDirty && (
              <button
                type="button"
                onClick={handleSaveTag}
                disabled={saving}
                className="flex h-10 items-center rounded-lg bg-[#11183C] px-5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Tag"}
              </button>
            )}

            {isPending && (
              <>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={saving}
                  className="flex h-10 items-center rounded-lg bg-[#B9100B] px-5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={saving}
                  className="flex h-10 items-center rounded-lg bg-[#2E7D32] px-5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  Approve
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Delivery Modal ───────────────────────────────────────────────────────

interface NewDeliveryForm {
  orgId: string;
  title: string;
  description: string;
  pickupAddress: string;
  urgent: boolean;
}

function NewDeliveryModal({
  orgs,
  onClose,
  onSubmit,
}: Readonly<{
  orgs: OrgOption[];
  onClose: () => void;
  onSubmit: (form: NewDeliveryForm) => Promise<void>;
}>) {
  const [form, setForm] = useState<NewDeliveryForm>({
    orgId: orgs[0]?.id ?? "",
    title: "",
    description: "",
    pickupAddress: "",
    urgent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "h-10 w-full rounded-lg px-3 text-[13px] text-[#1B1B22] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#11183C]";
  const inputStyle: React.CSSProperties = { background: "#FBF8FF", border: "1px solid #E5BDB7" };
  const labelClass = "text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]";

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      {/* Backdrop — close on click */}
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-[480px] rounded-2xl bg-white shadow-xl"
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
            className="flex size-7 items-center justify-center rounded-full text-[#5C403B] hover:bg-[rgba(185,16,11,0.08)] hover:text-[#B9100B]"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5 px-6 py-6">
          {/* Organisation */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-org" className={labelClass}>Organisation</label>
            <select
              id="new-org"
              required
              value={form.orgId}
              onChange={(e) => setForm((f) => ({ ...f, orgId: e.target.value }))}
              className={inputClass}
              style={inputStyle}
            >
              <option value="">Select an organisation…</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* Title / Item */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-title" className={labelClass}>Delivery Item</label>
            <input
              id="new-title"
              type="text"
              required
              placeholder="e.g. Emergency Medical Supplies"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-description" className={labelClass}>Description</label>
            <textarea
              id="new-description"
              rows={3}
              placeholder="Additional notes about this delivery…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full resize-none rounded-lg px-3 py-2.5 text-[13px] leading-[1.6] text-[#1B1B22] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#11183C]"
              style={inputStyle}
            />
          </div>

          {/* Pickup address */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-address" className={labelClass}>Pickup Address</label>
            <input
              id="new-address"
              type="text"
              required
              placeholder="e.g. 123 George St, Sydney NSW 2000"
              value={form.pickupAddress}
              onChange={(e) => setForm((f) => ({ ...f, pickupAddress: e.target.value }))}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Urgent */}
          <UrgentToggle
            checked={form.urgent}
            label="Mark as Urgent"
            subLabel="Sets urgency to High — flags this delivery for priority handling"
            onChange={() => setForm((f) => ({ ...f, urgent: !f.urgent }))}
          />

          {error && (
            <p className="rounded-lg bg-[rgba(185,16,11,0.08)] px-4 py-3 text-[13px] text-[#B9100B]">
              {error}
            </p>
          )}

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3"
            style={{ borderTop: "1px solid #E5BDB7", paddingTop: "16px" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 items-center rounded-lg px-5 text-[13px] font-medium text-[#5C403B] hover:bg-[rgba(185,16,11,0.06)]"
              style={{ border: "1px solid #E5BDB7", background: "#FBF8FF" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#B9100B] px-5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              <PlusIcon />
              {submitting ? "Creating…" : "Create Delivery"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Assign Driver Modal ──────────────────────────────────────────────────────

function AssignDriverModal({
  req,
  volunteers,
  onClose,
  onAssign,
}: Readonly<{
  req: Request;
  volunteers: Volunteer[];
  onClose: () => void;
  onAssign: (requestId: string, volunteerId: string) => Promise<void>;
}>) {
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(volunteers[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = { background: "#FBF8FF", border: "1px solid #E5BDB7" };
  const labelClass = "text-[12px] font-bold uppercase tracking-[0.05em] text-[#5C403B]";

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!selectedVolunteerId) return;
    setError(null);
    setSubmitting(true);
    try {
      await onAssign(req.id, selectedVolunteerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-[440px] rounded-2xl bg-white shadow-xl"
        style={{ border: "1px solid #E5BDB7" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between rounded-t-2xl px-6 py-5"
          style={{ borderBottom: "1px solid #E5BDB7", background: "#F5F2FC" }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5C403B]">
              {shortId(req.id)}
            </span>
            <h2 className="text-[18px] font-semibold leading-6 text-[#1B1B22]">Assign Driver</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full text-[#5C403B] hover:bg-[rgba(185,16,11,0.08)] hover:text-[#B9100B]"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5 px-6 py-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="assign-volunteer" className={labelClass}>Select Volunteer</label>
            {volunteers.length === 0 ? (
              <p className="rounded-lg px-3 py-2.5 text-[13px] text-[#9CA3AF]" style={inputStyle}>
                No active volunteers available.
              </p>
            ) : (
              <select
                id="assign-volunteer"
                required
                value={selectedVolunteerId}
                onChange={(e) => setSelectedVolunteerId(e.target.value)}
                className="h-10 w-full rounded-lg px-3 text-[13px] text-[#1B1B22] focus:outline-none focus:ring-2 focus:ring-[#11183C]"
                style={inputStyle}
              >
                {volunteers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.full_name ?? "Unnamed Volunteer"}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-[rgba(185,16,11,0.08)] px-4 py-3 text-[13px] text-[#B9100B]">
              {error}
            </p>
          )}

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3"
            style={{ borderTop: "1px solid #E5BDB7", paddingTop: "16px" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 items-center rounded-lg px-5 text-[13px] font-medium text-[#5C403B] hover:bg-[rgba(185,16,11,0.06)]"
              style={{ border: "1px solid #E5BDB7", background: "#FBF8FF" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || volunteers.length === 0}
              className="flex h-10 items-center rounded-lg bg-[#B9100B] px-5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Assigning…" : "Confirm Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ label }: Readonly<{ label: string }>) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <circle cx="18" cy="18" r="17" stroke="#e5bdb7" strokeWidth="1.4" />
        <path d="M18 12v6M18 21v2" stroke="#b9100b" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p className="text-[13px] font-medium text-[#5C403B]">{label}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DeliveriesPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<Request | null>(null);
  const [assigningReq, setAssigningReq] = useState<Request | null>(null);

  const [pendingOpen, setPendingOpen] = useState(true);
  const [approvedOpen, setApprovedOpen] = useState(true);
  const [activeOpen, setActiveOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);

  // Capture admin's auth UID once on mount (needed for pickups.assigned_by)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setAdminId(user.id);
    });
  }, []);

  const load = useCallback(async () => {
    const [{ data: reqData }, { data: orgData }, { data: volData }] = await Promise.all([
      supabase
        .from("requests")
        .select(
          `id, status, tag, description, urgency, created_at, created_by_admin,
           organisations(name),
           request_items(item_type, quantity),
           pickups(volunteers(full_name))`
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("organisations")
        .select("id, name")
        .eq("active", true)
        .order("name"),
      supabase
        .from("volunteers")
        .select("id, full_name")
        .eq("status", "active")
        .order("full_name"),
    ]);

    if (reqData) setRequests(reqData as unknown as Request[]);
    if (orgData) setOrgs(orgData as OrgOption[]);
    if (volData) setVolunteers(volData as Volunteer[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleApprove(id: string) {
    const { error } = await supabase.from("requests").update({ status: "approved" }).eq("id", id);
    if (error) { alert("Failed to approve: " + error.message); return; }
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)));
  }

  async function handleReject(id: string) {
    const { error } = await supabase.from("requests").update({ status: "rejected" }).eq("id", id);
    if (error) { alert("Failed to reject: " + error.message); return; }
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)));
  }

  async function handleTagChange(id: string, tag: Tag | null) {
    const { error } = await supabase.from("requests").update({ tag }).eq("id", id);
    if (error) { alert("Failed to update tag: " + error.message); return; }
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, tag } : r)));
  }

  async function handleAssignDriver(requestId: string, volunteerId: string) {
    const { error: pickupErr } = await supabase.from("pickups").insert({
      request_id: requestId,
      volunteer_id: volunteerId,
      assigned_by: adminId,
      status: "assigned",
    });
    if (pickupErr) { alert("Failed to create pickup: " + pickupErr.message); return; }

    const { error: reqErr } = await supabase
      .from("requests")
      .update({ status: "accepted" })
      .eq("id", requestId);
    if (reqErr) { alert("Failed to update request status: " + reqErr.message); return; }

    setAssigningReq(null);
    await load();
  }

  async function handleCreateDelivery(form: NewDeliveryForm) {
    // Geocode the pickup address
    const coords = await geocodeAddress(form.pickupAddress);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in.");

    const { data: newRequest, error: reqErr } = await supabase
      .from("requests")
      .insert({
        organisation_id: form.orgId,
        description: form.description || null,
        urgency: form.urgent ? "high" : "medium",
        status: "pending",
        created_by_admin: true,
        pickup_location: `POINT(${coords.lng} ${coords.lat})`,
      })
      .select()
      .single();

    if (reqErr || !newRequest) {
      throw new Error(reqErr?.message ?? "Failed to create delivery.");
    }

    const { error: itemErr } = await supabase.from("request_items").insert({
      request_id: newRequest.id,
      item_type: form.title,
      quantity: 1,
    });

    if (itemErr) {
      await supabase.from("requests").delete().eq("id", newRequest.id);
      throw new Error(itemErr.message);
    }

    await load();
  }

  const searchLower = search.toLowerCase();

  function filterReqs(list: Request[]) {
    if (!searchLower) return list;
    return list.filter(
      (r) =>
        shortId(r.id).toLowerCase().includes(searchLower) ||
        requestTitle(r).toLowerCase().includes(searchLower) ||
        (r.tag && tagLabel(r.tag)?.toLowerCase().includes(searchLower))
    );
  }

  const pendingReqs = filterReqs(requests.filter((r) => r.status === "pending"));
  const approvedReqs = filterReqs(requests.filter((r) => r.status === "approved"));
  const activeReqs = filterReqs(
    requests.filter((r) => r.status === "accepted" || r.status === "in_transit")
  );
  const completedReqs = filterReqs(requests.filter((r) => r.status === "delivered"));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-[14px] text-[#5C403B]">Loading deliveries…</span>
      </div>
    );
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
            placeholder="Search ID, org or tag…"
            className="h-10 w-64 rounded-sm py-1.5 pl-8 pr-3 text-[12px] font-medium text-[#1B1B22] placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#11183C]"
            style={{ background: "#FBF8FF", border: "1px solid #E5BDB7" }}
          />
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center">
            <SearchIcon />
          </span>
        </div>

        <button
          type="button"
          onClick={load}
          className="flex h-10 items-center justify-center rounded-sm px-4 text-[12px] font-medium text-[#1B1B22] hover:bg-[rgba(17,24,60,0.05)]"
          style={{ border: "1px solid #E5BDB7", background: "#FBF8FF" }}
        >
          Refresh
        </button>
      </div>

      {/* Accordion sections */}
      <div className="flex flex-col gap-4">

        {/* ── Pending Review ── */}
        <AccordionSection
          title="Pending Review"
          dotColor="bg-[#B9100B]"
          countBg="bg-[rgba(185,16,11,0.1)]"
          countText="text-[#B9100B]"
          count={pendingReqs.length}
          open={pendingOpen}
          onToggle={() => setPendingOpen((v) => !v)}
        >
          <PendingReviewTableHeader />
          {pendingReqs.length === 0 ? (
            <EmptyState label="No requests pending review" />
          ) : (
            pendingReqs.map((r, i) => (
              <PendingReviewRow
                key={r.id}
                req={r}
                isFirst={i === 0}
                onClick={() => setSelectedReq(r)}
                onApprove={() => void handleApprove(r.id)}
                onReject={() => void handleReject(r.id)}
              />
            ))
          )}
        </AccordionSection>

        {/* ── Pending Driver Assignment (approved, no driver yet) ── */}
        <AccordionSection
          title="Pending Driver Assignment"
          dotColor="bg-[#B9100B]"
          countBg="bg-[rgba(185,16,11,0.1)]"
          countText="text-[#B9100B]"
          count={approvedReqs.length}
          open={approvedOpen}
          onToggle={() => setApprovedOpen((v) => !v)}
        >
          <ApprovedTableHeader />
          {approvedReqs.length === 0 ? (
            <EmptyState label="No approved deliveries awaiting a driver" />
          ) : (
            approvedReqs.map((r, i) => (
              <ApprovedRow
                key={r.id}
                req={r}
                isFirst={i === 0}
                onClick={() => setSelectedReq(r)}
                onAssign={() => setAssigningReq(r)}
              />
            ))
          )}
        </AccordionSection>

        {/* ── Active (In Transit) ── */}
        <AccordionSection
          title="Active (In Transit)"
          dotColor="bg-[#11183C]"
          countBg="bg-[rgba(17,24,60,0.1)]"
          countText="text-[#11183C]"
          count={activeReqs.length}
          open={activeOpen}
          onToggle={() => setActiveOpen((v) => !v)}
        >
          <ActiveTableHeader />
          {activeReqs.length === 0 ? (
            <EmptyState label="No active deliveries in transit" />
          ) : (
            activeReqs.map((r, i) => (
              <ActiveRow
                key={r.id}
                req={r}
                isFirst={i === 0}
                onClick={() => setSelectedReq(r)}
              />
            ))
          )}
        </AccordionSection>

        {/* ── Completed ── */}
        <AccordionSection
          title="Completed"
          dotColor="bg-[#2E7D32]"
          countBg="bg-[rgba(46,125,50,0.1)]"
          countText="text-[#2E7D32]"
          count={completedReqs.length}
          open={completedOpen}
          onToggle={() => setCompletedOpen((v) => !v)}
        >
          <ActiveTableHeader />
          {completedReqs.length === 0 ? (
            <EmptyState label="No completed deliveries" />
          ) : (
            completedReqs.map((r, i) => (
              <ActiveRow
                key={r.id}
                req={r}
                isFirst={i === 0}
                onClick={() => setSelectedReq(r)}
              />
            ))
          )}
        </AccordionSection>

      </div>

      {/* New Delivery Modal */}
      {showNewModal && (
        <NewDeliveryModal
          orgs={orgs}
          onClose={() => setShowNewModal(false)}
          onSubmit={handleCreateDelivery}
        />
      )}

      {/* Detail Modal */}
      {selectedReq && (
        <DeliveryDetailModal
          req={selectedReq}
          onClose={() => setSelectedReq(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onTagChange={handleTagChange}
        />
      )}

      {/* Assign Driver Modal */}
      {assigningReq && (
        <AssignDriverModal
          req={assigningReq}
          volunteers={volunteers}
          onClose={() => setAssigningReq(null)}
          onAssign={handleAssignDriver}
        />
      )}
    </div>
  );
}
