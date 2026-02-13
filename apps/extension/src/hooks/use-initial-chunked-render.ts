import { startTransition, useEffect, useRef, useState } from "react";

const DEFAULT_CHUNK_SIZE = 15;

export function useInitialChunkedRender<T>(
  items: T[],
  chunkSize: number = DEFAULT_CHUNK_SIZE
) {
  const [renderedCount, setRenderedCount] = useState(0);
  const isInitialRenderDoneRef = useRef(false);

  useEffect(() => {
    if (isInitialRenderDoneRef.current) return;
    if (renderedCount >= items.length) {
      if (items.length > 0) {
        isInitialRenderDoneRef.current = true;
      }
      return;
    }

    const rafId = requestAnimationFrame(() => {
      startTransition(() => {
        setRenderedCount((prev) => Math.min(prev + chunkSize, items.length));
      });
    });

    return () => cancelAnimationFrame(rafId);
  }, [renderedCount, items.length, chunkSize]);

  const isInitialRenderDone =
    isInitialRenderDoneRef.current ||
    (items.length > 0 && renderedCount >= items.length);

  const visibleItems = isInitialRenderDone
    ? items
    : items.slice(0, renderedCount);

  const isVisible = isInitialRenderDone || renderedCount > 0;

  return { visibleItems, isVisible, isInitialRenderDone };
}
