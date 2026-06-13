import { useState } from "react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Check, CircleX, Clock4, ListX, TextAlignStart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { ErrorModal } from "@/components/ErrorModal";
import type { ProcessingItem } from "@/types/processing";
import { useProcessingStore } from "./useProcessingStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ProcessingList() {
  const { items } = useProcessingStore();
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<ProcessingItem | null>(null);

  function showLogs(item: ProcessingItem) {
    setItem(item);
    setOpen(true);
  }

  function canViewLogs(item: ProcessingItem) {
    return item.status === "done" || item.status === "error";
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Item variant="outline" key={item.name}>
            <ItemMedia variant="icon">
              {item.status === "waiting" && <Clock4 />}
              {item.status === "processing" && <Spinner />}
              {item.status === "done" && <Check className="text-green-400" />}
              {item.status === "error" && <CircleX className="text-red-400" />}
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{item.name}</ItemTitle>
              <ItemDescription className="flex gap-2">
                <span>
                  Status:{" "}
                  <span
                    className={cn(
                      item.status === "done" && "text-green-400",
                      item.status === "error" && "text-red-400",
                      item.status === "processing" && "text-orange-300",
                    )}
                  >
                    {item.status}
                  </span>
                </span>
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              {canViewLogs(item) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => showLogs(item)}
                    >
                      {item.status === "error" ? (
                        <ListX className="text-red-400" />
                      ) : (
                        <TextAlignStart className="text-muted-foreground" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View logs</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </ItemActions>
          </Item>
        ))}
      </div>
      {item && <ErrorModal open={open} setOpen={setOpen} item={item} />}
    </>
  );
}
