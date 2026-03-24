import { create } from "zustand";
import axios from "axios";

interface EditorState {
  postId: number | null;
  title: string;
  content: any;
  isSaving: boolean;
  wordCount: number;
  readingTime: number;
  seoScore: number;
  setPost: (data: Partial<EditorState>) => void;
  autoSave: () => Promise<void>;
  calculateMetrics: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  postId: null,
  title: "",
  content: {},
  isSaving: false,
  wordCount: 0,
  readingTime: 0,
  seoScore: 0,

  setPost: (data) => {
    set((state) => ({ ...state, ...data }));
    get().calculateMetrics();
  },

  calculateMetrics: () => {
    const { title, content } = get();
    let text = title + " ";

    // Extract text from EditorJS blocks
    if (content?.blocks) {
      content.blocks.forEach((block: any) => {
        if (block.data?.text) text += block.data.text + " ";
        if (block.data?.items) text += JSON.stringify(block.data.items) + " ";
      });
    }

    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    const readTime = Math.ceil(words / 200); // 200 words per minute

    let score = 0;
    if (title.length > 40 && title.length < 60) score += 30; // Optimal title length
    if (words > 300) score += 40; // Good content length
    if (content?.blocks?.some((b: any) => b.type === "image")) score += 30; // Has media

    set({ wordCount: words, readingTime: readTime, seoScore: score });
  },

  autoSave: async () => {
    const { postId, title, content } = get();
    if (!title) return; // Bina title ke save nahi karenge

    set({ isSaving: true });
    try {
      if (!postId) {
        // Create Draft
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/posts`,
          { title, content, author_id: 1 },
        );
        set({ postId: res.data.post.id });
      } else {
        // Update Draft
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}`,
          { title, content },
        );
      }
    } catch (error) {
      console.error("Auto-save failed", error);
    } finally {
      set({ isSaving: false });
    }
  },
}));
