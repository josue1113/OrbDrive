'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Play, 
  Square, 
  Navigation, 
  Clock, 
  AlertCircle,
  Wifi,
  WifiOff,
  LogOut,
  User,
  Gauge,
  Target,
  Signal,
  Activity,
  CheckCircle,
  XCircle,
  Menu,
  X
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/use-auth';
import { useBackgroundGeolocation } from '@/hooks/use-background-geolocation';
import { atualizarPosicao } from '@/lib/supabase';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export default function MotoristaPage() {
  const { usuario, logout } = useAuth();
  const backgroundGeo = useBackgroundGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000,
    updateInterval: 15000
  });
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Monitorar status online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const startTracking = async () => {
    if (backgroundGeo.permission !== 'granted') {
      setShowPermissionPrompt(true);
      const granted = await backgroundGeo.requestPermissions();
      if (!granted) {
        setError('Permissão de localização é necessária para o rastreamento');
        return;
      }
      setShowPermissionPrompt(false);
    }

    try {
      await backgroundGeo.startTracking();
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Erro ao iniciar rastreamento');
    }
  };

  const stopTracking = () => {
    backgroundGeo.stopTracking();
    setError(null);
  };

  // Sincronizar posições
  useEffect(() => {
    if (backgroundGeo.position && usuario?.id) {
      const syncPosition = async () => {
        try {
          await atualizarPosicao({
            latitude: backgroundGeo.position!.latitude,
            longitude: backgroundGeo.position!.longitude,
            velocidade: backgroundGeo.position!.speed || 0,
            precisao: backgroundGeo.position!.accuracy || 0
          });
          setLastUpdate(new Date());
          setError(null);
        } catch (error) {
          if (!backgroundGeo.isInBackground()) {
            setError('Erro ao salvar posição no servidor');
          }
        }
      };

      syncPosition();
    }
  }, [backgroundGeo.position, usuario?.id]);

  useEffect(() => {
    if (backgroundGeo.error) {
      setError(backgroundGeo.error);
    }
  }, [backgroundGeo.error]);

  // Sistema de heartbeat
  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout | null = null;

    if (backgroundGeo.isTracking && usuario?.id) {
      heartbeatInterval = setInterval(async () => {
        try {
          if (backgroundGeo.position) {
            await atualizarPosicao({
              latitude: backgroundGeo.position.latitude,
              longitude: backgroundGeo.position.longitude,
              velocidade: backgroundGeo.position.speed || 0,
              precisao: backgroundGeo.position.accuracy || 0
            });
          } else {
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                await atualizarPosicao({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  velocidade: pos.coords.speed ? pos.coords.speed * 3.6 : 0,
                  precisao: pos.coords.accuracy || 0
                });
              },
              (error) => {
                console.error('Erro no heartbeat de localização:', error);
              },
              { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
            );
          }
        } catch (error) {
          console.error('Erro no heartbeat:', error);
        }
      }, 30000);
    }

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [backgroundGeo.isTracking, usuario?.id]);

  const handleLogout = async () => {
    if (backgroundGeo.isTracking) {
      stopTracking();
    }
    
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const formatSpeed = (speed: number | null) => {
    if (speed === null || speed === undefined) return '0';
    return `${(speed * 3.6).toFixed(1)}`;
  };

  return (
    <ProtectedRoute only="motorista">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header Mobile-First */}
        <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              {/* Logo e user info */}
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-green-500 to-blue-600 p-2.5 rounded-xl shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {usuario?.nome || 'Motorista'}
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">
                    {usuario?.empresa?.nome || 'Carregando...'}
                  </p>
                </div>
              </div>

              {/* Status indicators (mobile) */}
              <div className="flex items-center space-x-2 sm:hidden">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className={`w-3 h-3 rounded-full ${backgroundGeo.isTracking ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
              </div>

              {/* Desktop status and actions */}
              <div className="hidden sm:flex items-center space-x-4">
                {/* Status cards */}
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-2 rounded-lg ${isOnline ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center space-x-2">
                      {isOnline ? (
                        <Wifi className="w-4 h-4 text-green-600" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-semibold ${isOnline ? 'text-green-900' : 'text-red-900'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-2 rounded-lg ${backgroundGeo.isTracking ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center space-x-2">
                      {backgroundGeo.isTracking ? (
                        <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-600" />
                      )}
                      <span className={`text-sm font-semibold ${backgroundGeo.isTracking ? 'text-blue-900' : 'text-gray-900'}`}>
                        {backgroundGeo.isTracking ? 'Rastreando' : 'Parado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:block">Sair</span>
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="sm:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="sm:hidden border-t border-gray-200 bg-white">
                <div className="px-4 py-3 space-y-3">
                  {/* Status mobile */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${isOnline ? 'bg-green-50' : 'bg-red-50'}`}>
                        {isOnline ? (
                          <Wifi className="w-4 h-4 text-green-600" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      
                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${backgroundGeo.isTracking ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        {backgroundGeo.isTracking ? (
                          <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-600" />
                        )}
                        <span className={`text-sm font-medium ${backgroundGeo.isTracking ? 'text-blue-700' : 'text-gray-700'}`}>
                          {backgroundGeo.isTracking ? 'Ativo' : 'Parado'}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="p-2 bg-red-50 text-red-600 rounded-lg"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Status Principal Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-blue-600 px-6 py-8 text-white text-center">
                <div className="mb-4">
                  <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 mx-auto flex items-center justify-center backdrop-blur-sm">
                    {backgroundGeo.isTracking ? (
                      <Navigation className="w-8 h-8 animate-pulse" />
                    ) : (
                      <MapPin className="w-8 h-8" />
                    )}
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {backgroundGeo.isTracking ? 'Rastreamento Ativo' : 'Sistema de Rastreamento'}
                </h2>
                <p className="text-green-100">
                  {backgroundGeo.isTracking 
                    ? 'Sua localização está sendo monitorada em tempo real'
                    : 'Clique no botão abaixo para iniciar o rastreamento'
                  }
                </p>
              </div>

              <div className="p-6 sm:p-8">
                {/* Botão Principal */}
                <div className="text-center mb-8">
                  {!backgroundGeo.isTracking ? (
                    <button
                      onClick={startTracking}
                      disabled={!isOnline}
                      className={`w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 mx-auto transform ${
                        !isOnline
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700 hover:scale-105 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      <Play className="w-6 h-6" />
                      <span>Iniciar Rastreamento</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopTracking}
                      className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 mx-auto transform bg-gradient-to-r from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <Square className="w-6 h-6" />
                      <span>Parar Rastreamento</span>
                    </button>
                  )}
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <div>
                        <h3 className="font-semibold text-red-800">Atenção</h3>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dados em tempo real */}
                {backgroundGeo.position && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">GPS</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900 mb-1">
                        {backgroundGeo.position.latitude.toFixed(4)}°
                      </div>
                      <div className="text-sm text-blue-700 font-medium">
                        {backgroundGeo.position.longitude.toFixed(4)}°
                      </div>
                      <div className="text-xs text-blue-600 mt-1">Coordenadas</div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <Gauge className="w-5 h-5 text-green-600" />
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">KM/H</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900 mb-1">
                        {formatSpeed(backgroundGeo.position.speed || null)}
                      </div>
                      <div className="text-xs text-green-600">Velocidade</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">M</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900 mb-1">
                        {backgroundGeo.position.accuracy?.toFixed(0) || '0'}
                      </div>
                      <div className="text-xs text-purple-600">Precisão</div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                      <div className="flex items-center justify-between mb-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">SYNC</span>
                      </div>
                      <div className="text-lg font-bold text-orange-900 mb-1">
                        {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--'}
                      </div>
                      <div className="text-xs text-orange-600">Última sync</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status de conexão e informações */}
            {!backgroundGeo.position && backgroundGeo.isTracking && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Signal className="w-5 h-5 text-yellow-600 animate-pulse" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Aguardando sinal GPS...</h3>
                    <p className="text-sm text-yellow-700">Localizando sua posição. Isso pode levar alguns segundos.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Guia de uso */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Como usar o sistema</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Iniciar Rastreamento</h4>
                    <p className="text-sm text-gray-600">Clique no botão verde para começar</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <span className="text-green-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Permissões</h4>
                    <p className="text-sm text-gray-600">Autorize o acesso à localização</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <span className="text-purple-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Funcionamento</h4>
                    <p className="text-sm text-gray-600">O app funciona em segundo plano</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <span className="text-red-600 font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Finalizar</h4>
                    <p className="text-sm text-gray-600">Pare o rastreamento ao final</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />

        {/* Permission Prompt */}
        {showPermissionPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 max-w-sm w-full">
              <div className="text-center mb-4">
                <div className="bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Permissões Necessárias</h3>
                <p className="text-gray-600 text-sm">
                  Para funcionar em segundo plano, o app precisa de permissão para acessar sua localização mesmo quando não estiver em uso.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPermissionPrompt(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    await backgroundGeo.requestPermissions();
                    setShowPermissionPrompt(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 font-medium transition-colors"
                >
                  Permitir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 