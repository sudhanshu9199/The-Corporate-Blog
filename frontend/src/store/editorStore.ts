import { create } from 'zustand';
import axios from "axios";

interface EditorState {
    postId: number | null;
  title: string;
  content: any[];
  isSaving: boolean;
  setPost: (data: Partial<EditorState>) => void;
  autoSave: () => Promise<void>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  postId: null,
  title: '',
  content: {},
  isSaving: false,
  
  setPost: (data) => set((state) => ({ ...state, ...data })),
  
  autoSave: async () => {
    const { postId, title, content } = get();
    if (!title) return; // Bina title ke save nahi karenge
    
    set({ isSaving: true });
    try {
      if (!postId) {
         // Create Draft
         const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, { title, content, author_id: 1 });
         set({ postId: res.data.post.id });
      } else {
         // Update Draft
         await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}`, { title, content });
      }
    } catch (error) {
      console.error("Auto-save failed", error);
    } finally {
      set({ isSaving: false });
    }
  }
}));