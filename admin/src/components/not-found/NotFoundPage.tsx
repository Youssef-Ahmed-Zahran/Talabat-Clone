import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 animate-fade-in">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-10 h-10 text-brand" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors focus-ring"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
