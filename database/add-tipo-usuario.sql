-- =============================================
-- CRIAR TABELA TIPO_USUARIO
-- =============================================

-- 1. CRIAR TABELA TIPO_USUARIO
CREATE TABLE tipo_usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. INSERIR TIPOS PADRÃO
INSERT INTO tipo_usuario (nome, descricao) VALUES 
    ('admin', 'Administrador da empresa - pode gerenciar motoristas e visualizar relatórios'),
    ('motorista', 'Motorista da empresa - envia localização em tempo real');

-- 3. ADICIONAR COLUNA tipo_usuario_id NA TABELA USUARIOS
ALTER TABLE usuarios ADD COLUMN tipo_usuario_id INTEGER;

-- 4. MIGRAR DADOS EXISTENTES
UPDATE usuarios SET tipo_usuario_id = (
    SELECT id FROM tipo_usuario WHERE nome = usuarios.tipo
);

-- 5. CRIAR FOREIGN KEY
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuarios_tipo_usuario 
FOREIGN KEY (tipo_usuario_id) REFERENCES tipo_usuario(id);

-- 6. FAZER tipo_usuario_id OBRIGATÓRIO
ALTER TABLE usuarios ALTER COLUMN tipo_usuario_id SET NOT NULL;

-- 7. REMOVER COLUNA ANTIGA (opcional - você decide)
-- ALTER TABLE usuarios DROP COLUMN tipo;

-- 8. CRIAR ÍNDICE
CREATE INDEX idx_usuarios_tipo_usuario_id ON usuarios(tipo_usuario_id);

-- =============================================
-- ATUALIZAR TRIGGER PARA USAR NOVA ESTRUTURA
-- =============================================

-- 9. ATUALIZAR FUNÇÃO DO TRIGGER
CREATE OR REPLACE FUNCTION simple_sync_user()
RETURNS TRIGGER AS $$
DECLARE
    motorista_tipo_id INTEGER;
BEGIN
    -- Buscar ID do tipo 'motorista'
    SELECT id INTO motorista_tipo_id FROM tipo_usuario WHERE nome = 'motorista' LIMIT 1;
    
    -- Se der qualquer erro, simplesmente ignora
    BEGIN
        INSERT INTO usuarios (id, nome, email, empresa_id, tipo_usuario_id)
        SELECT 
            NEW.id,
            COALESCE(split_part(NEW.email, '@', 1), 'Usuario'),
            NEW.email,
            (SELECT id FROM empresas LIMIT 1), -- primeira empresa
            motorista_tipo_id
        WHERE EXISTS (SELECT 1 FROM empresas) 
        AND motorista_tipo_id IS NOT NULL; -- só se existir tipo motorista
    EXCEPTION WHEN OTHERS THEN
        -- Ignora qualquer erro
        NULL;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VERIFICAR RESULTADO
-- =============================================

-- 10. LISTAR TIPOS DE USUÁRIO
SELECT 
    'Tipos de usuário disponíveis:' as info,
    id,
    nome,
    descricao,
    ativo
FROM tipo_usuario
ORDER BY id;

-- 11. VERIFICAR USUÁRIOS COM NOVA ESTRUTURA
SELECT 
    u.id,
    u.nome,
    u.email,
    tu.nome as tipo_nome,
    tu.descricao as tipo_descricao,
    e.nome as empresa
FROM usuarios u
LEFT JOIN tipo_usuario tu ON u.tipo_usuario_id = tu.id
LEFT JOIN empresas e ON u.empresa_id = e.id
ORDER BY u.criado_em DESC;

-- =============================================
-- FUNÇÕES ÚTEIS PARA O CÓDIGO
-- =============================================

-- 12. FUNÇÃO PARA BUSCAR TIPO POR NOME
CREATE OR REPLACE FUNCTION get_tipo_usuario_id(tipo_nome TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT id FROM tipo_usuario WHERE nome = tipo_nome AND ativo = true LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- 13. VIEW PARA FACILITAR CONSULTAS
CREATE OR REPLACE VIEW usuarios_completo AS
SELECT 
    u.id,
    u.nome,
    u.email,
    u.empresa_id,
    e.nome as empresa_nome,
    u.tipo_usuario_id,
    tu.nome as tipo_nome,
    tu.descricao as tipo_descricao,
    u.criado_em
FROM usuarios u
LEFT JOIN empresas e ON u.empresa_id = e.id
LEFT JOIN tipo_usuario tu ON u.tipo_usuario_id = tu.id;

-- =============================================
-- COMO USAR NO CÓDIGO
-- =============================================
-- 
-- Para verificar se é admin:
-- SELECT tipo_nome = 'admin' FROM usuarios_completo WHERE id = 'user-id';
--
-- Para buscar motoristas da empresa:
-- SELECT * FROM usuarios_completo 
-- WHERE empresa_id = 'empresa-id' AND tipo_nome = 'motorista';
--
-- Para adicionar novo tipo (futuro):
-- INSERT INTO tipo_usuario (nome, descricao) VALUES ('supervisor', 'Supervisor de frota');

SELECT 'Migração concluída com sucesso!' as status; 