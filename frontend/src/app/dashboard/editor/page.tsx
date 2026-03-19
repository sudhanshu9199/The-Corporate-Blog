"use client";
import { useEffect, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import axios from "axios";

export default function EditorPage() {
  const { title, content, isSaving, setPost, autoSave } = useEditorStore();
  const [slugPreview, setSlugPreview] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [publishStatus, setPublishStatus] = useState("draft"); // 'draft', 'publishing', 'published'

  const [coverImage, setCoverImage] = useState("");
  const [metaDesc, setMetaDesc] = useState("");

  // Handle Slug Preview
  useEffect(() => {
    if (title) {
      setSlugPreview(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  }, [title]);

  // Auto-save logic (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave();
    }, 2000); // User ke type karne ke 2 second baad auto-save
    return () => clearTimeout(timer);
  }, [title, content]);

  const handlePublishClick = () => {
    // FE Validation Check before opening modal
    if (!title || !slugPreview || !coverImage || !metaDesc) {
      alert("❌ Validation Failed: Title, Slug, Banner Image, and Meta Description are required to publish!");
      return;
    }
    setShowModal(true);
  };


  const confirmPublish = async () => {
    setPublishStatus("publishing");
    try {
      // Assuming you have the current post ID in your store
      const postId = 1; // Replace with actual draft ID
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/publish`, {
        author_id: 1, // Replace with authenticated user ID
        // scheduled_date: "2026-05-01T10:00:00Z" // Pass this if scheduling
      });
      
      setPublishStatus("published");
      setShowModal(false);
      alert(`✅ Post Published Successfully! Live URL: /blog/${slugPreview}`);
    } catch (error) {
      console.error("Publish failed", error);
      alert("Failed to publish post.");
      setPublishStatus("draft");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Write a Post</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded-full">
            Status: {publishStatus.toUpperCase()}
          </span>
          <span className="text-sm text-gray-500">
            {isSaving ? "🔄 Saving..." : "✅ Saved as Draft"}
          </span>
          <button 
            onClick={handlePublishClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Publish Post
          </button>
        </div>
      </div>

      {/* Inputs for required fields to pass validation */}
      <input type="text" placeholder="Cover Image URL" className="w-full border p-2 mb-2" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
      <input type="text" placeholder="SEO Meta Description" className="w-full border p-2 mb-4" value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} />

      <input 
        type="text" placeholder="Post Title" 
        className="w-full text-3xl font-bold border-none outline-none mb-2"
        value={title} onChange={(e) => setPost({ title: e.target.value })}
      />
      <p className="text-sm text-gray-400 mb-6">Preview URL: /blog/{slugPreview}</p>

      <textarea 
        placeholder="Start writing blocks (JSON format placeholder)..." 
        className="w-full h-96 border p-4 outline-none rounded-lg"
        value={typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
        onChange={(e) => setPost({ content: e.target.value })}
      />

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Publish</h2>
            <p className="mb-6 text-gray-600">Are you sure you want to make this post live? It will be instantly visible to search engines.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 border rounded">Cancel</button>
              <button onClick={confirmPublish} className="px-4 py-2 bg-green-600 text-white rounded">
                {publishStatus === 'publishing' ? 'Publishing...' : 'Yes, Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}