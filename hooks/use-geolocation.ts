// @ts-ignore
import { useState, useEffect, useCallback, useRef } from 'react';
import type { StatusRastreamento, ConfigGeolocalizacao, UseGeolocationReturn } from '@/types';

// Configuração padrão da geolocalização
const CONFIG_PADRAO: ConfigGeolocalizacao = {
  enableHighAccuracy: true,
  timeout: 10000, // 10 segundos
  maximumAge: 60000, // 1 minuto
};

export const useGeolocation = (): UseGeolocationReturn => {
  const [posicao, setPosicao] = useState<GeolocationPosition | null>(null);
  const [erro, setErro] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusRastreamento>('parado');
  
  const watchIdRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);

  // Função para lidar com sucesso na obtenção da localização
  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setPosicao(position);
    setErro(null);
    setLoading(false);
    
    if (isActiveRef.current) {
      setStatus('rastreando');
    }
  }, []);

  // Função para lidar com erros de geolocalização
  const handleError = useCallback((error: GeolocationPositionError) => {
    setErro(error);
    setLoading(false);
    setStatus('erro');
    
    console.error('Erro de geolocalização:', {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Função para iniciar o rastreamento
  const iniciarRastreamento = useCallback(() => {
    if (!navigator.geolocation) {
      const error: GeolocationPositionError = {
        code: 2,
        message: 'Geolocalização não é suportada neste dispositivo',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };
      handleError(error);
      return;
    }

    if (isActiveRef.current) {
      console.warn('Rastreamento já está ativo');
      return;
    }

    setLoading(true);
    setErro(null);
    isActiveRef.current = true;

    // Obter posição inicial
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      CONFIG_PADRAO
    );

    // Iniciar rastreamento contínuo
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      CONFIG_PADRAO
    );

    watchIdRef.current = watchId;
    
    console.log('Rastreamento iniciado, watchId:', watchId);
  }, [handleSuccess, handleError]);

  // Função para parar o rastreamento
  const pararRastreamento = useCallback(() => {
    if (!isActiveRef.current) {
      console.warn('Rastreamento não está ativo');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      console.log('Rastreamento parado, watchId:', watchIdRef.current);
      watchIdRef.current = null;
    }

    isActiveRef.current = false;
    setStatus('parado');
    setLoading(false);
    
    console.log('Rastreamento parado');
  }, []);

  // Limpar rastreamento ao desmontar o componente
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        isActiveRef.current = false;
      }
    };
  }, []);

  // Verificar se a geolocalização está disponível
  useEffect(() => {
    if (!navigator.geolocation) {
      const error: GeolocationPositionError = {
        code: 2,
        message: 'Geolocalização não é suportada neste navegador',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };
      setErro(error);
      setStatus('erro');
    }
  }, []);

  return {
    posicao,
    erro,
    loading,
    iniciarRastreamento,
    pararRastreamento,
    status,
  };
};

// Hook para obter posição única (não rastrear continuamente)
export const useCurrentPosition = () => {
  const [posicao, setPosicao] = useState<GeolocationPosition | null>(null);
  const [erro, setErro] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(false);

  const obterPosicao = useCallback(() => {
    if (!navigator.geolocation) {
      const error: GeolocationPositionError = {
        code: 2,
        message: 'Geolocalização não é suportada neste dispositivo',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };
      setErro(error);
      return Promise.reject(error);
    }

    setLoading(true);
    setErro(null);

    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPosicao(position);
          setLoading(false);
          resolve(position);
        },
        (error) => {
          setErro(error);
          setLoading(false);
          reject(error);
        },
        CONFIG_PADRAO
      );
    });
  }, []);

  return {
    posicao,
    erro,
    loading,
    obterPosicao,
  };
};

// Utilitários para trabalhar com coordenadas
export const formatarCoordenadas = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  const latAbs = Math.abs(lat).toFixed(6);
  const lngAbs = Math.abs(lng).toFixed(6);
  
  return `${latAbs}°${latDir}, ${lngAbs}°${lngDir}`;
};

// Calcular distância entre duas coordenadas (fórmula de Haversine)
export const calcularDistancia = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;
  
  return distancia;
};

// Verificar se a posição mudou significativamente
export const posicaoMudouSignificativamente = (
  pos1: GeolocationPosition | null,
  pos2: GeolocationPosition | null,
  distanciaMinima: number = 0.01 // 10 metros
): boolean => {
  if (!pos1 || !pos2) return true;
  
  const distancia = calcularDistancia(
    pos1.coords.latitude, pos1.coords.longitude,
    pos2.coords.latitude, pos2.coords.longitude
  );
  
  return distancia >= distanciaMinima;
}; 