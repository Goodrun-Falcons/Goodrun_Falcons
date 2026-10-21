"use client";

import Link from "next/link";
import { NotificationsBell } from "@/components/NotificationsBell";

export function OrgTopBar({ orgName }: { orgName: string }) {
  return (
    <div className="flex h-[72px] w-full items-center justify-between border-b border-[#c7c5cf] bg-[#f8f9fa] px-6">
      <h1 className="text-[24px] font-bold leading-[32px] text-black">Medical Pantry</h1>
      <div className="flex items-center gap-6">
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
