import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { VerifyBanner } from "@/components/VerifyBanner";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav user={user} />
      {!user.emailVerifiedAt && <VerifyBanner />}
      <main className="flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>
    </div>
  );
}
