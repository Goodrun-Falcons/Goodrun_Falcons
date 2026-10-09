"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "../../../supabase/types";

type Item = Database["public"]["Tables"]["items"]["Row"];

type Notification = {
  id: string;
  itemId: string;
  itemLabel: string;
  status: string;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "submitted",
  approved: "approved",
  rejected: "rejected",
  accepted: "matched to a volunteer",
  in_transit: "in transit",
  delivered: "delivered",
};

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

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function subscribe() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      channel = supabase
        .channel(`org-notifications-${user.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "items", filter: `organisation_id=eq.${user.id}` },
          (payload) => {
            const item = payload.new as Item;
            const oldItem = payload.old as Partial<Item>;
            if (oldItem.status === item.status) return;

            setNotifications((prev) => [
              {
                id: `${item.id}-${item.status}-${Date.now()}`,
                itemId: item.id,
                itemLabel: `${item.item_type} × ${item.quantity}`,
                status: item.status,
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ].slice(0, 20));
            setUnreadCount((count) => count + 1);
          }
        )
        .subscribe();
    }

    subscribe();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  function handleToggle() {
    setIsOpen((open) => {
      if (!open) setUnreadCount(0);
      return !open;
    });
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
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-[#6b7280]">
              No updates yet. You&apos;ll see status changes here as they happen.
            </p>
          ) : (
            <ul className="max-h-80 overflow-auto">
              {notifications.map((n) => (
                <li key={n.id} className="border-b border-[#eaecf0] last:border-b-0">
                  <Link
                    href={`/org/requests/${n.itemId}`}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-[13px] text-[#191c1d] hover:bg-[#f8f9fa]"
                  >
                    <span className="font-medium">{n.itemLabel}</span> is now{" "}
                    <span className="font-semibold">{STATUS_LABEL[n.status] ?? n.status}</span>
                    <p className="pt-1 text-[11px] text-[#6b7280]">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
