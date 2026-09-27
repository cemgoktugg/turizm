import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Rotamız Huzura | Hac & Umre Turizm",
    template: "%s | Rotamız Huzura",
  },
  description:
    "Yetkili acenta güvencesiyle premium hac ve umre programları, lüks umre, Ramazan umresi ve kültür turları. Merkezi oteller, tecrübeli rehberlik ve şeffaf fiyat.",
  keywords: [
    "umre",
    "hac",
    "umre turları",
    "lüks umre",
    "ramazan umresi",
    "hac programları",
    "mekke otelleri",
    "medine otelleri",
    "kültür turları",
  ],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Rotamız Huzura",
    images: ["/images/og-image.svg"],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{ style: { fontFamily: "var(--font-jakarta)" } }}
        />
      </body>
    </html>
  );
}
