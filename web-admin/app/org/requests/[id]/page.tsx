"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "../../../../../supabase/types";
import { LiveTrackingMap } from "@/components/org/LiveTrackingMap";
import { requestLabel, type RequestItem } from "@/lib/requestItems";
import { tagLabel } from "@/lib/tags";
import { HandoverProof } from "@/components/HandoverProof";

type Request = Database["public"]["Tables"]["requests"]["Row"] & {
  request_items: RequestItem[];
};
type Route = Database["public"]["Tables"]["routes"]["Row"];

function BackIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
      <path d="M10 6H2M6 2 2 6l4 4" stroke="#46464e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function urgencyBadge(urgency: string) {
  if (urgency === "high") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-[#ffdad6] px-2 py-0.5 text-[11px] uppercase text-[#93000a]">
        <span className="size-1.5 rounded-full bg-[#b9100b]" />
        Urgent
      </span>
    );
  }
  return null;
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "#e7e8e9", text: "#46464e", label: "Pending" },
    approved: { bg: "#e7e8e9", text: "#46464e", label: "Approved" },
    rejected: { bg: "#ffdad6", text: "#93000a", label: "Rejected" },
    cancelled: { bg: "#e7e8e9", text: "#6b7280", label: "Cancelled" },
    accepted: { bg: "#e7e8e9", text: "#46464e", label: "Matched" },
    in_transit: { bg: "#dd3022", text: "#ffffff", label: "In Transit" },
    delivered: { bg: "#d8f6e3", text: "#0f5132", label: "Delivered" },
  };
  const cfg = map[status] ?? map.pending;
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[12px] uppercase"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}

