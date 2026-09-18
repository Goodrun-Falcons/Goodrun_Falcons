import AdminSidebar from "@/components/admin/AdminSidebar";

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

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#FBF8FF]">
      {/* ── Sidebar ── */}
      <AdminSidebar />

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
