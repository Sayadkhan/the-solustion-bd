"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitCompare } from "lucide-react";
import { useCompareStore } from "@/stores/compare-store";

/** Only appears once there is something to compare. The cart lives in the header. */
export function FloatingWidgets() {
  const pathname = usePathname();
  const compareCount = useCompareStore((s) => s.items.length);

  if (compareCount === 0 || pathname === "/compare" || pathname === "/pc-builder") return null;

  return (
    <Link
      href="/compare"
      className="hidden md:inline-flex fixed right-4 bottom-5 z-40 items-center gap-2 rounded-full bg-foreground text-background pl-3.5 pr-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5 [box-shadow:var(--shadow-raised)]"
    >
      <GitCompare className="w-4 h-4" />
      Compare ({compareCount})
    </Link>
  );
}
