import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/ui";
import { PasswordForm, ProfileForm } from "@/components/admin/account-forms";

export const metadata = { title: "Hesabım" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader title="Hesabım" description="Profil bilgileriniz ve şifreniz." />
      {user.mustChangePassword ? (
        <>
          <PasswordForm mustChange />
          <ProfileForm defaultValues={{ name: user.name, email: user.email }} />
        </>
      ) : (
        <>
          <ProfileForm defaultValues={{ name: user.name, email: user.email }} />
          <PasswordForm mustChange={false} />
        </>
      )}
    </div>
  );
}
