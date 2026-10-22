"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { OrgSidebar } from "@/components/org/OrgSidebar";
import { OrgTopBar } from "@/components/org/OrgTopBar";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [orgName, setOrgName] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: org } = await supabase
        .from("organisations")
        .select("name, verified, active")
        .eq("id", user.id)
        .maybeSingle();

      if (!org?.verified || !org.active) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      if (!cancelled) setOrgName(org.name);
    }

    checkAccess();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!orgName) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]" />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {navOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}
      <OrgSidebar orgName={orgName} open={navOpen} onNavigate={() => setNavOpen(false)} />
      <div className="min-w-0 md:pl-[280px]">
        <OrgTopBar orgName={orgName} onMenu={() => setNavOpen(true)} />
        {children}
      </div>
    </div>
  );
}
