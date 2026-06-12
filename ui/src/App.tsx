import { useQuery } from "@tanstack/react-query";
import "./App.css";
import { FileSelection } from "./file-selection/FileSelection";
import { useFileSelectionStore } from "./file-selection/useFileSelectionStore";
import { ProcessingList } from "./processing-list/ProcessingList";
import { useProcessingStore } from "./processing-list/useProcessingStore";
import type { AppState } from "./common/types";
import { useRef } from "react";
import { CoreApi } from "./common/core-api";
import { useCoreWs } from "./common/useCoreWs";
import { CORE_URL } from "./common/const";

export function App() {
  const { status: connectionStatus } = useCoreWs();
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
      const response = await fetch(`${CORE_URL}/api/state`);
      return response.json();
    },
  });

  const hasSelectedFiles = files.length > 0;
  const hasProcessingFiles = processingItems.length > 0;
  const hasFailed = processingItems.some((item) => item.status === "error");

  function startConversion() {
    if (!hasSelectedFiles) {
      return;
    }
    clearFileSelection();
    enqueue(files);
    process("all");
  }

  function startOver() {
    clearProcessing();
  }

  function retryFailed() {
    process("failed");
  }

  function showOutput() {
    api.current.openOutputDir();
  }

  function refresh() {
    window.location.reload();
  }

  function exit() {
    window.close();
  }

  if (connectionStatus === "pending") {
    return <div>loading...</div>;
  } else if (connectionStatus === "disconnected") {
    return (
      <div>
        <div>disconnected. try refreshing the page</div>
        <button onClick={refresh}>Refresh page</button>
        <button onClick={exit}>Exit</button>
      </div>
    );
  }

  return (
    <div>
      <h1>TODO</h1>
      <div>
        <p>Status</p>
        <p>Socket: {connectionStatus ? "yes" : "no"}</p>
        {!isPending && (
          <p>ffmpeg: {appState?.ffmpegAvailable ? "yes" : "no"}</p>
        )}
      </div>
      {!hasProcessingFiles ? <FileSelection /> : <ProcessingList />}
      {!hasProcessingFiles ? (
        <button onClick={startConversion}>Convert to mp3</button>
      ) : (
        <>
          {hasFailed && <button onClick={retryFailed}>Retry failed</button>}
          <button onClick={startOver}>Back</button>
          <button onClick={showOutput}>Show output</button>
        </>
      )}
    </div>
  );
}
