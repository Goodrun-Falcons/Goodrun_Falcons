"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "../../../../supabase/types";

type Item = Database["public"]["Tables"]["items"]["Row"];

type Filter = "all" | "active" | "delivered";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "delivered", label: "Delivered" },
];

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

function matchesFilter(item: Item, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "delivered") return item.status === "delivered";
  return item.status === "pending" || item.status === "accepted" || item.status === "in_transit";
}

export default function MyRequestsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[#46464e]">Loading…</div>}>
      <MyRequestsContent />
    </Suspense>
  );
}

function MyRequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = (searchParams.get("filter") as Filter) ?? "all";

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

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

  const visibleItems = items.filter((item) => matchesFilter(item, filter));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-[32px] font-semibold leading-[40px] tracking-[-0.32px] text-[#191c1d]">
            My Requests
          </h2>
          <p className="text-[16px] text-[#46464e]">
            All delivery requests submitted by your organisation.
          </p>
        </div>
        <Link
          href="/org/requests/new"
          className="flex w-fit items-center gap-2 rounded-lg bg-[#b9100b] px-6 py-3 text-[12px] font-semibold tracking-[0.6px] text-white"
        >
          + New Request
        </Link>
      </div>

      <div className="flex w-fit gap-1 rounded-lg border border-[#eaecf0] bg-white/95 p-1 shadow-sm">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => router.push(f.key === "all" ? "/org/requests" : `/org/requests?filter=${f.key}`)}
            className={
              f.key === filter
                ? "rounded-md bg-[#11183c] px-4 py-2 text-[12px] font-semibold text-white"
                : "rounded-md px-4 py-2 text-[12px] font-medium text-[#46464e]"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex w-full flex-col items-start rounded-lg border border-[#eaecf0] bg-white/95 p-[25px] shadow-sm">
        {loading ? (
          <p className="text-[14px] text-[#46464e]">Loading…</p>
        ) : visibleItems.length === 0 ? (
          <p className="text-[14px] text-[#46464e]">
            No {filter === "all" ? "" : `${filter} `}requests to show.
          </p>
        ) : (
          <div className="flex w-full flex-col gap-4">
            {visibleItems.map((item) => (
              <Link
                key={item.id}
                href={`/org/requests/${item.id}`}
                className="flex flex-col gap-1 rounded-lg border border-[#c7c5cf] bg-[#f8f9fa] p-[17px] transition hover:border-[#11183c]"
              >
                <div className="flex items-start justify-between">
                  {urgencyBadge(item.urgency) ?? <span />}
                  {statusBadge(item.status)}
                </div>
                <h4 className="pt-1 text-[20px] font-semibold text-[#191c1d]">
                  {item.item_type} × {item.quantity}
                </h4>
                {item.description && <p className="text-[16px] text-[#46464e]">{item.description}</p>}
                <span className="pt-1 text-[12px] text-[#6b7280]">
                  Submitted {new Date(item.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
