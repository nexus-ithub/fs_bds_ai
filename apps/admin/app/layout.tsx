'use client';
import { SessionProvider, useSession } from "next-auth/react";
import { LoadingProvider } from "./utils/loadingOverlay";
import "./globals.css";
import { useEffect } from "react";
import { signOut } from "next-auth/react";

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
      </body>
    </html>
  );
}
