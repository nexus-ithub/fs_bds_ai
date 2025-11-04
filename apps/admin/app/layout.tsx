'use client';
import { SessionProvider, useSession } from "next-auth/react";
import { LoadingProvider } from "./utils/loadingOverlay";
import "./globals.css";
import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { ToastContainer, Flip } from 'react-toastify';

function SessionErrorHandler({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      signOut();
    }
  }, [session?.error]);
  return <>{children}</>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="">
      <body suppressHydrationWarning>
        <SessionProvider>
          <SessionErrorHandler>
            <LoadingProvider>{children}</LoadingProvider>
          </SessionErrorHandler>
        </SessionProvider>
        <ToastContainer
        style={{ top: '70px' }}
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
      </body>
    </html>
  );
}
