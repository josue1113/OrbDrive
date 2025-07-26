'use client';

// @ts-ignore
import { useState, useEffect, useRef } from 'react';
// @ts-ignore
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
  List
} from 'lucide-react';

import { supabase, buscarPosicoesMotoristas, subscribeToPositions, unsubscribeFromPositions } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CadastroMotorista from '@/components/admin/CadastroMotorista';
import ListaMotoristas from '@/components/admin/ListaMotoristas';

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

  // Inicializar Google Maps
  useEffect(() => {
    const initMap = () => {
      // Só carregar se estivermos na aba do mapa
      if (activeTab !== 'mapa') return;
      if (mapInstanceRef.current) return;

      // Dar um tempo para o DOM ser renderizado
      setTimeout(() => {
        if (!mapRef.current) return;

        // Verificar se já existe script do Google Maps
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        
        if (!window.google && !existingScript) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
          script.async = true;
          script.onload = initializeMap;
          document.head.appendChild(script);
        } else if (window.google) {
          initializeMap();
        }
      }, 100);
    };

    const initializeMap = () => {
      if (!mapRef.current || mapInstanceRef.current || !window.google?.maps) return;

      try {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: -23.5505, lng: -46.6333 },
          zoom: 12,
          mapTypeId: 'roadmap'
        });
        
        // Aguardar um pouco antes de adicionar marcadores
        setTimeout(() => {
          updateMapMarkers();
          loadDriversData();
        }, 500);
      } catch (error) {
        console.error('Erro ao criar mapa:', error);
      }
    };

    initMap();
  }, [activeTab]); // Depende da aba ativa

  // Atualizar marcadores diretamente no mapa (sem re-render do React)
  const updateMapMarkersDirectly = (newDriversData: any[]) => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps) return;

    // Criar um map dos novos dados por ID
    const newDriversMap = new Map();
    newDriversData.forEach(driver => {
      if (driver.posicao) {
        newDriversMap.set(driver.id, driver);
      }
    });

    // Atualizar marcadores existentes
    markersRef.current = markersRef.current.filter(marker => {
      const newDriverData = newDriversMap.get(marker.driverId);
      
      if (!newDriverData) {
        // Driver não existe mais, remover marcador
        marker.setMap(null);
        return false;
      }

      // Verificar se a posição realmente mudou
      const currentPos = marker.getPosition();
      const newLat = newDriverData.posicao.latitude;
      const newLng = newDriverData.posicao.longitude;
      
      const hasPositionChanged = !currentPos || 
        Math.abs(currentPos.lat() - newLat) > 0.000001 || 
        Math.abs(currentPos.lng() - newLng) > 0.000001;

      const hasStatusChanged = marker.currentStatus !== newDriverData.status;

      // Só atualizar se algo mudou
      if (hasPositionChanged || hasStatusChanged) {
        // Atualizar posição suavemente
        if (hasPositionChanged) {
          marker.setPosition({ lat: newLat, lng: newLng });
        }
        
        // Atualizar ícone se status mudou
        if (hasStatusChanged) {
          const iconColor = newDriverData.status === 'online' ? '#22c55e' : '#6b7280';
          marker.setIcon({
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="8" fill="${iconColor}" stroke="#ffffff" stroke-width="2"/>
                <circle cx="10" cy="10" r="3" fill="#ffffff"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(20, 20)
          });
          marker.currentStatus = newDriverData.status;
        }

        // Atualizar info window
        const statusColor = newDriverData.status === 'online' ? '#22c55e' : '#6b7280';
        const statusText = newDriverData.status === 'online' ? 'Online' : 'Offline';
        
        if (marker.infoWindow) {
          marker.infoWindow.setContent(`
            <div class="p-2">
              <h4 class="font-semibold">${newDriverData.nome}</h4>
              <p class="text-sm" style="color: ${statusColor}">Status: ${statusText}</p>
              <p class="text-sm text-gray-600">Velocidade: ${newDriverData.posicao.velocidade?.toFixed(1) || 0} km/h</p>
              <p class="text-sm text-gray-600">Atualizado: ${newDriverData.posicao.atualizado_em.toLocaleTimeString()}</p>
            </div>
          `);
        }
      }

      newDriversMap.delete(newDriverData.id);
      return true;
    });

    // Adicionar marcadores para novos motoristas
    newDriversMap.forEach((driver) => {
      const marker = new window.google.maps.Marker({
        position: {
          lat: driver.posicao.latitude,
          lng: driver.posicao.longitude
        },
        map: mapInstanceRef.current,
        title: `${driver.nome} (${driver.status})`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8" fill="${driver.status === 'online' ? '#22c55e' : '#6b7280'}" stroke="#ffffff" stroke-width="2"/>
              <circle cx="10" cy="10" r="3" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(20, 20)
        }
      });

      marker.driverId = driver.id;
      marker.currentStatus = driver.status;

      const statusColor = driver.status === 'online' ? '#22c55e' : '#6b7280';
      const statusText = driver.status === 'online' ? 'Online' : 'Offline';
      
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h4 class="font-semibold">${driver.nome}</h4>
            <p class="text-sm" style="color: ${statusColor}">Status: ${statusText}</p>
            <p class="text-sm text-gray-600">Velocidade: ${driver.posicao.velocidade?.toFixed(1) || 0} km/h</p>
            <p class="text-sm text-gray-600">Atualizado: ${driver.posicao.atualizado_em.toLocaleTimeString()}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        markersRef.current.forEach(m => {
          if (m.infoWindow && m !== marker) m.infoWindow.close();
        });
        infoWindow.open(mapInstanceRef.current, marker);
        setSelectedDriver(driver.id);
      });

      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);
    });
  };

  // Função original para inicialização (mantida para compatibilidade)
  const updateMapMarkers = () => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps) return;

    // Criar um map dos drivers atuais por ID
    const driversMap = new Map();
    drivers.forEach(driver => {
      if (driver.posicao) {
        driversMap.set(driver.id, driver);
      }
    });

    // Atualizar marcadores existentes ou remover se o driver não existe mais
    markersRef.current = markersRef.current.filter(marker => {
      const driver = driversMap.get(marker.driverId);
      
      if (!driver) {
        // Driver não existe mais, remover marcador
        marker.setMap(null);
        return false;
      }

      // Atualizar posição do marcador existente
      const newPosition = {
        lat: driver.posicao.latitude,
        lng: driver.posicao.longitude
      };
      
      marker.setPosition(newPosition);
      marker.setTitle(`${driver.nome} (${driver.status})`);
      
      // Atualizar ícone baseado no status
      const iconColor = driver.status === 'online' ? '#22c55e' : '#6b7280';
      marker.setIcon({
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" fill="${iconColor}" stroke="#ffffff" stroke-width="2"/>
            <circle cx="10" cy="10" r="3" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(20, 20)
      });

      // Atualizar conteúdo do info window
      const statusColor = driver.status === 'online' ? '#22c55e' : '#6b7280';
      const statusText = driver.status === 'online' ? 'Online' : 'Offline';
      
      if (marker.infoWindow) {
        marker.infoWindow.setContent(`
          <div class="p-2">
            <h4 class="font-semibold">${driver.nome}</h4>
            <p class="text-sm" style="color: ${statusColor}">Status: ${statusText}</p>
            <p class="text-sm text-gray-600">Velocidade: ${driver.posicao.velocidade?.toFixed(1) || 0} km/h</p>
            <p class="text-sm text-gray-600">Atualizado: ${driver.posicao.atualizado_em.toLocaleTimeString()}</p>
          </div>
        `);
      }

      // Marcar como processado
      driversMap.delete(driver.id);
      return true;
    });

    // Adicionar novos marcadores para drivers que não tinham marcador ainda
    driversMap.forEach((driver) => {
      const marker = new window.google.maps.Marker({
        position: {
          lat: driver.posicao.latitude,
          lng: driver.posicao.longitude
        },
        map: mapInstanceRef.current,
        title: `${driver.nome} (${driver.status})`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8" fill="${driver.status === 'online' ? '#22c55e' : '#6b7280'}" stroke="#ffffff" stroke-width="2"/>
              <circle cx="10" cy="10" r="3" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(20, 20)
        }
      });

      // Associar o ID do driver ao marcador
      marker.driverId = driver.id;

      // Adicionar info window
      const statusColor = driver.status === 'online' ? '#22c55e' : '#6b7280';
      const statusText = driver.status === 'online' ? 'Online' : 'Offline';
      
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h4 class="font-semibold">${driver.nome}</h4>
            <p class="text-sm" style="color: ${statusColor}">Status: ${statusText}</p>
            <p class="text-sm text-gray-600">Velocidade: ${driver.posicao.velocidade?.toFixed(1) || 0} km/h</p>
            <p class="text-sm text-gray-600">Atualizado: ${driver.posicao.atualizado_em.toLocaleTimeString()}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        // Fechar outras info windows
        markersRef.current.forEach(m => {
          if (m.infoWindow && m !== marker) m.infoWindow.close();
        });
        
        infoWindow.open(mapInstanceRef.current, marker);
        setSelectedDriver(driver.id);
      });

      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);
    });
  };

  // Buscar dados reais do Supabase
  const loadDriversData = async () => {
    if (!usuario) return;

    if (!usuario.empresa_id) {
      setError('Usuário não tem empresa associada');
      setIsLoading(false);
      return;
    }

    try {
      // Só mostrar loading na primeira carga
      if (isInitialLoadRef.current) {
        setIsLoading(true);
      }
      setError(null);
      
      // Buscar apenas motoristas da empresa do admin logado
      const posicoes = await buscarPosicoesMotoristas(usuario.empresa_id);
      
      // Transformar dados do Supabase para o formato esperado
      const driversData = posicoes.map((pos: any) => {
        const ultimaAtualizacao = new Date(pos.atualizado_em);
        const agora = new Date();
        const diferencaMinutos = (agora.getTime() - ultimaAtualizacao.getTime()) / (1000 * 60);
        
        // Considerar online se última atualização foi há menos de 1 minuto
        const isOnline = diferencaMinutos < 1 && pos.latitude && pos.longitude;
        
        return {
          id: pos.usuario.id,
          nome: pos.usuario.nome,
          posicao: pos.latitude && pos.longitude ? {
            latitude: pos.latitude,
            longitude: pos.longitude,
            velocidade: pos.velocidade || 0,
            atualizado_em: ultimaAtualizacao
          } : null,
          status: isOnline ? 'online' : 'offline'
        };
      });
      
      // Atualizar dados em memória e mapa diretamente (sem re-render)
      driversDataRef.current = driversData;
      updateMapMarkersDirectly(driversData);
      

      
      // Atualizar apenas a sidebar (sem afetar o mapa)
      setDrivers(driversData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados dos motoristas');
    } finally {
      if (isInitialLoadRef.current) {
        setIsLoading(false);
        isInitialLoadRef.current = false;
      }
    }
  };

  // Função para centralizar no motorista
  const centerOnDriver = (driver: any) => {
    // Mudar para aba do mapa se não estiver nela
    if (activeTab !== 'mapa') {
      setActiveTab('mapa');
    }

    if (!driver.posicao) {
      // Destacar mesmo sem posição
      setSelectedDriver(driver.id);
      return;
    }

    // Aguardar um pouco se mudou de aba para o mapa carregar
    const centerMap = () => {
      if (!mapInstanceRef.current) {
        setTimeout(centerMap, 500);
        return;
      }

      // Centralizar o mapa na posição do motorista
      mapInstanceRef.current.setCenter({
        lat: driver.posicao.latitude,
        lng: driver.posicao.longitude
      });
      
      // Dar zoom
      mapInstanceRef.current.setZoom(15);
      
      // Destacar o motorista selecionado
      setSelectedDriver(driver.id);
      
      // Abrir info window do motorista
      setTimeout(() => {
        const marker = markersRef.current.find(m => m.driverId === driver.id);
        if (marker && marker.infoWindow) {
          // Fechar outras info windows
          markersRef.current.forEach(m => {
            if (m.infoWindow && m !== marker) m.infoWindow.close();
          });
          
          marker.infoWindow.open(mapInstanceRef.current, marker);
        }
      }, 300);
    };

    if (activeTab === 'mapa') {
      centerMap();
    } else {
      setTimeout(centerMap, 500);
    }
  };

  // Inicializar marcadores apenas uma vez quando o mapa estiver pronto
  useEffect(() => {
    if (mapInstanceRef.current && driversDataRef.current.length > 0) {
      updateMapMarkers();
    }
  }, [mapInstanceRef.current]);

  // Carregar dados iniciais e configurar auto-refresh
  useEffect(() => {
    // Só executar quando o usuário estiver carregado E tiver empresa_id
    if (usuario && usuario.empresa_id && !authLoading) {
  
      loadDriversData();
      
      // Auto-refresh a cada 5 segundos
      const interval = setInterval(() => {
        loadDriversData();
      }, 5000);

      return () => clearInterval(interval);
    } else if (!authLoading && usuario && !usuario.empresa_id) {
      setError('Usuário não tem empresa associada');
      setIsLoading(false);
    }
  }, [usuario, authLoading]);

  // Configurar subscription para atualizações em tempo real
  useEffect(() => {
    const subscription = subscribeToPositions((payload: any) => {
      
      loadDriversData(); // Recarregar dados quando houver mudanças
    });

    return () => {
      unsubscribeFromPositions(subscription);
    };
  }, []);

  // Função para atualizar dados (botão refresh) - sem loading overlay
  const refreshData = async () => {
    if (!usuario?.empresa_id) return;
    
    try {
      setError(null);
      
      // Buscar dados sem mostrar loading
      const posicoes = await buscarPosicoesMotoristas(usuario.empresa_id);
      
      const driversData = posicoes.map((pos: any) => {
        const ultimaAtualizacao = new Date(pos.atualizado_em);
        const agora = new Date();
        const diferencaMinutos = (agora.getTime() - ultimaAtualizacao.getTime()) / (1000 * 60);
        const isOnline = diferencaMinutos < 1 && pos.latitude && pos.longitude;
        
        return {
          id: pos.usuario.id,
          nome: pos.usuario.nome,
          posicao: pos.latitude && pos.longitude ? {
            latitude: pos.latitude,
            longitude: pos.longitude,
            velocidade: pos.velocidade || 0,
            atualizado_em: ultimaAtualizacao
          } : null,
          status: isOnline ? 'online' : 'offline'
        };
      });
      
             // Atualizar dados em memória e mapa diretamente
       driversDataRef.current = driversData;
       updateMapMarkersDirectly(driversData);
       
 
       
       // Atualizar apenas a sidebar
       setDrivers(driversData);
       setLastUpdate(new Date());
     } catch (err) {
       console.error('❌ Erro no refreshData:', err);
       setError('Erro ao atualizar dados dos motoristas');
     }
  };



  // Filtrar motoristas
  const filteredDrivers = drivers.filter(driver => {
    if (filter === 'all') return true;
    return driver.status === filter;
  });

  // Calcular estatísticas
  const stats = {
    total: drivers.length,
    online: drivers.filter(d => d.status === 'online').length,
    offline: drivers.filter(d => d.status === 'offline').length,
    avgSpeed: drivers.reduce((acc, d) => acc + (d.posicao?.velocidade || 0), 0) / drivers.length
  };

  // Função para lidar com sucesso do cadastro
  const handleCadastroSuccess = () => {
    setRefreshDriversList(true);
    setActiveTab('lista'); // Mudar para aba da lista após cadastro
  };

  // Função para lidar com refresh completo da lista
  const handleRefreshComplete = () => {
    setRefreshDriversList(false);
  };

  return (
    <ProtectedRoute only="admin">
      {/* Conteúdo da página admin */}
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
                  <h1 className="text-lg font-semibold text-gray-900">Painel Admin</h1>
                  <p className="text-sm text-gray-600">
                    {usuario?.empresa?.nome || 'Carregando empresa...'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Navegação por abas */}
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('mapa')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center space-x-1 ${
                      activeTab === 'mapa'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Mapa</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('cadastro')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center space-x-1 ${
                      activeTab === 'cadastro'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Cadastrar</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('lista')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center space-x-1 ${
                      activeTab === 'lista'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span>Motoristas</span>
                  </button>
                </div>

                <div className="text-right text-sm">
                  <p className="font-medium text-gray-900">{usuario?.nome}</p>
                  <p className="text-gray-500">Administrador</p>
                </div>
                <button
                  onClick={refreshData}
                  disabled={isLoading}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
                </button>
                <button
                  onClick={logout}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo baseado na aba ativa */}
        {activeTab === 'mapa' && (
          <div className="flex flex-col lg:flex-row h-screen">
            {/* Sidebar - Lista de Motoristas */}
            <div className="w-full lg:w-96 bg-white border-r border-gray-200 flex flex-col">
              {/* Stats Cards */}
              <div className="p-4 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-primary-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-primary-600 font-medium">Total</p>
                        <p className="text-xl font-bold text-primary-900">{stats.total}</p>
                      </div>
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                  
                  <div className="bg-success-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-success-600 font-medium">Online</p>
                        <p className="text-xl font-bold text-success-900">{stats.online}</p>
                      </div>
                      <Activity className="w-6 h-6 text-success-600" />
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex space-x-2">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'online', label: 'Online' },
                    { value: 'offline', label: 'Offline' }
                  ].map(filterOption => (
                    <button
                      key={filterOption.value}
                      onClick={() => setFilter(filterOption.value as any)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        filter === filterOption.value
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filterOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Motoristas */}
              <div className="flex-1 overflow-y-auto">
                {error && (
                  <div className="p-4 m-4 bg-danger-50 border border-danger-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-danger-600" />
                      <div>
                        <h4 className="font-medium text-danger-800">Erro ao carregar dados</h4>
                        <p className="text-sm text-danger-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {!error && filteredDrivers.length === 0 && !isLoading && (
                  <div className="p-8 text-center text-gray-500">
                    <Car className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Nenhum motorista encontrado</p>
                    <p className="text-sm mt-1">
                      {filter === 'all' 
                        ? 'Nenhum motorista está enviando sua localização no momento.'
                        : `Nenhum motorista ${filter} encontrado.`
                      }
                    </p>
                  </div>
                )}
                
                {filteredDrivers.map(driver => (
                  <div
                    key={driver.id}
                    onClick={() => centerOnDriver(driver)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedDriver === driver.id ? 'bg-primary-50 border-primary-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          driver.status === 'online' ? 'bg-success-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="font-medium text-gray-900">{driver.nome}</span>
                      </div>
                      <Car className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    {driver.posicao ? (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Velocidade:</span>
                          <span className="font-mono">{driver.posicao.velocidade?.toFixed(1)} km/h</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Atualizado:</span>
                          <span className="font-mono text-xs">
                            {driver.posicao.atualizado_em.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>Localização não disponível</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer da Sidebar */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Última atualização:</span>
                  <span>{lastUpdate.toLocaleTimeString()}</span>
                </div>
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
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-primary-600" />
                      <span className="text-sm text-gray-600">Atualizando...</span>
                    </div>
                  </div>
              )}
            </div>
          </div>
        )}

        {/* Aba de Cadastro */}
        {activeTab === 'cadastro' && (
          <div className="p-6 max-w-2xl mx-auto">
            <CadastroMotorista onSuccess={handleCadastroSuccess} />
          </div>
        )}

        {/* Aba de Lista de Motoristas */}
        {activeTab === 'lista' && (
          <div className="p-6 max-w-6xl mx-auto">
            <ListaMotoristas 
              refresh={refreshDriversList} 
              onRefreshComplete={handleRefreshComplete}
            />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 