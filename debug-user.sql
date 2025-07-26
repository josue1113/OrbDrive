-- Script para debugar usuário admin usando usuarios_completo
-- Execute no Supabase SQL Editor

-- 1. Verificar todos os usuários e seus tipos (usando a view)
SELECT * FROM usuarios_completo ORDER BY criado_em DESC;

-- 2. Verificar se existe o tipo 'admin'
SELECT * FROM tipo_usuario WHERE nome = 'admin';

-- 3. Verificar se existe o tipo 'motorista'
SELECT * FROM tipo_usuario WHERE nome = 'motorista';

-- 4. Se o usuário admin não estiver com tipo correto, corrigir:
-- UPDATE usuarios 
-- SET tipo_usuario_id = (SELECT id FROM tipo_usuario WHERE nome = 'admin')
-- WHERE email = 'SEU_EMAIL_ADMIN_AQUI';

-- 5. Verificar especificamente usuários admin
SELECT * FROM usuarios_completo WHERE tipo_nome = 'admin';

-- 6. Verificar especificamente usuários motorista
SELECT * FROM usuarios_completo WHERE tipo_nome = 'motorista'; 