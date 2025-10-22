'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { DotProgress } from '@repo/common'; 

interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const loadingPathnameRef = useRef<string | null>(null);
  const pathname = usePathname();

  const startLoading = () => {
    loadingPathnameRef.current = pathname;
    setIsLoading(true);
  };

  useEffect(() => {
    if (!isLoading || pathname === loadingPathnameRef.current) {
        return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
      loadingPathnameRef.current = null;
    }, 0);
    return () => clearTimeout(timer);
    
  }, [pathname, isLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
          <DotProgress />
        </div>
      )}
    </LoadingContext.Provider>
  );
}