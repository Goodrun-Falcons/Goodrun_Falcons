"use client";

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

export function OrgSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="fixed left-0 top-0 flex h-screen w-[280px] flex-col justify-between bg-[#11183c] py-4">
      <div className="flex h-[81px] items-center px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-[38px] items-center justify-center rounded-full bg-[#b9100b]">
            <span className="text-[20px] font-bold leading-[28px] text-white">M</span>
          </div>
          <div className="text-[24px] font-extrabold leading-[32px] text-white">
            <p>Logistics</p>
            <p>Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col overflow-auto py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
          href="/org/support"
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
