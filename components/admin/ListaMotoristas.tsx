'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import type { Usuario } from '@/types';

interface ListaMotoristasProps {
  refresh?: boolean;
  onRefreshComplete?: () => void;
}

export default function ListaMotoristas({ refresh, onRefreshComplete }: ListaMotoristasProps) {
  const { usuario } = useAuth();
  const [motoristas, setMotoristas] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const carregarMotoristas = async () => {
    if (!usuario?.empresa_id) return;

    try {
      setLoading(true);
      setError('');

      const { data, error: queryError } = await supabase
        .from('usuarios_completo')
        .select('*')
        .eq('empresa_id', usuario.empresa_id)
        .eq('tipo_nome', 'motorista')
        .order('criado_em', { ascending: false });

      if (queryError) throw queryError;

      setMotoristas(data || []);
    } catch (err) {
      console.error('Erro ao carregar motoristas:', err);
      setError('Erro ao carregar lista de motoristas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMotoristas();
  }, [usuario?.empresa_id]);

  useEffect(() => {
    if (refresh) {
      carregarMotoristas().then(() => {
        if (onRefreshComplete) {
          onRefreshComplete();
        }
      });
    }
  }, [refresh]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Motoristas Cadastrados</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Motoristas Cadastrados</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Motoristas Cadastrados</h2>
        <button
          onClick={carregarMotoristas}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Atualizar
        </button>
      </div>

      {motoristas.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">Nenhum motorista cadastrado ainda</p>
          <p className="text-gray-400 text-sm">Use o formulário acima para cadastrar o primeiro motorista</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Cadastrado em</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {motoristas.map((motorista) => (
                <tr key={motorista.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{motorista.nome}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-gray-600">{motorista.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-gray-600 text-sm">
                      {motorista.criado_em ? 
                        new Date(motorista.criado_em).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        '-'
                      }
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Ativo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        Total: {motoristas.length} motorista{motoristas.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
} 