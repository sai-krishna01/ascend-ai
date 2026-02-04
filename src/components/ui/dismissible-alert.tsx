import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DismissibleAlertProps {
  id: string;
  title: string;
  message: string;
  type?: "info" | "warning" | "error" | "success";
  onDismiss: (id: string) => void;
  className?: string;
}

const alertStyles = {
  info: "bg-blue-500/10 border-blue-500 text-blue-500",
  warning: "bg-yellow-500/10 border-yellow-500 text-yellow-500",
  error: "bg-destructive/10 border-destructive text-destructive",
  success: "bg-green-500/10 border-green-500 text-green-500",
};

export function DismissibleAlert({
  id,
  title,
  message,
  type = "info",
  onDismiss,
  className,
}: DismissibleAlertProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3 rounded-lg border",
        alertStyles[type],
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <span className="font-medium">{title}</span>
        {message && (
          <>
            <span className="mx-2">—</span>
            <span className="text-sm">{message}</span>
          </>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-white/10 shrink-0"
        onClick={() => onDismiss(id)}
      >
        <X className="w-4 h-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </div>
  );
}
