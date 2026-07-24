import { useState, useRef } from "react";

export function useDragReorder<T extends { id: string }>(
  items: T[],
  onReorder: (orderedIds: string[]) => void
) {
  const [orderedItems, setOrderedItems] = useState<T[] | null>(null);
  const draggedId = useRef<string | null>(null);
  const dragOverId = useRef<string | null>(null);
  
  const displayedItems = orderedItems ?? items;

  const handleDragStart = (id: string) => {
    draggedId.current = id;
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragOverId.current = id;
  };

  const handleDragEnd = () => {
    if (
      !draggedId.current ||
      !dragOverId.current ||
      draggedId.current === dragOverId.current
    ) {
      draggedId.current = null;
      dragOverId.current = null;
      return;
    }
    
    const current = orderedItems ?? items;
    const fromIdx = current.findIndex((x) => x.id === draggedId.current);
    const toIdx = current.findIndex((x) => x.id === dragOverId.current);
    
    const reordered = [...current];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    
    setOrderedItems(reordered);
    onReorder(reordered.map((x) => x.id));
    
    draggedId.current = null;
    dragOverId.current = null;
  };

  const resetOrder = () => setOrderedItems(null);

  return {
    displayedItems,
    resetOrder,
    dragProps: (id: string) => ({
      onDragStart: () => handleDragStart(id),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, id),
      onDragEnd: handleDragEnd,
    }),
  };
}
