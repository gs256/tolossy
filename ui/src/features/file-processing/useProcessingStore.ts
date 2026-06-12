import { CoreApi } from "@/lib/core-api";
import type { ProcessingFilter, ProcessingItem } from "@/types/processing";
import { create } from "zustand";

export interface ProcessingStore {
  items: ProcessingItem[];
  enqueue: (files: File[]) => void;
  clear: () => void;
  process: (filter: ProcessingFilter) => Promise<void>;
}

const api = new CoreApi();

export const useProcessingStore = create<ProcessingStore>((set, state) => ({
  items: [],

  enqueue: (files: File[]) => {
    set({
      items: files.map((file) => ({
        file,
        name: file.name,
        status: "waiting",
        logs: "",
      })),
    });
  },

  clear: () => {
    set({ items: [] });
  },

  process: async (filter: ProcessingFilter) => {
    const updateItem = (name: string, changes: Partial<ProcessingItem>) => {
      set({
        items: state().items.map((item) => {
          return item.name === name ? { ...item, ...changes } : item;
        }),
      });
    };

    const items =
      filter === "failed"
        ? state().items.filter((item) => item.status === "error")
        : state().items;

    for (const item of items) {
      updateItem(item.name, { status: "processing" });
      const result = await api.convert(item.file);
      updateItem(item.name, {
        status: result.success ? "done" : "error",
        logs: result.message,
      });
    }
  },
}));
