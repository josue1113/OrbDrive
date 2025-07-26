# 🚀 Como Executar o Projeto

## Passos Rápidos

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Banco de Dados
1. Acesse o [Supabase](https://jtkocqfxoujrxmnxvdix.supabase.co)
2. Execute o script SQL do arquivo `database/setup.sql`
3. **Se der erro RLS**, use o arquivo `database/setup-simple.sql` (versão sem segurança avançada)
4. **Para testar o painel admin**, execute também `database/insert-mock-positions.sql`
5. Os dados de exemplo serão criados automaticamente com IDs gerados pelo banco

### 3. Executar em Desenvolvimento
```bash
npm run dev
```

### 4. Acessar o Sistema
- **Página inicial**: http://localhost:3000
- **App Motorista**: http://localhost:3000/motorista  
- **Painel Admin**: http://localhost:3000/admin

## 👤 Usuários de Teste (Criados Automaticamente)

### Transportadora ABC
- **Admin**: admin@abc.com
- **Motoristas**: joao@abc.com, maria@abc.com

### Logística XYZ  
- **Admin**: admin@xyz.com
- **Motoristas**: pedro@xyz.com

*Obs: Os IDs são gerados automaticamente pelo Supabase*

## 🔑 Credenciais Já Configuradas

- **Supabase URL**: `https://jtkocqfxoujrxmnxvdix.supabase.co`
- **Google Maps API**: `AIzaSyAxYDfxuRMozJuo2FRuKybzg-Nn29hXWps`

## 📱 Testando o PWA

### No Desktop
1. Abra Chrome/Edge
2. Acesse http://localhost:3000
3. Clique no ícone de instalar na barra de endereços

### No Mobile
1. Abra o navegador mobile
2. Acesse o site
3. Menu → "Adicionar à tela inicial"

## 🗺️ Testando o Rastreamento

### App do Motorista  
1. Acesse `/motorista`
2. Clique em "Iniciar Rastreamento"
3. Permita acesso à localização
4. Veja os dados sendo atualizados

### Painel Admin (Dados Reais)
1. **IMPORTANTE**: Execute primeiro `database/insert-mock-positions.sql` no Supabase
2. Acesse `/admin`
3. Veja os motoristas reais no Google Maps
4. Clique nos marcadores para mais info
5. Use os filtros para filtrar status
6. Use o botão "Atualizar" para refresh dos dados

**📊 O painel agora mostra dados reais do banco de dados Supabase!**

## 🔧 Solução Rápida de Problemas

### Erro "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### GPS não funciona
- Use HTTPS (necessário para geolocalização)
- Teste em dispositivo real (não simulador)

### Mapa não carrega
- Verifique se a chave Google Maps está ativa
- Confirme se as APIs estão habilitadas no Google Console

## 📊 Estrutura de Dados

O sistema já vem com dados de exemplo configurados. As tabelas principais são:
- `empresas` - Dados das empresas
- `usuarios` - Admins e motoristas
- `posicoes` - Localizações dos motoristas

## 🚀 Deploy Rápido

### Vercel
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload da pasta .next para Netlify
```

---

**✅ Sistema completo e funcional pronto para uso!** 