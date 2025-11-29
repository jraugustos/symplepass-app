# Guia de Setup Inicial - Symplepass App

Este guia detalha todos os passos para configurar o projeto Symplepass do zero.

## 1. Inicialização do Projeto

O projeto foi criado usando:

```bash
npx create-next-app@latest symplepass-app --typescript --tailwind --app --eslint
```

### Versões das Dependências

- **Next.js:** ^14.2.0
- **React:** ^18.3.0
- **TypeScript:** ^5.0.0
- **Node.js:** 18.17+ requerido

## 2. Instalação de Dependências

Instale todas as dependências do projeto:

```bash
npm install
```

### Dependências Principais

**Framework & React:**
- `next` - Framework Next.js 14+
- `react` & `react-dom` - React 18

**Backend & Auth:**
- `@supabase/supabase-js` - Cliente Supabase
- `@supabase/ssr` - Helpers SSR para Next.js

**Pagamentos:**
- `stripe` - SDK Stripe para Node.js

**UI & Styling:**
- `tailwindcss` - Tailwind CSS
- `tailwindcss-animate` - Plugin de animações
- `lucide-react` - Ícones

**Utilitários:**
- `clsx` - Classes condicionais
- `tailwind-merge` - Merge de classes Tailwind
- `qrcode` - Geração de QR codes
- `date-fns` - Manipulação de datas
- `zod` - Validação de schemas

## 3. Configuração Supabase (Passo a Passo)

### 3.1. Criar Projeto

1. Acesse: https://app.supabase.com
2. Clique em "New Project"
3. Preencha:
   - **Name:** symplepass
   - **Database Password:** Escolha uma senha forte
   - **Region:** Escolha a região mais próxima (ex: South America - São Paulo)
4. Aguarde a criação do projeto (~2 minutos)

### 3.2. Obter Credenciais

1. No dashboard do projeto, vá em: **Settings → API**
2. Copie os seguintes valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ privada, nunca exponha)

### 3.3. Configurar Autenticação

#### Email/Password Authentication
1. Vá em: **Authentication → Providers**
2. Configure Email/Password:
   - Enable "Email"
   - Configure confirmação de email (opcional para dev)
   - Para dev, desabilite confirmação de email em Settings → Auth → Email Auth

#### Google OAuth (Opcional)
1. Vá em: **Authentication → Providers → Google**
2. Enable Google provider
3. Obtenha credenciais OAuth do Google:
   - Acesse: https://console.cloud.google.com/apis/credentials
   - Crie um novo projeto (se necessário)
   - Vá em "Credentials" → "Create Credentials" → "OAuth Client ID"
   - Tipo: Web application
   - Nome: Symplepass
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/auth/callback`
     - Supabase: `https://[SEU-PROJECT-REF].supabase.co/auth/v1/callback`
     - Production: `https://symplepass.com/auth/callback`
4. Copie o Client ID e Client Secret
5. Cole no Supabase Dashboard em Google Provider
6. Salve as alterações

#### Site URL Configuration
1. Vá em: **Authentication → URL Configuration**
2. Configure:
   - **Site URL:** `http://localhost:3000` (dev) ou `https://symplepass.com` (prod)
   - **Redirect URLs:** Adicione:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/conta`
     - `http://localhost:3000/admin/dashboard`

### 3.4. Criar Tabelas Iniciais

