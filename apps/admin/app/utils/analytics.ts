import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

export interface ErrorContext {
  [key: string]: any;
}

export const trackError = (error: Error | unknown, context?: ErrorContext): void => {
  try {
    Sentry.captureException(error);
  } catch (err) {
    console.error('[Analytics] Sentry 전송 실패:', err);
  }

  try {
    const err = error instanceof Error ? error : new Error(String(error));
    posthog.captureException(err, context);
  } catch (err) {
    console.error('[Analytics] PostHog 전송 실패:', err);
  }
};