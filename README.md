# Symplepass

Plataforma fullstack de eventos esportivos com inscrições simplificadas para corridas, triatlos, ciclismo e mais.

## Stack Tecnológica

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Styling:** Tailwind CSS + Design System customizado
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Pagamentos:** Stripe
- **Ícones:** Lucide React
- **Fontes:** Inter (body) + Geist (headings)

## Pré-requisitos

- Node.js 18.17 ou superior
- npm, pnpm ou yarn
- Conta Supabase (gratuita)
- Conta Stripe (modo teste para desenvolvimento)

## Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd symplepass/symplepass-app
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Preencha as variáveis no arquivo `.env.local` com suas credenciais:
   - Supabase: Obtenha em https://app.supabase.com/project/_/settings/api
   - Stripe: Obtenha em https://dashboard.stripe.com/apikeys

## Configuração Supabase

1. Crie um novo projeto no [Supabase](https://app.supabase.com)
2. Copie a URL e a Anon Key do projeto
3. Cole as credenciais no arquivo `.env.local`
4. Execute as migrations do banco de dados (quando disponíveis)
5. Configure as políticas de Row Level Security (RLS)

## Configuração Stripe

### Desenvolvimento (Local)

1. Crie uma conta no [Stripe](https://dashboard.stripe.com)
2. Copie as chaves de API de teste (pk_test_* e sk_test_*)
3. Instale o Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows/Linux
# Baixe em: https://stripe.com/docs/stripe-cli
```

4. Faça login no Stripe CLI:
```bash
stripe login
```

5. Configure o webhook local:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

6. Copie o webhook secret exibido no terminal e adicione ao `.env.local`

### Teste de webhooks

```bash
stripe trigger checkout.session.completed
```

## Desenvolvimento

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa ESLint
- `npm run type-check` - Verifica tipos TypeScript
- `npm run analyze` - Executa build com `ANALYZE=true` para inspecionar bundles (requer `@next/bundle-analyzer`)
- `npm run test:e2e` - Placeholder para lembrar que os testes E2E são manuais (consulte `TESTING.md`)
- `npm run db:migrate` - Orientação para rodar migrations no Supabase Dashboard (ver `DEPLOYMENT.md`)
- `npm run db:seed` - Lembra de executar `seed.sql` direto no Supabase
- `npm run postbuild` - Mensagem pós-build indicando como testar localmente

## Estrutura do Projeto

```
symplepass-app/
├── app/                    # Rotas e páginas (App Router)
│   ├── (public)/          # Rotas públicas (não autenticadas)
│   ├── (user)/            # Rotas do usuário (autenticado)
│   ├── (admin)/           # Rotas administrativas
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Componentes React
│   ├── ui/               # Componentes base
│   ├── molecules/        # Componentes compostos
│   ├── layout/           # Componentes de layout
│   └── forms/            # Componentes de formulário
├── lib/                   # Utilitários e configurações
│   ├── supabase/         # Cliente Supabase
│   ├── stripe/           # Cliente Stripe
│   ├── utils.ts          # Funções utilitárias
│   └── design-tokens.ts  # Design tokens
├── types/                 # Tipos TypeScript
│   ├── database.types.ts # Tipos do banco de dados
│   └── index.ts          # Tipos centralizados
├── public/               # Assets estáticos
├── styles/               # Estilos globais
└── middleware.ts         # Middleware Next.js
```

## Testing

- A estratégia atual é manual para evitar dependências adicionais em produção.
- Consulte `TESTING.md` para cenários E2E (descoberta → checkout, painel, fluxos admin).
- Utilize o checklist em Markdown incluso para registrar resultados, evidências (screenshots/vídeos) e status.
- Execute Lighthouse para monitorar Performance (>90), Accessibility (>95), Best Practices (>90) e SEO (>90).

## Deploy

### Production Deployment Checklist

Siga o runbook detalhado em [`DEPLOYMENT.md`](./DEPLOYMENT.md) para configurar Supabase, Stripe, Resend e Vercel. Checklist rápido:
- [ ] Provisionar projeto Supabase de produção, executar migrations e configurar Storage/Auth.
- [ ] Ativar Stripe Live mode + webhook com eventos recomendados.
- [ ] Configurar projeto no Vercel com variáveis obrigatórias (`NEXT_PUBLIC_SUPABASE_URL`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, etc.).
- [ ] Acessar `/api/health` após deploy para garantir `status: healthy`.
- [ ] Validar fluxos críticos (cadastro, inscrição, pagamento, e-mails, QR Code).

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente de produção
3. Deploy automático a cada push

### Variáveis de ambiente de produção

Certifique-se de configurar no Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (use chaves de produção)
- `STRIPE_SECRET_KEY` (use chaves de produção)
- `STRIPE_WEBHOOK_SECRET` (crie webhook de produção no Stripe Dashboard)

### Webhook Stripe de produção

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em "Add endpoint"
3. URL: `https://seu-dominio.vercel.app/api/webhooks/stripe`
4. Selecione os eventos: `checkout.session.completed`, `payment_intent.succeeded`, etc.
5. Copie o webhook secret e adicione às variáveis de ambiente

## Performance

- Recomendações completas em [`PERFORMANCE.md`](./PERFORMANCE.md) abrangem otimização de imagens (`next/image`, Supabase transformations), lazy loading e limites de upload.
- Utilize imports dinâmicos para componentes pesados (PDF, gráficos, QR Code) e rode `npm run analyze` quando precisar inspecionar bundles.
- Documentamos estratégias de cache (ISR, CDN, `revalidatePath`) e otimizações de banco (índices, paginação).
- Checklist pré-deploy garante revisão de imagens, fontes, bundles, APIs e queries Supabase.

## Monitoring & Observability

- Veja [`MONITORING.md`](./MONITORING.md) para integrar Sentry, Vercel Analytics e (opcional) Google Analytics.
- Endpoint `/api/health` reporta status `healthy/degraded/unhealthy`, versão e latência do banco; utilize em UptimeRobot/Pingdom.
- Configure alertas críticos (falha no health-check, webhooks Stripe, taxa de erro alta) e warnings (latência >2s, falhas de e-mail).

## Operations

- [`OPERATIONS.md`](./OPERATIONS.md) descreve rotinas diárias/semanais/mensais, troubleshooting (webhook, login, imagens, admin) e procedimentos de emergência.
- Inclui plano de backup/recuperação, contatos de fornecedores (Vercel, Supabase, Stripe, Resend) e janela de manutenção recomendada.
- Consulte também [`SECURITY.md`](./SECURITY.md) para checklist de segurança e reporting.

## Recursos

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Stripe](https://stripe.com/docs)
- [Documentação Tailwind CSS](https://tailwindcss.com/docs)
- [Design System Symplepass](../design-system-v2/README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Testing Guide](./TESTING.md)
- [Performance Guide](./PERFORMANCE.md)
- [Monitoring Guide](./MONITORING.md)
- [Operations Runbook](./OPERATIONS.md)
- [Security Guidelines](./SECURITY.md)
- [Changelog](./CHANGELOG.md)

## Licença

Proprietary - Todos os direitos reservados

## Contato

Para dúvidas e suporte, entre em contato com a equipe de desenvolvimento.