Execute os seguintes comandos SQL no **SQL Editor**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'organizer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organizer_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  banner_url TEXT NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  sport_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Categories table
CREATE TABLE event_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registrations table
CREATE TABLE registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES event_categories(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_session_id TEXT,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_categories_event ON event_categories(event_id);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
```

### 3.5. Configurar Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Organizers can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = organizer_id AND role IN ('organizer', 'admin'));

CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = organizer_id);

-- Add more policies as needed...
```

> **Nota:** após criar as tabelas base, rode `supabase db push` (ou execute o arquivo `supabase/migrations/007_user_preferences_and_settings.sql`) para criar as tabelas `user_preferences` e `user_sessions`, responsáveis por armazenar tema, notificações e sessões ativas.

> **Dica rápida:** se o projeto já possui perfis antigos, execute um backfill simples para evitar inserções em tempo de execução:
> ```sql
> insert into public.user_preferences (user_id)
> select p.id
> from public.profiles p
> left join public.user_preferences up on up.user_id = p.id
> where up.id is null;
> ```
> Assim todos os usuários têm um registro padrão antes de acessar o painel.

### 3.6. Configurar Storage Buckets

#### Event Banners Bucket

O bucket `event-banners` é usado para armazenar imagens de banner dos eventos.

**Configuração automática:**

A migration `008_event_banners_storage.sql` cria o bucket e configura as políticas RLS automaticamente. Execute:

```bash
supabase db push
```

Ou execute manualmente o arquivo SQL em **SQL Editor**.

**Configuração manual (se necessário):**

1. Acesse o Supabase Dashboard → Storage
2. Crie um novo bucket chamado `event-banners`
3. Marque como "Public bucket" (leitura pública)
4. Configure as políticas RLS:
   - **INSERT**: Permitir para usuários autenticados com role `admin` ou `organizer`
   - **SELECT**: Permitir para todos (público)
   - **DELETE**: Permitir para usuários autenticados com role `admin` ou `organizer`
   - **UPDATE**: Permitir para usuários autenticados com role `admin` ou `organizer`

**Uso no código:**

```typescript
import { uploadEventBanner, deleteEventBanner } from '@/lib/storage/upload'

// Upload
const { data, error } = await uploadEventBanner(file)
if (data) {
  console.log('URL:', data.url)
}

// Delete
await deleteEventBanner(imageUrl)
```

**Limites:**
- Tamanho máximo: 5MB
- Formatos aceitos: JPEG, PNG, WebP

#### User Avatars Bucket (Futuro)

1. Vá em: **Storage → Create bucket**
2. Crie o bucket:
   - **user-avatars** (public)
3. Configure políticas de acesso público similares ao event-banners

### 3.7. Testar Conexão

Crie um arquivo temporário para testar:

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data, error } = await supabase.from('events').select('*')
console.log(data, error)
```

## 4. Configuração Stripe (Passo a Passo)

### 4.1. Criar Conta

1. Acesse: https://dashboard.stripe.com/register
2. Preencha os dados da conta
3. Ative o modo de teste (Test Mode)

### 4.2. Obter API Keys

1. No dashboard, vá em: **Developers → API keys**
2. Copie as chaves de teste:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

⚠️ **Importante:** Use apenas chaves de teste (`pk_test_*` e `sk_test_*`) durante desenvolvimento!

### 4.3. Instalar Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Linux:**
```bash
# Baixe e instale de: https://github.com/stripe/stripe-cli/releases
```

### 4.4. Login no Stripe CLI

```bash
stripe login
```

Isso abrirá o navegador para autenticação.

### 4.5. Configurar Webhook Local

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Saída esperada:**
```
> Ready! Your webhook signing secret is whsec_... (^C to quit)
```

Copie o `whsec_...` e adicione ao `.env.local` como `STRIPE_WEBHOOK_SECRET`.

### 4.6. Testar Webhooks

Em outro terminal:

```bash
# Simular checkout completado
stripe trigger checkout.session.completed

# Simular pagamento bem-sucedido
stripe trigger payment_intent.succeeded
```

Verifique os logs no terminal onde o `stripe listen` está rodando.

## 5. Configuração de Variáveis de Ambiente

### 5.1. Criar arquivo .env.local

```bash
cp .env.example .env.local
```

### 5.2. Preencher valores

Edite `.env.local`:

```env
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5.3. Validar variáveis

Certifique-se de que:
- ✅ Todas as variáveis estão preenchidas
- ✅ Não há espaços em branco extras
- ✅ URLs não terminam com `/`
- ✅ Chaves de teste para desenvolvimento

## 6. Primeiro Run

### 6.1. Instalar dependências (se ainda não instalou)

```bash
npm install
```

### 6.2. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

### 6.3. Abrir no navegador

Acesse: http://localhost:3000

**Você deverá ver:**
- ✅ Página inicial com gradiente laranja
- ✅ Título "Symplepass" com gradiente
- ✅ Botão "Em breve..." com estilo correto
- ✅ Fontes Inter e Geist carregadas

### 6.4. Verificar console

Abra o DevTools (F12) e verifique:
- ✅ Sem erros no console
- ✅ Sem warnings de hidratação
- ✅ Fontes carregadas corretamente

## 7. Checklist de Verificação

### Configuração Geral
- [ ] Node.js 18.17+ instalado
- [ ] Dependências npm instaladas
- [ ] Arquivo `.env.local` criado e preenchido
- [ ] Projeto rodando sem erros em `localhost:3000`

### Next.js & Tailwind
- [ ] Tailwind processando classes customizadas
- [ ] Gradientes laranja funcionando (`.text-gradient`, `.gradient-primary`)
- [ ] Fontes Inter e Geist carregando
- [ ] Animações funcionando (`.animate-fade-in-up`)
- [ ] TypeScript sem erros (`npm run type-check`)

