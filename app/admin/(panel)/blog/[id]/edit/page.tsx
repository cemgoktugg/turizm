import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BlogForm } from "@/components/admin/blog-form";
import { getBlogCategories } from "@/lib/admin-data";

export const metadata = { title: "Yazı Düzenle" };

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, categories] = await Promise.all([prisma.blogPost.findUnique({ where: { id } }), getBlogCategories()]);
  if (!post) notFound();

  return (
    <div>
      <Link href="/admin/blog" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
        <ArrowLeft className="size-4" /> Yazılara Dön
      </Link>
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">
        Yazı Düzenle: <span className="text-brand-600">{post.title}</span>
      </h2>
      <BlogForm
        postId={post.id}
        slug={post.slug}
        categories={categories}
        defaultValues={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          content: post.content,
          coverImage: post.coverImage ?? "",
          category: post.category ?? "",
          readTime: post.readTime == null ? "" : String(post.readTime),
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
          isPublished: post.isPublished,
        }}
      />
    </div>
  );
}
