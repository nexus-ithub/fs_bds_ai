'use client';
import posthog from 'posthog-js';
import { useEffect } from 'react';

export function PostHogInit() {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    });
  }, []);
  return null;
}