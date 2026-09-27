import { HotelsCity } from "@/components/site/hotels-city";
import { pageMetadata } from "@/lib/content";

export const generateMetadata = () => pageMetadata("page.oteller-mekke");

export default function MekkeOtelleriPage() {
  return <HotelsCity city="Mekke" />;
}
