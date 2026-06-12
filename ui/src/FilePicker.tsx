import { FilePlusCorner } from "lucide-react";
import { cn } from "./lib/utils";

export function FilePicker(props: { onFileSelected: (files: File[]) => void }) {
  function fileSelected(e: React.ChangeEvent) {
    const target = e.target as HTMLInputElement;
    const addedFiles = Array.from(target.files ?? []);

    props.onFileSelected(addedFiles);

    target.files = null;
    target.value = "";
  }

  return (
    <div className="relative">
      <input
        type="file"
        multiple
        className={cn("py-4 px-3 bg-white/3 w-full cursor-pointer opacity-0")}
        onChange={fileSelected}
      />
      <div className="absolute top-0 left-0 h-full pointer-events-none flex items-center justify-center gap-2 border-dashed border-2 rounded-xl bg-white/3 w-full">
        <FilePlusCorner className="size-4" />
        <span className="text-muted-foreground">
          Drop audio file or{" "}
          <span className="underline text-foreground">browse</span>
        </span>
      </div>
    </div>
  );
}
