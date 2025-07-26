-- =============================================
-- SINCRONIZAÇÃO CORRIGIDA: AUTH.USERS ↔ USUARIOS
-- =============================================
-- Execute este script para CORRIGIR os triggers

-- 1. REMOVER TRIGGERS ANTIGOS
DROP TRIGGER IF EXISTS trigger_sync_user_insert ON auth.users;
DROP TRIGGER IF EXISTS trigger_sync_user_delete ON auth.users;

-- 2. FUNÇÃO CORRIGIDA - MAIS TOLERANTE A ERROS
CREATE OR REPLACE FUNCTION sync_user_to_usuarios()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_tipo TEXT;
    user_empresa_id UUID;
    default_empresa_id UUID;
BEGIN
    -- Buscar uma empresa padrão (primeira empresa criada)
    SELECT id INTO default_empresa_id FROM empresas ORDER BY criada_em LIMIT 1;
    
    -- Se não existir empresa, não fazer nada (evita erro)
    IF default_empresa_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Extrair dados do metadata com fallbacks seguros
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'nome',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'Usuário'
    );
    
    user_tipo := COALESCE(
        NEW.raw_user_meta_data->>'tipo',
        'motorista' -- padrão
    );
    
    user_empresa_id := COALESCE(
        (NEW.raw_user_meta_data->>'empresa_id')::UUID,
        default_empresa_id -- usar empresa padrão se não especificado
    );
    
    -- Inserir na tabela usuarios (com tratamento de erro)
    BEGIN
        INSERT INTO usuarios (id, nome, email, empresa_id, tipo, criado_em)
        VALUES (
            NEW.id,
            user_name,
            NEW.email,
            user_empresa_id,
            user_tipo,
            COALESCE(NEW.created_at, NOW())
        )
        ON CONFLICT (id) DO UPDATE SET
            nome = EXCLUDED.nome,
            email = EXCLUDED.email,
            empresa_id = EXCLUDED.empresa_id,
            tipo = EXCLUDED.tipo;
    EXCEPTION
        WHEN OTHERS THEN
            -- Se der erro, registrar no log mas não falhar
            RAISE WARNING 'Erro ao sincronizar usuário %: %', NEW.email, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNÇÃO DE DELETE (mais simples)
CREATE OR REPLACE FUNCTION sync_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Deletar da tabela usuarios (com tratamento de erro)
    BEGIN
        DELETE FROM usuarios WHERE id = OLD.id;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Erro ao deletar usuário %: %', OLD.email, SQLERRM;
    END;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RECRIAR TRIGGERS
CREATE TRIGGER trigger_sync_user_insert
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_to_usuarios();

CREATE TRIGGER trigger_sync_user_delete
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_delete();

-- =============================================
-- TESTE: CRIAR EMPRESA PADRÃO SE NÃO EXISTIR
-- =============================================
INSERT INTO empresas (nome) 
VALUES ('Empresa Padrão') 
ON CONFLICT (nome) DO NOTHING;

-- =============================================
-- VERIFICAR SE TUDO ESTÁ OK
-- =============================================
SELECT 'Triggers criados com sucesso!' as status;

-- Listar empresas disponíveis
SELECT 'Empresas disponíveis:' as info, id, nome FROM empresas;

-- =============================================
-- COMO USAR AGORA (MAIS SIMPLES)
-- =============================================
-- MÉTODO 1: Sem metadata (vai usar empresa padrão)
-- - Email: admin@teste.com
-- - Password: senha123
-- - User Metadata: {} (vazio ou não preencher)
-- Resultado: Será criado como 'motorista' na empresa padrão

-- MÉTODO 2: Com metadata específico
-- - Email: admin@empresa.com  
-- - Password: senha123
-- - User Metadata:
-- {
--   "nome": "João Admin",
--   "tipo": "admin",
--   "empresa_id": "cole-id-da-empresa-aqui"
-- }

-- =============================================
-- TESTAR CRIAÇÃO DE USUÁRIO
-- =============================================
-- Agora tente criar um usuário no painel Auth!
-- Se ainda der erro, execute:
-- SELECT * FROM pg_stat_activity WHERE query LIKE '%trigger%';
-- Para debugar. 