import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] bg-background text-foreground flex flex-col items-center justify-center py-20 px-4 animate-in fade-in duration-150">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">Loading content...</p>
      <p className="text-xs text-muted-foreground mt-1">Please wait a moment</p>
    </div>
  );
}
