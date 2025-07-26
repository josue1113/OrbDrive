-- =============================================
-- TRIGGER ULTRA-SIMPLES (SÓ EXECUTA APÓS TESTAR SEM TRIGGER)
-- =============================================

-- 1. FUNÇÃO SIMPLES QUE NÃO FALHA
CREATE OR REPLACE FUNCTION simple_sync_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Se der qualquer erro, simplesmente ignora
    BEGIN
        INSERT INTO usuarios (id, nome, email, empresa_id, tipo)
        SELECT 
            NEW.id,
            COALESCE(split_part(NEW.email, '@', 1), 'Usuario'),
            NEW.email,
            (SELECT id FROM empresas LIMIT 1), -- primeira empresa
            'motorista'
        WHERE EXISTS (SELECT 1 FROM empresas); -- só se existir empresa
    EXCEPTION WHEN OTHERS THEN
        -- Ignora qualquer erro
        NULL;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CRIAR TRIGGER SIMPLES
CREATE TRIGGER simple_user_sync
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION simple_sync_user();

-- 3. TESTE
SELECT 'Trigger simples criado!' as status;

-- 4. AGORA TESTE CRIAR USUÁRIO NO PAINEL AUTH
-- Se funcionar, o usuário será criado nas duas tabelas
-- Se não funcionar, pelo menos não vai bloquear a criação no Auth 