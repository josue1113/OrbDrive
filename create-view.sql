-- Criar view usuarios_completo se não existir
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

-- Testar a view
SELECT * FROM usuarios_completo LIMIT 5;

-- Verificar especificamente o usuário admin
SELECT * FROM usuarios_completo WHERE email = 'josue@admin.com'; 