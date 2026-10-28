import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { storefrontApi } from "@/lib/api";
import {
  FileText,
  Clock,
  Calendar,
  User,
  ArrowRight,
  Search,
  Sparkles,
  BookOpen,
  ChevronRight,
  Layers,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tech Blogs & Hardware Guides | The Solutions BD",
  description:
    "Expert PC hardware buying guides, processor benchmarks, GPU comparisons, and gaming PC builds in Bangladesh from The Solutions BD.",
  keywords: [
    "pc hardware blog bd",
    "ryzen processor guide bd",
    "graphics card price bd",
    "gaming pc build bangladesh",
  ],
};

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;
  const res = await storefrontApi.getBlogs({ category, search, limit: 20 });
  const blogs = res?.items || [];

  const categories = [
    "All",
    "Buying Guide",
    "Hardware Comparison",
    "Tech News",
    "PC Build Tips",
    "Processor Benchmarks",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-blue-600/20 selection:text-blue-500 font-sans pb-16">
      {/* Hero Header */}
      <div className="relative border-b border-border bg-card/60 backdrop-blur-md py-12 px-4 sm:px-6 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Tech Blogs & Hardware Guides</span>
          </div>

          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Solutions BD Editorial Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Tech Hardware Guides & Benchmarks
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              In-depth technical buying guides, authentic warranty advice, and component comparisons tailored for Bangladeshi PC gamers and creators.
            </p>
          </div>

          {/* Categories Pill Bar */}
          <div className="pt-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const isSelected =
                (!category && cat === "All") || category === cat;
              return (
                <Link
                  key={cat}
                  href={cat === "All" ? "/blogs" : `/blogs?category=${encodeURIComponent(cat)}`}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Articles Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        {blogs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/40 space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/60" />
            <h3 className="text-base font-bold text-foreground">No articles found in this section</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              We publish new hardware analyses and buying guides weekly. Check back soon or explore other categories.
            </p>
            <Link
              href="/blogs"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
            >
              <span>View All Articles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((b: any) => (
              <article
                key={b.id || b.slug}
                className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                {/* Image Box */}
                <Link
                  href={`/blogs/${b.slug}`}
                  className="relative aspect-video w-full overflow-hidden bg-muted block"
                >
                  <img
                    src={b.featuredImage || "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800"}
                    alt={b.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-semibold text-white border border-white/10">
                    {b.category || "Hardware"}
                  </div>
                </Link>

                {/* Content Box */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    {/* Meta info */}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{b.readingTimeMinutes || 4} min read</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{b.authorName || "Editorial Team"}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      <Link href={`/blogs/${b.slug}`}>{b.title}</Link>
                    </h2>

                    {/* Excerpt */}
                    {b.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {b.excerpt}
                      </p>
                    )}
                  </div>

                  {/* Footer link */}
                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently Published"}
                    </span>
                    <Link
                      href={`/blogs/${b.slug}`}
                      className="inline-flex items-center gap-1 text-primary font-bold group-hover:gap-1.5 transition-all"
                    >
                      <span>Read Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
