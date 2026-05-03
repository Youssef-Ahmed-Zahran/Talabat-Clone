import toast from "react-hot-toast";

/**
 * Parses and displays a user-friendly error message from an API error response.
 * Fallbacks to a generic "friendly" message if no specific error is provided.
 *
 * @param err The error object (usually from Axios)
 * @param fallback A generic fallback message (e.g., "Failed to update")
 */
export const handleApiError = (
  err: unknown,
  fallback: string = "Something went wrong. Please try again.",
) => {
  // 1. Try to extract message from backend response
  const axiosError = err as { response?: { data?: { message?: string } } };
  const backendMessage = axiosError?.response?.data?.message;

  // 2. If backend message is too technical, simplify it
  let friendlyMessage = backendMessage || fallback;

  if (
    friendlyMessage.toLowerCase().includes("prisma") ||
    friendlyMessage.toLowerCase().includes("invocation") ||
    friendlyMessage.toLowerCase().includes("uuid")
  ) {
    friendlyMessage =
      "We encountered a technical issue. Our team has been notified.";
  }

  // 3. Show toast with a friendly vibe
  toast.error(friendlyMessage, {
    style: {
      borderRadius: "12px",
      background: "#333",
      color: "#fff",
    },
    duration: 4000,
  });
};
