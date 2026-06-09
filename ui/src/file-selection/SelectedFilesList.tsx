export function SelectedFilesList(props: {
  files: File[];
  onRemove: (name: string) => void;
}) {
  const { files, onRemove } = props;

  return (
    <div>
      {files.map((file, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            width: "280px",
            justifyContent: "space-between",
          }}
        >
          <span>{file.name}</span>
          <button onClick={() => onRemove(file.name)}>x</button>
        </div>
      ))}
    </div>
  );
}