const STEPS = [
  { key: "pending", label: "Submitted" },
  { key: "approved", label: "Approved" },
  { key: "accepted", label: "Matched" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
];

function StatusTimeline({ status }: { status: string }) {
  const currentIndex = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex w-full items-center">
      {STEPS.map((step, i) => {
        const reached = i <= currentIndex;
        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex size-8 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{
                  backgroundColor: reached ? "#11183c" : "#e7e8e9",
                  color: reached ? "#ffffff" : "#6b7280",
                }}
              >
                {i + 1}
              </div>
              <span className="whitespace-nowrap text-[12px] font-medium text-[#46464e]">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="mx-2 h-[2px] flex-1"
                style={{ backgroundColor: i < currentIndex ? "#11183c" : "#e7e8e9" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data, error } = await supabase
        .from("requests")
        .select("*, request_items(*)")
        .eq("id", params.id)
        .eq("organisation_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setRequest(data as Request);
      }
      setLoading(false);
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`request-${params.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "requests", filter: `id=eq.${params.id}` },
        (payload) =>
          setRequest((prev) =>
            prev ? { ...prev, ...(payload.new as Database["public"]["Tables"]["requests"]["Row"]) } : prev
          )
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  useEffect(() => {
    if (!request) return;

    async function loadRoute() {
      const { data } = await supabase
        .from("pickups")
        .select("*, routes(*)")
        .eq("request_id", request!.id)
        .not("route_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setRoute((data?.routes as Route | null) ?? null);
    }
    loadRoute();
  }, [request]);

  useEffect(() => {
    if (!route?.id) return;

    const channel = supabase
      .channel(`route-${route.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "routes", filter: `id=eq.${route.id}` },
        (payload) => setRoute((prev) => (prev ? { ...prev, ...(payload.new as Route) } : prev))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [route?.id]);

  async function handleCancel() {
    if (!window.confirm("Cancel this request? Volunteers will no longer see it.")) return;
    setCancelling(true);
    setActionError(null);
    const { error } = await supabase.rpc("cancel_request", { p_request_id: params.id });
    setCancelling(false);
    if (error) {
      setActionError(error.message);
      return;
    }
    setRequest((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
  }

  if (loading) {
    return <div className="p-6 text-[#46464e]">Loading…</div>;
  }

  if (notFound || !request) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <p className="text-[16px] text-[#46464e]">Request not found.</p>
        <Link href="/org/requests" className="w-fit text-[12px] font-semibold text-[#b9100b]">
          ← Back to My Requests
        </Link>
      </div>
    );
  }

  const isLive = request.status === "in_transit";

  return (
    <div className="flex flex-col gap-6 p-6">
      <Link href="/org/requests" className="flex w-fit items-center gap-2 text-[12px] font-semibold text-[#46464e]">
        <BackIcon />
        Back to My Requests
      </Link>

      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-[32px] font-semibold leading-[40px] tracking-[-0.32px] text-[#191c1d]">
              {requestLabel(request)}
            </h2>
            {urgencyBadge(request.urgency)}
          </div>
          <p className="text-[14px] text-[#6b7280]">
            Request #{request.id.slice(0, 8)} · Submitted {new Date(request.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          {statusBadge(request.status)}
          {(request.status === "pending" || request.status === "approved") && (
            <div className="flex gap-2">
              {request.status === "pending" && (
                <Link
                  href={`/org/requests/${request.id}/edit`}
                  className="rounded-lg border border-[#c7c5cf] px-4 py-2 text-[12px] font-semibold text-[#191c1d]"
                >
                  Edit
                </Link>
              )}
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="rounded-lg border border-[#b9100b] px-4 py-2 text-[12px] font-semibold text-[#b9100b] disabled:opacity-60"
              >
                {cancelling ? "Cancelling…" : "Cancel request"}
              </button>
            </div>
          )}
          {actionError && <p className="text-[12px] text-[#b9100b]">{actionError}</p>}
        </div>
      </div>

      <div className="w-full rounded-lg border border-[#eaecf0] bg-white/95 p-[25px] shadow-sm">
        {request.status === "rejected" ? (
          <p className="text-[14px] text-[#93000a]">
            This request was reviewed and rejected by an admin.
          </p>
        ) : request.status === "cancelled" ? (
          <p className="text-[14px] text-[#46464e]">This request was cancelled.</p>
        ) : (
          <StatusTimeline status={request.status} />
        )}
      </div>

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-lg border border-[#eaecf0] bg-white/95 p-[25px] shadow-sm">
          <h3 className="text-[16px] font-semibold text-[#191c1d]">Request Details</h3>
          <div className="flex flex-col gap-3 text-[14px]">
            <div className="flex flex-col gap-2 border-b border-[#eaecf0] pb-3">
              <span className="text-[#6b7280]">Items</span>
              {request.request_items.map((requestItem, index) => (
                <div key={index} className="flex justify-between">
                  <span className="font-medium text-[#191c1d]">{requestItem.item_type}</span>
                  <span className="font-medium text-[#191c1d]">× {requestItem.quantity}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Urgency</span>
              <span className="font-medium capitalize text-[#191c1d]">{request.urgency}</span>
            </div>
            {tagLabel(request.tag) && (
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Team Tag</span>
                <span className="font-medium text-[#191c1d]">{tagLabel(request.tag)}</span>
              </div>
            )}
            {request.description && (
              <div className="flex flex-col gap-1 border-t border-[#eaecf0] pt-3">
                <span className="text-[#6b7280]">Description</span>
                <span className="font-medium text-[#191c1d]">{request.description}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-[#eaecf0] bg-white/95 p-[25px] shadow-sm">
          <h3 className="text-[16px] font-semibold text-[#191c1d]">Live Tracking</h3>
          {isLive && request.pickup_lat != null && request.pickup_lng != null ? (
            <LiveTrackingMap
              pickup={{ lat: request.pickup_lat, lng: request.pickup_lng }}
              dropoff={
                request.dropoff_lat != null && request.dropoff_lng != null
                  ? { lat: request.dropoff_lat, lng: request.dropoff_lng }
                  : null
              }
              volunteer={
                route?.current_lat != null && route?.current_lng != null
                  ? { lat: route.current_lat, lng: route.current_lng }
                  : null
              }
            />
          ) : isLive ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg bg-[#f3f4f5] p-10 text-center">
              <span className="text-[14px] text-[#6b7280]">Pickup location unavailable for this request.</span>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg bg-[#f3f4f5] p-10 text-center">
              <span className="text-[14px] text-[#6b7280]">
                Tracking will be available once this request is in transit.
              </span>
            </div>
          )}
        </div>
      </div>

      {request.status === "delivered" && <HandoverProof requestId={request.id} />}
    </div>
  );
}
