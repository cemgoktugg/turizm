import { pageMetadata } from "@/lib/content";
import { LegalPage } from "@/components/site/legal-page";

export const generateMetadata = () => pageMetadata("legal.cookies");

export default function CookiePolicyPage() {
  return <LegalPage blockKey="legal.cookies" />;
}
