import { useState } from "react";
import { useProcessingStore, type ProcessingItem } from "./useProcessingStore";
import { ErrorModal } from "../error-modal/ErrorModal";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Check, ChevronRightIcon, CircleX, Clock4 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

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
                {canViewLogs(item) && (
                  <Badge
                    variant={
                      item.status === "error" ? "destructive" : "outline"
                    }
                    onClick={() => showLogs(item)}
                    className="select-none cursor-pointer"
                  >
                    View logs
                  </Badge>
                )}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="icon" variant="ghost">
                <ChevronRightIcon />
              </Button>
            </ItemActions>
          </Item>
        ))}
      </div>
      {item && <ErrorModal open={open} setOpen={setOpen} item={item} />}
    </>
  );
}
