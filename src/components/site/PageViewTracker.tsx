"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRepo } from "@/data/DataProvider";
import { trackPageView } from "@/services/visitTracker";

export function PageViewTracker() {
  const pathname = usePathname();
  const repo = useRepo();
  useEffect(() => {
    void trackPageView(pathname, repo);
  }, [pathname, repo]);
  return null;
}
