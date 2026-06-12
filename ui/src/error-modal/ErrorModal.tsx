import { useEffect, useRef } from "react";
import type { ProcessingItem } from "../processing-list/useProcessingStore";

export function ErrorModal(props: {
  open: boolean;
  setOpen: (open: boolean) => void;
  item: ProcessingItem;
}) {
  const { open, setOpen, item } = props;
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (dialogRef.current) {
      if (open && !dialogRef.current.open) {
        dialogRef.current?.show();
      } else if (!open && dialogRef.current.open) {
        dialogRef.current?.close();
      }
    }
  }, [open]);

  function closeErrorModal() {
    setOpen(false);
  }

  return (
    <dialog ref={dialogRef} style={{ maxWidth: "90vw" }}>
      <div>
        <h1>{item.name}</h1>
        <pre>
          <code style={{ textWrap: "wrap" }}>{item.logs}</code>
        </pre>
        <button onClick={closeErrorModal}>Close</button>
      </div>
    </dialog>
  );
}
