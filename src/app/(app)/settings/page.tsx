import { redirect } from "next/navigation";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <SecuritySettings
      user={{
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        emailVerified: Boolean(user.emailVerifiedAt),
        totpEnabled: user.totpEnabled,
        createdAt: user.createdAt.toISOString(),
      }}
    />
  );
}
