import { useCallback, useEffect, useRef } from 'react';

/**
 * Debounce a callback — delays invocation until after `delay` ms
 * have passed since the last call.
 */
export function useDebouncing<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debouncedFn;
}
