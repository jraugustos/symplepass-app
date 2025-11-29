# Deployment Guide

Passo a passo para publicar Symplepass em produção (Vercel + Supabase + Stripe + Resend).

## Prerequisites

- Conta Vercel (free tier suficiente inicialmente)
- Projeto Supabase exclusivo para produção
- Conta Stripe em modo Live (ativada)
- Conta Resend com domínio verificado
- Repositório Git (GitHub, GitLab ou Bitbucket)

## Step 1: Prepare Production Supabase

1. Crie novo projeto Supabase (separado do ambiente de dev).
2. Execute todas as migrations em ordem (`supabase/migrations/001_initial_schema.sql` → `009_coupons_schema.sql`).
3. Rode `supabase/seed.sql` para dados exemplo ou cadastre eventos manualmente.
4. Configure bucket `event-banners` com leitura pública e upload restrito a organizadores.
5. Confirme que RLS está habilitado em todas as tabelas e políticas revisadas.
6. Habilite provedores Auth necessários (Email/Senha, Google OAuth) com URLs de produção.
7. Defina **Site URL** como `https://symplepass.com` e configure redirect URLs adicionais (`/auth/callback`, `/conta`, `/admin/dashboard`).
8. Copie chaves de produção (URL, anon key, service role) para uso posterior.

## Step 2: Configure Production Stripe

1. Ative modo Live e finalize verificação de conta/banco.
2. Copie chaves `pk_live_*` e `sk_live_*`.
3. Configure webhook: `https://symplepass.com/api/webhooks/stripe` recebendo eventos `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`, `payment_intent.payment_failed`.
4. Salve segredo do webhook (`whsec_*`) e adicione às variáveis.
5. Ajuste branding do Checkout, recibos e e-mails de confirmação no Dashboard.
6. Utilize ferramentas de teste do Stripe para reexecutar eventos e validar logs.

## Step 3: Deploy to Vercel

1. Garanta que o código está em branch principal e faça push.
2. Importe repositório na Vercel e selecione preset Next.js.
3. Configurações:
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Adicione variáveis de ambiente (ver lista abaixo).
5. Execute primeiro deploy e aguarde build.
6. Configure domínio customizado (`symplepass.com` e `www.symplepass.com`).
7. Habilite Vercel Analytics e Deploy Protection (opcional) para previews.

## Environment Variables (Production)

Configure no painel Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_APP_URL=https://symplepass.com
NEXT_PUBLIC_SITE_URL=https://symplepass.com
NEXT_PUBLIC_APP_NAME=Symplepass
NEXT_PUBLIC_SUPPORT_EMAIL=suporte@symplepass.com

NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

RESEND_API_KEY=re_...

SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

Adicione chaves adicionais (Google OAuth, Resend domains) conforme necessário.

### Health Check Environment Expectations

O endpoint `/api/health` monitora variáveis críticas e opcionais:
- **Críticas (ausência retorna HTTP 503 / status unhealthy):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`.
- **Opcionais (ausência marca status degraded, porém HTTP 200):** `RESEND_API_KEY` (e demais integrações não essenciais). Configure-as para evitar alertas degradados.

## Step 4: Post-Deployment Verification

1. Acesse `/api/health` e confirme `status: healthy`.
2. Execute fluxo completo de cadastro/login.
3. Crie evento teste no painel admin.
4. Faça inscrição usando cartão de teste Stripe (4242 4242 4242 4242) com webhooks em modo teste ou modo Live real (cancelar depois).
5. Verifique entrega do webhook no Stripe Dashboard.
6. Confirme envio de e-mail de confirmação (Resend logs).
7. Gere QR Code e download de PDF para inscrição teste.
8. Teste rotas protegidas (usuário e admin) e verifique redirecionamentos.
9. Rode Lighthouse (>90) em páginas críticas.

## Step 5: Monitoring Setup

- Vercel Analytics para Core Web Vitals e tráfego (habilite no dashboard).
- Sentry para rastrear erros client/server (ver `MONITORING.md`).
- Uptime monitor (UptimeRobot/Pingdom) apontando para `https://symplepass.com/api/health`.
- Stripe Dashboard para pagamentos e webhooks.
- Supabase Dashboard para métricas de banco/Auth/storage.

## Rollback Procedure

1. Abra Vercel → Deployments.
2. Localize última versão estável.
3. Clique em `...` → **Promote to Production**.
4. Aguarde propagação e confirme via `/api/health`.
5. Registre incidente e plano de ação.

## Troubleshooting

| Problema | Ação |
| --- | --- |
| Erro de build | Execute `npm run type-check`/`npm run lint`, revise logs no Vercel. |
| Variáveis faltando | Valide em Project Settings → Environment Variables. |
| Webhook Stripe falhando | Verifique URL, segredo e eventos habilitados. Consulte function logs. |
| Conexão Supabase falhando | Cheque status supabase.com e políticas RLS. |
| Imagens não carregam | Confirme permissões do bucket e padrões em `next.config.js`. |

## Maintenance & Backups

- Supabase oferece backups automáticos (retenção conforme plano). Realize exports mensais.
- Utilize tags/releases no Git para cada deploy.
- Documente alterações no `CHANGELOG.md`.

Mantenha este runbook sincronizado com cada release e inclua novas dependências/serviços conforme adicionados.
