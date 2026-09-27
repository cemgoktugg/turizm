import { getBlogPosts } from "@/lib/queries";
import { getContent, pageMetadata } from "@/lib/content";
import { PageHero } from "@/components/site/page-hero";
import { BlogCard } from "@/components/site/blog-card";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal } from "@/components/ui/reveal";
import { BookOpen } from "lucide-react";

export const generateMetadata = () => pageMetadata("page.blog");

export default async function BlogPage() {
  const [posts, c] = await Promise.all([getBlogPosts(), getContent("page.blog")]);
  const [featured, ...rest] = posts;

  return (
    <>
      <PageHero title={c.title} description={c.description} image={c.image} crumbs={[{ label: "Blog" }]} />

      <section className="py-16 lg:py-20">
        <div className="container-tr">
          {posts.length === 0 ? (
            <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border bg-cream-50 p-10 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                <BookOpen className="size-7" />
              </div>
              <p className="mt-4 text-sm text-muted">Henüz yazı eklenmemiş.</p>
            </div>
          ) : (
            <>
              {/* Öne çıkan yazı */}
              {featured && (
                <Reveal className="mb-10">
                  <FeaturedPost post={featured} />
                </Reveal>
              )}

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((p, i) => (
                  <Reveal key={p.id} delay={i % 3}>
                    <BlogCard post={p} />
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <CtaBand />
    </>
  );
}

function FeaturedPost({
  post,
}: {
  post: Awaited<ReturnType<typeof getBlogPosts>>[number];
}) {
  return (
    <article className="grid overflow-hidden rounded-3xl border border-border bg-white shadow-card lg:grid-cols-2">
      <a href={`/blog/${post.slug}`} className="relative aspect-[16/10] overflow-hidden lg:aspect-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.coverImage || "/images/logo-mark.svg"}
          alt={post.title}
          className="size-full object-cover"
        />
      </a>
      <div className="flex flex-col justify-center p-8 lg:p-10">
        <span className="eyebrow">
          <span className="h-px w-6 bg-current opacity-60" /> Öne Çıkan Yazı
        </span>
        <h2 className="mt-3 font-serif text-2xl font-bold text-brand-900 sm:text-3xl">
          <a href={`/blog/${post.slug}`} className="transition-colors hover:text-brand-600">
            {post.title}
          </a>
        </h2>
        {post.excerpt && <p className="mt-4 text-muted">{post.excerpt}</p>}
        <a
          href={`/blog/${post.slug}`}
          className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          Yazıyı Oku
        </a>
      </div>
    </article>
  );
}
