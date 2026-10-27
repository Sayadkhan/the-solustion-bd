import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 w-full animate-in fade-in duration-150">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
      <span className="text-xs font-semibold text-muted-foreground">Loading workspace...</span>
    </div>
  );
}
