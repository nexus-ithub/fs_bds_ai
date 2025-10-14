'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import React from 'react';

export function withAuth<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'loading') return;
      if (!session) router.push('/login');
    }, [session, status, router]);

    if (status === 'loading' || !session) {
      return (
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      );
    }

    return <Component {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;

  return AuthenticatedComponent;
}
