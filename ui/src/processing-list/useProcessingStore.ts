import { create } from "zustand";

export type ProcessingItemStatus = "processing" | "error" | "done";

export interface ProcessingItem {
  name: string;
  status: ProcessingItemStatus;
}

export interface ProcessingStore {
  items: ProcessingItem[];
  process: (files: File[]) => void;
  clear: () => void;
}

export const useProcessingStore = create<ProcessingStore>((set) => ({
  items: [],

  process: (files: File[]) => {
    set({
      items: files.map((file) => ({
        name: file.name,
        status: "processing",
      })),
    });
  },

  clear: () => {
    set({ items: [] });
  },
}));
