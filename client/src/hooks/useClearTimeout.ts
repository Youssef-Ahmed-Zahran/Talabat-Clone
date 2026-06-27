import { useEffect } from "react";

/**
 * Custom hook to automatically close a modal or trigger a callback after a specified delay.
 * Useful for ensuring modals don't stay open indefinitely if a user forgets them.
 * 
 * @param onClose Callback function to be executed when the timeout expires (e.g., closing the modal).
 * @param isOpen Boolean indicating if the timer should be active. Defaults to true.
 * @param delay Time in milliseconds before the callback is triggered. Defaults to 10 minutes (600,000ms).
 */
export function useClearTimeout(
  onClose: () => void,
  isOpen: boolean = true,
  delay: number = 600000
) {
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onClose();
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose, isOpen, delay]);
}
