"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "../../../../supabase/types";
import { formatItemsLabel, type RequestItem } from "@/lib/requestItems";
import { tagLabel } from "@/lib/tags";

type Request = Database["public"]["Tables"]["requests"]["Row"] & {
  request_items: RequestItem[];
};

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
    approved: { bg: "#e7e8e9", text: "#46464e", label: "Approved" },
    rejected: { bg: "#ffdad6", text: "#93000a", label: "Rejected" },
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

function matchesFilter(request: Request, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "delivered") return request.status === "delivered";
  return (
    request.status === "pending" ||
    request.status === "approved" ||
    request.status === "accepted" ||
    request.status === "in_transit"
  );
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

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: orgRequests } = await supabase
        .from("requests")
        .select("*, request_items(*)")
        .eq("organisation_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      setRequests((orgRequests as Request[] | null) ?? []);
      setLoading(false);

      const channel = supabase
        .channel(`org-requests-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "requests", filter: `organisation_id=eq.${user.id}` },
          async (payload) => {
            if (payload.eventType === "INSERT") {
              const newRequest = payload.new as Database["public"]["Tables"]["requests"]["Row"];
              const { data: requestItems } = await supabase
                .from("request_items")
                .select("*")
                .eq("request_id", newRequest.id);
              setRequests((prev) => [{ ...newRequest, request_items: requestItems ?? [] }, ...prev]);
            } else if (payload.eventType === "UPDATE") {
              const updated = payload.new as Database["public"]["Tables"]["requests"]["Row"];
              setRequests((prev) =>
                prev.map((request) => (request.id === updated.id ? { ...request, ...updated } : request))
              );
            } else if (payload.eventType === "DELETE") {
              const deleted = payload.old as Database["public"]["Tables"]["requests"]["Row"];
              setRequests((prev) => prev.filter((request) => request.id !== deleted.id));
            }
          }
        )
        .subscribe();

      return channel;
    }

    const channelPromise = load();

    return () => {
      cancelled = true;
      channelPromise.then((channel) => {
        if (channel) supabase.removeChannel(channel);
      });
    };
  }, []);

  const visibleRequests = requests.filter((request) => matchesFilter(request, filter));

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
        ) : visibleRequests.length === 0 ? (
          <p className="text-[14px] text-[#46464e]">
            No {filter === "all" ? "" : `${filter} `}requests to show.
          </p>
        ) : (
          <div className="flex w-full flex-col gap-4">
            {visibleRequests.map((request) => (
              <Link
                key={request.id}
                href={`/org/requests/${request.id}`}
                className="flex flex-col gap-1 rounded-lg border border-[#c7c5cf] bg-[#f8f9fa] p-[17px] transition hover:border-[#11183c]"
              >
                <div className="flex items-start justify-between">
                  {urgencyBadge(request.urgency) ?? <span />}
                  {statusBadge(request.status)}
                </div>
                <h4 className="pt-1 text-[20px] font-semibold text-[#191c1d]">
                  {formatItemsLabel(request.request_items)}
                </h4>
                {request.description && <p className="text-[16px] text-[#46464e]">{request.description}</p>}
                <div className="flex items-center gap-2 pt-1 text-[12px] text-[#6b7280]">
                  <span>Submitted {new Date(request.created_at).toLocaleDateString()}</span>
                  {tagLabel(request.tag) && (
                    <span className="rounded-full bg-[#e7e8e9] px-2 py-0.5 text-[11px] font-medium text-[#46464e]">
                      {tagLabel(request.tag)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
