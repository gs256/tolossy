import { useState } from "react";

export function FileSelection() {
  const [files, setFiles] = useState<File[]>([]);

  function fileSelected(e: React.ChangeEvent) {
    const target = e.target as HTMLInputElement;
    const addedFiles = Array.from(target.files ?? []);

    if (addedFiles.length > 0) {
      const newFiles = [...files];
      for (const added of addedFiles) {
        if (files.some((existing) => existing.name === added.name)) {
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
      <div>
        {files.map((file, i) => (
          <div key={i}>{file.name}</div>
        ))}
      </div>
      <input
        type="file"
        multiple
        style={{ border: "1px solid red", padding: "30px" }}
        onChange={fileSelected}
      />
    </>
  );
}
