import { useState, useEffect } from "react";

/**
 * Delays updating the returned value until the user stops typing.
 * Mirrors admin/src/hooks/useDebouncing.ts
 */
export const useDebouncing = <T>(value: T, delay = 400): T => {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
