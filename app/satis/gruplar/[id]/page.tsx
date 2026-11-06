import { notFound } from "next/navigation";
import { BackLink } from "@/components/admin/sales/ui";
import { GroupDetail } from "@/components/admin/sales/group-detail";
import { getGroup } from "@/lib/sales";
import { getSalesBase } from "@/lib/sales-base-server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = /^\d{1,9}$/.test(id) ? await getGroup(Number(id)) : null;
  return { title: group?.name ?? "Grup" };
}

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const base = await getSalesBase();
  const { id } = await params;
  const group = /^\d{1,9}$/.test(id) ? await getGroup(Number(id)) : null;
  if (!group) notFound();

  return (
    <div className="max-w-4xl">
      <BackLink href={`${base}/gruplar`} label="Gruplara Dön" />
      <GroupDetail
        group={group}
        base={base}
        saleHref={(saleId) => `${base}/${saleId}`}
        addHref={`${base}/yeni?grup=${group.id}`}
        afterDeleteHref={`${base}/gruplar`}
      />
    </div>
  );
}
