# 🚀 Deploy na Vercel - Guia Completo

## 📋 Pré-requisitos

- [x] Código no GitHub: ✅ `https://github.com/josue1113/OrbDrive`
- [x] Conta na Vercel (conectada ao GitHub)
- [x] Variáveis de ambiente do Supabase
- [x] Google Maps API Key

## 🎯 Passo a Passo

### 1️⃣ **Acessar a Vercel**

1. Acesse: **https://vercel.com**
2. Faça login com sua conta GitHub
3. Clique em **"New Project"**

### 2️⃣ **Importar Repositório**

1. Procure por: **`josue1113/OrbDrive`**
2. Clique em **"Import"**
3. Framework detectado: **Next.js** ✅

### 3️⃣ **Configurar Variáveis de Ambiente**

Na seção **"Environment Variables"**, adicione:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ggqmpddgyjbhccybpbdf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncW1wZGRneWpiaGNjeWJwYmRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODI0NTUsImV4cCI6MjA2ODk1ODQ1NX0.U8jn38ObEVEAh8t5dnFfLAFmwZO0qm-OVlqRrVC_XTE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncW1wZGRneWpiaGNjeWJwYmRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM4MjQ1NSwiZXhwIjoyMDY4OTU4NDU1fQ.gRa7dFM60Vt0M4Rw0JtrYt51kAtPvlHwp6dN8HQtjPI

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAxYDfxuRMozJuo2FRuKybzg-Nn29hXWps
```

### 4️⃣ **Configurações de Build** (Padrão)

✅ **Build Command:** `npm run build`  
✅ **Output Directory:** `.next`  
✅ **Install Command:** `npm install`  
✅ **Development Command:** `npm run dev`

### 5️⃣ **Deploy**

1. Clique em **"Deploy"**
2. Aguarde ⏱️ ~2-3 minutos
3. Sucesso! 🎉

## 🌐 URLs de Acesso

Após o deploy, você receberá:

- **URL Principal:** `https://orb-drive.vercel.app` (ou similar)
- **URL de Preview:** Para cada commit/PR
- **URL de Produção:** Para a branch main/master

## 🔧 Configurações Pós-Deploy

### **A) Domínio Personalizado** (Opcional)

1. Vá em: **Project Settings → Domains**
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções

### **B) Configurar CORS no Supabase**

No painel do Supabase, em **Authentication → URL Configuration**:

```
Site URL: https://sua-url.vercel.app
Additional Redirect URLs: 
https://sua-url.vercel.app/login
https://sua-url.vercel.app/admin
https://sua-url.vercel.app/motorista
```

### **C) Atualizar Google Maps API**

No Google Cloud Console:
1. Vá em **APIs & Services → Credentials**
2. Edite sua API Key
3. Adicione em **HTTP referrers:**
   - `https://sua-url.vercel.app/*`
   - `https://*.vercel.app/*`

## ✅ Checklist de Verificação

Após o deploy, teste:

- [ ] **Login funciona** - Teste com credenciais válidas
- [ ] **Mapa carrega** - Verifique o Google Maps
- [ ] **Cadastro de motorista** - Teste a criação de usuários
- [ ] **GPS funciona** - Teste na página do motorista
- [ ] **PWA instala** - Teste "Adicionar à tela inicial"
- [ ] **HTTPS ativo** - Essencial para PWA e GPS

## 🚨 Solução de Problemas

### **Erro: "Failed to load Google Maps"**
```bash
# Verificar se a API Key está configurada
console.log(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

# Solução: Adicione o domínio nas restrições da API
```

### **Erro: "Supabase connection failed"**
```bash
# Verificar URLs no console
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)

# Solução: Confirme se as variáveis estão corretas
```

### **Erro: "PWA não instala"**
- ✅ Confirme HTTPS ativo
- ✅ Teste em dispositivo real (não simulador)
- ✅ Verifique manifest.json acessível

### **Erro: "GPS não funciona"**
- ✅ Use HTTPS (obrigatório)
- ✅ Teste em dispositivo físico
- ✅ Permita localização no navegador

## 📊 Monitoramento

### **Analytics da Vercel**
- **Performance:** Automatic Web Vitals
- **Functions:** Logs das API routes
- **Bandwidth:** Uso de dados

### **Logs em Tempo Real**
```bash
# Via Vercel CLI
npx vercel logs https://sua-url.vercel.app

# Ou no dashboard da Vercel
```

## 🔄 Atualizações Automáticas

A cada push no GitHub:
- ✅ **Deploy automático** na Vercel
- ✅ **Preview URLs** para PRs
- ✅ **Rollback simples** se necessário

## 🎯 URLs Finais

Após seguir este guia, você terá:

- **🏠 Homepage:** `https://sua-url.vercel.app`
- **👨‍💼 Admin:** `https://sua-url.vercel.app/admin`
- **🚛 Motorista:** `https://sua-url.vercel.app/motorista`
- **🔐 Login:** `https://sua-url.vercel.app/login`

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs na Vercel
2. Confirme as variáveis de ambiente
3. Teste localmente primeiro
4. Consulte a documentação oficial

---

**🚀 Pronto! Seu sistema está no ar e funcionando!** 