"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useEditorStore } from "@/store/editorStore";
import axios from "axios";

interface InternalLink {
  id: number;
  title: string;
  slug: string;
}

interface AnchorWarning {
  text: string;
  index: number;
}

const WEAK_ANCHOR_PATTERNS = [
  "click here",
  "here",
  "link",
  "read more",
  "more",
  "this",
  "url",
  "website",
  "page",
];

const MARKDOWN_LINK_RE = /\[([^\]]+)\]\([^)]+\)/g;

function detectWeakAnchors(content: string): AnchorWarning[] {
  const warnings: AnchorWarning[] = [];
  let match: RegExpExecArray | null;

  MARKDOWN_LINK_RE.lastIndex = 0;

  while ((match = MARKDOWN_LINK_RE.exec(content)) !== null) {
    const anchorText = match[1].trim().toLowerCase();
    if (WEAK_ANCHOR_PATTERNS.includes(anchorText)) {
      warnings.push({ text: match[1], index: match.index });
    }
  }
  return warnings;
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const MOCK_INTERNAL_POSTS: InternalLink[] = [
  { id: 1, title: "Getting Started with Next.js 14", slug: "getting-started-nextjs-14" },
  { id: 2, title: "Understanding React Server Components", slug: "react-server-components" },
  { id: 3, title: "MERN Stack Best Practices 2025", slug: "mern-stack-best-practices-2025" },
  { id: 4, title: "Mastering Tailwind CSS Layouts", slug: "mastering-tailwind-css-layouts" },
  { id: 5, title: "JWT Auth in Express.js", slug: "jwt-auth-expressjs" },
  { id: 6, title: "MongoDB Aggregation Pipeline Deep Dive", slug: "mongodb-aggregation-pipeline" },
];

export default function EditorPage() {
  const { title, content, isSaving, setPost, autoSave } = useEditorStore();
  const [slugPreview, setSlugPreview] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"draft" | "publishing" | "published">("draft"); // 'draft', 'publishing', 'published'

  const [coverImage, setCoverImage] = useState("");
  const [metaDesc, setMetaDesc] = useState("");

  // ── SEO / Sidebar state
  const [keywords, setKeywords]             = useState<string[]>([]);
  const [isFetchingKw, setIsFetchingKw]     = useState(false);
  const [anchorWarnings, setAnchorWarnings] = useState<AnchorWarning[]>([]);
  const [linkSearch, setLinkSearch]         = useState("");
  const [activeTab, setActiveTab]           = useState<"keywords" | "links">("keywords");
 
  // ── Ref to textarea for cursor-aware insertion
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSlugPreview(title ? toSlug(title) : "");
  }, [title]);

  // Auto-save logic (debounced)
  useEffect(() => {
    const timer = setTimeout(() => autoSave(), 2000);
    return () => clearTimeout(timer);
  }, [title, content, autoSave]);

  const fetchKeywords = useCallback(async (text: string) => {
    const stripped = text.trim();
    if (!stripped || stripped.length < 50) {
        setKeywords([]);
        return;
    }

    setIsFetchingKw(true);

    try {
        const { data } = await axios.post<{ keywords: string[] }>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/keywords`,
        { content: stripped }
      );
      setKeywords(data.keywords.slice(0, 10));
    } catch {
      // Graceful fallback: naive client-side extraction
      const words = stripped
        .replace(/[#*`[\]()>~_]/g, " ")          // strip markdown syntax
        .split(/\s+/)
        .map((w) => w.toLowerCase().replace(/[^a-z]/g, ""))
        .filter((w) => w.length > 5);
 
      const freq: Record<string, number> = {};
      words.forEach((w) => { freq[w] = (freq[w] ?? 0) + 1; });
 
      const top = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([w]) => w);
 
      setKeywords(top);
    } finally {
      setIsFetchingKw(false);
    }
  }, []);

  useEffect(() => {
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const timer = setTimeout(() => fetchKeywords(contentStr), 1500);
    return () => clearTimeout(timer);
  }, [content, fetchKeywords]);
 
  // ─────────────────────────────────────────────────────────────────────────
  // [FEATURE 2] Anchor text SEO validation — on every content change
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    setAnchorWarnings(detectWeakAnchors(contentStr));
  }, [content]);


  const insertLinkAtCursor = useCallback(
    (post: InternalLink) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
 
      const markdownLink = `[${post.title}](/blog/${post.slug})`;
      const start  = textarea.selectionStart ?? 0;
      const end    = textarea.selectionEnd   ?? 0;
      const currentContent = typeof content === "string" ? content : JSON.stringify(content, null, 2);
 
      const newContent =
        currentContent.slice(0, start) +
        markdownLink +
        currentContent.slice(end);
 
      setPost({ content: newContent });
 
      // Restore cursor position after the inserted link
      requestAnimationFrame(() => {
        const newCursor = start + markdownLink.length;
        textarea.setSelectionRange(newCursor, newCursor);
        textarea.focus();
      });
    },
    [content, setPost]
  );



  const handlePublishClick = () => {
    // FE Validation Check before opening modal
    if (!title || !slugPreview || !coverImage || !metaDesc) {
      alert(
        "❌ Validation Failed: Title, Slug, Banner Image, and Meta Description are required to publish!",
      );
      return;
    }
    setShowModal(true);
  };

  const confirmPublish = async () => {
    setPublishStatus("publishing");
    try {
      const postId = 1; // Replace with actual draft ID
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/publish`,
        {
          author_id: 1, // Replace with authenticated user ID
        },
      );

      setPublishStatus("published");
      setShowModal(false);
      alert(`✅ Post Published Successfully! Live URL: /blog/${slugPreview}`);
    } catch (error) {
      console.error("Publish failed", error);
      alert("Failed to publish post.");
      setPublishStatus("draft");
    }
  };

  const filteredLinks = MOCK_INTERNAL_POSTS.filter((p) =>
    p.title.toLowerCase().includes(linkSearch.toLowerCase())
  );

  const contentStr = typeof content === "string" ? content : JSON.stringify(content, null, 2);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
 
      {/* ── Main Editor Area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-y-auto p-8 max-w-4xl mx-auto w-full">
 
        {/* Header bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Write a Post</h1>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold px-3 py-1 bg-gray-100 rounded-full text-gray-600 uppercase tracking-wide">
              {publishStatus}
            </span>
            <span className="text-sm text-gray-400">
              {isSaving ? "🔄 Saving..." : "✅ Saved as Draft"}
            </span>
            <button
              onClick={handlePublishClick}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              Publish Post
            </button>
          </div>
        </div>
 
        {/* SEO fields */}
        <input
          type="text"
          placeholder="Cover Image URL"
          className="w-full border border-gray-200 rounded-lg p-2.5 mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
        />
        <input
          type="text"
          placeholder="SEO Meta Description"
          className="w-full border border-gray-200 rounded-lg p-2.5 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={metaDesc}
          onChange={(e) => setMetaDesc(e.target.value)}
        />
 
        {/* Title */}
        <input
          type="text"
          placeholder="Post Title"
          className="w-full text-3xl font-bold border-none outline-none mb-1 bg-transparent text-gray-900 placeholder-gray-300"
          value={title}
          onChange={(e) => setPost({ title: e.target.value })}
        />
        <p className="text-xs text-gray-400 mb-5">
          Preview URL: <span className="font-mono">/blog/{slugPreview || "your-post-slug"}</span>
        </p>
 
        {/* ── [FEATURE 2] Anchor text warnings banner */}
        {anchorWarnings.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
            <p className="text-sm font-semibold text-amber-800 mb-1">
              ⚠️ SEO Warning — Weak Anchor Text Detected ({anchorWarnings.length})
            </p>
            <ul className="list-disc list-inside text-sm text-amber-700 space-y-0.5">
              {anchorWarnings.map((w, i) => (
                <li key={i}>
                  <code className="bg-amber-100 px-1 rounded">[{w.text}]</code> — replace with a descriptive keyword phrase for better SEO.
                </li>
              ))}
            </ul>
          </div>
        )}
 
        {/* Content textarea */}
        <textarea
          ref={textareaRef}
          placeholder="Start writing in Markdown..."
          className="w-full h-96 border border-gray-200 rounded-lg p-4 outline-none resize-none text-sm text-gray-700 leading-relaxed focus:ring-2 focus:ring-blue-500 font-mono"
          value={contentStr}
          onChange={(e) => setPost({ content: e.target.value })}
        />
 
        <p className="text-xs text-gray-400 mt-2">
          Tip: Select a word in the editor, then click an internal link in the sidebar to insert it as a Markdown link.
        </p>
      </div>
 
      {/* ── Right Sidebar ───────────────────────────────────────────────── */}
      <aside className="w-72 border-l border-gray-200 bg-white flex flex-col overflow-hidden flex-shrink-0">
 
        {/* Sidebar tab switcher */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("keywords")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "keywords"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🔑 Keywords
          </button>
          <button
            onClick={() => setActiveTab("links")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "links"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🔗 Internal Links
          </button>
        </div>
 
        {/* ── [FEATURE 1] Keywords Tab */}
        {activeTab === "keywords" && (
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-xs text-gray-500 mb-3">
              Auto-extracted from your content. Use these naturally throughout your post for better SEO.
            </p>
 
            {isFetchingKw ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-7 bg-gray-100 rounded-full animate-pulse" />
                ))}
              </div>
            ) : keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center mt-8">
                Start writing to extract keywords…
              </p>
            )}
 
            {/* Anchor warning summary in keyword tab */}
            {anchorWarnings.length > 0 && (
              <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-700">
                  ⚠️ {anchorWarnings.length} weak anchor{anchorWarnings.length > 1 ? "s" : ""} found
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Avoid generic texts like "click here", "here", "read more".
                </p>
              </div>
            )}
          </div>
        )}
 
        {/* ── [FEATURE 3] Internal Links Tab */}
        {activeTab === "links" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search posts…"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
              />
            </div>
 
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {filteredLinks.length > 0 ? (
                filteredLinks.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => insertLinkAtCursor(post)}
                    title={`Insert: [${post.title}](/blog/${post.slug})`}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors group"
                  >
                    <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700 leading-snug">
                      {post.title}
                    </p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">
                      /blog/{post.slug}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center mt-8 px-4">
                  No posts match "{linkSearch}"
                </p>
              )}
            </div>
 
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">
                Click any post to insert a Markdown link at cursor
              </p>
            </div>
          </div>
        )}
      </aside>
 
      {/* ── Publish Confirmation Modal ───────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full shadow-xl mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Publish</h2>
            <p className="text-gray-500 text-sm mb-6">
              This post will become publicly visible and indexed by search engines immediately.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmPublish}
                disabled={publishStatus === "publishing"}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 font-medium"
              >
                {publishStatus === "publishing" ? "Publishing…" : "Yes, Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}