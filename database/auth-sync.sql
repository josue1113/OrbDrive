-- =============================================
-- SINCRONIZAÇÃO AUTOMÁTICA: AUTH.USERS ↔ USUARIOS
-- =============================================
-- Execute este script APÓS o schema-v2.sql

-- 1. FUNÇÃO PARA SINCRONIZAR USUÁRIO CRIADO NO AUTH
CREATE OR REPLACE FUNCTION sync_user_to_usuarios()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando um usuário é criado no auth.users,
    -- vamos inserir na tabela usuarios automaticamente
    
    -- Precisamos extrair dados do user_metadata ou raw_user_meta_data
    DECLARE
        user_name TEXT;
        user_tipo TEXT;
        user_empresa_id UUID;
    BEGIN
        -- Extrair dados do metadata (você pode ajustar conforme necessário)
        user_name := COALESCE(
            NEW.raw_user_meta_data->>'nome',
            NEW.raw_user_meta_data->>'name', 
            split_part(NEW.email, '@', 1) -- fallback: parte antes do @
        );
        
        user_tipo := COALESCE(
            NEW.raw_user_meta_data->>'tipo',
            'motorista' -- padrão é motorista (admin deve ser especificado)
        );
        
        user_empresa_id := COALESCE(
            (NEW.raw_user_meta_data->>'empresa_id')::UUID,
            NULL -- se não especificado, será NULL (pode causar erro de constraint)
        );
        
        -- Inserir na tabela usuarios
        INSERT INTO usuarios (id, nome, email, empresa_id, tipo, criado_em)
        VALUES (
            NEW.id,
            user_name,
            NEW.email,
            user_empresa_id,
            user_tipo,
            NEW.created_at
        )
        ON CONFLICT (id) DO UPDATE SET
            nome = EXCLUDED.nome,
            email = EXCLUDED.email,
            empresa_id = EXCLUDED.empresa_id,
            tipo = EXCLUDED.tipo;
            
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNÇÃO PARA SINCRONIZAR USUÁRIO DELETADO NO AUTH
CREATE OR REPLACE FUNCTION sync_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando um usuário é deletado do auth.users,
    -- também deletar da tabela usuarios
    DELETE FROM usuarios WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CRIAR TRIGGERS
DROP TRIGGER IF EXISTS trigger_sync_user_insert ON auth.users;
DROP TRIGGER IF EXISTS trigger_sync_user_delete ON auth.users;

CREATE TRIGGER trigger_sync_user_insert
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_to_usuarios();

CREATE TRIGGER trigger_sync_user_delete
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_delete();

-- =============================================
-- COMO USAR
-- =============================================
-- Agora, quando você criar um usuário no painel Auth do Supabase:
-- 1. Vá para Authentication > Users
-- 2. Clique em "Add user"
-- 3. Preencha:
--    - Email: admin@empresa.com
--    - Password: sua_senha
--    - User Metadata (JSON):
--      {
--        "nome": "Admin da Empresa",
--        "tipo": "admin",
--        "empresa_id": "id-da-empresa-aqui"
--      }
-- 4. O usuário será automaticamente criado na tabela usuarios!

-- =============================================
-- EXEMPLO DE USER METADATA PARA DIFERENTES TIPOS
-- =============================================
-- ADMIN:
-- {
--   "nome": "João Admin",
--   "tipo": "admin", 
--   "empresa_id": "11111111-1111-1111-1111-111111111111"
-- }
--
-- MOTORISTA (criado pelo admin via painel):
-- {
--   "nome": "Pedro Motorista",
--   "tipo": "motorista",
--   "empresa_id": "11111111-1111-1111-1111-111111111111"
-- }

-- =============================================
-- VERIFICAR SE ESTÁ FUNCIONANDO
-- =============================================
-- Após criar um usuário no Auth, execute:
-- SELECT 
--     au.id,
--     au.email,
--     au.created_at as "criado_no_auth",
--     u.nome,
--     u.tipo,
--     u.empresa_id,
--     u.criado_em as "criado_na_tabela"
-- FROM auth.users au
-- LEFT JOIN usuarios u ON au.id = u.id
-- ORDER BY au.created_at DESC; 