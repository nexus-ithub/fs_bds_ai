import * as Sentry from "@sentry/react";
import posthog from "posthog-js";
import { logEvent } from "firebase/analytics";
import { analytics as firebaseAnalytics } from "../firebaseConfig";

export interface EventProperties {
  [key: string]: any;
}

export interface ErrorContext {
  [key: string]: any;
}

export const trackError = (error: Error | unknown, context?: ErrorContext): void => {
  // if (import.meta.env.DEV) {
  //   console.error('[Analytics] Error:', error, context);
  // }

  try {
    Sentry.captureException(error, { extra: context });
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

export const trackEvent = (eventName: string, properties?: EventProperties): void => {
  // if (import.meta.env.DEV) {
  //   console.log('[Analytics] Event:', eventName, properties);
  // }

  try {
    posthog.capture(eventName, properties);
  } catch (err) {
    console.error('[Analytics] PostHog 전송 실패:', err);
  }

  try {
    logEvent(firebaseAnalytics, eventName, properties);
  } catch (err) {
    console.error('[Analytics] Firebase 전송 실패:', err);
  }
};
