"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const RoadmapLazy = dynamic(() => import("@/components/guide/roadmap").then((m) => m.Roadmap), {
  ssr: false,
  loading: () => <Skeleton className="h-[222px] w-full rounded-xl" />,
});
