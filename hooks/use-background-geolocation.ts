'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface BackgroundGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  updateInterval?: number;
}

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  timestamp: number;
}

interface BackgroundGeolocationState {
  position: GeolocationPosition | null;
  isTracking: boolean;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  backgroundPermission: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export function useBackgroundGeolocation(options: BackgroundGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    updateInterval = 15000 // 15 segundos
  } = options;

  const [state, setState] = useState<BackgroundGeolocationState>({
    position: null,
    isTracking: false,
    error: null,
    permission: 'unknown',
    backgroundPermission: 'unknown'
  });

  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Verificar permissões
  const checkPermissions = useCallback(async () => {
    try {
      // Verificar permissão de geolocalização
      if ('permissions' in navigator) {
        const geoPermission = await navigator.permissions.query({ name: 'geolocation' });
        
        // Verificar se existe permissão de background (experimental)
        let backgroundPermission = 'unknown';
        try {
          // @ts-ignore - API experimental
          const bgPermission = await navigator.permissions.query({ name: 'background-sync' });
          backgroundPermission = bgPermission.state;
        } catch {
          backgroundPermission = 'granted'; // Assumir disponível se não puder verificar
        }

        setState(prev => ({
          ...prev,
          permission: geoPermission.state as any,
          backgroundPermission: backgroundPermission as any
        }));

        return {
          geolocation: geoPermission.state,
          background: backgroundPermission
        };
      }
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
    }

    return {
      geolocation: 'unknown',
      background: 'unknown'
    };
  }, []);

  // Solicitar permissões
  const requestPermissions = useCallback(async () => {
    try {
      // Solicitar permissão de geolocalização
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed || undefined,
            heading: pos.coords.heading || undefined,
            altitude: pos.coords.altitude || undefined,
            altitudeAccuracy: pos.coords.altitudeAccuracy || undefined,
            timestamp: pos.timestamp
          }),
          reject,
          { enableHighAccuracy, timeout, maximumAge }
        );
      });

      // Solicitar Wake Lock para manter ativo em segundo plano
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (error) {
        console.warn('Wake Lock não disponível:', error);
      }

      setState(prev => ({
        ...prev,
        permission: 'granted',
        position,
        error: null
      }));

      await checkPermissions();
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        permission: 'denied'
      }));
      return false;
    }
  }, [enableHighAccuracy, timeout, maximumAge, checkPermissions]);

  // Iniciar rastreamento
  const startTracking = useCallback(async () => {
    if (state.isTracking) return;

    // Verificar e solicitar permissões se necessário
    if (state.permission !== 'granted') {
      const granted = await requestPermissions();
      if (!granted) return;
    }

    try {
      // Registrar Service Worker se não estiver registrado
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js');
      }

      // Iniciar watchPosition para atualizações contínuas
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const position: GeolocationPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed || undefined,
            heading: pos.coords.heading || undefined,
            altitude: pos.coords.altitude || undefined,
            altitudeAccuracy: pos.coords.altitudeAccuracy || undefined,
            timestamp: pos.timestamp
          };

          setState(prev => ({
            ...prev,
            position,
            error: null
          }));

          // Enviar para Service Worker para cache offline
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CACHE_LOCATION',
              location: position
            });
          }
        },
        (error) => {
          setState(prev => ({
            ...prev,
            error: error.message
          }));
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge
        }
      );

      // Configurar intervalo para manter ativo mesmo quando em background
      intervalIdRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const position: GeolocationPosition = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              speed: pos.coords.speed || undefined,
              heading: pos.coords.heading || undefined,
              altitude: pos.coords.altitude || undefined,
              altitudeAccuracy: pos.coords.altitudeAccuracy || undefined,
              timestamp: pos.timestamp
            };

            setState(prev => ({
              ...prev,
              position
            }));
          },
          (error) => {
            console.error('Erro no heartbeat de localização:', error);
          },
          {
            enableHighAccuracy: false, // Menor precisão para economizar bateria
            timeout: 5000,
            maximumAge: 30000
          }
        );
      }, updateInterval);

      setState(prev => ({
        ...prev,
        isTracking: true,
        error: null
      }));

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message
      }));
    }
  }, [state.isTracking, state.permission, requestPermissions, enableHighAccuracy, timeout, maximumAge, updateInterval]);

  // Parar rastreamento
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    // Liberar Wake Lock
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isTracking: false
    }));
  }, []);

  // Verificar se está em background
  const isInBackground = useCallback(() => {
    return document.hidden || document.visibilityState === 'hidden';
  }, []);

  // Listener para mudanças de visibilidade (foreground/background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (state.isTracking) {
        if (document.hidden) {
          // App foi para background - registrar background sync
          if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then((registration) => {
              return (registration as any).sync.register('background-sync-location');
            }).catch(console.error);
          }
        } else {
          // App voltou para foreground - continuar rastreamento normal
          console.log('App retornou para foreground');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.isTracking]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // Verificar permissões iniciais
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    ...state,
    startTracking,
    stopTracking,
    requestPermissions,
    checkPermissions,
    isInBackground
  };
} 