import { HotelsCity } from "@/components/site/hotels-city";
import { pageMetadata } from "@/lib/content";

export const generateMetadata = () => pageMetadata("page.oteller-medine");

export default function MedineOtelleriPage() {
  return <HotelsCity city="Medine" />;
}
