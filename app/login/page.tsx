'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  LogIn, 
  Loader2, 
  Car,
  Eye,
  EyeOff,
  AlertCircle,
  Building,
  MapPin,
  Shield,
  Smartphone
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col lg:flex-row">
      {/* Side Panel - Features (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full"></div>
          <div className="absolute top-32 right-20 w-20 h-20 border border-white rounded-full"></div>
          <div className="absolute bottom-20 left-32 w-16 h-16 border border-white rounded-full"></div>
          <div className="absolute bottom-32 right-16 w-24 h-24 border-2 border-white rounded-full"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                <Building className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">OrbDrive</h1>
                <p className="text-blue-100">Sistema de Rastreamento</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold mb-4">
              Gerencie sua frota com
              <span className="block text-yellow-300">inteligência orbital</span>
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Rastreamento em tempo real, gestão intuitiva e controle total da sua operação.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg backdrop-blur-sm">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Rastreamento em Tempo Real</h3>
                <p className="text-blue-100">Acompanhe todos os seus motoristas com precisão GPS</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg backdrop-blur-sm">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Segurança Avançada</h3>
                <p className="text-blue-100">Controle de acesso e proteção de dados empresariais</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg backdrop-blur-sm">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">PWA Mobile</h3>
                <p className="text-blue-100">Funciona offline e pode ser instalado no dispositivo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md">
          
          {/* Mobile Header */}
          <div className="text-center mb-8 lg:hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Building className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">OrbDrive</h1>
            <p className="text-gray-600">Sistema de Rastreamento</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8 text-white text-center">
              <div className="hidden lg:block mb-4">
                <div className="bg-white bg-opacity-20 rounded-full w-12 h-12 mx-auto flex items-center justify-center backdrop-blur-sm">
                  <LogIn className="w-6 h-6" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Bem-vindo de volta!</h2>
              <p className="text-blue-100">Entre com suas credenciais para continuar</p>
            </div>

            {/* Form */}
            <div className="p-6 sm:p-8">
              {/* Erro */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Formulário */}
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Campo Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-colors"
                      placeholder="seu-email@empresa.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Campo Senha */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-colors"
                      placeholder="Digite sua senha"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Botão de Login */}
                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className={`w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 transform ${
                    isLoading || !email || !password
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <LogIn className="w-5 h-5" />
                  )}
                  <span>{isLoading ? 'Entrando...' : 'Entrar no Sistema'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Dados de Teste */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-yellow-100 p-1 rounded">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Dados para Teste</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-semibold text-blue-900 mb-1">👨‍💼 Administrador</p>
                <p className="text-blue-700"><strong>Email:</strong> admin@abc.com</p>
                <p className="text-blue-700"><strong>Senha:</strong> senha123</p>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="font-semibold text-green-900 mb-1">🚛 Motorista</p>
                <p className="text-green-700"><strong>Email:</strong> joao@abc.com</p>
                <p className="text-green-700"><strong>Senha:</strong> senha123</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
              ⚠️ Execute primeiro o script SQL no Supabase para configurar o banco de dados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 