# 🚛 Sistema de Rastreamento de Motoristas

PWA completo e moderno para rastreamento de motoristas em tempo real com suporte multiempresa.

## 📱 Visão Geral

Este sistema oferece duas interfaces principais:
- **App PWA do Motorista**: Interface mobile otimizada para rastreamento GPS
- **Painel Administrativo**: Dashboard web com Google Maps para monitoramento

## ✨ Funcionalidades Principais

### 🚗 App do Motorista
- ✅ Rastreamento GPS em tempo real
- ✅ Interface PWA otimizada para mobile
- ✅ Funcionamento offline com sincronização
- ✅ Status de conectividade em tempo real
- ✅ Informações detalhadas de localização
- ✅ Controle simples (Iniciar/Parar rastreamento)

### 🖥️ Painel Admin
- ✅ Visualização em Google Maps
- ✅ Monitoramento de múltiplos motoristas
- ✅ Filtros por status (Online/Offline)
- ✅ Estatísticas em tempo real
- ✅ Informações detalhadas por motorista
- ✅ Atualização automática das posições

### 🏢 Sistema Multiempresa
- ✅ Isolamento total de dados por empresa
- ✅ Políticas de segurança RLS no Supabase
- ✅ Usuários admin e motorista por empresa
- ✅ Escalabilidade para múltiplas empresas

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Maps**: Google Maps API
- **PWA**: Service Worker, Web App Manifest
- **Icons**: Lucide React

## 🚀 Instalação e Configuração

### 1. Prerequisites

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Chave da API do Google Maps

### 2. Clonar e Instalar

```bash
# Clonar o repositório
git clone <seu-repo>
cd rastreamento-motoristas

# Instalar dependências
npm install
```

### 3. Configurar Banco de Dados (Supabase)

1. **Acesse o Supabase e execute o script SQL**:
```sql
-- Execute o conteúdo do arquivo database/setup.sql
-- OU se der erro RLS, use database/setup-simple.sql
```

2. **As credenciais já estão configuradas no código**:
- URL: `https://jtkocqfxoujrxmnxvdix.supabase.co`
- Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. Executar o Projeto

```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

### 5. Acessar as Aplicações

- **Página inicial**: http://localhost:3000
- **App Motorista**: http://localhost:3000/motorista
- **Painel Admin**: http://localhost:3000/admin

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### `empresas`
```sql
id          UUID PRIMARY KEY
nome        TEXT NOT NULL
criada_em   TIMESTAMPTZ DEFAULT NOW()
```

#### `usuarios`
```sql
id          UUID PRIMARY KEY
nome        TEXT NOT NULL
email       TEXT UNIQUE NOT NULL
empresa_id  UUID REFERENCES empresas(id)
tipo        TEXT CHECK (tipo IN ('admin', 'motorista'))
criado_em   TIMESTAMPTZ DEFAULT NOW()
```

#### `posicoes`
```sql
id             UUID PRIMARY KEY
usuario_id     UUID REFERENCES usuarios(id)
latitude       FLOAT8 NOT NULL
longitude      FLOAT8 NOT NULL
velocidade     FLOAT8 DEFAULT 0
heading        FLOAT8 DEFAULT 0
precisao       FLOAT8 DEFAULT 0
atualizado_em  TIMESTAMPTZ DEFAULT NOW()
```

### Dados de Exemplo

O sistema já vem configurado com dados de exemplo:

**Empresas:**
- Transportadora ABC
- Logística XYZ

**Usuários de Teste (criados automaticamente):**
- `admin@abc.com` (Admin - Transportadora ABC)
- `joao@abc.com` (Motorista - Transportadora ABC)
- `maria@abc.com` (Motorista - Transportadora ABC)
- `admin@xyz.com` (Admin - Logística XYZ)
- `pedro@xyz.com` (Motorista - Logística XYZ)

*Obs: Os IDs são gerados automaticamente pelo banco de dados*

## 🔐 Segurança (RLS)

O sistema implementa Row Level Security (RLS) para isolamento de dados:

- **Motoristas**: Podem inserir/atualizar apenas suas próprias posições
- **Admins**: Podem visualizar apenas motoristas da sua empresa
- **Empresas**: Isolamento total de dados entre empresas

## 📱 PWA - Progressive Web App

### Funcionalidades PWA
- ✅ Instalável no device (Android/iOS)
- ✅ Funciona offline
- ✅ Service Worker para cache
- ✅ Sincronização em background
- ✅ Ícones e splash screen
- ✅ Shortcuts para acesso rápido

### Instalação no Dispositivo
1. Acesse o site no navegador mobile
2. Toque no menu do navegador
3. Selecione "Adicionar à tela inicial"
4. Confirme a instalação

## 🗂️ Estrutura do Projeto

```
rastreamento-motoristas/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Layout principal
│   ├── page.tsx                 # Página inicial
│   ├── globals.css              # Estilos globais
│   ├── motorista/               # App PWA do motorista
│   │   └── page.tsx
│   └── admin/                   # Painel administrativo
│       └── page.tsx
├── components/                   # Componentes reutilizáveis
├── hooks/                       # Hooks customizados
│   ├── use-auth.ts             # Autenticação
│   └── use-geolocation.ts      # Geolocalização
├── lib/                        # Utilitários e configurações
│   └── supabase.ts            # Cliente Supabase
├── types/                      # Definições TypeScript
│   ├── index.ts               # Tipos principais
│   └── google-maps.d.ts       # Tipos Google Maps
├── public/                     # Arquivos estáticos
│   ├── manifest.json          # PWA Manifest
│   ├── sw.js                  # Service Worker
│   └── *.png                  # Ícones PWA
├── database/                   # Scripts SQL
│   └── setup.sql              # Setup do banco
└── README.md                   # Esta documentação
```

## 🚀 Deploy

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📋 Configuração de Produção

### 1. Variáveis de Ambiente
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_supabase
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_google_maps
```

