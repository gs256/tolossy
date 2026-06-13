import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DisconnectedScreen } from "./DisconnectedScreen";
import { LoadingScreen } from "./LoadingScreen";
import { SetupNeededScreen } from "./SetupNeededScreen";
import { FileSelection } from "@/features/file-selection/FileSelection";
import { useFileSelectionStore } from "@/features/file-selection/useFileSelectionStore";
import { ProcessingList } from "@/features/file-processing/ProcessingList";
import { useProcessingStore } from "@/features/file-processing/useProcessingStore";
import { useCoreWs } from "@/hooks/useCoreWs";
import { CORE_URL } from "@/lib/const";
import { CoreApi } from "@/lib/core-api";
import type { AppState } from "@/types/app";
import { truncatePath } from "@/lib/utils";

export function App() {
  const { status: connectionStatus } = useCoreWs();
  const { files, clear: clearFileSelection } = useFileSelectionStore();
  const {
    enqueue,
    process,
    items: processingItems,
    clear: clearProcessing,
  } = useProcessingStore();
  const isProcessing = useProcessingStore((state) =>
    state.items.some(
      (item) => item.status === "processing" || item.status === "waiting",
    ),
  );
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
  } else if (!appState?.ffmpegAvailable) {
    return <SetupNeededScreen />;
  } else if (connectionStatus === "disconnected") {
    return <DisconnectedScreen />;
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <Card className="min-w-md">
        <CardHeader>
          <CardTitle>tolossy</CardTitle>
          <CardDescription>
            <p>Convert any audio file to .mp3</p>
            <p>
              Output path:
              <Button
                variant="link"
                className="px-1"
                size="sm"
                onClick={showOutput}
              >
                {truncatePath(appState?.outputPath)}
              </Button>
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="-mx-4 scrollbar-thin scrollbar-thumb-accent max-h-[70vh] overflow-y-auto px-4">
            {!hasProcessingFiles ? <FileSelection /> : <ProcessingList />}
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          {!hasProcessingFiles ? (
            <Button onClick={startConversion} disabled={!hasSelectedFiles}>
              Convert to mp3
            </Button>
          ) : (
            <>
              {hasFailed && <Button onClick={retryFailed}>Retry failed</Button>}
              <Button
                onClick={startOver}
                variant="outline"
                disabled={isProcessing}
              >
                Back
              </Button>
              <Button onClick={showOutput} variant="outline">
                Show output
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
