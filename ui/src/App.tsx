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
import { DisconnectedScreen } from "./DisconnectedScreen";
import { LoadingScreen } from "./LoadingScreen";
import { SetupNeededScreen } from "./SetupNeededScreen";

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

  if (connectionStatus === "pending" || !appState || isPending) {
    return <LoadingScreen />;
  } else if (!appState.ffmpegAvailable) {
    return <SetupNeededScreen />;
  } else if (connectionStatus === "disconnected") {
    return <DisconnectedScreen />;
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <Card className="min-w-md">
        <CardHeader>
          <CardTitle>tolossy</CardTitle>
          <CardDescription>Convert any audio file to .mp3</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasProcessingFiles ? <FileSelection /> : <ProcessingList />}
          <p className="pt-3 text-muted-foreground text-sm">
            Output directory: /path/TODO
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          {!hasProcessingFiles ? (
            <Button onClick={startConversion} disabled={!hasSelectedFiles}>
              Convert to mp3
            </Button>
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