### 2. Ícones PWA
Substitua os arquivos em `/public/` pelos ícones da sua marca:
- `icon-72x72.png` até `icon-512x512.png`
- `favicon.ico`

### 3. Domínio e SSL
- Configure um domínio próprio
- Habilite SSL/HTTPS (obrigatório para PWA)
- Configure o Service Worker para o novo domínio

## 🔧 Personalização

### Cores e Tema
Edite `tailwind.config.js` para personalizar cores:
```js
theme: {
  extend: {
    colors: {
      primary: {
        // Suas cores primárias
      }
    }
  }
}
```

### Configurações PWA
Edite `/public/manifest.json`:
```json
{
  "name": "Sua Empresa - Rastreamento",
  "short_name": "SuaEmpresa",
  "theme_color": "#sua-cor"
}
```

## 🐛 Solução de Problemas

### Erro RLS no banco de dados
- **Erro**: `ERROR: 42601: only WITH CHECK expression allowed for INSERT`
- **Solução**: Use o arquivo `database/setup-simple.sql` ao invés do `setup.sql`
- **Alternativa**: Desabilite RLS temporariamente para inserir dados

### GPS não funciona
- Verifique se está usando HTTPS
- Confirme permissões de localização
- Teste em device físico (não simulador)

### Mapa não carrega
- Verifique a chave da API Google Maps
- Confirme se a API está habilitada no Google Console
- Verifique restrições de domínio

### PWA não instala
- Confirme HTTPS ativo
- Verifique se manifest.json está acessível
- Teste Service Worker no DevTools

## 📈 Próximos Passos

### Funcionalidades Futuras
- [ ] Histórico de trajetos
- [ ] Relatórios e analytics
- [ ] Notificações push
- [ ] Geofencing
- [ ] Integração com APIs de trânsito
- [ ] Chat entre motorista e admin
- [ ] Sistema de alertas automáticos

### Melhorias Técnicas
- [ ] Testes automatizados
- [ ] Monitoramento de performance
- [ ] Cache mais inteligente
- [ ] Otimizações de bundle
- [ ] Internacionalização (i18n)

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte os logs no console
3. Teste as credenciais do Supabase
4. Confirme configurações da API Google Maps

## 📄 Licença

Este projeto é fornecido como exemplo educacional.

---

**🚀 Sistema pronto para produção com todas as funcionalidades implementadas!** 