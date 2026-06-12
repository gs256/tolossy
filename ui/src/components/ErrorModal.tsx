import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProcessingItem } from "@/types/processing";

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="min-w-2xl">
        <DialogHeader>
          <DialogTitle>Conversion logs</DialogTitle>
          <DialogDescription>{item.name}</DialogDescription>
        </DialogHeader>
        <div className="-mx-4 scrollbar-thin scrollbar-thumb-accent max-h-[50vh] overflow-y-auto px-4">
          <pre>
            <code style={{ textWrap: "wrap" }}>{item.logs}</code>
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
