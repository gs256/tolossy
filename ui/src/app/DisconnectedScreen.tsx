import { Button } from "../components/ui/button";

export function DisconnectedScreen() {
  function refresh() {
    window.location.reload();
  }

  function exit() {
    window.close();
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex flex-col gap-2 items-center">
        <div className="text-sm text-muted-foreground">
          Disconnected. Try refreshing the page.
        </div>
        <div className="flex gap-2">
          <Button onClick={refresh} variant="outline">
            Refresh page
          </Button>
          <Button onClick={exit} variant="destructive">
            Quit
          </Button>
        </div>
      </div>
    </div>
  );
}
