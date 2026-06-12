export type ProcessingItemStatus = "processing" | "error" | "done" | "waiting";
export type ProcessingFilter = "all" | "failed";

export interface ProcessingItem {
  file: File;
  name: string;
  status: ProcessingItemStatus;
  logs: string;
}
