# Monitoring & Observability

Guia de instrumentação para detectar erros rapidamente, acompanhar performance real e definir alertas proativos.

## Sentry Integration

### Setup
1. Crie conta em [sentry.io](https://sentry.io) e adicione novo projeto Next.js.
2. Instale SDK: `npm install @sentry/nextjs`.
3. Execute o assistente: `npx @sentry/wizard@latest -i nextjs` (gera `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`).
4. Configure variáveis `SENTRY_DSN` e `NEXT_PUBLIC_SENTRY_DSN` no `.env` e na Vercel.

### Configuration & Usage
- Defina `tracesSampleRate` (ex.: `0.1` em produção) e `profilesSampleRate` opcional.
- Configure release tracking usando `SENTRY_RELEASE` com SHA do commit (`vercel env pull && export SENTRY_RELEASE=$VERCEL_GIT_COMMIT_SHA`).
- Habilite upload de source maps (`npx sentry-cli sourcemaps upload .next --url-prefix=~/_next`).
- Adicione contexto do usuário (ID, e-mail) com `Sentry.setUser` após autenticação.
- Utilize `Sentry.withScope` para tags `payment`, `auth`, `database` e identificar áreas.
- Envolva `app/api/*` em handlers do Sentry (`withSentryConfig`) e use error boundaries em componentes críticos do App Router.

### Performance Monitoring
- Ative métricas de performance para rotas API e ações server-side.
- Monitore queries lentas, external calls (Stripe, Supabase) e latência do Stripe.
- Configure alertas por limiar (ex.: `apdex < 0.9`, p95 > 1s).

## Vercel Analytics

1. Habilite Analytics em Project Settings.
2. Instale `@vercel/analytics` (`npm install @vercel/analytics`).
3. Importe `<Analytics />` em `app/layout.tsx` (`import { Analytics } from '@vercel/analytics/react'`).
4. Métricas coletadas: Core Web Vitals (LCP, FID, CLS, INP, TTFB), page views, referrers, devices/browsers.
5. Opcional: rastreie eventos customizados com `import { track } from '@vercel/analytics'` (`track('Payment Completed', { amount })`).

## Google Analytics (Optional)

1. Configure propriedade GA4 e crie `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
2. Instale `react-ga4` ou adicione script via `next/script` com consent management.
3. Eventos recomendados: `event_registration_started`, `payment_completed`, `user_signup`, `search_query`.
4. Configure consent mode para LGPD (banner de cookies).

## Logging Strategy

- **Server:** utilize logs estruturados (JSON) para APIs. Em produção, prefira `console.info(JSON.stringify({...}))` e inclua `requestId` para rastreamento. Erros críticos devem ser enviados ao Sentry.
- **Client:** limite logs a warnings essenciais. Use Sentry para capturar exceptions e breadcrumbs.
- **Supabase Logs:** monitore consultas e storage em `Project → Logs`. Configure retenção (>7 dias) conforme plano.
- **Stripe Logs:** revisite `Developers → Events` para falhas de webhook. Configure alertas por e-mail.

## Alerting

- **Críticos:** falha no `/api/health`, erro em webhook Stripe, indisponibilidade do banco, taxa de erro >5%. Notificar por e-mail + Slack/PagerDuty.
- **Aviso:** respostas lentas (>2s), consumo elevado de memória, falha em envio de e-mails Resend, queda moderada de conversão.
- Utilize alertas do Sentry (Issue/Performance), Vercel (functions), Stripe (webhooks) e UptimeRobot (health check).

## Dashboard Recommendations

- **Vercel Dashboard:** status de deployments, analytics em tempo real, logs das serverless functions.
- **Sentry:** feed de issues, releases, performance e mapas de calor.
- **Supabase:** métricas de banco (Connections, RPS), storage e autenticação.
- **Stripe:** volume financeiro, chargebacks e logs de webhooks.
- **Custom Dashboard (opcional):** painel interno com KPIs (inscrições/dia, receita, tickets por modalidade).

## Monitoring Checklist

### Semanal
- [ ] Revisar erros novos/recorrentes no Sentry e classificar severidade.
- [ ] Checar Core Web Vitals e tendências no Vercel Analytics.
- [ ] Validar taxa de entrega de webhooks Stripe.
- [ ] Analisar performance do banco no Supabase (slow queries, locks).
- [ ] Conferir feedbacks de suporte/usuários.

### Mensal
- [ ] Conferir uso/custos (Vercel, Supabase, Stripe fees, Resend).
- [ ] Revisar storage utilizado (banners, PDFs) e limpar itens obsoletos.
- [ ] Auditar alertas configurados (thresholds, destinatários).
- [ ] Avaliar funil de conversão (descoberta → inscrição → pagamento → confirmação).

Mantenha alertas e dashboards atualizados para refletir qualquer service novo adicionado ao produto.
