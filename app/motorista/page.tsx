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
  LogOut
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
    if (speed === null || speed === undefined) return 'N/A';
    return `${(speed * 3.6).toFixed(1)} km/h`;
  };

  return (
    <ProtectedRoute only="motorista">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-600 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Rastreamento</h1>
                  <p className="text-sm text-gray-600">Motorista</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <Wifi className="w-5 h-5 text-success-600" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-danger-600" />
                  )}
                  <span className={`text-sm font-medium ${isOnline ? 'text-success-600' : 'text-danger-600'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 max-w-md mx-auto">
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Status do Rastreamento</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  backgroundGeo.isTracking 
                    ? 'bg-success-100 text-success-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {backgroundGeo.isTracking ? 'Ativo' : 'Parado'}
                </div>
              </div>

              {/* Botão Principal */}
              <div className="mb-6">
                {!backgroundGeo.isTracking ? (
                  <button
                    onClick={startTracking}
                    disabled={!isOnline}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    <span>Iniciar Rastreamento</span>
                  </button>
                ) : (
                  <button
                    onClick={stopTracking}
                    className="w-full bg-danger-600 hover:bg-danger-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Square className="w-5 h-5" />
                    <span>Parar Rastreamento</span>
                  </button>
                )}
              </div>

              {/* Informações da Posição */}
              {backgroundGeo.position && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Coordenadas:</span>
                    <span className="text-sm font-mono">
                      {formatCoordinates(backgroundGeo.position.latitude, backgroundGeo.position.longitude)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Velocidade:</span>
                    <span className="text-sm font-mono">
                      {formatSpeed(backgroundGeo.position.speed || null)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Precisão:</span>
                    <span className="text-sm font-mono">
                      {backgroundGeo.position.accuracy?.toFixed(1)} m
                    </span>
                  </div>

                  {lastUpdate && (
                    <div className="flex items-center justify-between py-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Última atualização:</span>
                      <span className="text-sm font-mono">
                        {lastUpdate.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Erros */}
            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-danger-600" />
                  <div>
                    <h4 className="font-medium text-danger-800">Erro no rastreamento</h4>
                    <p className="text-sm text-danger-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Alertas */}
            {!isOnline && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <WifiOff className="w-5 h-5 text-warning-600" />
                  <div>
                    <h4 className="font-medium text-warning-800">Sem conexão</h4>
                    <p className="text-sm text-warning-700 mt-1">
                      Os dados serão sincronizados quando a conexão for restaurada.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instruções */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Como usar</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="bg-primary-100 text-primary-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">1</span>
                  <span>Clique em "Iniciar Rastreamento" para começar</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-primary-100 text-primary-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">2</span>
                  <span>Permita o acesso à localização quando solicitado</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-primary-100 text-primary-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">3</span>
                  <span>Mantenha o app aberto durante a viagem</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-primary-100 text-primary-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">4</span>
                  <span>Clique em "Parar Rastreamento" ao final</span>
                </li>
              </ol>
            </div>
          </div>
        </main>

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />

        {/* Permission Prompt */}
        {showPermissionPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-2">Permissões Necessárias</h3>
              <p className="text-gray-600 mb-4">
                Para funcionar em segundo plano, o app precisa de permissão para acessar sua localização mesmo quando não estiver em uso.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPermissionPrompt(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    await backgroundGeo.requestPermissions();
                    setShowPermissionPrompt(false);
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
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