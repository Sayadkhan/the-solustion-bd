"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Table as TableIcon,
  Code,
  AlertCircle,
  Minus,
  RotateCcw,
  RotateCw,
  RemoveFormatting,
  Eye,
  FileCode,
  Upload,
  Plus,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { adminApi } from "@/lib/api-client";

interface WordPressEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function WordPressEditor({
  value,
  onChange,
  placeholder = "Start writing your article here in WordPress style...",
  minHeight = "360px",
}: WordPressEditorProps) {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // Link Dialog Modal State
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkTargetBlank, setLinkTargetBlank] = useState(true);
  const [linkNofollow, setLinkNofollow] = useState(false);
  const savedSelection = useRef<Range | null>(null);

  // Media Upload Modal State
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [mediaImageUrl, setMediaImageUrl] = useState("");
  const [mediaAlt, setMediaAlt] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Sync incoming value to contentEditable canvas if not an internal keystroke
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalUpdate.current = false;
  }, [value, mode]);

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  }, [onChange]);

  // Execute standard formatting commands
  const execCmd = (command: string, cmdValue: string | undefined = undefined) => {
    if (mode !== "visual") return;
    editorRef.current?.focus();
    document.execCommand(command, false, cmdValue);
    handleEditorInput();
  };

  // Block format changer (Paragraph, H1, H2, H3, H4)
  const handleBlockFormat = (tag: string) => {
    if (mode !== "visual") return;
    editorRef.current?.focus();
    if (tag === "p") {
      document.execCommand("formatBlock", false, "<p>");
    } else {
      document.execCommand("formatBlock", false, `<${tag}>`);
    }
    handleEditorInput();
  };

  // Save current text selection before opening modals
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelection.current = sel.getRangeAt(0).cloneRange();
      const selectedStr = sel.toString();
      if (selectedStr) {
        setLinkText(selectedStr);
      }
    }
  };

  // Restore saved selection
  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelection.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelection.current);
    }
  };

  // Open Link Dialog
  const handleOpenLinkDialog = () => {
    saveSelection();
    setLinkUrl("https://");
    setIsLinkDialogOpen(true);
  };

  // Insert Link with SEO Attributes
  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    restoreSelection();
    editorRef.current?.focus();

    const relAttr = linkNofollow ? 'rel="nofollow noopener"' : 'rel="dofollow"';
    const targetAttr = linkTargetBlank ? 'target="_blank"' : '';
    const displayText = linkText.trim() || linkUrl;

    const linkHtml = `<a href="${linkUrl.trim()}" ${targetAttr} ${relAttr} class="text-primary font-medium underline underline-offset-2 hover:text-blue-400 transition-colors">${displayText}</a>`;

    document.execCommand("insertHTML", false, linkHtml);
    handleEditorInput();

    setIsLinkDialogOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  // Remove Link
  const handleRemoveLink = () => {
    execCmd("unlink");
  };

  // Insert Table (WordPress Block Style)
  const handleInsertTable = () => {
    const tableHtml = `
      <div class="overflow-x-auto my-4">
        <table class="w-full text-xs text-left border border-border border-collapse rounded-xl overflow-hidden">
          <thead class="bg-muted/70 text-foreground font-bold">
            <tr>
              <th class="p-2.5 border border-border">Component / Spec</th>
              <th class="p-2.5 border border-border">Recommended Model</th>
              <th class="p-2.5 border border-border">Approx. Price (BDT)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr>
              <td class="p-2.5 border border-border font-medium">Processor (CPU)</td>
              <td class="p-2.5 border border-border">AMD Ryzen 7 7800X3D</td>
              <td class="p-2.5 border border-border font-mono text-emerald-500 font-semibold">৳ 51,500</td>
            </tr>
            <tr>
              <td class="p-2.5 border border-border font-medium">Graphics Card (GPU)</td>
              <td class="p-2.5 border border-border">GeForce RTX 4070 Ti Super 16GB</td>
              <td class="p-2.5 border border-border font-mono text-emerald-500 font-semibold">৳ 1,08,000</td>
            </tr>
            <tr>
              <td class="p-2.5 border border-border font-medium">Motherboard</td>
              <td class="p-2.5 border border-border">MSI B650 Gaming Plus WiFi</td>
              <td class="p-2.5 border border-border font-mono text-emerald-500 font-semibold">৳ 23,500</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p></p>
    `;
    document.execCommand("insertHTML", false, tableHtml);
    handleEditorInput();
  };

  // Insert Code Block
  const handleInsertCodeBlock = () => {
    const codeHtml = `
      <pre class="p-3.5 my-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto"><code>// Tech Benchmark & Specs Comparison
const config = {
  cpu: "Ryzen 7 7800X3D",
  cores: "8 Cores / 16 Threads",
  maxBoost: "5.0 GHz",
  l3Cache: "96MB 3D V-Cache"
};</code></pre><p></p>
    `;
    document.execCommand("insertHTML", false, codeHtml);
    handleEditorInput();
  };

  // Insert Callout Box
  const handleInsertCallout = () => {
    const calloutHtml = `
      <div class="p-4 my-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-foreground flex items-start gap-3">
        <span class="text-blue-500 font-bold text-sm">💡 Pro Tip:</span>
        <div class="text-xs leading-relaxed">
          Always check box serial number on the outer retail box and match it with the processor heat-spreader to guarantee 3-years official Bangladesh distributor replacement warranty!
        </div>
      </div>
      <p></p>
    `;
    document.execCommand("insertHTML", false, calloutHtml);
    handleEditorInput();
  };

  // Insert Media (Image)
  const handleInsertMedia = () => {
    if (!mediaImageUrl.trim()) return;

    restoreSelection();
    editorRef.current?.focus();

    const captionHtml = mediaCaption.trim()
      ? `<figcaption class="text-center text-xs text-muted-foreground mt-2 italic">${mediaCaption.trim()}</figcaption>`
      : "";

    const figureHtml = `
      <figure class="my-5 text-center">
        <img
          src="${mediaImageUrl.trim()}"
          alt="${mediaAlt.trim() || "The Solutions BD Hardware Article"}"
          class="max-w-full rounded-2xl mx-auto shadow-lg border border-border object-cover max-h-[450px]"
          loading="lazy"
        />
        ${captionHtml}
      </figure>
      <p></p>
    `;

    document.execCommand("insertHTML", false, figureHtml);
    handleEditorInput();

    setIsMediaDialogOpen(false);
    setMediaImageUrl("");
    setMediaAlt("");
    setMediaCaption("");
  };

  // Handle local image file upload for WordPress Add Media
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await adminApi.uploadImage(file, "blogs");
      if (res?.success && res?.url) {
        setMediaImageUrl(res.url);
      } else {
        alert("Failed to upload image. Please enter an image URL.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Word & Character count calculation
  const cleanText = (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
  const charCount = cleanText.length;
  const readingTime = Math.ceil(wordCount / 200) || 1;

  return (
    <div className="w-full border border-border rounded-2xl bg-card overflow-hidden shadow-sm flex flex-col font-sans">
      {/* 1. WordPress Classic Top Action Bar */}
      <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between gap-2 flex-wrap">
        {/* WordPress "Add Media" Button */}
        <button
          type="button"
          onClick={() => {
            saveSelection();
            setIsMediaDialogOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold shadow-xs transition-colors group"
        >
          <ImageIcon className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
          <span>Add Media</span>
        </button>

        {/* Visual vs Text/HTML Mode Tabs (WordPress Style) */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setMode("visual")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              mode === "visual"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-primary" />
            <span>Visual</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("html")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              mode === "html"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-blue-500" />
            <span>Text / HTML</span>
          </button>
        </div>
      </div>

      {/* 2. WordPress Formatting Toolbar (Visible in Visual Mode) */}
      {mode === "visual" && (
        <div className="px-3 py-2 bg-card border-b border-border flex items-center gap-1 flex-wrap text-foreground">
          {/* Headings Selector */}
          <select
            onChange={(e) => handleBlockFormat(e.target.value)}
            defaultValue="p"
            className="px-2.5 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary mr-1"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1 (H1)</option>
            <option value="h2">Heading 2 (H2)</option>
            <option value="h3">Heading 3 (H3)</option>
            <option value="h4">Heading 4 (H4)</option>
          </select>

          <span className="w-px h-5 bg-border mx-1" />

          {/* Inline Styling: Bold, Italic, Underline, Strikethrough */}
          <button
            type="button"
            onClick={() => execCmd("bold")}
            title="Bold (Ctrl+B)"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("italic")}
            title="Italic (Ctrl+I)"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("underline")}
            title="Underline (Ctrl+U)"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("strikeThrough")}
            title="Strikethrough"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-5 bg-border mx-1" />

          {/* Lists & Quotes */}
          <button
            type="button"
            onClick={() => execCmd("insertUnorderedList")}
            title="Bulleted List"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("insertOrderedList")}
            title="Numbered List"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("formatBlock", "<blockquote>")}
            title="Blockquote"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-5 bg-border mx-1" />

          {/* Alignment */}
          <button
            type="button"
            onClick={() => execCmd("justifyLeft")}
            title="Align Left"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("justifyCenter")}
            title="Align Center"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("justifyRight")}
            title="Align Right"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("justifyFull")}
            title="Justify"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-5 bg-border mx-1" />

          {/* Link Controls */}
          <button
            type="button"
            onClick={handleOpenLinkDialog}
            title="Insert Link with SEO rel tags"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <LinkIcon className="w-3.5 h-3.5 text-primary" />
          </button>
          <button
            type="button"
            onClick={handleRemoveLink}
            title="Remove Link"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Unlink className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-5 bg-border mx-1" />

          {/* Rich Content Blocks: Table, Code, Callout, HR */}
          <button
            type="button"
            onClick={handleInsertTable}
            title="Insert Specs Table"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium"
          >
            <TableIcon className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Table</span>
          </button>

          <button
            type="button"
            onClick={handleInsertCodeBlock}
            title="Insert Code Benchmark Block"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium"
          >
            <Code className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Code</span>
          </button>

          <button
            type="button"
            onClick={handleInsertCallout}
            title="Insert Pro Tip / Callout Box"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Tip Box</span>
          </button>

          <button
            type="button"
            onClick={() => execCmd("insertHorizontalRule")}
            title="Horizontal Divider Line"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => execCmd("removeFormat")}
            title="Clear Formatting"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-5 bg-border mx-1" />

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={() => execCmd("undo")}
            title="Undo"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("redo")}
            title="Redo"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Editor Content Canvas */}
      <div className="relative flex-1 bg-background">
        {mode === "visual" ? (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onBlur={handleEditorInput}
            style={{ minHeight }}
            data-placeholder={placeholder}
            className="p-6 text-foreground text-sm leading-relaxed focus:outline-none overflow-y-auto max-h-[500px] prose dark:prose-invert max-w-none
              [&_h1]:text-2xl [&_h1]:font-black [&_h1]:tracking-tight [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-foreground
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:pb-1 [&_h2]:border-b [&_h2]:border-border [&_h2]:text-foreground
              [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-foreground
              [&_h4]:text-sm [&_h4]:font-bold [&_h4]:mt-3 [&_h4]:mb-1 [&_h4]:text-foreground
              [&_p]:mb-3.5 [&_p]:leading-relaxed
              [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-primary/5 [&_blockquote]:px-4 [&_blockquote]:py-2.5 [&_blockquote]:my-4 [&_blockquote]:rounded-r-xl [&_blockquote]:italic
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:space-y-1
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol]:space-y-1
              [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-muted [&_code]:font-mono [&_code]:text-xs [&_code]:text-primary
              [&_hr]:my-6 [&_hr]:border-border"
          />
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ minHeight }}
            placeholder="<!-- Write or edit raw HTML tags like in WordPress Code Editor -->"
            className="w-full p-6 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-y max-h-[500px]"
          />
        )}
      </div>

      {/* 4. WordPress Bottom Word Count & Stats Bar */}
      <div className="px-4 py-2 bg-muted/40 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
        <div className="flex items-center gap-3 font-mono">
          <span>Words: <strong className="text-foreground">{wordCount}</strong></span>
          <span>•</span>
          <span>Characters: <strong className="text-foreground">{charCount}</strong></span>
          <span>•</span>
          <span>Reading: <strong className="text-foreground">~{readingTime} min</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>WordPress Rich Engine {mode === "visual" ? "Visual WYSIWYG" : "HTML Mode"}</span>
        </div>
      </div>

      {/* Modal: Insert Link Dialog */}
      {isLinkDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Insert / Edit Hyperlink</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkDialogOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertLink} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Destination URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://thesolutionsbd.com/products/..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Anchor / Link Text</label>
                <input
                  type="text"
                  placeholder="e.g. Official Ryzen 7 7800X3D Price in BD"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-border">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={linkTargetBlank}
                    onChange={(e) => setLinkTargetBlank(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Open link in a new tab (<code className="text-[10px]">target="_blank"</code>)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={linkNofollow}
                    onChange={(e) => setLinkNofollow(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Add <code className="text-[10px]">rel="nofollow"</code> (SEO external backlink policy)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkDialogOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm"
                >
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Media / Image Dialog */}
      {isMediaDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">WordPress Media Inserter</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMediaDialogOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* File Upload Option */}
              <div className="p-4 rounded-xl border border-dashed border-border bg-muted/30 text-center space-y-2">
                <Upload className="w-6 h-6 mx-auto text-primary" />
                <div className="text-xs font-semibold text-foreground">Upload from Computer</div>
                <div className="text-[11px] text-muted-foreground">PNG, JPG, WebP up to 10MB</div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold cursor-pointer transition-colors">
                  {isUploading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{isUploading ? "Uploading..." : "Select Image File"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-full h-px bg-border" />
                <span className="text-[11px] text-muted-foreground uppercase font-bold">OR URL</span>
                <span className="w-full h-px bg-border" />
              </div>

              {/* Image URL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Image URL *</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-... or /uploads/..."
                  value={mediaImageUrl}
                  onChange={(e) => setMediaImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Alt Text & Caption */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Alt Text (For Google Image SEO)</label>
                  <input
                    type="text"
                    placeholder="e.g. AMD Ryzen 7 7800X3D Processor Box"
                    value={mediaAlt}
                    onChange={(e) => setMediaAlt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Caption (Displayed under image)</label>
                  <input
                    type="text"
                    placeholder="e.g. Authentic box packaging from authorized distributor"
                    value={mediaCaption}
                    onChange={(e) => setMediaCaption(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Preview */}
              {mediaImageUrl && (
                <div className="p-2 rounded-xl border border-border bg-muted/20 text-center">
                  <div className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase">Image Preview:</div>
                  <img
                    src={mediaImageUrl}
                    alt="Preview"
                    className="max-h-36 rounded-lg mx-auto object-cover border border-border"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsMediaDialogOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!mediaImageUrl.trim()}
                  onClick={handleInsertMedia}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  Insert into Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
