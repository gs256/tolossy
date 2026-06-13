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
import { CoreApi } from "@/lib/core-api";
import { truncatePath } from "@/lib/utils";
import { PageWrapper } from "@/components/PageWrapper";
import { ScrollableArea } from "@/components/ScrollableArea";
import { createAppStateQuery } from "@/lib/queries";
import { useProcessingStoreComputed } from "@/features/file-processing/useProcessingStoreComputed";
import type { AppState } from "@/types/app";

export function App() {
  const { status: connectionStatus } = useCoreWs();
  const { files, clear: clearFileSelection } = useFileSelectionStore();
  const api = useRef(new CoreApi());
  const { data: appState, isPending } = useQuery(createAppStateQuery());
  const { isProcessing, someFailed } = useProcessingStoreComputed();
  const {
    enqueue,
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

  async function quit() {
    await api.current.shutdown();
    window.close();
  }

  if (connectionStatus === "pending" || !appState || isPending) {
    return <LoadingScreen />;
  } else if (!appState?.ffmpegAvailable) {
    return <SetupNeededScreen />;
  } else if (connectionStatus === "disconnected") {
    return <DisconnectedScreen />;
  }

  return (
    <PageWrapper>
      <Card className="min-w-md">
        <CardHeader>
          <CardTitle>tolossy</CardTitle>
          <CardDescription>
            <p>Convert any audio file to .mp3</p>
            <OutputPath reveal={showOutput} appState={appState} />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollableArea className="max-h-[70vh]">
            {!hasProcessingFiles ? <FileSelection /> : <ProcessingList />}
          </ScrollableArea>
        </CardContent>
        <CardFooter className="gap-2">
          {!hasProcessingFiles ? (
            <Button onClick={startConversion} disabled={!hasSelectedFiles}>
              Convert to mp3
            </Button>
          ) : (
            <>
              {someFailed && (
                <Button onClick={retryFailed}>Retry failed</Button>
              )}
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
          <Button variant="destructive" onClick={quit}>
            Quit
          </Button>
        </CardFooter>
      </Card>
    </PageWrapper>
  );
}

function OutputPath(props: { reveal: () => void; appState: AppState }) {
  return (
    <p>
      Output path:
      <Button variant="link" className="px-1" size="sm" onClick={props.reveal}>
        {truncatePath(props.appState.outputPath)}
      </Button>
    </p>
  );
}
