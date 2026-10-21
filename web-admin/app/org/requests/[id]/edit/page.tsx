"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { RequestForm, type RequestFormValues } from "@/components/org/RequestForm";
import type { Tag } from "@/lib/tags";

export default function EditRequestPage() {
  const params = useParams<{ id: string }>();
  const [initial, setInitial] = useState<RequestFormValues | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("requests")
        .select("*, request_items(*)")
        .eq("id", params.id)
        .eq("organisation_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (!data) {
        setBlocked("Request not found.");
        return;
      }
      if (data.status !== "pending") {
        setBlocked("Only requests still awaiting admin review can be edited.");
        return;
      }

      setInitial({
        requestId: data.id,
        name: data.name ?? "",
        items: data.request_items.map((i: { item_type: string; quantity: number }) => ({ itemType: i.item_type, quantity: i.quantity })),
        description: data.description ?? "",
        urgency: data.urgency as RequestFormValues["urgency"],
        tag: (data.tag as Tag | null) ?? "",
        pickupAddress: data.pickup_address ?? "",
        dropoffAddress: data.dropoff_address ?? "",
        // Coordinates are re-geocoded from the address unless the org picks a
        // new suggestion, so an unchanged address keeps its location.
        pickupCoords:
          data.pickup_lat != null && data.pickup_lng != null
            ? { lat: data.pickup_lat, lng: data.pickup_lng }
            : null,
        dropoffCoords:
          data.dropoff_lat != null && data.dropoff_lng != null
            ? { lat: data.dropoff_lat, lng: data.dropoff_lng }
            : null,
      });
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Link href={`/org/requests/${params.id}`} className="w-fit text-[12px] font-semibold text-[#46464e]">
          ← Back to request
        </Link>
        <h2 className="text-[32px] font-semibold leading-[40px] tracking-[-0.32px] text-[#191c1d]">
          Edit Request
        </h2>
      </div>

      {blocked ? (
        <p className="text-[14px] text-[#46464e]">{blocked}</p>
      ) : initial ? (
        <RequestForm initial={initial} />
      ) : (
        <p className="text-[14px] text-[#46464e]">Loading…</p>
      )}
    </div>
  );
}
