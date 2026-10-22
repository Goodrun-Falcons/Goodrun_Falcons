"use client";

import { createContext, useContext } from "react";

// The signed-in admin's display name, shared between the admin layout (sidebar,
// avatar) and the Settings page so a rename shows up everywhere immediately.
type AdminProfile = {
  name: string;
  setName: (name: string) => void;
};

const AdminProfileContext = createContext<AdminProfile | null>(null);

export const AdminProfileProvider = AdminProfileContext.Provider;

export function useAdminProfile(): AdminProfile {
  const ctx = useContext(AdminProfileContext);
  if (!ctx) throw new Error("useAdminProfile must be used inside the admin layout");
  return ctx;
}
