"use client";
import { create } from 'zustand';
import { useEffect, useState } from "react";
import axios from "axios";

interface EditorState {
  title: string;
  blocks: any[];
  status: 'draft' | 'published';
  setTitle: (title: string) => void;
  addBlock: (block: any) => void;
  updateBlock: (id: string, data: any) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  title: '',
  blocks: [],
  status: 'draft',
  setTitle: (title) => set({ title }),
  addBlock: (block) => set((state) => ({ blocks: [...state.blocks, block] })),
  updateBlock: (id, data) => set((state) => ({
    blocks: state.blocks.map(b => b.id === id ? { ...b, data } : b)
  })),
}));

export default function DraftEditor({ postId }) {
  const { content, title, setContent } = useEditorStore();
  
  // Auto-save Logic (Debouncing)
  useEffect(() => {
    const timer = setTimeout(() => {
      if(title || content) {
        axios.put(`/api/posts/${postId}`, { title, content });
      }
    }, 3000); // 3 seconds baad auto-save

    return () => clearTimeout(timer);
  }, [content, title, postId]);

  return (
    <div>
      {/* Slug Preview */}
      <p className="text-gray-500">Preview: yourblog.com/blog/{title ? title.toLowerCase().replace(/ /g, '-') : 'new-post'}</p>
      {/* Editor component here */}
    </div>
  );
}