import { pageMetadata } from "@/lib/content";
import { LegalPage } from "@/components/site/legal-page";

export const generateMetadata = () => pageMetadata("legal.cancellation");

export default function CancellationPage() {
  return <LegalPage blockKey="legal.cancellation" />;
}
