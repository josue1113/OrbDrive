'use client';

// @ts-ignore
import { useEffect, useState } from 'react';
// @ts-ignore
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (!redirected) {
      setRedirected(true);
      // Usar timeout para evitar loop
      setTimeout(() => {
        router.replace('/login');
      }, 100);
    }
  }, [redirected, router]);

  // Mostrar loading
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
} 