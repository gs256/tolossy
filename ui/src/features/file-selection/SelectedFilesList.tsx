import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Music, X } from "lucide-react";

export function SelectedFilesList(props: {
  files: File[];
  onRemove: (name: string) => void;
}) {
  const { files, onRemove } = props;

  return (
    <div className="flex flex-col gap-2">
      {files.map((file, i) => (
        <Item variant="outline" size="sm" key={i}>
          <ItemMedia variant="icon">
            <Music />
          </ItemMedia>
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
