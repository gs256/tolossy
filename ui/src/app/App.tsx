import { useQuery } from "@tanstack/react-query";
import { DisconnectedScreen } from "./DisconnectedScreen";
import { LoadingScreen } from "./LoadingScreen";
import { SetupNeededScreen } from "./SetupNeededScreen";
import { useCoreWs } from "@/hooks/useCoreWs";
import { createAppStateQuery } from "@/lib/queries";
import { MainPage } from "./MainPage";

export function App() {
  const { status } = useCoreWs();
  const { data: appState, isPending } = useQuery(createAppStateQuery());

  if (status === "disconnected" && !isPending) {
    return <DisconnectedScreen />;
  } else if (status === "pending" || !appState || isPending) {
    return <LoadingScreen />;
  } else if (!appState.ffmpegAvailable) {
    return <SetupNeededScreen />;
  }

  return <MainPage appState={appState} />;
}
