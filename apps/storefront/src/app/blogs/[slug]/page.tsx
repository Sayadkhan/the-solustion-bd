import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { storefrontApi } from "@/lib/api";
import {
  Clock,
  Calendar,
  User,
  Share2,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Phone,
  MessageCircle,
  Link as LinkIcon,
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const res = await storefrontApi.getBlogBySlug(slug);
  const blog = res?.data;

  if (!blog) {
    return {
      title: "Article Not Found | The Solutions BD",
    };
  }

  return {
    title: `${blog.metaTitle || blog.title} | The Solutions BD`,
    description: blog.metaDescription || blog.excerpt || blog.title,
    keywords: Array.isArray(blog.metaKeywords) ? blog.metaKeywords : [],
    alternates: {
      canonical: blog.canonicalUrl || `https://thesolutionsbd.com/blogs/${slug}`,
    },
    openGraph: {
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.excerpt || blog.title,
      images: [
        {
          url: blog.featuredImage || "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=1200",
        },
      ],
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const res = await storefrontApi.getBlogBySlug(slug);
  const blog = res?.data;

  if (!blog) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-blue-600/20 selection:text-blue-500 font-sans pb-20">
      {/* Top Breadcrumb & Article Header */}
      <div className="border-b border-border bg-card/40 backdrop-blur-md py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/blogs" className="hover:text-foreground">
              Tech Blogs
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-medium">{blog.category || "Guide"}</span>
          </div>

          {/* Category & Read Time */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              {blog.category || "Hardware Buying Guide"}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{blog.readingTimeMinutes || 4} min read</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {blog.publishedAt
                  ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Recently Published"}
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
            {blog.title}
          </h1>

          {/* Author info */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                SB
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">
                  {blog.authorName || "The Solutions BD Editorial"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Hardware & PC Gaming Specialists
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-mono">
                {blog.viewCount || 1420} reads
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Banner Hero */}
      {blog.featuredImage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border shadow-2xl">
            <img
              src={blog.featuredImage}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Article Content Body (WordPress HTML Rendered) */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <div
          dangerouslySetInnerHTML={{ __html: blog.content }}
          className="text-foreground text-sm sm:text-base leading-relaxed space-y-4
            [&_h1]:text-2xl sm:[&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-tight [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-foreground
            [&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-border [&_h2]:text-foreground
            [&_h3]:text-lg sm:[&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-foreground
            [&_h4]:text-base [&_h4]:font-bold [&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:text-foreground
            [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-foreground/90
            [&_a]:text-primary [&_a]:font-bold [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-blue-400 [&_a]:transition-colors
            [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-primary/5 [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:my-6 [&_blockquote]:rounded-r-2xl [&_blockquote]:italic [&_blockquote]:text-foreground
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1.5
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1.5
            [&_code]:px-2 [&_code]:py-0.5 [&_code]:rounded-lg [&_code]:bg-muted [&_code]:font-mono [&_code]:text-xs [&_code]:text-primary
            [&_pre]:p-4 [&_pre]:my-5 [&_pre]:rounded-2xl [&_pre]:bg-slate-950 [&_pre]:border [&_pre]:border-slate-800 [&_pre]:overflow-x-auto
            [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:mx-auto [&_img]:shadow-xl [&_img]:border [&_img]:border-border
            [&_figure]:my-8 [&_figure]:text-center
            [&_figcaption]:text-xs [&_figcaption]:text-muted-foreground [&_figcaption]:mt-2.5 [&_figcaption]:italic
            [&_table]:w-full [&_table]:text-xs sm:[&_table]:text-sm [&_table]:border [&_table]:border-border [&_table]:border-collapse [&_table]:rounded-xl [&_table]:overflow-hidden [&_table]:my-6
            [&_th]:bg-muted/70 [&_th]:p-3 [&_th]:border [&_th]:border-border [&_th]:font-bold [&_th]:text-foreground
            [&_td]:p-3 [&_td]:border [&_td]:border-border"
        />

        {/* Managed Internal Backlinks Box */}
        {Array.isArray(blog.backlinks) && blog.backlinks.length > 0 && (
          <div className="mt-10 p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <LinkIcon className="w-4 h-4 text-primary" />
              <span>Related Product Categories & Verified Links:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {blog.backlinks.map((lnk: any, idx: number) => (
                <a
                  key={idx}
                  href={lnk.url}
                  target={lnk.targetBlank ? "_blank" : undefined}
                  rel={lnk.rel || "dofollow"}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/50 hover:bg-muted text-xs font-medium text-foreground hover:text-primary transition-colors"
                >
                  <span>{lnk.anchorText}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Callout Commercial CTA Banner */}
        <div className="mt-10 p-6 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-950 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Official Box Warranty in Bangladesh</span>
            </div>
            <h3 className="text-xl font-black tracking-tight">
              Ready to Build Your AMD Ryzen Battle-Station?
            </h3>
            <p className="text-xs text-white/80 max-w-lg">
              Get customized component recommendations, instant cash discount pricing, and free professional assembly at our IDB Bhaban showroom.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            <Link
              href="/pc-builder"
              className="px-5 py-2.5 rounded-xl bg-white text-blue-900 text-xs font-bold hover:bg-slate-100 transition shadow-lg flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              <span>Open PC Builder</span>
            </Link>
            <a
              href="https://wa.me/8801922730343"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition shadow-lg flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Us</span>
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
