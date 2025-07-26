// @ts-ignore
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  only?: 'admin' | 'motorista';
}

export default function ProtectedRoute({ children, only }: ProtectedRouteProps) {
  const { usuario, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
              } else if (only === 'admin' && usuario?.tipo_nome !== 'admin') {
          router.replace('/motorista');
        } else if (only === 'motorista' && usuario?.tipo_nome !== 'motorista') {
        router.replace('/admin');
      }
    }
  }, [isAuthenticated, isLoading, usuario, only, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-lg">Carregando...</div>
      </div>
    );
  }

  // Se passou, renderiza a página
  return <>{children}</>;
} 