# 🚗 OrbDrive - Sistema de Rastreamento de Motoristas

Sistema PWA completo para rastreamento de motoristas em tempo real, desenvolvido com Next.js 14 e Supabase.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

## 🚀 Funcionalidades

### 👨‍💼 **Painel Administrativo**
- ✅ **Dashboard com Google Maps** - Visualização em tempo real
- ✅ **Gestão de Motoristas** - Cadastro e listagem
- ✅ **Status Online/Offline** - Baseado em heartbeat automático
- ✅ **Multi-empresa** - Isolamento total de dados
- ✅ **Atualização Automática** - Refresh a cada 5 segundos

### 🚛 **App do Motorista**
- ✅ **Rastreamento GPS** - Localização precisa
- ✅ **Envio Automático** - Coordenadas a cada 15 segundos
- ✅ **PWA Instalável** - Funciona offline
- ✅ **Interface Simples** - Fácil de usar

### 🔐 **Sistema de Autenticação**
- ✅ **Login Seguro** - Email e senha
- ✅ **Controle de Acesso** - Baseado em roles
- ✅ **Sessão Persistente** - Mantém login
- ✅ **Redirecionamento Automático** - Admin/Motorista

## 🛠️ Tecnologias

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS, Lucide Icons
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Maps:** Google Maps JavaScript API
- **PWA:** Service Worker, Web App Manifest

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase
- Google Maps API Key
- Conta na Vercel (para deploy)

## ⚡ Instalação Rápida

```bash
# Clone o repositório
git clone https://github.com/josue1113/OrbDrive.git
cd OrbDrive

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Configure o banco de dados
# Execute os scripts em /database/ no Supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

## 🗄️ Configuração do Banco

Execute os scripts SQL na seguinte ordem:

1. **`database/schema-v2.sql`** - Estrutura principal
2. **`database/add-tipo-usuario.sql`** - Sistema de roles
3. **`create-view.sql`** - View consolidada

## 🔧 Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_google_maps_key
```

## 🚀 Deploy na Vercel

1. **Conecte** o repositório na Vercel
2. **Configure** as variáveis de ambiente
3. **Deploy** automático

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/josue1113/OrbDrive)

## 📱 Como Usar

### **Para Administradores:**
1. Acesse o sistema pelo navegador
2. Faça login com suas credenciais
3. Cadastre motoristas na aba "Cadastro"
4. Monitore em tempo real na aba "Mapa"

### **Para Motoristas:**
1. Acesse via link enviado pelo admin
2. Faça login com credenciais recebidas
3. Ative o rastreamento
4. O app funciona em segundo plano

## 🏗️ Arquitetura

```
├── app/                    # Páginas Next.js 14
│   ├── admin/             # Dashboard administrativo
│   ├── motorista/         # App do motorista
│   ├── login/             # Autenticação
│   └── api/               # API routes
├── components/            # Componentes React
├── hooks/                 # Custom hooks
├── lib/                   # Configurações
├── database/              # Scripts SQL
└── public/                # Assets estáticos
```

## 🔐 Segurança

- **RLS (Row Level Security)** no Supabase
- **Autenticação JWT** com refresh automático
- **Isolamento por empresa** em todas as queries
- **Sanitização** de inputs do usuário

## 📊 Performance

- **Otimização de Mapas** - Atualização direta sem re-render
- **PWA Caching** - Recursos estáticos em cache
- **Bundle Splitting** - Carregamento otimizado
- **Realtime Seletivo** - Apenas dados necessários

## 🎯 Roadmap

- [ ] **Notificações Push** - Alertas em tempo real
- [ ] **Relatórios** - Analytics de rotas
- [ ] **Geofencing** - Zonas de interesse
- [ ] **App Mobile Nativo** - React Native

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Documentação:** [Instruções Completas](INSTRUCOES_COMPLETAS.md)
- **Issues:** [GitHub Issues](https://github.com/josue1113/OrbDrive/issues)
- **Email:** josuea.m123@gmail.com

---

<div align="center">
  <strong>🚗 Desenvolvido com ❤️ para gestão eficiente de frotas</strong>
</div> 