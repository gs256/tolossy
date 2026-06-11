import { useQuery } from "@tanstack/react-query";
import "./App.css";
import { FileSelection } from "./file-selection/FileSelection";
import { useFileSelectionStore } from "./file-selection/useFileSelectionStore";
import { ProcessingList } from "./processing-list/ProcessingList";
import { useProcessingStore } from "./processing-list/useProcessingStore";
import type { AppState } from "./common/types";
import { useRef } from "react";
import { CoreApi } from "./common/core-api";

export function App() {
  const { files, clear: clearFileSelection } = useFileSelectionStore();
  const {
    enqueue,
    process,
    items: processingItems,
    clear: clearProcessing,
  } = useProcessingStore();
  const api = useRef(new CoreApi());

  const { data: appState, isPending } = useQuery({
    queryKey: ["ffmpeg-available"],
    queryFn: async (): Promise<AppState> => {
      const response = await fetch("http://localhost:2479/api/state");
      return response.json();
    },
  });

  const hasSelectedFiles = files.length > 0;
  const hasProcessingFiles = processingItems.length > 0;

  function startConversion() {
    if (!hasSelectedFiles) {
      return;
    }
    clearFileSelection();
    enqueue(files);
    process();
  }

  function startOver() {
    clearProcessing();
  }

  function showOutput() {
    api.current.openOutputDir();
  }

  return (
    <div>
      <h1>TODO</h1>
      <div>
        <p>Status</p>
        {!isPending && (
          <p>ffmpeg: {appState?.ffmpegAvailable ? "yes" : "no"}</p>
        )}
      </div>
      {!hasProcessingFiles ? <FileSelection /> : <ProcessingList />}
      {!hasProcessingFiles ? (
        <button onClick={startConversion}>Convert to mp3</button>
      ) : (
        <>
          <button onClick={startOver}>Start over</button>
          <button onClick={showOutput}>Show output</button>
        </>
      )}
    </div>
  );
}
