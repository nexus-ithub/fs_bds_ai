import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClientProvider, QueryClient } from 'react-query'
import { Flip, Slide, ToastContainer, Zoom } from 'react-toastify'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { PostHogProvider } from 'posthog-js/react'
import * as Sentry from "@sentry/react";
import version from '../public/version.json'; 

if (import.meta.env.MODE === 'production') {
  Sentry.init({
    // dsn: "https://c074e64ab4ab8ab4d051c8c8ac949ef4@o4510350730854400.ingest.us.sentry.io/4510350732689408",
    dsn: "https://2894803047c969a2d2a4f38230cb632f@o4510396295675904.ingest.us.sentry.io/4510396379037696",
    environment: import.meta.env.MODE,
    release: `web@${version.version}`, 
    // tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    tracesSampleRate: 0.1,
    sendDefaultPii: true,
    // debug: import.meta.env.MODE !== 'production',

  });
}

const theme = createTheme({
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '12px', 
        },
      },
    },
  },
});
const queryClient = new QueryClient();

const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  capture_pageview: true,
}

const container = document.getElementById('root')!
const root = createRoot(container)
// createRoot(document.getElementById('root')!).render(
root.render(
  <StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={posthogOptions}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <App />
        <ToastContainer
          style={{ top: '100px' }}
          position="top-center"
          autoClose={2000}
          limit={3}
          hideProgressBar
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable={false}
          pauseOnHover={false}
          theme="light"
          transition={Flip}
          icon={false}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </PostHogProvider>
  </StrictMode>,
)
