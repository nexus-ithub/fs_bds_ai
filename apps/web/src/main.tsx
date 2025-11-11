import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClientProvider, QueryClient } from 'react-query'
import { Flip, Slide, ToastContainer, Zoom } from 'react-toastify'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { PostHogProvider } from 'posthog-js/react'

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

createRoot(document.getElementById('root')!).render(
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
