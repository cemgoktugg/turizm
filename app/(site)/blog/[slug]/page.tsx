import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, CalendarDays, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getBlogPostBySlug } from "@/lib/queries";
import { PageHero } from "@/components/site/page-hero";
import { Prose } from "@/components/site/prose";
import { BlogCard } from "@/components/site/blog-card";
import { CtaBand } from "@/components/site/cta-band";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    select: { slug: true },
  });
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Yazı bulunamadı" };
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
      type: "article",
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const related = await prisma.blogPost.findMany({
    where: { isPublished: true, slug: { not: slug } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <>
      <ArticleJsonLd
        title={post.title}
        description={post.excerpt}
        image={post.coverImage}
        slug={post.slug}
        datePublished={post.createdAt}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: post.title, url: `/blog/${post.slug}` },
        ]}
      />

      <PageHero
        title={post.title}
        image={post.coverImage || "/images/blog-ilk-umre.svg"}
        crumbs={[{ label: "Blog", href: "/blog" }, { label: post.category || "Yazı" }]}
        size="sm"
      />

      <article className="py-14 lg:py-20">
        <div className="container-tr">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              {post.category && <Badge variant="gold">{post.category}</Badge>}
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" /> {formatDate(post.createdAt)}
              </span>
              {post.readTime ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" /> {post.readTime} dk okuma
                </span>
              ) : null}
            </div>

            <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-3xl border border-border shadow-card">
              <SmartImage
                src={post.coverImage}
                alt={post.title}
                loading="eager"
                className="size-full"
              />
            </div>

            {post.excerpt && (
              <p className="mt-8 border-l-4 border-gold-400 bg-cream-50 py-4 pl-5 pr-4 font-serif text-lg italic text-brand-800">
                {post.excerpt}
              </p>
            )}

            <div className="mt-6">
              <Prose content={post.content} />
            </div>

            <div className="mt-10 border-t border-border pt-6">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-gold-600"
              >
                <ArrowLeft className="size-4" /> Tüm Yazılara Dön
              </Link>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="bg-cream-50 py-16 lg:py-20">
          <div className="container-tr">
            <h2 className="mb-8 font-serif text-2xl font-bold text-brand-900">
              İlgili Yazılar
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {related.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}
