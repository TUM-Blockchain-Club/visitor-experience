type GtagCommand = "config" | "event" | "set" | "js";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
    dataLayer?: Object[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const getMeasurementId = (): string | undefined => {
  return process.env.NEXT_PUBLIC_GA_ID;
};

export const isAnalyticsAvailable = (): boolean => {
  if (typeof window === "undefined") return false;
  return typeof window.gtag === "function";
};

export const gtag = (
  command: GtagCommand,
  ...params: unknown[]
): void => {
  if (!isAnalyticsAvailable()) return;
  window.gtag?.(command, ...params);
};

export type ExceptionEvent = {
  description?: string;
  fatal?: boolean;
};

export const trackException = (event: ExceptionEvent): void => {
  gtag("event", "exception", {
    description: event.description ?? "",
    fatal: Boolean(event.fatal),
  });
};


