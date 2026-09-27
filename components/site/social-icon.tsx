/**
 * Lucide yeni sürümlerde marka ikonlarını kaldırdığı için sosyal medya
 * ikonlarını sade inline SVG olarak sunuyoruz.
 */
export type SocialName = "facebook" | "instagram" | "youtube" | "twitter" | "tiktok" | "linkedin" | "telegram";

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
  tiktok: (
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
  ),
  linkedin: (
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />
  ),
  telegram: (
    <path d="M21.94 4.3 18.9 18.63c-.23 1.01-.83 1.26-1.68.79l-4.63-3.41-2.23 2.15c-.25.25-.45.45-.93.45l.33-4.72 8.59-7.76c.37-.33-.08-.52-.58-.19L7.16 12.62 2.6 11.19c-.99-.31-1.01-.99.21-1.47l17.84-6.88c.83-.31 1.55.19 1.29 1.46z" />
  ),
};

export function SocialIcon({ name, className }: { name: SocialName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
