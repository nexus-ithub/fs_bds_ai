import { Sentry } from '../instrument';
import { PostHog } from 'posthog-node';

export interface ErrorContext {
  [key: string]: any;
}

export const posthog = new PostHog(
  process.env.POSTHOG_API_KEY || '',
  {
    host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
    enableExceptionAutocapture: true
  }
);

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
