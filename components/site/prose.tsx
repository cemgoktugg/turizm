import { Fragment } from "react";
import Link from "next/link";

const TOKENS = /(\*\*[^*]+\*\*|\[[^\]]+\]\((?:\/[^)\s]*|https?:\/\/[^)\s]+)\))/g;
const LINK = /^\[([^\]]+)\]\((\/[^)\s]*|https?:\/\/[^)\s]+)\)$/;
const linkClass =
  "font-semibold text-brand-700 underline decoration-brand-200 underline-offset-4 transition hover:text-gold-600";

/** **kalın** ve [bağlantı](/adres) biçimlerini işler */
function renderInline(text: string, keyBase: string): React.ReactNode {
  const parts = text.split(TOKENS).filter(Boolean);
  return parts.map((p, i) => {
    const link = p.match(LINK);
    if (link) {
      const [, label, href] = link;
      return href.startsWith("/") ? (
        <Link key={`${keyBase}-${i}`} href={href} className={linkClass}>
          {label}
        </Link>
      ) : (
        <a key={`${keyBase}-${i}`} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {label}
        </a>
      );
    }
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={`${keyBase}-${i}`} className="font-semibold text-brand-900">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={`${keyBase}-${i}`}>{p}</Fragment>;
  });
}

/** Tek satırlık metinde **kalın** ve [bağlantı](/adres) biçimleri (ör. SSS cevapları) */
export function InlineText({ text }: { text: string }) {
  return <>{renderInline(text, "in")}</>;
}

/** Biçim işaretlerini temizler (Google yapılandırılmış verisi gibi düz metin gereken yerler için) */
export function plainText(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");
}

/**
 * Basit markdown alt kümesini (## başlık, - madde, 1. sıralı, paragraf, **kalın**, [bağlantı](/adres))
 * güvenli biçimde React'e dönüştürür.
 */
export function Prose({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!list) return;
    const items = list.items;
    if (list.ordered) {
      blocks.push(
        <ol key={key++} className="my-4 ml-1 space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex gap-3 text-brand-800">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                {i + 1}
              </span>
              <span>{renderInline(it, `ol-${key}-${i}`)}</span>
            </li>
          ))}
        </ol>,
      );
    } else {
      blocks.push(
        <ul key={key++} className="my-4 space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex gap-3 text-brand-800">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-400" />
              <span>{renderInline(it, `ul-${key}-${i}`)}</span>
            </li>
          ))}
        </ul>,
      );
    }
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      blocks.push(
        <h3 key={key++} className="mt-8 font-serif text-xl font-bold text-brand-900">
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith("## ")) {
      flushList();
      blocks.push(
        <h2 key={key++} className="mt-10 font-serif text-2xl font-bold text-brand-900">
          {line.slice(3)}
        </h2>,
      );
    } else if (/^\d+\.\s/.test(line)) {
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(line.replace(/^\d+\.\s/, ""));
    } else if (line.startsWith("- ")) {
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(line.slice(2));
    } else {
      flushList();
      blocks.push(
        <p key={key++} className="my-4 leading-relaxed text-brand-800/90">
          {renderInline(line, `p-${key}`)}
        </p>,
      );
    }
  }
  flushList();

  return <div className="text-[15px]">{blocks}</div>;
}
