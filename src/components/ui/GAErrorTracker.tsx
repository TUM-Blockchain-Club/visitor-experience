"use client";

import { useEffect } from "react";
import { trackException } from "@/lib/gtag";

type Props = {
  captureUnhandledRejections?: boolean;
};

export function GAErrorTracker({ captureUnhandledRejections = true }: Props) {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const description =
        event?.error?.stack || event?.message || "Unknown error";
      trackException({ description, fatal: false });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      if (!captureUnhandledRejections) return;
      const reason = (event?.reason as Error | string | undefined) ?? "Unknown";
      const description =
        typeof reason === "string"
          ? reason
          : reason?.stack || reason?.message || "Unhandled rejection";
      trackException({ description, fatal: false });
    };

    window.addEventListener("error", onError);
    if (captureUnhandledRejections) {
      window.addEventListener("unhandledrejection", onRejection);
    }
    return () => {
      window.removeEventListener("error", onError);
      if (captureUnhandledRejections) {
        window.removeEventListener("unhandledrejection", onRejection);
      }
    };
  }, [captureUnhandledRejections]);

  return null;
}
