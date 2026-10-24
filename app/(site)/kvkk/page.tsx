import { pageMetadata } from "@/lib/content";
import { LegalPage } from "@/components/site/legal-page";

export const generateMetadata = () => pageMetadata("legal.kvkk");

export default function KvkkPage() {
  return <LegalPage blockKey="legal.kvkk" />;
}
