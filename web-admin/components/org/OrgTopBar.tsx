"use client";

import Link from "next/link";
import { NotificationsBell } from "./NotificationsBell";

function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path
        d="M8.3 2.2h3.4l.4 2a6.4 6.4 0 0 1 1.5.9l1.9-.7 1.7 3-1.5 1.3a6.5 6.5 0 0 1 0 1.7l1.5 1.3-1.7 3-1.9-.7a6.4 6.4 0 0 1-1.5.9l-.4 2H8.3l-.4-2a6.4 6.4 0 0 1-1.5-.9l-1.9.7-1.7-3 1.5-1.3a6.5 6.5 0 0 1 0-1.7L2.8 7.7l1.7-3 1.9.7a6.4 6.4 0 0 1 1.5-.9l.4-2Z"
        stroke="#191c1d"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke="#191c1d" strokeWidth="1.3" />
    </svg>
  );
}

export function OrgTopBar({ orgName }: { orgName: string }) {
  return (
    <div className="flex h-[72px] w-full items-center justify-between border-b border-[#c7c5cf] bg-[#f8f9fa] px-6">
      <h1 className="text-[24px] font-bold leading-[32px] text-black">Medical Pantry</h1>
      <div className="flex items-center gap-6">
        <NotificationsBell />
        <Link href="/org/settings" aria-label="Settings">
          <SettingsIcon />
        </Link>
        <Link
          href="/org/settings"
          className="flex size-8 items-center justify-center rounded-full bg-[#bec4f1] text-[12px] font-semibold text-[#11183c]"
        >
          {orgName.charAt(0).toUpperCase()}
        </Link>
      </div>
    </div>
  );
}
