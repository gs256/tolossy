import { create } from "zustand";

export interface FileSelectionStore {
  files: File[];
  setFiles: (files: File[]) => void;
  removeFile: (name: string) => void;
}

export const useFileSelectionStore = create<FileSelectionStore>(
  (set, state) => ({
    files: [],

    setFiles: (files: File[]) => {
      set({ files });
    },

    removeFile: (name: string) => {
      set({ files: state().files.filter((file) => file.name !== name) });
    },
  }),
);
