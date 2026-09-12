"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/supabase/types";

type Item = Database["public"]["Tables"]["items"]["Row"];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
      <path d="M2 6h8M6 2l4 4-4 4" stroke="#b9100b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[100px] flex-col items-center justify-center rounded-lg border border-[#eaecf0] bg-white/95 p-[17px] shadow-sm">
      <span className="text-[20px] font-bold leading-[28px] text-[#11183c]">{value}</span>
      <span className="pt-1 text-[11px] font-medium uppercase tracking-[0.55px] text-[#46464e]">{label}</span>
    </div>
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
      className="rounded-full px-2 py-0.5 text-[11px] uppercase"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}

export default function OrgDashboardPage() {
  const [orgName, setOrgName] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: org } = await supabase
        .from("organisations")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();
      if (org) setOrgName(org.name);

      const { data: orgItems } = await supabase
        .from("items")
        .select("*")
        .eq("organisation_id", user.id)
        .order("created_at", { ascending: false });

      setItems(orgItems ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const requestsThisMonth = items.filter((i) => new Date(i.created_at) >= startOfMonth).length;
  const awaitingPickupCount = items.filter((i) => i.status === "pending" || i.status === "accepted").length;
  const inTransitCount = items.filter((i) => i.status === "in_transit").length;
  const deliveredCount = items.filter((i) => i.status === "delivered").length;
  const activeCount = awaitingPickupCount + inTransitCount;
  const recentItems = items.slice(0, 5);

  if (loading) {
    return <div className="p-6 text-[#46464e]">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-[32px] font-semibold leading-[40px] tracking-[-0.32px] text-[#191c1d]">
            Good morning, {orgName}
          </h2>
          <p className="text-[16px] text-[#46464e]">
            Here is the current logistics overview for your organisation.
          </p>
        </div>
        <div className="flex gap-4">
          <StatCard value={requestsThisMonth} label="Requests this month" />
          <StatCard value={activeCount} label="Currently pending" />
          <StatCard value={deliveredCount} label="Delivered" />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg bg-[#b9100b] p-6 shadow-lg">
        <span className="text-[12px] font-semibold uppercase tracking-[0.6px] text-white/90">
          Your Active Requests
        </span>
        <span className="text-[48px] font-bold leading-[60px] tracking-[-0.96px] text-white">
          {activeCount} active {activeCount === 1 ? "request" : "requests"}
        </span>
        <span className="pb-5 text-[16px] text-white/90">
          {awaitingPickupCount} awaiting pickup · {inTransitCount} in transit
        </span>
        <Link
          href="/org/requests?filter=active"
          className="flex w-fit items-center gap-2 rounded-full bg-white px-6 py-2 text-[12px] font-semibold tracking-[0.6px] text-[#b9100b]"
        >
          View all requests
          <ArrowIcon />
        </Link>
      </div>

      <div className="flex w-full flex-col items-start rounded-lg border border-[#eaecf0] bg-white/95 p-[25px] shadow-sm">
        <div className="flex w-full items-center justify-between pb-6">
          <h3 className="text-[20px] font-semibold text-[#191c1d]">Recent Requests</h3>
          <Link href="/org/requests" className="text-[12px] font-semibold text-[#b9100b]">
            See all →
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <p className="text-[14px] text-[#46464e]">
            No requests yet. Click &ldquo;+ New Request&rdquo; in the sidebar to submit your first one.
          </p>
        ) : (
          <div className="flex w-full flex-col gap-4">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1 rounded-lg border border-[#c7c5cf] bg-[#f8f9fa] p-[17px]"
              >
                <div className="flex items-start justify-between">
                  {urgencyBadge(item.urgency) ?? <span />}
                  {statusBadge(item.status)}
                </div>
                <h4 className="pt-1 text-[20px] font-semibold text-[#191c1d]">
                  {item.item_type} × {item.quantity}
                </h4>
                {item.description && <p className="text-[16px] text-[#46464e]">{item.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
