import { AlertTriangle } from "lucide-react";

interface ErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorFallback({
  message,
  onRetry,
}: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px] animate-fade-in">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Something went wrong
          </h3>
          <p className="text-sm text-gray-500">
            {message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors focus-ring"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
