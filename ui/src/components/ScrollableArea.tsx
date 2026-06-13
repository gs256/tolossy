import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";

export function ScrollableArea(
  props: { className?: string } & PropsWithChildren,
) {
  const { children, className } = props;

  return (
    <div
      className={cn(
        "-mx-4 scrollbar-thin scrollbar-thumb-accent overflow-y-auto px-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
