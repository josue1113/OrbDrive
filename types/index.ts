// ================================
// TIPOS DO SISTEMA DE RASTREAMENTO
// ================================

export interface Empresa {
  id: string;
  nome: string;
  criada_em: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  empresa_id: string;
  tipo_usuario_id: number;
  tipo_nome?: string; // join com tipo_usuario
  tipo_descricao?: string; // join com tipo_usuario
  empresa?: {
    id: string;
    nome: string;
  };
  criado_em?: string;
}

export interface Posicao {
  id?: string;
  usuario_id: string;
  latitude: number;
  longitude: number;
  velocidade?: number;
  heading?: number;
  precisao?: number;
  atualizado_em: string;
  usuario?: Usuario;
}

export interface PosicaoInput {
  latitude: number;
  longitude: number;
  velocidade?: number;
  heading?: number;
  precisao?: number;
}

// Estado do rastreamento
export type StatusRastreamento = 'parado' | 'rastreando' | 'erro';

export interface EstadoRastreamento {
  status: StatusRastreamento;
  watchId?: number;
  ultimaAtualizacao?: Date;
  erro?: string;
}

// Configurações de geolocalização
export interface ConfigGeolocalizacao {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}

// Dados do mapa
export interface DadosMapa {
  centro: {
    lat: number;
    lng: number;
  };
  zoom: number;
  motoristas: MotoristaNoMapa[];
}

export interface MotoristaNoMapa {
  id: string;
  nome: string;
  posicao: {
    lat: number;
    lng: number;
  };
  velocidade?: number;
  heading?: number;
  ultimaAtualizacao: string;
  status: 'online' | 'offline';
}

// Toast notifications
export type TipoToast = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  tipo: TipoToast;
  titulo: string;
  mensagem: string;
  duracao?: number;
}

// Auth types
export interface AuthState {
  usuario: Usuario | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// PWA Install types
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Google Maps types (complementares)
export interface GoogleMapsMarker {
  id: string;
  position: google.maps.LatLngLiteral;
  title: string;
  info?: string;
  icon?: google.maps.Icon | google.maps.Symbol;
}

export interface GoogleMapsConfig {
  apiKey: string;
  defaultCenter: google.maps.LatLngLiteral;
  defaultZoom: number;
  options?: google.maps.MapOptions;
}

// Real-time subscription types
export interface SubscriptionConfig {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: (payload: any) => void;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export type ErrorCode = 
  | 'GEOLOCATION_DENIED'
  | 'GEOLOCATION_UNAVAILABLE' 
  | 'GEOLOCATION_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'PERMISSION_DENIED'
  | 'INVALID_DATA'
  | 'UNKNOWN_ERROR';

// Hook return types
export interface UseGeolocationReturn {
  posicao: GeolocationPosition | null;
  erro: GeolocationPositionError | null;
  loading: boolean;
  iniciarRastreamento: () => void;
  pararRastreamento: () => void;
  status: StatusRastreamento;
}

export interface UseSupabaseReturn {
  supabase: any;
  usuario: Usuario | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<ApiResponse>;
  signOut: () => Promise<void>;
  initialized: boolean;
} 