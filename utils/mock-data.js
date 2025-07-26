// Script para inserir dados de posição mock no Supabase
// Execute: node utils/mock-data.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jtkocqfxoujrxmnxvdix.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0a29jcWZ4b3Vqcnhtbnh2ZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzQxOTQsImV4cCI6MjA2ODk1MDE5NH0.ZMZ_YbYqyyTgZ0JRmRkSCCboi5RBok_CTzm2JmsOXlk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertMockPositions() {
  try {
    console.log('🔄 Buscando usuários motoristas...');
    
    // Buscar motoristas do banco
    const { data: motoristas, error: motoristaError } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('tipo', 'motorista');

    if (motoristaError) {
      throw motoristaError;
    }

    if (!motoristas || motoristas.length === 0) {
      console.log('❌ Nenhum motorista encontrado no banco.');
      return;
    }

    console.log(`✅ Encontrados ${motoristas.length} motoristas`);

    // Inserir posições mock para cada motorista
    for (const motorista of motoristas) {
      // Coordenadas base de São Paulo com pequena variação
      const baseLat = -23.5505;
      const baseLng = -46.6333;
      
      const latitude = baseLat + (Math.random() - 0.5) * 0.01; // ~1km de variação
      const longitude = baseLng + (Math.random() - 0.5) * 0.01;
      const velocidade = Math.random() * 60; // 0-60 km/h
      const heading = Math.random() * 360; // 0-360 graus
      const precisao = 5 + Math.random() * 10; // 5-15 metros

      console.log(`📍 Inserindo posição para ${motorista.nome}...`);

      const { error: posicaoError } = await supabase
        .from('posicoes')
        .upsert({
          usuario_id: motorista.id,
          latitude,
          longitude,
          velocidade,
          heading,
          precisao,
          atualizado_em: new Date().toISOString()
        });

      if (posicaoError) {
        console.error(`❌ Erro ao inserir posição para ${motorista.nome}:`, posicaoError);
      } else {
        console.log(`✅ Posição inserida para ${motorista.nome}`);
      }
    }

    console.log('🎉 Dados mock inseridos com sucesso!');
    
    // Verificar dados inseridos
    const { data: posicoes, error: verificacaoError } = await supabase
      .from('posicoes')
      .select(`
        latitude,
        longitude,
        velocidade,
        atualizado_em,
        usuario:usuarios(nome, email)
      `);

    if (!verificacaoError && posicoes) {
      console.log('\n📊 Posições no banco:');
      posicoes.forEach(pos => {
        console.log(`  - ${pos.usuario.nome}: ${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)} (${pos.velocidade.toFixed(1)} km/h)`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  insertMockPositions();
}

module.exports = { insertMockPositions }; 