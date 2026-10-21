"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { OrgSidebar } from "@/components/org/OrgSidebar";
import { OrgTopBar } from "@/components/org/OrgTopBar";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [orgName, setOrgName] = useState<string | null>(null);

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
        .select("name, verified")
        .eq("id", user.id)
        .maybeSingle();

      if (!org?.verified) {
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
      <OrgSidebar />
      <div className="pl-[280px]">
        <OrgTopBar orgName={orgName} />
        {children}
      </div>
    </div>
  );
}
