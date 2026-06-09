import { useState } from "react";
import { SelectedFilesList } from "./SelectedFilesList";

export function FileSelection() {
  const [files, setFiles] = useState<File[]>([]);

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

  function onRemove(name: string) {
    setFiles(files.filter((file) => file.name !== name));
  }

  return (
    <>
      <SelectedFilesList files={files} onRemove={onRemove} />
      <input
        type="file"
        multiple
        style={{ border: "1px solid red", padding: "30px" }}
        onChange={fileSelected}
      />
    </>
  );
}
