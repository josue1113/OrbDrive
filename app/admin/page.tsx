'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MapPin, 
  Activity, 
  Clock, 
  Filter,
  RefreshCw,
  Building,
  Car,
  AlertCircle,
  UserPlus,
  List,
  LogOut,
  Menu,
  X,
  MoreVertical
} from 'lucide-react';

import { supabase, buscarPosicoesMotoristas, subscribeToPositions, unsubscribeFromPositions } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CadastroMotorista from '@/components/admin/CadastroMotorista';
import ListaMotoristas from '@/components/admin/ListaMotoristas';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

// Configuração do Google Maps
const GOOGLE_MAPS_API_KEY = 'AIzaSyAxYDfxuRMozJuo2FRuKybzg-Nn29hXWps';

declare global {
  interface Window {
    google: any;
  }
}

export default function AdminPage() {
  const { usuario, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialLoadRef = useRef(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mapa' | 'cadastro' | 'lista'>('mapa');
  const [refreshDriversList, setRefreshDriversList] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Dados dos motoristas em memória (sem causar re-render)
  const driversDataRef = useRef<any[]>([]);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Redirecionar se não autenticado ou não for admin
  if (!authLoading && (!isAuthenticated || usuario?.tipo_nome !== 'admin')) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
      return null;
    }
  }

  // Atualizar marcadores do mapa diretamente sem re-render
  const updateMapMarkersDirectly = (driversData: any[]) => {
    if (!mapInstanceRef.current || !window.google) return;

    // Limpar marcadores existentes
    markersRef.current.forEach(marker => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    // Adicionar novos marcadores
    driversData.forEach(driver => {
      if (driver.posicao?.latitude && driver.posicao?.longitude) {
        const isOnline = driver.posicao && 
          new Date(driver.posicao.atualizado_em).getTime() > Date.now() - 60000;

        const marker = new window.google.maps.Marker({
          position: {
            lat: parseFloat(driver.posicao.latitude),
            lng: parseFloat(driver.posicao.longitude)
          },
          map: mapInstanceRef.current,
          title: driver.nome,
          icon: {
            path: 0, // Circle
            scale: 8,
            fillColor: isOnline ? '#22c55e' : '#6b7280',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-semibold">${driver.nome}</h3>
              <p class="text-sm text-gray-600">${driver.empresa?.nome || 'N/A'}</p>
              <p class="text-xs text-gray-500">
                Status: <span class="${isOnline ? 'text-green-600' : 'text-gray-600'}">${isOnline ? 'Online' : 'Offline'}</span>
              </p>
              <p class="text-xs text-gray-500">
                Atualizado: ${new Date(driver.posicao.atualizado_em).toLocaleTimeString()}
              </p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
          setSelectedDriver(driver.id);
        });

        markersRef.current.push(marker);
      }
    });
  };

  // Carregar script do Google Maps
  const loadGoogleMapsScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps'));
      
      document.head.appendChild(script);
    });
  };

  // Inicializar o mapa
  const initializeMap = async () => {
    try {
      await loadGoogleMapsScript();
      
      if (mapRef.current && window.google) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: -23.5505, lng: -46.6333 },
          zoom: 12,
          mapTypeId: 'roadmap',
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true
        });
      }
    } catch (error) {
      console.error('Erro ao carregar Google Maps:', error);
      setError('Erro ao carregar o mapa. Verifique sua conexão.');
    }
  };

  // Atualizar marcadores (versão que não causa re-render)
  const updateMapMarkers = (driversData: any[]) => {
    // Salvar dados em ref para não causar re-render
    driversDataRef.current = driversData;
    // Atualizar marcadores diretamente
    updateMapMarkersDirectly(driversData);
  };

  // Carregar dados dos motoristas
  const loadDriversData = async () => {
    try {
      if (isInitialLoadRef.current) {
        setIsLoading(true);
      }
      
      const data = await buscarPosicoesMotoristas(usuario?.empresa_id);
      
      setDrivers(data);
      updateMapMarkers(data);
      setLastUpdate(new Date());
      setError(null);
      
      if (isInitialLoadRef.current) {
        setIsLoading(false);
        isInitialLoadRef.current = false;
      }
    } catch (error) {
      console.error('Erro ao carregar dados dos motoristas:', error);
      setError('Erro ao carregar dados dos motoristas');
      if (isInitialLoadRef.current) {
        setIsLoading(false);
        isInitialLoadRef.current = false;
      }
    }
  };

  // Auto-refresh dos dados
  useEffect(() => {
    const interval = setInterval(() => {
      loadDriversData();
    }, 5000); // Refresh a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // Função para atualizar dados
  const refreshData = async () => {
    await loadDriversData();
  };

  // Efeito para carregar dados iniciais
  useEffect(() => {
    loadDriversData();
  }, []);

  // Efeito para inicializar o mapa
  useEffect(() => {
    if (activeTab === 'mapa') {
      setTimeout(() => {
        initializeMap();
      }, 100);
    }
  }, [activeTab]);

  // Subscription para atualizações em tempo real
  useEffect(() => {
    let isSubscribed = true;
    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        subscription = await subscribeToPositions((payload) => {
          if (!isSubscribed) return;
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Recarregar dados quando houver mudanças
            loadDriversData();
          }
        });
      } catch (error) {
        console.error('Erro ao configurar subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      isSubscribed = false;
      if (subscription) {
        unsubscribeFromPositions(subscription);
      }
    };
  }, []);

  // Centralize o mapa no motorista selecionado
  const centerMapOnDriver = (driver: any) => {
    if (mapInstanceRef.current && driver.posicao?.latitude && driver.posicao?.longitude) {
      const position = {
        lat: parseFloat(driver.posicao.latitude),
        lng: parseFloat(driver.posicao.longitude)
      };
      
      mapInstanceRef.current.setCenter(position);
      mapInstanceRef.current.setZoom(15);
      
      setSelectedDriver(driver.id);
      setActiveTab('mapa');
    }
  };

  // Loading inicial
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
          <span className="text-gray-600">Carregando...</span>
        </div>
      </div>
    );
  }

  // Filtrar motoristas
  const filteredDrivers = drivers.filter(driver => {
    if (filter === 'all') return true;
    
    const isOnline = driver.posicao && 
      new Date(driver.posicao.atualizado_em).getTime() > Date.now() - 60000;
    
    return filter === 'online' ? isOnline : !isOnline;
  });

  // Calcular estatísticas
  const stats = {
    total: drivers.length,
    online: drivers.filter(driver => {
      return driver.posicao && 
        new Date(driver.posicao.atualizado_em).getTime() > Date.now() - 60000;
    }).length,
    offline: drivers.filter(driver => {
      return !driver.posicao || 
        new Date(driver.posicao.atualizado_em).getTime() <= Date.now() - 60000;
    }).length
  };

  // Função para lidar com sucesso do cadastro
  const handleCadastroSuccess = () => {
    setRefreshDriversList(true);
    setActiveTab('lista');
  };

  // Função para lidar com refresh completo da lista
  const handleRefreshComplete = () => {
    setRefreshDriversList(false);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <ProtectedRoute only="admin">
      <div className="min-h-screen bg-gray-50">
        {/* Header Mobile-First */}
        <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              {/* Logo e título */}
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-sm text-gray-500 font-medium">
                    {usuario?.empresa?.nome || 'Carregando...'}
                  </p>
                </div>
              </div>

              {/* Stats compactas (mobile) */}
              <div className="flex items-center space-x-2 sm:hidden">
                <div className="bg-blue-50 px-2 py-1 rounded-lg">
                  <span className="text-xs font-semibold text-blue-600">{stats.total}</span>
                </div>
                <div className="bg-green-50 px-2 py-1 rounded-lg">
                  <span className="text-xs font-semibold text-green-600">{stats.online}</span>
                </div>
              </div>

              {/* Ações desktop */}
              <div className="hidden sm:flex items-center space-x-4">
                {/* Stats cards */}
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 px-3 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">{stats.total}</span>
                    </div>
                  </div>
                  <div className="bg-green-50 px-3 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-900">{stats.online}</span>
                    </div>
                  </div>
                </div>

                {/* User info */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{usuario?.nome}</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={refreshData}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden lg:block">Atualizar</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden lg:block">Sair</span>
                  </button>
                </div>
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
                  {/* User info mobile */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{usuario?.nome}</p>
                      <p className="text-sm text-gray-500">Administrador</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={refreshData}
                        disabled={isLoading}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={handleLogout}
                        className="p-2 bg-red-50 text-red-600 rounded-lg"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

                         {/* Navigation Tabs */}
            <div className="border-t border-gray-200 bg-white">
              <div className="flex">
                <button
                  onClick={() => { setActiveTab('mapa'); setMobileMenuOpen(false); }}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'mapa'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Mapa</span>
                </button>
                <button
                  onClick={() => { setActiveTab('cadastro'); setMobileMenuOpen(false); }}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'cadastro'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar</span>
                </button>
                <button
                  onClick={() => { setActiveTab('lista'); setMobileMenuOpen(false); }}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'lista'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>Motoristas</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1">
          {/* Aba do Mapa */}
          {activeTab === 'mapa' && (
            <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)]">
              {/* Sidebar - Lista de Motoristas */}
              <div className="w-full lg:w-96 bg-white border-r border-gray-200 flex flex-col">
                {/* Filters */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex space-x-1">
                    {[
                      { key: 'all', label: 'Todos', icon: Users },
                      { key: 'online', label: 'Online', icon: Activity },
                      { key: 'offline', label: 'Offline', icon: Clock }
                    ].map(filterOption => {
                      const Icon = filterOption.icon;
                      return (
                        <button
                          key={filterOption.key}
                          onClick={() => setFilter(filterOption.key as any)}
                          className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                            filter === filterOption.key
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{filterOption.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lista de Motoristas */}
                <div className="flex-1 overflow-y-auto">
                  {filteredDrivers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Nenhum motorista encontrado</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredDrivers.map(driver => {
                        const isOnline = driver.posicao && 
                          new Date(driver.posicao.atualizado_em).getTime() > Date.now() - 60000;
                        
                        return (
                          <div
                            key={driver.id}
                            onClick={() => centerMapOnDriver(driver)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedDriver === driver.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 truncate">{driver.nome}</p>
                                <p className="text-sm text-gray-600 truncate">{driver.empresa?.nome}</p>
                                {driver.posicao && (
                                  <p className="text-xs text-gray-500">
                                    {new Date(driver.posicao.atualizado_em).toLocaleTimeString()}
                                  </p>
                                )}
                              </div>
                              <Car className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Mapa */}
              <div className="flex-1 relative">
                <div
                  ref={mapRef}
                  className="w-full h-full"
                  style={{ minHeight: '400px' }}
                />
                
                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                    <div className="flex items-center space-x-3 bg-white px-4 py-3 rounded-lg shadow-lg">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Carregando dados...</span>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Aba de Cadastro */}
          {activeTab === 'cadastro' && (
            <div className="p-4 sm:p-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Cadastrar Motorista</h2>
                  <p className="text-sm text-gray-600">Adicione um novo motorista à sua empresa</p>
                </div>
                <div className="p-6">
                  <CadastroMotorista onSuccess={handleCadastroSuccess} />
                </div>
              </div>
            </div>
          )}

          {/* Aba de Lista de Motoristas */}
          {activeTab === 'lista' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Lista de Motoristas</h2>
                  <p className="text-sm text-gray-600">Gerencie todos os motoristas da sua empresa</p>
                </div>
                <div className="p-6">
                  <ListaMotoristas 
                    refresh={refreshDriversList} 
                    onRefreshComplete={handleRefreshComplete}
                  />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
      </div>
    </ProtectedRoute>
  );
} 