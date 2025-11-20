import * as Sentry from "@sentry/node";

Sentry.init({
  // dsn: "https://7a0aaf94da30336341b03504e51e3e62@o4510350730854400.ingest.us.sentry.io/4510354845859840",
  dsn: "https://9079eba3fa24ea22b12bf5e384f90066@o4510396295675904.ingest.us.sentry.io/4510396306620416",
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  sendDefaultPii: true,
  // debug: process.env.NODE_ENV !== 'production',
});

export { Sentry };