import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminPageHeader, AdminCard } from "@/components/admin/ui";
import { NewUserForm, RoleSelect } from "@/components/admin/account-forms";
import { DeleteButton } from "@/components/admin/row-actions";
import { Badge } from "@/components/ui/badge";
import { deleteUser } from "@/app/actions/account";
import { ROLE_LABELS } from "@/lib/roles";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Kullanıcılar" };

export default async function AdminUsersPage() {
  const [me, users] = await Promise.all([
    getCurrentUser(),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true, passwordChangedAt: true },
    }),
  ]);
  if (me?.role !== "ADMIN") redirect("/admin");

  return (
    <div>
      <AdminPageHeader title="Kullanıcılar" description="Yönetim paneline erişebilen kişiler." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border bg-cream-50 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Kullanıcı</th>
                  <th className="px-4 py-3 font-semibold">Yetki</th>
                  <th className="px-4 py-3 font-semibold">Son giriş</th>
                  <th className="px-4 py-3 font-semibold">Şifre</th>
                  <th className="px-4 py-3 text-right font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white">
                          {u.name.charAt(0).toLocaleUpperCase("tr")}
                        </span>
                        <div>
                          <p className="font-semibold text-brand-900">
                            {u.name} {u.id === me?.id && <span className="text-xs font-normal text-muted">(siz)</span>}
                          </p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === "ADMIN" ? (
                        <Badge variant="slate" size="sm">{ROLE_LABELS.ADMIN}</Badge>
                      ) : (
                        <RoleSelect userId={u.id} role={u.role} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Hiç giriş yapmadı"}</td>
                    <td className="px-4 py-3">
                      {u.passwordChangedAt ? (
                        <Badge variant="green" size="sm">{formatDate(u.passwordChangedAt)} değişti</Badge>
                      ) : (
                        <Badge variant="amber" size="sm">Geçici / varsayılan</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {u.id !== me?.id && users.length > 1 && (
                          <DeleteButton action={deleteUser} id={u.id} label={`${u.name} kullanıcısını silmek istediğinize emin misiniz?`} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
        <NewUserForm />
      </div>
    </div>
  );
}
