import { SelectedFilesList } from "./SelectedFilesList";
import { useFileSelectionStore } from "./useFileSelectionStore";

export function FileSelection() {
  const { files, setFiles, removeFile } = useFileSelectionStore();

  function fileSelected(e: React.ChangeEvent) {
    const target = e.target as HTMLInputElement;
    const addedFiles = Array.from(target.files ?? []);

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

    target.files = null;
    target.value = "";
  }

  return (
    <>
      <SelectedFilesList files={files} onRemove={removeFile} />
      <div>
        <input
          type="file"
          multiple
          style={{ border: "1px solid red", padding: "20px" }}
          onChange={fileSelected}
        />
      </div>
    </>
  );
}
