'use client';

// @ts-ignore
import { useState, useEffect } from 'react';
// @ts-ignore
import { 
  MapPin, 
  Play, 
  Square, 
  Navigation, 
  Clock, 
  AlertCircle,
  Wifi,
  WifiOff,
  User,
  LogOut
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/use-auth';
import { atualizarPosicao } from '@/lib/supabase';

// Simulando dados para desenvolvimento
const MOCK_USER = {
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  nome: 'João Motorista',
  empresa: 'Transportadora ABC'
};

export default function MotoristaPage() {
  const { usuario, logout } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [watchId, setWatchId] = useState<number | null>(null);

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

  // Função para iniciar rastreamento
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada neste dispositivo');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    const handleSuccess = async (pos: GeolocationPosition) => {
      setPosition(pos);
      setLastUpdate(new Date());
      setError(null);
      
      // Salvar posição real no banco de dados
      if (usuario?.id) {
        try {
          await atualizarPosicao({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            velocidade: pos.coords.speed ? pos.coords.speed * 3.6 : 0, // Converter m/s para km/h
            precisao: pos.coords.accuracy || 0
          });


        } catch (error) {
          console.error('Erro ao salvar posição:', error);
          setError('Erro ao salvar posição no servidor');
        }
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      let errorMessage = 'Erro desconhecido';
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Permissão de localização negada';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Localização indisponível';
          break;
        case err.TIMEOUT:
          errorMessage = 'Timeout na obtenção da localização';
          break;
      }
      
      setError(errorMessage);
    };

    // Obter posição inicial
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    // Iniciar rastreamento contínuo
    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
    setWatchId(id);
    setIsTracking(true);
  };

  // Função para parar rastreamento
  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  // Sistema de heartbeat para manter status online
  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout | null = null;

    if (isTracking && usuario?.id) {
      // Enviar heartbeat a cada 15 segundos
      heartbeatInterval = setInterval(async () => {
        try {
          
          // Se temos uma posição atual, enviar ela
          if (position) {
            await atualizarPosicao({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              velocidade: position.coords.speed ? position.coords.speed * 3.6 : 0,
              precisao: position.coords.accuracy || 0
            });
          } else {
            // Se não tem posição, tentar obter uma rapidamente
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
    
              },
              { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
            );
          }
        } catch (error) {
          console.error('❌ Erro ao enviar heartbeat:', error);
        }
      }, 15000); // 15 segundos
    }

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [isTracking, usuario?.id, position]);

  // Função para fazer logout
  const handleLogout = async () => {
    // Parar rastreamento antes de sair
    if (isTracking) {
      stopTracking();
    }
    
    try {
      await logout();
      // Redirecionar para login será feito automaticamente pelo useAuth
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Formatar coordenadas
  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Formatar velocidade
  const formatSpeed = (speed: number | null) => {
    if (speed === null || speed === undefined) return 'N/A';
    return `${(speed * 3.6).toFixed(1)} km/h`;
  };

  return (
    <ProtectedRoute only="motorista">
      {/* Conteúdo da página motorista */}
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4">
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
              
              {/* Status de conectividade e logout */}
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
                
                {/* Botão de Logout */}
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
        <main className="px-4 py-6 space-y-6">
          {/* Perfil do Motorista */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-3 rounded-full">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{usuario?.nome || 'Motorista'}</h3>
                  <p className="text-sm text-gray-600">{usuario?.empresa?.nome || 'Empresa'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status do Rastreamento */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Status do Rastreamento</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isTracking 
                    ? 'bg-success-100 text-success-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {isTracking ? 'Ativo' : 'Parado'}
                </div>
              </div>

              {/* Botão Principal */}
              <div className="mb-6">
                {!isTracking ? (
                  <button
                    onClick={startTracking}
                    disabled={!isOnline}
                    className="btn btn-success btn-lg w-full flex items-center justify-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Iniciar Rastreamento</span>
                  </button>
                ) : (
                  <button
                    onClick={stopTracking}
                    className="btn btn-danger btn-lg w-full flex items-center justify-center space-x-2"
                  >
                    <Square className="w-5 h-5" />
                    <span>Parar Rastreamento</span>
                  </button>
                )}
              </div>

              {/* Informações da Posição */}
              {position && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Coordenadas:</span>
                    <span className="text-sm font-mono">
                      {formatCoordinates(position.coords.latitude, position.coords.longitude)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Velocidade:</span>
                    <span className="text-sm font-mono">
                      {formatSpeed(position.coords.speed)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Precisão:</span>
                    <span className="text-sm font-mono">
                      {position.coords.accuracy?.toFixed(1)} m
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
          <div className="card">
            <div className="card-body">
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
      </div>
    </ProtectedRoute>
  );
} 