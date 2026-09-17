import Link from "next/link";

function DeliveriesIcon({ active }: { active?: boolean }) {
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

function OrgRequestsIcon() {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
      <rect x="1" y="5" width="18" height="12" rx="1" stroke="rgba(227,225,235,0.7)" strokeWidth="1.3" />
      <path d="M7 5V3a3 3 0 0 1 6 0v2" stroke="rgba(227,225,235,0.7)" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M1 9h18" stroke="rgba(227,225,235,0.7)" strokeWidth="1.3" />
    </svg>
  );
}

function VolunteersIcon() {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
      <circle cx="8" cy="5" r="3.5" stroke="rgba(227,225,235,0.7)" strokeWidth="1.3" />
      <path d="M1 15c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="rgba(227,225,235,0.7)" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M16 7c1.933 0 3.5 1.567 3.5 3.5 0 1.4-.857 2.6-2.09 3.13" stroke="rgba(227,225,235,0.7)" strokeWidth="1.3" strokeLinecap="round" />
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

function BellIcon() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
      <path
        d="M13 7A5 5 0 0 0 3 7c0 4-2 5-2 5h14s-2-1-2-5Z"
        stroke="#46464E"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.73 17a2 2 0 0 1-3.46 0" stroke="#46464E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3" stroke="#46464E" strokeWidth="1.3" />
      <path
        d="M10 1v2M10 17v2M1 10h2M17 10h2M3.22 3.22l1.42 1.42M15.36 15.36l1.42 1.42M3.22 16.78l1.42-1.42M15.36 4.64l1.42-1.42"
        stroke="#46464E"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

const navLinks = [
  { href: "/admin/deliveries", label: "Deliveries", icon: <DeliveriesIcon active /> },
  { href: "/admin/organisation-requests", label: "Organization Requests", icon: <OrgRequestsIcon /> },
  { href: "/admin/volunteers", label: "Volunteers", icon: <VolunteersIcon /> },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#FBF8FF]">
      {/* ── Sidebar ── */}
      <aside
        className="flex w-[280px] shrink-0 flex-col justify-between py-4"
        style={{
          background: "#11183C",
          borderRight: "1px solid #E5BDB7",
        }}
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
            {navLinks.map((link) => {
              const isDeliveries = link.href === "/admin/deliveries";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-3"
                  style={
                    isDeliveries
                      ? {
                          background: "rgba(143,0,2,0.1)",
                          borderLeft: "4px solid #8F0002",
                          opacity: 0.9,
                        }
                      : {}
                  }
                >
                  <span className="shrink-0">{link.icon}</span>
                  <span
                    className="text-[12px] font-medium leading-4"
                    style={{ color: isDeliveries ? "#FFDAD5" : "rgba(227,225,235,0.7)" }}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
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

      {/* ── Right side ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Nav */}
        <header
          className="flex h-[75px] shrink-0 items-center justify-between px-6"
          style={{ background: "#F8F9FA", borderBottom: "1px solid #C7C5CF" }}
        >
          <span className="text-2xl font-bold text-black">Medical Pantry</span>

          <div className="flex items-center gap-6">
            {/* Bell with badge */}
            <button
              type="button"
              className="relative flex size-10 items-center justify-center rounded-full"
              aria-label="Notifications"
            >
              <BellIcon />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#B9100B]" />
            </button>

            {/* Settings */}
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full"
              aria-label="Settings"
            >
              <SettingsIcon />
            </button>

            {/* Avatar */}
            <div className="ml-2 size-8 overflow-hidden rounded-full border border-[#C7C5CF] bg-[#BEC4F1]">
              <div className="flex h-full w-full items-center justify-center text-[13px] font-semibold text-[#11183C]">
                SC
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#FBF8FF]">{children}</main>
      </div>
    </div>
  );
}
