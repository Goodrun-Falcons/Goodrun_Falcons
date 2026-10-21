"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "../../supabase/types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

// Notifications are purged server-side after 7 days; the query mirrors that
// so a not-yet-purged row never shows up late.
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SHOWN = 30;

function BellIcon() {
  return (
    <svg viewBox="0 0 16 20" fill="none" className="h-5 w-4">
      <path
        d="M8 1a5 5 0 0 0-5 5v3.4c0 .6-.2 1.2-.6 1.7L1 13.5c-.6.8 0 2 1 2h12c1 0 1.6-1.2 1-2l-1.4-2.4a2.7 2.7 0 0 1-.6-1.7V6a5 5 0 0 0-5-5Z"
        stroke="#191c1d"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M6 17.5a2 2 0 0 0 4 0" stroke="#191c1d" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  // Ids that were unread when the panel was opened, so they keep their
  // "new" dot while the panel is open even though they're marked read.
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const load = useCallback(async (uid: string) => {
    const since = new Date(Date.now() - RETENTION_MS).toISOString();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_SHOWN);
    if (data) setNotifications(data);
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      setUserId(user.id);
      await load(user.id);
      if (cancelled) return;

      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          (payload) => {
            const row = payload.new as NotificationRow;
            setNotifications((prev) => [row, ...prev.filter((n) => n.id !== row.id)].slice(0, MAX_SHOWN));
          }
        )
        .subscribe();
    }

    init();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [load]);

  async function handleToggle() {
    const opening = !isOpen;
    setIsOpen(opening);
    if (!opening || !userId || unreadCount === 0) return;

    const unread = notifications.filter((n) => !n.read_at);
    setFreshIds(new Set(unread.map((n) => n.id)));
    const readAt = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: readAt })));
    await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("user_id", userId)
      .is("read_at", null);
  }

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={handleToggle} aria-label="Notifications" className="relative">
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-[#b9100b] text-[8px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 z-20 w-80 overflow-hidden rounded-lg border border-[#eaecf0] bg-white shadow-lg">
          <div className="border-b border-[#eaecf0] px-4 py-3 text-[13px] font-semibold text-[#191c1d]">
            Notifications
            <span className="pl-2 text-[11px] font-normal text-[#6b7280]">kept for 7 days</span>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-[#6b7280]">
              Nothing new. Updates will show up here as they happen.
            </p>
          ) : (
            <ul className="max-h-96 overflow-auto">
              {notifications.map((n) => {
                const content = (
                  <>
                    <div className="flex items-start gap-2">
                      {freshIds.has(n.id) && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#b9100b]" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold">{n.title}</p>
                        {n.body && <p className="truncate text-[#46464e]">{n.body}</p>}
                        <p className="pt-1 text-[11px] text-[#6b7280]">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </>
                );
                return (
                  <li key={n.id} className="border-b border-[#eaecf0] last:border-b-0">
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-3 text-[13px] text-[#191c1d] hover:bg-[#f8f9fa]"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="px-4 py-3 text-[13px] text-[#191c1d]">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
