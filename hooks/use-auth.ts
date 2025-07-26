// @ts-ignore
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Usuario } from '@/types';

interface SignInResult {
  success: boolean;
  usuario?: Usuario;
  error?: string;
}

// Hook principal de autenticação - VERSÃO SIMPLES
export const useAuth = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar usuário do localStorage
  const loadStoredUser = (): Usuario | null => {
    try {
      const stored = localStorage.getItem('orbdrive-user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      return null;
    }
  };

  // Salvar usuário no localStorage
  const saveUser = (userData: Usuario | null) => {
    if (userData) {
      localStorage.setItem('orbdrive-user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('orbdrive-user');
    }
  };

  // Buscar dados do usuário no banco
  const buscarDadosUsuario = async (authUserId: string): Promise<Usuario | null> => {
    try {
      const { data, error } = await supabase
        .from('usuarios_completo')
        .select('*')
        .eq('id', authUserId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        nome: data.nome,
        email: data.email,
        empresa_id: data.empresa_id,
        tipo_usuario_id: data.tipo_usuario_id,
        tipo_nome: data.tipo_nome,
        tipo_descricao: data.tipo_descricao,
        empresa: {
          id: data.empresa_id,
          nome: data.empresa_nome
        },
        criado_em: data.criado_em
      };
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      return null;
    }
  };

  // Fazer login
  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    try {
      setIsLoading(true);
      setError(null);

      // Login no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Erro na autenticação');
      }

      // Buscar dados do usuário na tabela usuarios
      const userData = await buscarDadosUsuario(authData.user.id);
      
      if (!userData) {
        throw new Error('Usuário não encontrado no sistema');
      }

      setUsuario(userData);
      saveUser(userData);
      return { success: true, usuario: userData };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Fazer logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUsuario(null);
      setError(null);
      saveUser(null);
      
      // Redirecionar para login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  // Inicializar na montagem do componente
  useEffect(() => {
    const initAuth = async () => {
      // Carregar do localStorage primeiro
      const storedUser = loadStoredUser();
      if (storedUser) {
        setUsuario(storedUser);
        setIsLoading(false);
        return;
      }

      // Verificar sessão do Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userData = await buscarDadosUsuario(session.user.id);
          if (userData) {
            setUsuario(userData);
            saveUser(userData);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  return {
    usuario,
    isLoading,
    error,
    isAuthenticated: !!usuario,
    isAdmin: usuario?.tipo_nome === 'admin',
    isMotorista: usuario?.tipo_nome === 'motorista',
    signIn,
    logout
  };
}; 