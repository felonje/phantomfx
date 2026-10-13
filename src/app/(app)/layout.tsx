import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav user={user} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
