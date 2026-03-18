"use client";
import { useEffect, useState } from "react";
import { useEditorStore } from "@/store/editorStore";

export default function EditorPage() {
  const { title, content, isSaving, setPost, autoSave } = useEditorStore();
  const [slugPreview, setSlugPreview] = useState("");

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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Write a Post</h1>
        <span className="text-sm text-gray-500">
          {isSaving ? "🔄 Saving..." : "✅ Saved as Draft"}
        </span>
      </div>

      <input 
        type="text" 
        placeholder="Post Title" 
        className="w-full text-3xl font-bold border-none outline-none mb-2"
        value={title}
        onChange={(e) => setPost({ title: e.target.value })}
      />
      <p className="text-sm text-gray-400 mb-6">Preview URL: /blog/{slugPreview}</p>

      <textarea 
        placeholder="Start writing blocks (JSON format placeholder)..." 
        className="w-full h-96 border p-4 outline-none rounded-lg"
        value={typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
        onChange={(e) => setPost({ content: e.target.value })} // In real app, connect this to a Block Editor
      />
    </div>
  );
}