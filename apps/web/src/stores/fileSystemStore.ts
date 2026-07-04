import { create } from 'zustand';
import type { FileNode } from '@/types';

interface FileSystemState {
  root: FileNode[];
  currentPath: string;
  currentParentId: string | null;
  isLoading: boolean;
  setRoot: (files: FileNode[]) => void;
  setCurrentPath: (path: string, parentId: string | null) => void;
  addNode: (node: FileNode) => void;
  removeNode: (id: string) => void;
  setLoading: (loading: boolean) => void;
  getNodeByPath: (path: string) => FileNode | undefined;
}

export const useFileSystemStore = create<FileSystemState>((set, get) => ({
  root: [],
  currentPath: '/',
  currentParentId: null,
  isLoading: false,

  setRoot: (root) => set({ root }),

  setCurrentPath: (currentPath, currentParentId) =>
    set({ currentPath, currentParentId }),

  addNode: (node) =>
    set((s) => ({ root: [...s.root, node] })),

  removeNode: (id) =>
    set((s) => ({ root: s.root.filter((n) => n.id !== id) })),

  setLoading: (isLoading) => set({ isLoading }),

  getNodeByPath: (path) => get().root.find((n) => n.path === path),
}));
