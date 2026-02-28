import * as Sentry from "@sentry/nextjs";


Sentry.init({
  dsn: "https://8f2bcd7662a6fa1d1bd00a893551b780@o4510843165999105.ingest.us.sentry.io/4510843171897344",

  // Performance monitoring
  tracesSampleRate: 1.0,

  // Session replay (optional)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // Debug mode - production-ல false பண்ணுங்க
  debug: false,
});