import "./App.css";
import { FileSelection } from "./file-selection/FileSelection";
import { useFileSelectionStore } from "./file-selection/useFileSelectionStore";
import { ProcessingList } from "./processing-list/ProcessingList";
import { useProcessingStore } from "./processing-list/useProcessingStore";

export function App() {
  const { files, clear: clearFileSelection } = useFileSelectionStore();
  const {
    process,
    items: processingItems,
    clear: clearProcessing,
  } = useProcessingStore();

  const hasSelectedFiles = files.length > 0;
  const hasProcessingFiles = processingItems.length > 0;

  function startConversion() {
    if (!hasSelectedFiles) {
      return;
    }
    clearFileSelection();
    process(files);
  }

  function startOver() {
    clearProcessing();
  }

  return (
    <div>
      <h1>TODO</h1>
      {!hasProcessingFiles ? <FileSelection /> : <ProcessingList />}
      {!hasProcessingFiles ? (
        <button onClick={startConversion}>Convert to mp3</button>
      ) : (
        <button onClick={startOver}>Start over</button>
      )}
    </div>
  );
}
