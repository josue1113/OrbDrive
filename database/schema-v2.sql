-- =============================================
-- SCHEMA v2 - MULTIEMPRESA + CADASTRO MOTORISTA VIA ADMIN
-- =============================================
-- Execute este script para criar o banco do zero

-- 1. TABELA DE EMPRESAS
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABELA DE USUÁRIOS
CREATE TABLE usuarios (
    id UUID PRIMARY KEY, -- Deve ser igual ao id do Supabase Auth
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('admin', 'motorista')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA DE POSIÇÕES
CREATE TABLE posicoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    velocidade DOUBLE PRECISION DEFAULT 0,
    heading DOUBLE PRECISION DEFAULT 0,
    precisao DOUBLE PRECISION DEFAULT 0,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id)
);

-- 4. ÍNDICES
CREATE INDEX idx_usuarios_empresa_id ON usuarios(empresa_id);
CREATE INDEX idx_posicoes_usuario_id ON posicoes(usuario_id);
CREATE INDEX idx_posicoes_atualizado_em ON posicoes(atualizado_em DESC);

-- 5. CONSTRAINTS E REGRAS
-- (RLS pode ser habilitado depois, se desejar)
-- Por padrão, sem RLS para facilitar integração

-- 6. FUNÇÃO PARA ATUALIZAR POSIÇÃO (upsert)
CREATE OR REPLACE FUNCTION upsert_posicao(
    p_usuario_id UUID,
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_velocidade DOUBLE PRECISION DEFAULT 0,
    p_heading DOUBLE PRECISION DEFAULT 0,
    p_precisao DOUBLE PRECISION DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    INSERT INTO posicoes (usuario_id, latitude, longitude, velocidade, heading, precisao, atualizado_em)
    VALUES (p_usuario_id, p_latitude, p_longitude, p_velocidade, p_heading, p_precisao, NOW())
    ON CONFLICT (usuario_id) DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        velocidade = EXCLUDED.velocidade,
        heading = EXCLUDED.heading,
        precisao = EXCLUDED.precisao,
        atualizado_em = NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMO USAR ESTE SCHEMA
-- =============================================
-- 1. Crie empresas manualmente ou via painel SQL
-- 2. Crie o admin manualmente no Supabase Auth e na tabela usuarios
-- 3. Para cadastrar motorista:
--    - O admin logado chama a função de cadastro (via painel)
--    - O sistema cria o usuário no Supabase Auth (email/senha)
--    - O sistema cria o registro na tabela usuarios com o mesmo id do Auth, tipo 'motorista', empresa_id igual ao do admin
-- 4. O admin só vê motoristas da sua empresa
-- 5. O motorista só vê sua própria posição

-- =============================================
-- BLOCO OPCIONAL: CRIAR ADMIN INICIAL (REMOVA SE NÃO QUISER)
-- =============================================
-- Exemplo:
-- INSERT INTO empresas (id, nome) VALUES ('11111111-1111-1111-1111-111111111111', 'Minha Empresa');
-- INSERT INTO usuarios (id, nome, email, empresa_id, tipo) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Admin Inicial', 'admin@empresa.com', '11111111-1111-1111-1111-111111111111', 'admin');
-- Depois, crie o mesmo usuário no Supabase Auth com o mesmo id/email/senha. 