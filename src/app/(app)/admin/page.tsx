import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/trade");
  return <AdminDashboard />;
}
