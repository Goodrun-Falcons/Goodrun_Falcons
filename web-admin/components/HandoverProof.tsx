"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const BUCKET = "handover-photos";

// The live pickups.handover_photo column is bytea, which PostgREST returns as
// a "\x<hex>" string holding the raw image bytes.
function bytesToObjectUrl(hex: string): string {
  const clean = hex.slice(2);
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
  return URL.createObjectURL(new Blob([bytes], { type: isPng ? "image/png" : "image/jpeg" }));
}

// Shows the volunteer's proof-of-delivery photo for a request, if one was
// uploaded. pickups.handover_photo may be raw image bytes (bytea), a full URL,
// or a storage path inside the private handover-photos bucket (resolved to a
// signed URL).
export function HandoverProof({ requestId }: { requestId: string }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [handedOverAt, setHandedOverAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function load() {
      const { data } = await supabase
        .from("pickups")
        .select("handover_photo, handover_timestamp")
        .eq("request_id", requestId)
        .not("handover_photo", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled || !data?.handover_photo) return;

      let url = data.handover_photo;
      if (url.startsWith("\\x")) {
        url = objectUrl = bytesToObjectUrl(url);
      } else if (!/^https?:\/\//.test(url)) {
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(url, 3600);
        if (!signed) return;
        url = signed.signedUrl;
      }
      if (cancelled) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        return;
      }
      setPhotoUrl(url);
      setHandedOverAt(data.handover_timestamp);
    }
    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [requestId]);

  if (!photoUrl) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#eaecf0] bg-white/95 p-[25px] shadow-sm">
      <h3 className="text-[16px] font-semibold text-[#191c1d]">Proof of Delivery</h3>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photoUrl} alt="Handover photo" className="max-h-[360px] w-fit rounded-lg object-contain" />
      {handedOverAt && (
        <p className="text-[12px] text-[#6b7280]">
          Handed over {new Date(handedOverAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
