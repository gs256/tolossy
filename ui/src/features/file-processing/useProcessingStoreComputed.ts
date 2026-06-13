import { useProcessingStore } from "./useProcessingStore";

export function useProcessingStoreComputed() {
  const isProcessing = useProcessingStore((state) =>
    state.items.some(
      (item) => item.status === "processing" || item.status === "waiting",
    ),
  );

  const someFailed = useProcessingStore((state) =>
    state.items.some((item) => item.status === "error"),
  );

  return { isProcessing, someFailed };
}
