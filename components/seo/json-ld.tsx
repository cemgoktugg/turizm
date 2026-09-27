import type { SiteSettings } from "@/lib/settings";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** Site içi yolları mutlak URL'ye çevirir */
function abs(url?: string | null): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) ? url : `${SITE_URL}${url}`;
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // "<" kaçışlanır; içerikteki "</script>" betiği sonlandıramaz
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function TravelAgencyJsonLd({ settings }: { settings: SiteSettings }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "TravelAgency",
        name: settings.siteName,
        description: settings.seoDescription,
        url: SITE_URL,
        logo: abs(settings.logo),
        image: abs(settings.ogImage),
        telephone: settings.phone,
        email: settings.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: settings.address,
          addressCountry: "TR",
        },
        sameAs: [
          settings.facebook,
          settings.instagram,
          settings.youtube,
          settings.twitter,
          settings.tiktok,
          settings.linkedin,
          settings.telegram,
        ].filter(Boolean),
      }}
    />
  );
}

export function TourJsonLd({
  title,
  description,
  image,
  price,
  currency,
  slug,
}: {
  title: string;
  description?: string | null;
  image?: string | null;
  price?: number | null;
  currency?: string | null;
  slug: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        name: title,
        description: description ?? undefined,
        image: abs(image),
        url: `${SITE_URL}/turlar/${slug}`,
        ...(price != null && {
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: currency ?? "USD",
            availability: "https://schema.org/InStock",
          },
        }),
      }}
    />
  );
}

export function FaqJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  if (!faqs.length) return null;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.name,
          item: `${SITE_URL}${it.url}`,
        })),
      }}
    />
  );
}

export function ArticleJsonLd({
  title,
  description,
  image,
  slug,
  datePublished,
  dateModified,
  publisher,
}: {
  title: string;
  description?: string | null;
  image?: string | null;
  slug: string;
  datePublished?: Date | string | null;
  dateModified?: Date | string | null;
  publisher: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: description ?? undefined,
        image: abs(image),
        url: `${SITE_URL}/blog/${slug}`,
        datePublished: datePublished ? new Date(datePublished).toISOString() : undefined,
        dateModified: dateModified ? new Date(dateModified).toISOString() : undefined,
        author: { "@type": "Organization", name: publisher },
        publisher: { "@type": "Organization", name: publisher },
      }}
    />
  );
}
