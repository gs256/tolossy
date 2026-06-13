import { PageWrapper } from "@/components/PageWrapper";
import { ScrollableArea } from "@/components/ScrollableArea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ProcessingList } from "@/features/file-processing/ProcessingList";
import { useProcessingStore } from "@/features/file-processing/useProcessingStore";
import { useProcessingStoreComputed } from "@/features/file-processing/useProcessingStoreComputed";
import { FileSelection } from "@/features/file-selection/FileSelection";
import { useFileSelectionStore } from "@/features/file-selection/useFileSelectionStore";
import { CoreApi } from "@/lib/core-api";
import { truncatePath } from "@/lib/utils";
import type { AppState } from "@/types/app";
import { useRef } from "react";

export function MainPage(props: { appState: AppState }) {
  const { appState } = props;
  const { files, clear: clearFileSelection } = useFileSelectionStore();
  const {
    enqueue,
    process,
    items: processingItems,
    clear: clearProcessing,
  } = useProcessingStore();
  const api = useRef(new CoreApi());

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
            <SelectionStageButtons
              hasSelectedFiles={hasSelectedFiles}
              startConversion={startConversion}
            />
          ) : (
            <ProcessingStageButtons
              retryFailed={retryFailed}
              startOver={startOver}
              showOutput={showOutput}
            />
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

function SelectionStageButtons(props: {
  hasSelectedFiles: boolean;
  startConversion: () => void;
}) {
  const { startConversion, hasSelectedFiles } = props;

  return (
    <Button onClick={startConversion} disabled={!hasSelectedFiles}>
      Convert to mp3
    </Button>
  );
}

function ProcessingStageButtons(props: {
  retryFailed: () => void;
  startOver: () => void;
  showOutput: () => void;
}) {
  const { retryFailed, startOver, showOutput } = props;
  const { isProcessing, someFailed } = useProcessingStoreComputed();

  return (
    <>
      {someFailed && <Button onClick={retryFailed}>Retry failed</Button>}
      <Button onClick={startOver} variant="outline" disabled={isProcessing}>
        Back
      </Button>
      <Button onClick={showOutput} variant="outline">
        Show output
      </Button>
    </>
  );
}
