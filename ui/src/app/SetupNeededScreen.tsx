export function SetupNeededScreen() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex flex-col gap-2 items-center">
        <p className="text-sm text-muted-foreground text-center">
          Looks like <span className="font-mono text-foreground">ffmpeg</span>{" "}
          is not available on your system.
          <br />
          Please, install it and restart the app.
        </p>
      </div>
    </div>
  );
}
