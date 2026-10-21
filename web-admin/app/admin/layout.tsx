"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { NotificationsBell } from "@/components/NotificationsBell";

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: admin } = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!admin) {
        router.replace("/login");
        return;
      }

      if (!cancelled) setReady(true);
    }

    checkAdmin();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center bg-[#FBF8FF]" />;
  }

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
            <NotificationsBell />

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
