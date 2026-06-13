import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";

export function PageWrapper(props: { className?: string } & PropsWithChildren) {
  const { children, className } = props;

  return (
    <div
      className={cn(
        "h-screen flex flex-col items-center justify-center gap-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
