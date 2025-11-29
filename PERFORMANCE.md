# Performance Optimization Guide

Este guia documenta otimizações implementadas e práticas recomendadas para garantir carregamento rápido e experiência fluida na Symplepass.

## Image Optimization

- Utilizar `next/image` para banners de eventos, avatares e assets estáticos, sempre informando `width`, `height` e `sizes` coerentes.
- Supabase Storage oferece transformação (resize, format, quality). Para banners grandes use query strings: `?width=1600&quality=80&format=webp`.
- Formatos preferenciais: **WebP** (primário) com fallback automático do Next.js para JPEG/PNG quando navegador não suportar. Limite uploads a 5 MB; armazene originais e sirva variações otimizadas.
- Todos os assets abaixo da dobra devem usar carregamento preguiçoso (`loading="lazy"`, comportamento padrão do `Image`), reservando `priority` apenas para hero.

## Code Splitting & Bundle Optimization

- Componentes pesados (geração de PDF, QR Code, gráficos Recharts) devem ser importados dinamicamente (`dynamic(() => import('...'), { ssr: false })`).
- O App Router já aplica code splitting por rota. Planeje módulos independentes (admin/user) para evitar compartilhamento desnecessário.
- Para analisar bundles: `npm run build` gera estatísticas no terminal. Para inspeção detalhada, habilite o `@next/bundle-analyzer` descomentando a seção correspondente em `next.config.js` e execute `npm run analyze`.
- Mantenha dependências enxutas e evite polyfills manuais; use SWC minification já habilitada.

## Caching Strategies

- Incremental Static Regeneration (ISR)
  - Home `/` e `/eventos`: `revalidate` de 3600 s (1 h) para equilibrar frescor e custo.
- Página de detalhes `/eventos/[slug]`: `revalidate` de 3600 s (1 h) com invalidação manual após edições críticas.
- Use `revalidatePath()` ou `revalidateTag()` após criar/atualizar eventos e categorias para evitar dados stale.
- Supabase possui caching interno via edge; preferir queries com filtros específicos e limites para melhor cache-hit.
- CDN (Vercel Edge Network) entrega assets estáticos com cabeçalhos `Cache-Control: public, max-age=31536000, immutable` para fontes, ícones e imagens não mutáveis.
- Configurar cache do navegador para fontes (`/fonts/*`) e ícones (`/icons/*`) com longos vencimentos.

## Database Query Optimization

- Índices já aplicados via migrations: `events.slug`, `events.status`, `registrations.user_id`, `registrations.event_id`, `payments.registration_id`, `event_categories.event_id`, entre outros. Consulte `supabase/migrations` para lista completa.
- Todas as listagens usam paginação (`limit 12` eventos, `limit 10` pagamentos). Mantenha paginação baseada em `created_at` para estabilidade.
- Selecionar apenas colunas necessárias (`select('id,title,start_date')`) e evitar `select('*')` em rotas críticas para prevenir consultas N+1.
- Prefira `select` com relacionamentos específicos e `inner` quando possível para reduzir payload.
- Monitorar Supabase Query Performance Dashboard para identificar scans completos e adicionar índices adicionais.

## Monitoring & Metrics

- Core Web Vitals-alvo: **LCP <2.5 s**, **FID <100 ms**, **CLS <0.1**, **INP <200 ms**.
- Habilitar Vercel Analytics (ver `MONITORING.md`) para coletar métricas reais de usuários.
- Ferramentas recomendadas: Lighthouse (CI + manual), WebPageTest (testes multi-local), Chrome DevTools (Coverage e Performance tabs).
- Acompanhar logs do Supabase para monitorar latência de consultas e falhas.

## Optimization Checklist (Pré-deploy)

- [ ] Banners otimizados (≤1600px largura, formato WebP, qualidade ≤85).
- [ ] Avatares e logos com `placeholder="blur"` quando disponível.
- [ ] Fontes self-hosted com `font-display: swap`.
- [ ] Bundles inspecionados (`npm run analyze` se necessário) e imports dinâmicos aplicados em componentes pesados.
- [ ] Lighthouse executado para home, eventos, inscrição e painel (>90 Performance, >95 Accessibility, >90 Best Practices, >90 SEO).
- [ ] API responses monitoradas (latência <500 ms em endpoints críticos).
- [ ] Queries Supabase com índices verificados e limites aplicados.
- [ ] CDN/Cache cabeçalhos revisados e `revalidate` configurado conforme esperado.

Revisite este documento a cada nova feature para manter o baseline de performance atualizado.
