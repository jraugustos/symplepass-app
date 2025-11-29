# Operations Runbook

Procedimentos diários, semanais e mensais para manter o Symplepass estável, além de ações de troubleshooting e emergência.

## Daily Operations

- Verificar `/api/health` (status `healthy`, latência dentro da meta).
- Monitorar painel Sentry para novos erros ou regressões.
- Acompanhar Vercel Analytics para picos de tráfego ou quedas.
- Revisar dashboard Stripe em busca de pagamentos falhos.
- Checar caixa de suporte (`suporte@symplepass.com`) e tickets.
- Validar logs de e-mail no Resend e geração de QR Codes/tickets.

## Weekly Operations

- Executar Lighthouse nas páginas críticas e registrar métricas.
- Revisar tendência de Core Web Vitals em Vercel Analytics.
- Avaliar queries lentas no Supabase e ajustar índices/políticas.
- Inspecionar funções serverless no Vercel (latência e erros).
- Revisar logs de login e tentativas falhas para detectar ataques.
- Validar delivery de webhooks Stripe e e-mails Resend.
- Arquivar eventos concluídos/maduros e limpar sessões expiradas.

## Monthly Operations

- Rodar `npm outdated` e planejar atualizações seguras.
- Executar `npm audit` e aplicar patches críticos.
- Revisar custos (Vercel, Supabase, Stripe, Resend) e otimizar.
- Avaliar métricas de uso (cadastros, inscrições, receita, funil).
- Revisar consumo de storage (banners, PDFs) e remover lixo.
- Validar backups automáticos e processos de restauração.

## Common Troubleshooting Scenarios

### Payment webhook not received
1. Conferir `Developers → Webhooks` no Stripe (logs e respostas).
2. Valide `STRIPE_WEBHOOK_SECRET` na Vercel.
3. Execute `stripe trigger checkout.session.completed` para testar.
4. Inspecione logs da função `/api/webhooks/stripe` no Vercel.
5. Garanta que rota está acessível publicamente e sem bloqueios.

### User can't login
1. Verifique logs de Auth no Supabase (tentativas, bloqueios, confirmação de e-mail).
2. Teste fluxo de recuperação de senha.
3. Revise roles/claims do usuário (admin/organizer).
4. Confirme URLs de redirect OAuth configuradas corretamente.

### Event images not loading
1. Revisar permissões do bucket `event-banners` e URLs geradas.
2. Checar `remotePatterns` em `next.config.js` e se inclui domínio usado.
3. Acessar o asset diretamente no navegador para confirmar status 200.
4. Regenerar imagem caso arquivo esteja corrompido.

### Confirmation email not sent
1. Validar `RESEND_API_KEY` e domínio verificado.
2. Consultar logs de envio no painel Resend.
3. Testar envio manual (curl/REST) usando o template atual.
4. Garantir que evento da aplicação não lançou erro (ver Sentry).

### Admin panel not accessible
1. Confirmar role do usuário na tabela `profiles`.
2. Revisar middleware e logs do Next.js para negações de acesso.
3. Testar com outro usuário que possua role válida.
4. Checar se RLS permite consultas para o perfil solicitado.

### High error rate in Sentry
1. Identificar rotas/componentes afetados.
2. Verificar últimos deploys (Vercel) e reverter se necessário.
3. Priorizar correção e criar hotfix.
4. Comunicar impacto e ETAs aos stakeholders.

### Slow page load times
1. Rodar Lighthouse e analisar oportunidades.
2. Monitorar queries no Supabase (ver se há scans completos).
3. Confirmar otimizações de imagem/lazy-loading.
4. Utilizar `npm run analyze` para investigar bundles.
5. Revisar logs de funções serverless para latências elevadas.

## Emergency Procedures

### Site Down
1. Checar status Vercel, Supabase e Stripe.
2. Verificar `/api/health` e logs da aplicação.
3. Revisar deploy recente e, se necessário, realizar rollback via Vercel.
4. Comunicar usuários (status page/newsletter). Documentar incidente.

### Data Breach / Security Incident
1. Revogar todas as chaves/segredos relevantes imediatamente.
2. Analisar logs do Supabase e Vercel para identificar escopo.
3. Notificar usuários afetados (LGPD) dentro de 72 h.
4. Registrar incidente e ações de mitigação. Planejar post-mortem.

### Payment Issues
1. Contatar suporte Stripe e revisar logs.
2. Se necessário, pause novas inscrições temporariamente.
3. Notificar usuários sobre instabilidade.
4. Processar reembolsos manuais quando aplicável.
5. Atualizar documentação interna com lições aprendidas.

## Backup & Recovery

- **Banco:** backups automáticos diários no Supabase (retenção depende do plano). Realize exportações completas mensais e armazene de forma segura (criptografada).
- **Código:** repositório Git é fonte da verdade; utilize tags por release. Vercel mantém histórico de deploys para rollback rápido.
- **Procedimento:** identifique estado saudável mais recente, restaure banco se preciso, promova deploy estável, execute smoke tests e comunique usuários.

## Contact Information

- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.com
- Stripe Support: https://support.stripe.com
- Resend Support: support@resend.com
- Equipe interna / plantão: documente pessoas e horários no Notion interno.

## Maintenance Windows

- Agendar entre 02h–04h horário local (menor tráfego).
- Avisar usuários com 48 h de antecedência (e-mail/blog).
- Utilizar proteções de deploy para testar antes de promover.
- Monitorar métricas durante/depois da manutenção.
- Ter plano de rollback pronto e equipe de prontidão.
