"use client";

import React, { useState } from "react";
import { adminApi } from "@/lib/api-client";
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
} from "lucide-react";

interface AddBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBlog: any) => void;
}

export function AddBlogModal({ isOpen, onClose, onSuccess }: AddBlogModalProps) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Buying Guide");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT">("PUBLISHED");

  // SEO Fields
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("graphics card bd, gaming pc dhaka, pc build guide");
  const [canonicalUrl, setCanonicalUrl] = useState("");

  // Backlinks
  const [backlinks, setBacklinks] = useState<
    Array<{ anchorText: string; url: string; rel: "dofollow" | "nofollow" | "sponsored"; targetBlank: boolean }>
  >([
    {
      anchorText: "Official GPU Collection",
      url: "https://thesolutionsbd.com/products?category=graphics-card",
      rel: "dofollow",
      targetBlank: true,
    },
  ]);
  const [newAnchor, setNewAnchor] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newRel, setNewRel] = useState<"dofollow" | "nofollow" | "sponsored">("dofollow");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-");
    setSlug(autoSlug);
    if (!metaTitle) setMetaTitle(val.slice(0, 65));
    if (!canonicalUrl) setCanonicalUrl(`https://thesolutionsbd.com/blog/${autoSlug}`);
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
    if (!title || !content) {
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
          .map((k) => k.trim())
          .filter(Boolean),
        canonicalUrl: canonicalUrl.trim() || `https://thesolutionsbd.com/blog/${slug}`,
        backlinks,
      };

      const res = await adminApi.createBlog(payload);
      if (res.success) {
        onSuccess(res.data);
        onClose();
      } else {
        alert(res.message || "Failed to publish blog post.");
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Write & Publish SEO Blog Post
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Main Article Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Article Content
            </h3>

            <div className="space-y-3">
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
                  className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    URL Slug (Indexable Permlink) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="best-gaming-graphics-cards-under-50000-bdt"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono bg-muted/40 border border-border rounded-lg text-foreground outline-none"
                  />
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    URL: /blog/{slug || "..."}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-lg text-foreground outline-none"
                  >
                    <option value="Buying Guide">Buying Guide</option>
                    <option value="Hardware Comparison">Hardware Comparison</option>
                    <option value="Tech News">Tech News & Releases</option>
                    <option value="PC Build Tips">PC Build & Maintenance</option>
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
                  className="w-full px-3.5 py-2 text-xs bg-muted/40 border border-border rounded-lg text-foreground outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Full Article Body (Supports HTML & Markdown) *
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="<p>Write your detailed technical analysis here with benchmarks, pricing tables, and recommendations...</p>"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-muted/40 border border-border rounded-lg text-foreground outline-none"
                />
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="space-y-4 pt-2 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-primary" />
              2. Featured Banner Image
            </h3>

            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="w-full md:w-1/2">
                <label className="block border-2 border-dashed border-border hover:border-primary/50 transition rounded-xl p-6 text-center cursor-pointer bg-muted/20">
                  <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                  <span className="text-xs font-semibold text-foreground block">
                    {uploadingImage ? "Uploading Banner..." : "Click or Drag Banner Image"}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    Recommended ratio 16:9 (1200x630px)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="w-full md:w-1/2 space-y-2">
                <label className="block text-xs font-semibold text-foreground">Or Enter Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-muted/40 border border-border rounded-lg text-foreground outline-none"
                />
                {featuredImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featuredImage}
                    alt="Banner Preview"
                    className="w-full h-28 object-cover rounded-lg border border-border mt-2"
                  />
                )}
              </div>
            </div>
          </div>

          {/* SEO Metadata Suite */}
          <div className="space-y-4 pt-2 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Search className="w-4 h-4 text-primary" />
              3. Search Engine Optimization (SEO) Suite
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Meta Title (Google SERP Title)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Best GPU Under 50,000 BDT in Bangladesh"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-muted/40 border border-border rounded-lg text-foreground outline-none"
                />
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Length: {metaTitle.length}/70 chars
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Canonical URL (Authority Reference)
                </label>
                <input
                  type="text"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-muted/40 border border-border rounded-lg text-foreground outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Meta Description (Google Snippet)
                </label>
                <input
                  type="text"
                  placeholder="Detailed benchmark analysis comparing RTX 4060 and RX 7600 with official warranty in BD."
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-muted/40 border border-border rounded-lg text-foreground outline-none"
                />
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Length: {metaDescription.length}/160 chars
                </span>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Target SEO Keywords (Comma Separated)
                </label>
                <input
                  type="text"
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-muted/40 border border-border rounded-lg text-foreground outline-none"
                />
              </div>
            </div>
          </div>

          {/* Backlink Manager */}
          <div className="space-y-4 pt-2 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-primary" />
              4. Backlink & Internal Link Engine
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Anchor Text (e.g. RTX 4060 GPU)"
                value={newAnchor}
                onChange={(e) => setNewAnchor(e.target.value)}
                className="px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-lg text-foreground outline-none"
              />
              <input
                type="text"
                placeholder="URL (e.g. https://thesolutionsbd.com/products/...)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono bg-muted/40 border border-border rounded-lg text-foreground outline-none md:col-span-2"
              />
              <div className="flex gap-1.5">
                <select
                  value={newRel}
                  onChange={(e) => setNewRel(e.target.value as any)}
                  className="px-2 py-1.5 text-xs bg-muted/40 border border-border rounded-lg text-foreground outline-none"
                >
                  <option value="dofollow">dofollow (Pass SEO)</option>
                  <option value="nofollow">nofollow (No rank pass)</option>
                  <option value="sponsored">sponsored</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddBacklink}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {backlinks.map((link, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-muted/20 border border-border/50 text-foreground"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-semibold text-primary">{link.anchorText}</span>
                    <span className="font-mono text-[11px] text-muted-foreground truncate">
                      ({link.url})
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono rounded bg-primary/10 text-primary">
                      rel=&quot;{link.rel}&quot;
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBacklink(idx)}
                    className="text-muted-foreground hover:text-destructive transition p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Publication Status */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-4">
              <label className="text-xs font-semibold text-foreground">Publication Status:</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === "PUBLISHED"}
                    onChange={() => setStatus("PUBLISHED")}
                    className="text-primary"
                  />
                  <span>Published (Live on Website)</span>
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
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
              >
                {loading ? "Publishing..." : "Save & Publish Article"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
