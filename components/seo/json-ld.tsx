import type { SiteSettings } from "@/lib/settings";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD güvenli biçimde serialize edilir
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
        description:
          "Yetkili acenta güvencesiyle hac, umre ve kültür turları düzenleyen premium seyahat acentası.",
        url: SITE_URL,
        logo: `${SITE_URL}${settings.logo}`,
        image: `${SITE_URL}/images/og-image.svg`,
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
        image: image ? `${SITE_URL}${image}` : undefined,
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
}: {
  title: string;
  description?: string | null;
  image?: string | null;
  slug: string;
  datePublished?: Date | string | null;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: description ?? undefined,
        image: image ? `${SITE_URL}${image}` : undefined,
        url: `${SITE_URL}/blog/${slug}`,
        datePublished: datePublished
          ? new Date(datePublished).toISOString()
          : undefined,
        author: { "@type": "Organization", name: "Rotamız Huzura" },
      }}
    />
  );
}
