import React from "react";
import { PageLoader } from "@/components/page-loader";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 w-full">
      <PageLoader title="Navigating & loading data..." />
    </div>
  );
}
