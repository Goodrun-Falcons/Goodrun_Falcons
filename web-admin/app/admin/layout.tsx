"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AdminProfileProvider } from "@/components/admin/AdminProfile";
import { NotificationsBell } from "@/components/NotificationsBell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [adminName, setAdminName] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);

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
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();

      if (!admin) {
        router.replace("/login");
        return;
      }

      if (!cancelled) {
        setAdminName(admin.full_name?.trim() || admin.email.split("@")[0]);
      }
    }

    checkAdmin();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!adminName) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">
      {/* ── Sidebar ── */}
      {navOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}
      <AdminSidebar adminName={adminName} open={navOpen} onNavigate={() => setNavOpen(false)} />

      {/* ── Right side ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Nav */}
        <header
          className="flex h-[72px] shrink-0 items-center justify-between px-4 md:px-6"
          style={{ background: "#F8F9FA", borderBottom: "1px solid #C7C5CF" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setNavOpen(true)}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[#11183c] md:hidden"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <Image src="/logo.svg" alt="GoodRun" width={32} height={32} className="shrink-0" />
            <span className="truncate text-xl font-bold text-black md:text-2xl">Medical Pantry</span>
          </div>

          <div className="flex shrink-0 items-center gap-3 md:gap-6">
            <NotificationsBell />

            <Link
              href="/admin/settings"
              aria-label="Settings"
              title={adminName}
              className="flex size-8 items-center justify-center rounded-full bg-[#bec4f1] text-[12px] font-semibold text-[#11183c]"
            >
              {adminName.charAt(0).toUpperCase()}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#F8F9FA]">
          <AdminProfileProvider value={{ name: adminName, setName: setAdminName }}>
            {children}
          </AdminProfileProvider>
        </main>
      </div>
    </div>
  );
}
