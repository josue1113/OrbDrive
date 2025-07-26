// @ts-ignore
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ggqmpddgyjbhccybpbdf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncW1wZGRneWpiaGNjeWJwYmRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODI0NTUsImV4cCI6MjA2ODk1ODQ1NX0.U8jn38ObEVEAh8t5dnFfLAFmwZO0qm-OVlqRrVC_XTE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Função para verificar se o usuário está autenticado
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
};

// Função para obter o usuário atual
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: usuario, error } = await supabase
    .from('usuarios_completo')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }

  return usuario;
};

// Função para fazer login
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

// Função para fazer logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Erro ao fazer logout:', error);
    return false;
  }
  return true;
};

// Função para atualizar posição do motorista
export const atualizarPosicao = async (posicao: {
  latitude: number;
  longitude: number;
  velocidade?: number;
  heading?: number;
  precisao?: number;
}) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('Usuário não autenticado');
  }



  // Fazer upsert direto na tabela posicoes
  const { data, error } = await supabase
    .from('posicoes')
    .upsert({
      usuario_id: session.user.id,
      latitude: posicao.latitude,
      longitude: posicao.longitude,
      velocidade: posicao.velocidade || 0,
      heading: posicao.heading || 0,
      precisao: posicao.precisao || 0,
      atualizado_em: new Date().toISOString()
    }, {
      onConflict: 'usuario_id' // Atualizar se já existir para este usuário
    });

  if (error) {
    console.error('Erro ao atualizar posição:', error);
    throw error;
  }


  return true;
};

// Função para buscar motoristas e suas posições mais recentes (para admins)
export const buscarPosicoesMotoristas = async (empresaId?: string) => {

  // Primeiro, buscar todos os motoristas da empresa
  let motoristasQuery = supabase
    .from('usuarios_completo')
    .select('*')
    .eq('tipo_nome', 'motorista');

  if (empresaId) {
    motoristasQuery = motoristasQuery.eq('empresa_id', empresaId);
  }

  const { data: motoristas, error: motoristasError } = await motoristasQuery;

  if (motoristasError) {
    console.error('Erro ao buscar motoristas:', motoristasError);
    throw motoristasError;
  }



  if (!motoristas || motoristas.length === 0) {
    return [];
  }

  // Para cada motorista, buscar sua posição mais recente
  const motoristasComPosicao = await Promise.all(
    motoristas.map(async (motorista) => {
      const { data: posicoes, error: posicaoError } = await supabase
        .from('posicoes')
        .select('*')
        .eq('usuario_id', motorista.id)
        .order('atualizado_em', { ascending: false })
        .limit(1);

      if (posicaoError) {
        console.error(`Erro ao buscar posição do motorista ${motorista.nome}:`, posicaoError);
      }

      // Retornar dados no formato esperado
      const posicaoMaisRecente = posicoes && posicoes.length > 0 ? posicoes[0] : null;
      
      return {
        id: posicaoMaisRecente?.id || `sem-posicao-${motorista.id}`,
        latitude: posicaoMaisRecente?.latitude || null,
        longitude: posicaoMaisRecente?.longitude || null,
        velocidade: posicaoMaisRecente?.velocidade || 0,
        atualizado_em: posicaoMaisRecente?.atualizado_em || motorista.criado_em,
        usuario_id: motorista.id,
        usuario: motorista
      };
    })
  );


  return motoristasComPosicao;
};

// Função para se inscrever em atualizações de posições em tempo real
export const subscribeToPositions = (callback: (payload: any) => void) => {
  const subscription = supabase
    .channel('posicoes-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'posicoes',
      },
      callback
    )
    .subscribe();

  return subscription;
};

// Função para cancelar inscrição
export const unsubscribeFromPositions = (subscription: any) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};

// Validações de permissão
export const isAdmin = async () => {
  const user = await getCurrentUser();
  return user?.tipo_nome === 'admin';
};

export const isMotorista = async () => {
  const user = await getCurrentUser();
  return user?.tipo_nome === 'motorista';
};

// Função para obter informações da empresa
export const getEmpresaInfo = async () => {
  const user = await getCurrentUser();
  if (!user?.empresa_id) return null;

  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', user.empresa_id)
    .single();

  if (error) {
    console.error('Erro ao buscar empresa:', error);
    return null;
  }

  return data;
};

// Tipos para o banco de dados
export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          nome: string;
          criada_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          criada_em?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          criada_em?: string;
        };
      };
      usuarios: {
        Row: {
          id: string;
          nome: string;
          email: string;
          empresa_id: string;
          tipo_usuario_id: number;
          criado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email: string;
          empresa_id: string;
          tipo_usuario_id: number;
          criado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          empresa_id?: string;
          tipo_usuario_id?: number;
          criado_em?: string;
        };
      };
      posicoes: {
        Row: {
          id: string;
          usuario_id: string;
          latitude: number;
          longitude: number;
          velocidade: number;
          heading: number;
          precisao: number;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          latitude: number;
          longitude: number;
          velocidade?: number;
          heading?: number;
          precisao?: number;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          latitude?: number;
          longitude?: number;
          velocidade?: number;
          heading?: number;
          precisao?: number;
          atualizado_em?: string;
        };
      };
    };
  };
}; 