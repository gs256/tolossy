import { Spinner } from "./components/ui/spinner";

export function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
