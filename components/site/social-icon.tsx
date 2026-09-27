/**
 * Lucide yeni sürümlerde marka ikonlarını kaldırdığı için sosyal medya
 * ikonlarını sade inline SVG olarak sunuyoruz.
 */
type SocialName = "facebook" | "instagram" | "youtube" | "twitter";

const PATHS: Record<SocialName, React.ReactNode> = {
  facebook: (
    <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z" />
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.2" />
    </>
  ),
  youtube: (
    <>
      <path
        d="M22 12s0-3.3-.4-4.8c-.2-.9-.9-1.5-1.7-1.7C18.3 5 12 5 12 5s-6.3 0-7.9.5c-.8.2-1.5.8-1.7 1.7C2 8.7 2 12 2 12s0 3.3.4 4.8c.2.9.9 1.5 1.7 1.7C5.7 19 12 19 12 19s6.3 0 7.9-.5c.8-.2 1.5-.8 1.7-1.7.4-1.5.4-4.8.4-4.8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M10 15l5-3-5-3v6z" />
    </>
  ),
  twitter: (
    <path d="M18.9 3H21l-6.6 7.6L22 21h-6l-4.7-6.1L5.9 21H3l7-8L2 3h6.1l4.3 5.6L18.9 3zm-2.1 16h1.7L7.3 4.8H5.5L16.8 19z" />
  ),
};

export function SocialIcon({
  name,
  className,
}: {
  name: SocialName;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
