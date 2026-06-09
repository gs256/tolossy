import { useProcessingStore } from "./useProcessingStore";

export function ProcessingList() {
  const { items } = useProcessingStore();

  return (
    <div>
      {items.map((item) => (
        <div key={item.name}>
          {item.name} [{item.status}]
        </div>
      ))}
    </div>
  );
}
