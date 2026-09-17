"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "../../../../../supabase/types";
import { LiveTrackingMap } from "@/components/org/LiveTrackingMap";

type Item = Database["public"]["Tables"]["items"]["Row"];
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
  const [item, setItem] = useState<Item | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", params.id)
        .eq("organisation_id", user.id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setItem(data);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  useEffect(() => {
    if (!item) return;

    async function loadRoute() {
      const { data } = await supabase
        .from("pickups")
        .select("*, routes(*)")
        .eq("item_id", item!.id)
        .not("route_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setRoute((data?.routes as Route | null) ?? null);
    }
    loadRoute();
  }, [item]);

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

  if (loading) {
    return <div className="p-6 text-[#46464e]">Loading…</div>;
  }

  if (notFound || !item) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <p className="text-[16px] text-[#46464e]">Request not found.</p>
        <Link href="/org/requests" className="w-fit text-[12px] font-semibold text-[#b9100b]">
          ← Back to My Requests
        </Link>
      </div>
    );
  }

  const isLive = item.status === "in_transit";

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
              {item.item_type} × {item.quantity}
            </h2>
            {urgencyBadge(item.urgency)}
          </div>
          <p className="text-[14px] text-[#6b7280]">
            Request #{item.id.slice(0, 8)} · Submitted {new Date(item.created_at).toLocaleString()}
          </p>
        </div>
        {statusBadge(item.status)}
      </div>

      <div className="w-full rounded-lg border border-[#eaecf0] bg-white/95 p-[25px] shadow-sm">
        <StatusTimeline status={item.status} />
      </div>

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-lg border border-[#eaecf0] bg-white/95 p-[25px] shadow-sm">
          <h3 className="text-[16px] font-semibold text-[#191c1d]">Request Details</h3>
          <div className="flex flex-col gap-3 text-[14px]">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Item Type</span>
              <span className="font-medium text-[#191c1d]">{item.item_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Quantity</span>
              <span className="font-medium text-[#191c1d]">{item.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Urgency</span>
              <span className="font-medium capitalize text-[#191c1d]">{item.urgency}</span>
            </div>
            {item.description && (
              <div className="flex flex-col gap-1 border-t border-[#eaecf0] pt-3">
                <span className="text-[#6b7280]">Description</span>
                <span className="font-medium text-[#191c1d]">{item.description}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-[#eaecf0] bg-white/95 p-[25px] shadow-sm">
          <h3 className="text-[16px] font-semibold text-[#191c1d]">Live Tracking</h3>
          {isLive && item.pickup_lat != null && item.pickup_lng != null ? (
            <LiveTrackingMap
              pickup={{ lat: item.pickup_lat, lng: item.pickup_lng }}
              dropoff={
                item.dropoff_lat != null && item.dropoff_lng != null
                  ? { lat: item.dropoff_lat, lng: item.dropoff_lng }
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
    </div>
  );
}
