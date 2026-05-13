import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  description?: string;
  footer?: React.ReactNode;
}

export function SlideOver({
  isOpen,
  onClose,
  title,
  children,
  description,
  footer,
}: SlideOverProps) {
  const [mounted, setMounted] = useState(isOpen);

  // Sync state during render to avoid cascading renders from useEffect
  if (isOpen && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div
            className={`pointer-events-auto w-screen max-w-xl transform transition duration-300 ease-in-out sm:duration-500 ${
              isOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex h-full flex-col bg-white shadow-2xl">
              {/* Header */}
              <div className="px-6 py-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                      {title}
                    </h2>
                    {description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {description}
                      </p>
                    )}
                  </div>
                  <div className="ml-3 flex h-7 items-center">
                    <button
                      type="button"
                      className="rounded-xl bg-gray-50 p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-all outline-none"
                      onClick={onClose}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="relative flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 px-6 py-6 bg-gray-50/50">
                  {footer}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
