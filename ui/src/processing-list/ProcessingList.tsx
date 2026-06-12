import { useState } from "react";
import { useProcessingStore, type ProcessingItem } from "./useProcessingStore";
import { ErrorModal } from "../error-modal/ErrorModal";

export function ProcessingList() {
  const { items } = useProcessingStore();
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<ProcessingItem | null>(null);

  function showLogs(item: ProcessingItem) {
    setItem(item);
    setOpen(true);
  }

  return (
    <>
      <div>
        {items.map((item) => (
          <div key={item.name}>
            <span>
              {item.name} [{item.status}]
            </span>
            {item.logs && <button onClick={() => showLogs(item)}>logs</button>}
          </div>
        ))}
      </div>
      {item && <ErrorModal open={open} setOpen={setOpen} item={item} />}
    </>
  );
}