### Supabase
- [ ] Projeto criado no Supabase
- [ ] Tabelas criadas no banco
- [ ] RLS policies configuradas
- [ ] Storage buckets criados
- [ ] Cliente Supabase conectando (testar com query simples)

### Stripe
- [ ] Conta Stripe criada (modo teste)
- [ ] API keys copiadas
- [ ] Stripe CLI instalado e autenticado
- [ ] Webhook local rodando (`stripe listen`)
- [ ] Webhook secret adicionado ao `.env.local`
- [ ] Teste de trigger funcionando (`stripe trigger`)

## 8. Painel do Usuário

### 8.1 Preferências do Usuário
- As preferências esportivas, idioma e notificações são persistidas na tabela `user_preferences`.
- O componente `PreferencesTab` também replica a seleção em `localStorage` (`symplepass-preferences`) como fallback offline.
- Para resetar preferências em ambiente de desenvolvimento, exclua a linha correspondente na tabela ou rode `delete from user_preferences where user_id = '<ID>';`.

### 8.2 Tema do Painel
- O hook `useTheme` aplica o tema selecionado adicionando/removendo a classe `dark` no `<html>`.
- O valor escolhido fica salvo em `localStorage` (chave `symplepass-theme`) e sincronizado com o Supabase através do `PATCH /api/user/preferences`.
- A opção “Sistema” acompanha automaticamente o `prefers-color-scheme` do dispositivo.

### 8.3 Histórico de Pagamentos
- O helper `lib/data/payments.ts` consulta `registrations`, `events` e `event_categories` para montar o histórico.
- O painel mostra 10 itens por página, mas o servidor busca os últimos 40 registros para garantir paginação fluida.
- Para testar rapidamente, crie registros na tabela `registrations` com valores diferentes em `payment_status` (`paid`, `pending`, etc.).

### 8.4 Sessões Ativas
- Cada login cria automaticamente uma linha na tabela `user_sessions` (via server action `signInWithEmail`), registrando IP e user-agent para exibição no painel.
- O endpoint `DELETE /api/user/preferences` recebe `{ sessionId }` e chama `deleteUserSession`, permitindo encerrar sessões remotamente.
- Use o GET de `/api/user/preferences` para conferir as sessões retornadas na chave `sessions`; o botão “Encerrar” no painel reutiliza o mesmo fluxo.

### 8.5 Atualização de Perfil
- Campos editáveis: `full_name`, `phone`, `date_of_birth` e `gender`. Email e CPF permanecem somente leitura após preenchidos.
- A validação utiliza Zod (`profileUpdateSchema`) e exige telefone brasileiro válido e idade mínima de 18 anos.
- As alterações chamam a server action `updateUserProfile`, que revalida `/conta`.

### 8.6 Testes Recomendados
1. Crie um usuário de teste via `/cadastro`.
2. Efetue login e navegue até `/conta` verificando os skeletons do `loading.tsx`.
3. Atualize dado pessoal (ex.: telefone) e confirme no banco.
4. Selecione diferentes esportes e recarregue a página para validar persistência.
5. Gere registros fictícios em `registrations` para checar o histórico de pagamentos e o modal de QR Code.
6. No Settings, alterne o tema e desconecte uma sessão para validar o DELETE.

### 8.7 Troubleshooting
- **Preferências não salvam:** confirme se a tabela `user_preferences` existe e se o usuário possui permissão nas policies de RLS.
- **Tema não muda:** limpe `localStorage`, verifique se o hook `useTheme` está sendo inicializado apenas no cliente e se `document.documentElement` recebe a classe `dark`.
- **Histórico vazio:** confira a consulta `getUserPaymentHistory` e se o usuário realmente possui registros em `registrations`.
- **Erro 401 nos endpoints `/api/user/*`:** certifique-se de que cookies de sessão do Supabase estão sendo enviados (o fetch usa `credentials: 'include'`).

### Code Quality
- [ ] ESLint rodando sem erros críticos (`npm run lint`)
- [ ] TypeScript compilando sem erros (`npm run type-check`)
- [ ] Build de produção funcionando (`npm run build`)

## 8. Troubleshooting Comum

### Erro: "Missing Supabase environment variables"

**Causa:** Variáveis de ambiente não configuradas.

**Solução:**
1. Verifique se `.env.local` existe
2. Certifique-se que as variáveis estão preenchidas
3. Reinicie o servidor (`Ctrl+C` e `npm run dev`)

