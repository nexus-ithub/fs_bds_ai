'use client';

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth');
    if (token) {
      router.push('/main/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Loading...</p>
    </div>
  );
}
