import { Loader2 } from "lucide-react";

export default function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading…</p>
      </div>
    </div>
  );
}
