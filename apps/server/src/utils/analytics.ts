import { Sentry } from '../instrument';
import { PostHog } from 'posthog-node';

export interface ErrorContext {
  [key: string]: any;
}

export const posthog = process.env.POSTHOG_KEY
  ? new PostHog(
      process.env.POSTHOG_KEY,
      {
        host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
        enableExceptionAutocapture: true
      }
    )
  : null;

export const trackError = (error: Error | unknown, context?: ErrorContext): void => {
  try {
    Sentry.captureException(error, { extra: context });
  } catch (err) {
    console.error('[Analytics] Sentry 전송 실패:', err);
  }

  try {
    const err = error instanceof Error ? error : new Error(String(error));
    posthog.captureException(err, 'server', context);
  } catch (err) {
    console.error('[Analytics] PostHog 전송 실패:', err);
  }
};
