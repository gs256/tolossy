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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";

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
    api.current.cleanup();
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
    <div className="h-screen flex flex-col items-center justify-center">
      {/*{!hasProcessingFiles ? <FileSelection /> : <ProcessingList />}
      {!hasProcessingFiles ? (
        <Button onClick={startConversion}>Convert to mp3</Button>
      ) : (
        <>
          {hasFailed && <button onClick={retryFailed}>Retry failed</button>}
          <button onClick={startOver}>Back</button>
          <button onClick={showOutput}>Show output</button>
        </>
      )}*/}
      <Card className="min-w-lg">
        <CardHeader>
          <CardTitle>tolossy</CardTitle>
          <CardDescription>
            <p>Convert anything to mp3</p>
            <p>Socket: {connectionStatus ? "yes" : "no"}</p>
            {!isPending && (
              <p>ffmpeg: {appState?.ffmpegAvailable ? "yes" : "no"}</p>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasProcessingFiles ? <FileSelection /> : <ProcessingList />}
        </CardContent>
        <CardFooter>
          {!hasProcessingFiles ? (
            <Button onClick={startConversion}>Convert to mp3</Button>
          ) : (
            <>
              {hasFailed && <Button onClick={retryFailed}>Retry failed</Button>}
              <Button onClick={startOver} variant="outline">
                Back
              </Button>
              <Button onClick={showOutput} variant="secondary">
                Show output
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
