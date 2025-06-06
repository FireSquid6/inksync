import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { errorsAtom } from "../lib/state";

export function ErrorsDisplay() {
  const [error, setError] = useAtom(errorsAtom);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        dismissError();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  const dismissError = () => {
    setIsVisible(false);
    // Clear the error after animation completes
    setTimeout(() => {
      setError(null);
    }, 300);
  };

  if (!error) return null;

  return (
    <div className="toast toast-bottom toast-center z-50">
      <div 
        className={`alert alert-error shadow-lg transition-all duration-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <AlertCircle className="w-5 h-5 shrink-0" />
        <div className="flex-1">
          <div className="font-semibold">{error.name || "Error"}</div>
          <div className="text-sm opacity-90">{error.message}</div>
        </div>
        <button 
          className="btn btn-sm btn-circle btn-ghost"
          onClick={dismissError}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
