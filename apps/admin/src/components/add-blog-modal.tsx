"use client";

import React, { useState, useEffect } from "react";
import { adminApi } from "@/lib/api-client";
import { WordPressEditor } from "@/components/wordpress-editor";
import {
  X,
  Plus,
  Trash2,
  Upload,
  Globe,
  Link as LinkIcon,
  Search,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";

interface AddBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (blog: any) => void;
  initialBlog?: any | null;
}

export function AddBlogModal({
  isOpen,
  onClose,
  onSuccess,
  initialBlog = null,
}: AddBlogModalProps) {
  if (!isOpen) return null;

  const isEditing = !!initialBlog?.id;
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [title, setTitle] = useState(initialBlog?.title || "");
  const [slug, setSlug] = useState(initialBlog?.slug || "");
  const [category, setCategory] = useState(initialBlog?.category || "Buying Guide");
  const [excerpt, setExcerpt] = useState(initialBlog?.excerpt || "");
  const [content, setContent] = useState(initialBlog?.content || "");
  const [featuredImage, setFeaturedImage] = useState(initialBlog?.featuredImage || "");
  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT">(
    initialBlog?.status === "DRAFT" ? "DRAFT" : "PUBLISHED"
  );

  // SEO Fields
  const [metaTitle, setMetaTitle] = useState(initialBlog?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(initialBlog?.metaDescription || "");
  const [metaKeywords, setMetaKeywords] = useState(
    Array.isArray(initialBlog?.metaKeywords)
      ? initialBlog.metaKeywords.join(", ")
      : initialBlog?.metaKeywords || "graphics card bd, gaming pc dhaka, pc build guide"
  );
  const [canonicalUrl, setCanonicalUrl] = useState(initialBlog?.canonicalUrl || "");

  // Backlinks
  const [backlinks, setBacklinks] = useState<
    Array<{ anchorText: string; url: string; rel: "dofollow" | "nofollow" | "sponsored"; targetBlank: boolean }>
  >(
    Array.isArray(initialBlog?.backlinks) && initialBlog.backlinks.length > 0
      ? initialBlog.backlinks
      : [
          {
            anchorText: "Official GPU Collection",
            url: "https://thesolutionsbd.com/products?category=graphics-card",
            rel: "dofollow",
            targetBlank: true,
          },
        ]
  );
  const [newAnchor, setNewAnchor] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newRel, setNewRel] = useState<"dofollow" | "nofollow" | "sponsored">("dofollow");

  // Re-sync if initialBlog changes
  useEffect(() => {
    if (initialBlog) {
      setTitle(initialBlog.title || "");
      setSlug(initialBlog.slug || "");
      setCategory(initialBlog.category || "Buying Guide");
      setExcerpt(initialBlog.excerpt || "");
      setContent(initialBlog.content || "");
      setFeaturedImage(initialBlog.featuredImage || "");
      setStatus(initialBlog.status === "DRAFT" ? "DRAFT" : "PUBLISHED");
      setMetaTitle(initialBlog.metaTitle || "");
      setMetaDescription(initialBlog.metaDescription || "");
      setMetaKeywords(
        Array.isArray(initialBlog.metaKeywords)
          ? initialBlog.metaKeywords.join(", ")
          : initialBlog.metaKeywords || ""
      );
      setCanonicalUrl(initialBlog.canonicalUrl || "");
      if (Array.isArray(initialBlog.backlinks) && initialBlog.backlinks.length > 0) {
        setBacklinks(initialBlog.backlinks);
      }
    }
  }, [initialBlog]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-");
      setSlug(autoSlug);
      if (!metaTitle) setMetaTitle(val.slice(0, 65));
      if (!canonicalUrl) setCanonicalUrl(`https://thesolutionsbd.com/blog/${autoSlug}`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await adminApi.uploadImage(file, "banners");
      if (res.success && res.url) {
        setFeaturedImage(res.url);
      } else {
        alert("Image upload failed.");
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddBacklink = () => {
    if (!newAnchor.trim() || !newUrl.trim()) return;
    setBacklinks([
      ...backlinks,
      {
        anchorText: newAnchor.trim(),
        url: newUrl.trim(),
        rel: newRel,
        targetBlank: true,
      },
    ]);
    setNewAnchor("");
    setNewUrl("");
  };

  const handleRemoveBacklink = (idx: number) => {
    setBacklinks(backlinks.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Please provide both Title and Article Content.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || null,
        content: content.trim(),
        featuredImage: featuredImage.trim() || null,
        category,
        status,
        metaTitle: metaTitle.trim() || title,
        metaDescription: metaDescription.trim() || excerpt || title,
        metaKeywords: metaKeywords
          .split(",")
          .map((k: string) => k.trim())
          .filter(Boolean),
        canonicalUrl: canonicalUrl.trim() || `https://thesolutionsbd.com/blog/${slug}`,
        backlinks,
      };

      let res;
      if (isEditing && initialBlog?.id) {
        res = await adminApi.updateBlog(initialBlog.id, payload);
      } else {
        res = await adminApi.createBlog(payload);
      }

      if (res.success) {
        onSuccess(res.data);
        onClose();
      } else {
        alert(res.message || "Failed to save blog post.");
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>{isEditing ? "Edit SEO Blog Post" : "Write & Publish SEO Blog Post"}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-semibold font-mono">
                WordPress WYSIWYG
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rank on Google with clean canonical URLs, structured Article schema, and managed backlinks.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Main Article Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Article Content & WordPress Rich Body
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Article Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Best Gaming Graphics Cards Under 50,000 BDT in Bangladesh (2026 Guide)"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    URL Slug (Indexable Permalink) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="best-gaming-graphics-cards-under-50000-bdt"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono bg-muted/40 border border-border rounded-xl text-foreground outline-none"
                  />
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    Live URL: /blogs/{slug || "..."}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl text-foreground outline-none"
                  >
                    <option value="Buying Guide">Buying Guide</option>
                    <option value="Hardware Comparison">Hardware Comparison</option>
                    <option value="Tech News">Tech News & Releases</option>
                    <option value="PC Build Tips">PC Build & Maintenance</option>
                    <option value="Processor Benchmarks">Processor Benchmarks</option>
                    <option value="GPU Reviews">GPU Reviews</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Short Excerpt / Summary (Used in search result snippets)
                </label>
                <textarea
                  rows={2}
                  placeholder="A concise 2-sentence breakdown of what this article covers for tech buyers."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-muted/40 border border-border rounded-xl text-foreground outline-none resize-none"
                />
              </div>

              {/* WordPress-Style Full Article Body Editor */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>Full Article Body (WordPress Style Rich Editor) *</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Visual WYSIWYG & Raw HTML Dual Mode
                  </span>
                </label>

                <WordPressEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Write your comprehensive technical guide here with rich headings, comparisons, benchmark charts, images, and links..."
                  minHeight="380px"
                />
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-primary" />
              2. Featured Banner Image (OpenGraph / Social Sharing)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Image URL / CDN Path
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... or /uploads/..."
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-muted/40 border border-border rounded-xl text-foreground outline-none"
                />

                <div className="mt-2 flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? "Uploading..." : "Upload from Computer"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {featuredImage && (
                <div className="p-2 border border-border rounded-xl bg-muted/20 text-center">
                  <span className="text-[10px] text-muted-foreground font-mono mb-1 block">
                    Featured Thumbnail Preview:
                  </span>
                  <img
                    src={featuredImage}
                    alt="Featured Preview"
                    className="h-28 w-full object-cover rounded-lg border border-border"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Managed Backlinks Engine */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-primary" />
              3. SEO Internal Backlinks Registry (Rule 4.8)
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Register targeted high-intent anchor texts to pass PageRank to core product categories and build topical authority in Bangladesh search results.
            </p>

            <div className="p-4 border border-border rounded-xl bg-muted/20 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Anchor Text (e.g. Official GPU Price)"
                  value={newAnchor}
                  onChange={(e) => setNewAnchor(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground outline-none"
                />
                <input
                  type="url"
                  placeholder="Target URL (e.g. /products?category=gpu)"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground outline-none font-mono sm:col-span-2"
                />
                <div className="flex gap-1.5">
                  <select
                    value={newRel}
                    onChange={(e) => setNewRel(e.target.value as any)}
                    className="px-2 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground outline-none"
                  >
                    <option value="dofollow">dofollow</option>
                    <option value="nofollow">nofollow</option>
                    <option value="sponsored">sponsored</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddBacklink}
                    className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Active registered backlinks */}
              {backlinks.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Configured Backlinks ({backlinks.length}):
                  </div>
                  <div className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
                    {backlinks.map((b, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">{b.anchorText}</span>
                          <span className="text-muted-foreground font-mono text-[10px]">
                            -&gt; {b.url}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-muted text-[9px] font-mono border border-border">
                            rel=&quot;{b.rel}&quot;
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBacklink(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Advanced Technical SEO */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Search className="w-4 h-4 text-primary" />
              4. Advanced Google Search Meta & SERP Snippet
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Meta Title (50-65 chars recommended for Google SERP)
                </label>
                <input
                  type="text"
                  placeholder="Leave blank to use main headline"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-muted/40 border border-border rounded-xl text-foreground outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Meta Description (120-155 chars recommended)
                </label>
                <textarea
                  rows={2}
                  placeholder="Target search terms and compelling call-to-action for organic click-through rate."
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-muted/40 border border-border rounded-xl text-foreground outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Canonical URL (Prevent Duplicate Content)
                  </label>
                  <input
                    type="url"
                    placeholder="https://thesolutionsbd.com/blog/..."
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono bg-muted/40 border border-border rounded-xl text-foreground outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Meta Keywords (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono bg-muted/40 border border-border rounded-xl text-foreground outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Controls: Status & Submit */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-foreground">Publication Status:</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === "PUBLISHED"}
                    onChange={() => setStatus("PUBLISHED")}
                    className="text-primary"
                  />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Published (Live on Website)
                  </span>
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === "DRAFT"}
                    onChange={() => setStatus("DRAFT")}
                    className="text-primary"
                  />
                  <span>Draft (Hidden from public)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Article...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isEditing ? "Update & Save Changes" : "Save & Publish Article"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
