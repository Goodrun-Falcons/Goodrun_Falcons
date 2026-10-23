"use client";

import Image from "next/image";
import Link from "next/link";
import { NotificationsBell } from "@/components/NotificationsBell";

export function OrgTopBar({ orgName, onMenu }: { orgName: string; onMenu: () => void }) {
  return (
    <div className="flex h-[72px] w-full items-center justify-between border-b border-[#c7c5cf] bg-[#f8f9fa] px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenu}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[#11183c] md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <Image src="/logo.svg" alt="GoodRun" width={32} height={32} className="shrink-0" />
        <h1 className="truncate text-[20px] font-bold leading-[32px] text-black md:text-[24px]">Medical Pantry</h1>
      </div>
      <div className="flex shrink-0 items-center gap-3 md:gap-6">
        <NotificationsBell />
        <Link
          href="/org/settings"
          aria-label="Settings"
          className="flex size-8 items-center justify-center rounded-full bg-[#bec4f1] text-[12px] font-semibold text-[#11183c]"
        >
          {orgName.charAt(0).toUpperCase()}
        </Link>
      </div>
    </div>
  );
}
