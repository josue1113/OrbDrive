// @ts-ignore
'use client';

// @ts-ignore
import { useState, useEffect } from 'react';
// @ts-ignore
import { useRouter } from 'next/navigation';
// @ts-ignore
import { 
  Mail, 
  Lock, 
  LogIn, 
  Loader2, 
  Car,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const { signIn, isAuthenticated, usuario } = useAuth();
  const router = useRouter();

  // Redirecionar se já logado baseado no tipo de usuário
  useEffect(() => {
    if (isAuthenticated && usuario) {
      if (usuario.tipo_nome === 'admin') {
        router.push('/admin');
      } else if (usuario.tipo_nome === 'motorista') {
        router.push('/motorista');
      }
    }
  }, [isAuthenticated, usuario, router]);

  // Fazer login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Preencha email e senha');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const result = await signIn(email, password);
      
      if (result.success && result.usuario) {
        // Redirecionar baseado no tipo de usuário
        if (result.usuario.tipo_nome === 'admin') {
          router.push('/admin');
        } else if (result.usuario.tipo_nome === 'motorista') {
          router.push('/motorista');
        } else {
          router.push('/');
        }
      } else {
        setError(result.error || 'Erro no login');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro inesperado no login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Car className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">OrbDrive</h1>
          <p className="text-gray-600">Sistema de Rastreamento</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Fazer Login</h2>
            <p className="text-sm text-gray-600">
              Digite suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-danger-600" />
                <p className="text-sm text-danger-700">{error}</p>
              </div>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="seu-email@empresa.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Digite sua senha"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                isLoading || !email || !password
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Entrando...' : 'Entrar'}</span>
            </button>
          </form>
        </div>

        {/* Dados de Teste */}
        <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-2">📋 Dados para Teste</h3>
          <div className="text-xs space-y-1 text-gray-600">
            <p><strong>Admin:</strong> admin@abc.com | senha123</p>
            <p><strong>Motorista:</strong> joao@abc.com | senha123</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Execute primeiro o script SQL no Supabase
          </p>
        </div>
      </div>
    </div>
  );
} 