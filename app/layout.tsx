import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { getSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

const serif = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
});

/** Genel SEO ayarları admin panelindeki "Site Ayarları › SEO" bölümünden gelir */
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: s.seoTitle, template: `%s | ${s.siteName}` },
    description: s.seoDescription,
    keywords: s.seoKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    icons: { icon: s.favicon || "/favicon.ico", apple: "/images/nemira-apple-icon.png" },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: s.siteName,
      images: s.ogImage ? [s.ogImage] : undefined,
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

/** Mobil tarayıcı çubuğu rengi (logo laciverti) */
export const viewport: Viewport = { themeColor: "#000f20" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Toaster position="top-center" richColors toastOptions={{ style: { fontFamily: "var(--font-jakarta)" } }} />
      </body>
    </html>
  );
}
