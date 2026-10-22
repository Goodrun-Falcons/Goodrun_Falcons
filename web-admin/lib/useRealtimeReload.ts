"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

const DEBOUNCE_MS = 250;

// Loads the page's data once on mount, then again whenever any row in `tables`
// changes, so every admin sees another admin's actions without a manual
// refresh. Bursts of events (e.g. an RPC that touches several tables) collapse
// into a single reload. Also reloads when the tab becomes visible again, to
// cover a dropped websocket.
export function useRealtimeReload(tables: string[], reload: () => void | Promise<void>) {
  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  const key = tables.join(",");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void reloadRef.current(), DEBOUNCE_MS);
    };

    // First load: queued (not run inline) so it never sets state during the effect.
    timer = setTimeout(() => void reloadRef.current(), 0);

    let channel = supabase.channel(`admin-live-${key}-${Math.random().toString(36).slice(2)}`);
    for (const table of key.split(",")) {
      channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, schedule);
    }
    channel.subscribe();

    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [key]);
}
