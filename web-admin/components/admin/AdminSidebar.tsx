"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

function DeliveriesIcon({ active }: Readonly<{ active?: boolean }>) {
  const color = active ? "#FFDAD5" : "rgba(227,225,235,0.7)";
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
      <rect x="1" y="1" width="14" height="11" rx="1" stroke={color} strokeWidth="1.3" />
      <path d="M15 4h3.5l2.5 3v5h-6V4Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="5" cy="14" r="1.5" stroke={color} strokeWidth="1.3" />
      <circle cx="17" cy="14" r="1.5" stroke={color} strokeWidth="1.3" />
    </svg>
  );
}

function OrgIcon({ active }: Readonly<{ active?: boolean }>) {
  const color = active ? "#FFDAD5" : "rgba(227,225,235,0.7)";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="1" y="7" width="18" height="12" rx="1" stroke={color} strokeWidth="1.3" />
      <path d="M7 7V5a3 3 0 0 1 6 0v2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="10" cy="13" r="2" stroke={color} strokeWidth="1.3" />
    </svg>
  );
}

function OrgRequestsIcon({ active }: Readonly<{ active?: boolean }>) {
  const color = active ? "#FFDAD5" : "rgba(227,225,235,0.7)";
  return (
    <svg width="18" height="18" viewBox="0 0 20 18" fill="none">
      <rect x="1" y="5" width="18" height="12" rx="1" stroke={color} strokeWidth="1.3" />
      <path d="M7 5V3a3 3 0 0 1 6 0v2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M1 9h18" stroke={color} strokeWidth="1.3" />
    </svg>
  );
}

function AccountApprovalIcon({ active }: Readonly<{ active?: boolean }>) {
  const color = active ? "#FFDAD5" : "rgba(227,225,235,0.7)";
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke={color} strokeWidth="1.3" />
      <path d="M6.5 10.5l2.5 2.5 4.5-5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SupportTicketsIcon({ active }: Readonly<{ active?: boolean }>) {
  const color = active ? "#FFDAD5" : "rgba(227,225,235,0.7)";
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="1" y="3" width="18" height="14" rx="1.5" stroke={color} strokeWidth="1.3" />
      <path d="M5 8h10M5 12h6" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function VolunteersIcon({ active }: Readonly<{ active?: boolean }>) {
  const color = active ? "#FFDAD5" : "rgba(227,225,235,0.7)";
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
      <circle cx="8" cy="5" r="3.5" stroke={color} strokeWidth="1.3" />
      <path d="M1 15c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M16 7c1.933 0 3.5 1.567 3.5 3.5 0 1.4-.857 2.6-2.09 3.13" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="rgba(227,225,235,0.7)" strokeWidth="1.3" />
      <path
        d="M7.5 7.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4"
        stroke="rgba(227,225,235,0.7)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="10" cy="15" r="0.75" fill="rgba(227,225,235,0.7)" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M7 16H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h4"
        stroke="rgba(227,225,235,0.7)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M12 13l4-4-4-4" stroke="rgba(227,225,235,0.7)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 9H7" stroke="rgba(227,225,235,0.7)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }: Readonly<{ open: boolean }>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M2 4l4 4 4-4" stroke="rgba(227,225,235,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ORG_SUBNAV = [
  {
    href: "/admin/organisation-requests",
    label: "Organization Requests",
    icon: OrgRequestsIcon,
  },
  {
    href: "/admin/account-approval",
    label: "Account Approval",
    icon: AccountApprovalIcon,
  },
  {
    href: "/admin/support-tickets",
    label: "Support Tickets",
    icon: SupportTicketsIcon,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const orgActive = ORG_SUBNAV.some((s) => pathname.startsWith(s.href));
  const [orgOpen, setOrgOpen] = useState(orgActive);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className="flex w-[280px] shrink-0 flex-col justify-between py-4"
      style={{ background: "#11183C", borderRight: "1px solid #E5BDB7" }}
    >
      {/* Logo */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 px-6 pb-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#B9100B]">
            <span className="text-xl font-bold text-white">M</span>
          </div>
          <div>
            <p className="text-[24px] font-extrabold leading-8 text-white">Logistics</p>
            <p className="text-[24px] font-extrabold leading-8 text-white">Portal</p>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex flex-col">
          {/* Deliveries */}
          <Link
            href="/admin/deliveries"
            className="flex items-center gap-3 px-4 py-3"
            style={
              isActive("/admin/deliveries")
                ? { background: "rgba(143,0,2,0.1)", borderLeft: "4px solid #8F0002", opacity: 0.9 }
                : {}
            }
          >
            <span className="shrink-0">
              <DeliveriesIcon active={isActive("/admin/deliveries")} />
            </span>
            <span
              className="text-[12px] font-medium leading-4"
              style={{ color: isActive("/admin/deliveries") ? "#FFDAD5" : "rgba(227,225,235,0.7)" }}
            >
              Deliveries
            </span>
          </Link>

          {/* Organisation dropdown */}
          <button
            type="button"
            onClick={() => setOrgOpen((v) => !v)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
            style={
              orgActive && !orgOpen
                ? { background: "rgba(143,0,2,0.1)", borderLeft: "4px solid #8F0002", opacity: 0.9 }
                : {}
            }
          >
            <span className="shrink-0">
              <OrgIcon active={orgActive} />
            </span>
            <span
              className="flex-1 text-[12px] font-medium leading-4"
              style={{ color: orgActive ? "#FFDAD5" : "rgba(227,225,235,0.7)" }}
            >
              Organisation
            </span>
            <ChevronIcon open={orgOpen} />
          </button>

          {/* Organisation sub-items */}
          {orgOpen && (
            <div className="flex flex-col" style={{ background: "rgba(0,0,0,0.15)" }}>
              {ORG_SUBNAV.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 py-2.5 pl-10 pr-4"
                    style={
                      active
                        ? { background: "rgba(143,0,2,0.1)", borderLeft: "4px solid #8F0002", paddingLeft: "2.25rem" }
                        : {}
                    }
                  >
                    <span className="shrink-0">
                      <Icon active={active} />
                    </span>
                    <span
                      className="text-[11px] font-medium leading-4"
                      style={{ color: active ? "#FFDAD5" : "rgba(227,225,235,0.6)" }}
                    >
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Volunteers */}
          <Link
            href="/admin/volunteers"
            className="flex items-center gap-3 px-4 py-3"
            style={
              isActive("/admin/volunteers")
                ? { background: "rgba(143,0,2,0.1)", borderLeft: "4px solid #8F0002", opacity: 0.9 }
                : {}
            }
          >
            <span className="shrink-0">
              <VolunteersIcon active={isActive("/admin/volunteers")} />
            </span>
            <span
              className="text-[12px] font-medium leading-4"
              style={{ color: isActive("/admin/volunteers") ? "#FFDAD5" : "rgba(227,225,235,0.7)" }}
            >
              Volunteers
            </span>
          </Link>
        </nav>
      </div>

      {/* Footer Nav */}
      <div className="flex flex-col border-t border-[#3E446B] pt-2">
        <Link href="/admin/support" className="flex items-center gap-3 px-4 py-3">
          <SupportIcon />
          <span className="text-[12px] font-medium leading-4 text-[rgba(227,225,235,0.7)]">Support</span>
        </Link>
        <Link href="/logout" className="flex items-center gap-4 rounded-lg px-4 py-3">
          <LogoutIcon />
          <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[rgba(227,225,235,0.7)]">
            Logout
          </span>
        </Link>
      </div>
    </aside>
  );
}
