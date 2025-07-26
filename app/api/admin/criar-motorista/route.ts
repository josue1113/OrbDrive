import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase com service_role para operações admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Precisa desta env var
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, email, senha, adminId } = body;

    // Validações básicas
    if (!nome || !email || !senha || !adminId) {
      return NextResponse.json(
        { error: 'Nome, email, senha e adminId são obrigatórios' },
        { status: 400 }
      );
    }

    // 1. Buscar dados do admin (empresa_id)
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('usuarios')
      .select('empresa_id, tipo_usuario_id')
      .eq('id', adminId)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json(
        { error: 'Admin não encontrado ou sem permissão' },
        { status: 403 }
      );
    }

    // Verificar se é admin
    const { data: tipoAdmin } = await supabaseAdmin
      .from('tipo_usuario')
      .select('nome')
      .eq('id', adminData.tipo_usuario_id)
      .single();

    if (tipoAdmin?.nome !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas admins podem cadastrar motoristas' },
        { status: 403 }
      );
    }

    // 2. Buscar ID do tipo 'motorista'
    const { data: tipoMotorista, error: tipoError } = await supabaseAdmin
      .from('tipo_usuario')
      .select('id')
      .eq('nome', 'motorista')
      .single();

    if (tipoError || !tipoMotorista) {
      return NextResponse.json(
        { error: 'Tipo de usuário "motorista" não encontrado' },
        { status: 500 }
      );
    }

    // 3. Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // Confirma email automaticamente
      user_metadata: {
        nome,
        tipo: 'motorista',
        empresa_id: adminData.empresa_id
      }
    });

    if (authError || !authUser.user) {
      console.error('Erro ao criar usuário no Auth:', authError);
      return NextResponse.json(
        { error: `Erro ao criar usuário: ${authError?.message}` },
        { status: 500 }
      );
    }

    // 4. Criar registro na tabela usuarios
    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: authUser.user.id, // Mesmo ID do Auth
        nome,
        email,
        empresa_id: adminData.empresa_id,
        tipo_usuario_id: tipoMotorista.id
      });

    if (usuarioError) {
      // Se falhar, tentar deletar o usuário do Auth (cleanup)
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      console.error('Erro ao criar usuário na tabela:', usuarioError);
      return NextResponse.json(
        { error: `Erro ao salvar dados: ${usuarioError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Motorista cadastrado com sucesso',
      usuario: {
        id: authUser.user.id,
        nome,
        email
      }
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 