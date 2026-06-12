import { FilePicker } from "@/components/FilePicker";
import { SelectedFilesList } from "./SelectedFilesList";
import { useFileSelectionStore } from "./useFileSelectionStore";

export function FileSelection() {
  const { files, setFiles, removeFile } = useFileSelectionStore();

  function fileSelected(addedFiles: File[]) {
    if (addedFiles.length > 0) {
      const newFiles = [...files];
      for (const added of addedFiles) {
        if (added.type === "") {
          alert(`Directories are not supported`);
        } else if (files.some((existing) => existing.name === added.name)) {
          alert(`File ${added.name} already added`);
        } else {
          newFiles.push(added);
        }
      }
      setFiles(newFiles);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {files.length > 0 && (
        <SelectedFilesList files={files} onRemove={removeFile} />
      )}
      <FilePicker onFileSelected={fileSelected} />
    </div>
  );
}
