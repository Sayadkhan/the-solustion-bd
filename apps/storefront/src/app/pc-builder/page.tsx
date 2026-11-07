import type { Metadata } from "next";
import { PcBuilderClient } from "@/components/pc-builder/pc-builder-client";

export const metadata: Metadata = {
  title: "3D PC Builder: Build and Check Your PC Online | The Solutions BD",
  description:
    "Build your PC in 3D with real parts and prices from The Solutions BD. Check socket, memory, case size and power compatibility, then order the whole build.",
  alternates: { canonical: "https://thesolutionsbd.com/pc-builder" },
};

export default function PcBuilderPage() {
  return <PcBuilderClient />;
}
