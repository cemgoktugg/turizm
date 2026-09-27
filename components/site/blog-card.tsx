import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";

export type BlogCardData = {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category?: string | null;
  readTime?: number | null;
  createdAt?: Date | string | null;
};

export function BlogCard({
  post,
  className,
}: {
  post: BlogCardData;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card",
        className,
      )}
    >
      <Link href={`/blog/${post.slug}`} className="relative aspect-[16/9] overflow-hidden">
        <SmartImage
          src={post.coverImage}
          alt={post.title}
          className="size-full transition-transform duration-700 group-hover:scale-105"
        />
        {post.category && (
          <div className="absolute left-3 top-3">
            <Badge variant="cream" className="backdrop-blur">
              {post.category}
            </Badge>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3 text-xs text-muted">
          {post.createdAt && <span>{formatDate(post.createdAt)}</span>}
          {post.readTime ? (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {post.readTime} dk okuma
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 font-serif text-lg font-bold leading-snug text-brand-900">
          <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-brand-600">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">{post.excerpt}</p>
        )}
        <Link
          href={`/blog/${post.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-gold-600"
        >
          Devamını Oku <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
