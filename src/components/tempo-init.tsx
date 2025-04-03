"use client";

import { TempoDevtools } from "tempo-devtools";
import { useEffect } from "react";

export function TempoInit() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_TEMPO) {
      try {
        TempoDevtools.init();
        console.log("TempoDevtools initialized successfully");
      } catch (error) {
        console.error("Failed to initialize TempoDevtools:", error);
        // Continue without Tempo devtools if initialization fails
      }
    }
  }, []);

  return null;
}
