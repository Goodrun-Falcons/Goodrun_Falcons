import { redirect } from "next/navigation";

// /admin/support was a duplicate of /admin/support-tickets.
// Keep this redirect so any bookmarked or linked URLs still work.
export default function AdminSupportPage() {
  redirect("/admin/support-tickets");
}
