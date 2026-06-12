import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import { X } from "lucide-react";

export function SelectedFilesList(props: {
  files: File[];
  onRemove: (name: string) => void;
}) {
  const { files, onRemove } = props;

  return (
    <div className="flex flex-col gap-2">
      {files.map((file, i) => (
        <Item variant="outline" size="sm" key={i}>
          <ItemContent>
            <ItemTitle>{file.name}</ItemTitle>
          </ItemContent>
          <ItemActions>
            <X
              className="size-4 cursor-pointer"
              onClick={() => onRemove(file.name)}
            />
          </ItemActions>
        </Item>
      ))}
    </div>
  );
}
