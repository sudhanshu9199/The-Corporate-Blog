// frontend/src/store/editorStore.ts
import { create } from 'zustand';

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