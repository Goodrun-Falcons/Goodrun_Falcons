"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.signOut().then(() => {
      router.replace("/login");
    });
  }, [router]);

  // Render nothing — just a blank screen during the async redirect.
  return <div className="flex min-h-screen items-center justify-center bg-[#FBF8FF]" />;
}
