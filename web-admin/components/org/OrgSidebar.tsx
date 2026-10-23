"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function DashboardIcon() {
  return (
    <svg viewBox="0 0 22 16" fill="none" className="h-4 w-[22px]">
      <rect x="1" y="1" width="9" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="12" y="1" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1" y="9" width="9" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 20 18" fill="none" className="h-[18px] w-5">
      <path d="M1 2h18M1 9h18M1 16h18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path
        d="M8.3 2.2h3.4l.4 2a6.4 6.4 0 0 1 1.5.9l1.9-.7 1.7 3-1.5 1.3a6.5 6.5 0 0 1 0 1.7l1.5 1.3-1.7 3-1.9-.7a6.4 6.4 0 0 1-1.5.9l-.4 2H8.3l-.4-2a6.4 6.4 0 0 1-1.5-.9l-1.9.7-1.7-3 1.5-1.3a6.5 6.5 0 0 1 0-1.7L2.8 7.7l1.7-3 1.9.7a6.4 6.4 0 0 1 1.5-.9l.4-2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7.5 7.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="10" cy="14.2" r="0.9" fill="currentColor" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" className="h-[18px] w-[18px]">
      <path d="M7 1.5H2.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11.5 12.5 16 9l-4.5-3.5M16 9H6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/org/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/org/requests/new", label: "+ New Request", icon: PlusIcon, highlight: true },
  { href: "/org/requests", label: "My Requests", icon: ListIcon },
];

export function OrgSidebar({
  orgName,
  open,
  onNavigate,
}: {
  orgName: string;
  open: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div
      className={`fixed left-0 top-0 z-40 flex h-dvh w-[280px] flex-col justify-between bg-[#11183c] py-4 transition-transform duration-200 md:z-auto md:h-screen md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-3 px-6 pt-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-white"><Image src="/logo.svg" alt="GoodRun" width={26} height={26} /></div>
        <span className="text-[16px] font-extrabold text-white">GoodRun</span>
      </div>
      <div className="flex h-[81px] items-center px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-10 w-[38px] shrink-0 items-center justify-center rounded-full bg-[#b9100b]">
            <span className="text-[20px] font-bold leading-[28px] text-white">
              {orgName.charAt(0).toUpperCase()}
            </span>
          </div>
          <p
            title={orgName}
            className="line-clamp-2 min-w-0 break-words text-[20px] font-extrabold leading-[26px] text-white"
          >
            {orgName}
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col overflow-auto py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={
                item.highlight
                  ? "mx-4 my-1 flex items-center gap-3 rounded-lg bg-[#b9100b] px-4 py-3 text-[12px] font-semibold text-white"
                  : active
                  ? "flex items-center gap-3 border-l-4 border-[#8f0002] bg-[rgba(143,0,2,0.1)] py-3 pl-5 pr-4 text-[12px] font-medium text-[#ffdad5]"
                  : "flex items-center gap-3 px-4 py-3 text-[12px] font-medium text-[rgba(227,225,235,0.7)]"
              }
            >
              <item.icon />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#3e446b] pt-2">
        <Link
          href="/org/settings"
          onClick={onNavigate}
          className={
            pathname === "/org/settings"
              ? "flex items-center gap-3 border-l-4 border-[#8f0002] bg-[rgba(143,0,2,0.1)] py-3 pl-5 pr-4 text-[12px] font-medium text-[#ffdad5]"
              : "flex items-center gap-3 px-4 py-3 text-[12px] font-medium text-[rgba(227,225,235,0.7)]"
          }
        >
          <SettingsIcon />
          Settings
        </Link>
        <Link
          href="/org/support"
          onClick={onNavigate}
          className="flex items-center gap-3 px-4 py-3 text-[12px] font-medium text-[rgba(227,225,235,0.7)]"
        >
          <SupportIcon />
          Support
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-4 px-4 py-3 text-left text-[12px] font-semibold tracking-[0.6px] text-[rgba(227,225,235,0.7)]"
        >
          <LogoutIcon />
          Logout
        </button>
      </div>
    </div>
  );
}