### Erro: "Webhook signature verification failed"

**Causa:** Webhook secret incorreto ou desatualizado.

**Solução:**
1. Verifique se `stripe listen` está rodando
2. Copie o novo webhook secret do terminal
3. Atualize `STRIPE_WEBHOOK_SECRET` no `.env.local`
4. Reinicie o servidor

### Erro: "Cannot find module '@/lib/...' "

**Causa:** Path aliases não configurados corretamente.

**Solução:**
1. Verifique `tsconfig.json` → `paths`
2. Certifique-se que `"@/*": ["./*"]` está configurado
3. Reinicie o TypeScript server no VSCode

### Erro de tipo TypeScript

**Causa:** Dependências de tipos não instaladas.

**Solução:**
```bash
npm install --save-dev @types/node @types/react @types/react-dom
```

### Build falhando

**Causa:** Código com erros de TypeScript ou ESLint.

**Solução:**
1. Execute `npm run type-check`
2. Execute `npm run lint`
3. Corrija os erros reportados
4. Tente `npm run build` novamente

## 9. Próximos Passos

✅ Fundação do projeto configurada com sucesso!

**Fase 2 - Componentes UI:**
- Converter componentes HTML do design-system-v2 para React
- Criar biblioteca de componentes reutilizáveis
- Implementar Storybook (opcional)

**Fase 3 - Autenticação:**
- Implementar login/signup
- Criar middleware de proteção de rotas
- Desenvolver perfil de usuário

**Fase 4 - Eventos:**
- CRUD de eventos
- Sistema de categorias
- Upload de banners

**Fase 5 - Inscrições:**
- Fluxo de inscrição
- Integração com Stripe
- Geração de QR codes

## 10. Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm run start            # Servidor de produção
npm run lint             # Executar ESLint
npm run type-check       # Verificar tipos

# Stripe CLI
stripe login             # Autenticar
stripe listen            # Ouvir webhooks locais
stripe trigger <event>   # Simular eventos
stripe logs tail         # Ver logs em tempo real

# Supabase (futuro)
supabase login           # Autenticar
supabase db push         # Aplicar migrations
supabase gen types       # Gerar tipos TypeScript
```

## 11. Recursos de Referência

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## 12. Configuração de E-mail (Resend)

1. Crie uma conta em [resend.com](https://resend.com/).
2. Gere uma API key em **Dashboard → API Keys**.
3. Adicione ao `.env.local`: `RESEND_API_KEY=re_xxx`.
4. Para produção configure um domínio verificado ou utilize `resend.dev` em desenvolvimento.
5. Sem a chave configurada os e-mails de confirmação serão ignorados (veja mensagens no console).

## 13. Testando o Webhook da Stripe

Use o Stripe CLI para reproduzir o fluxo completo:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copie o `whsec_...` mostrado no terminal e atualize `STRIPE_WEBHOOK_SECRET`.

Em outro terminal, dispare eventos:

```bash
stripe trigger checkout.session.completed
stripe trigger payment_intent.payment_failed
```

O webhook atualizará inscrições, gerará QR Codes e enviará e-mails automaticamente.

## 14. QR Codes e Comprovantes

- QR Codes são gerados assim que a Stripe envia `checkout.session.completed`.
- O QR armazena o `registration.id` para validação no credenciamento.
- PDFs são gerados sob demanda por `/api/receipt/[registrationId]` usando `jsPDF`.
- O comprovante inclui logo, resumo do evento, status do pagamento e o QR Code incorporado.

## 15. Passo a Passo para Testar a Confirmação

1. Crie um evento/categoria no Supabase usando valores de teste.
2. Faça a inscrição pelo site até chegar na página de revisão.
3. Complete o checkout Stripe usando `4242 4242 4242 4242`.
4. Verifique o terminal do Stripe CLI para garantir que o webhook foi acionado.
5. Confirme no Supabase que o registro ficou `status=confirmed` e `payment_status=paid`.
6. Cheque o e-mail configurado para receber o comprovante enviado via Resend.
7. Acesse `/confirmacao?session_id={CHECKOUT_SESSION_ID}` e valide:
   - Exibição do QR Code e do código do ingresso.
   - Download do PDF através do botão "Baixar comprovante".
   - Download do arquivo `.ics` ao clicar em "Adicionar ao calendário".
8. Opcional: execute `stripe trigger checkout.session.expired` para validar cenários de falha/cancelamento.

---

**Configuração completa!** 🎉

Para dúvidas, consulte a documentação oficial ou entre em contato com a equipe.
