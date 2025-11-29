# Security Guidelines

Boas práticas de segurança, checklist pré-deploy e procedimentos de resposta para Symplepass.

## Security Best Practices

### Authentication & Authorization
- Supabase Auth com hashing bcrypt gerenciado pelo provedor.
- Sessões via JWT armazenadas em cookies httpOnly + middleware Next.js.
- RBAC aplicado tanto no middleware quanto nas políticas RLS (usuário, organizer, admin).
- Login social Google via OAuth 2.0; rotacione client secret periodicamente.
- Sessões possuem expiração e renovação automática via middleware.

### Data Protection
- Todas as tabelas possuem RLS e políticas específicas.
- Dados sensíveis ficam armazenados no Supabase (Postgres) com criptografia at rest.
- HTTPS obrigatório (Vercel), evitando tráfego em texto claro.
- Segredos acessados via variáveis de ambiente, nunca commitados.
- Chave service role usada somente em ambientes server-side protegidos.

### Input Validation
- Formulários validados com Zod (client/server) e sanitização extra em APIs.
- Supabase previne SQL injection via queries parametrizadas.
- React escapa HTML por padrão, reduzindo XSS; sanitize campos ricos antes de renderizar.
- Cookies SameSite previnem CSRF; mantenha tokens revogados após logout.

### API Security
- Verificação de assinatura (`stripe.webhooks.constructEvent`) para todos webhooks.
- Rate limiting padrão do Supabase Auth + limites adicionais configuráveis.
- Configuração de CORS restrita às origens conhecidas.
- Respostas não exibem informações sensíveis; mensagens genéricas para erros auth.

### Infrastructure Security
- Cabeçalhos de segurança (CSP, X-Frame-Options, etc.) definidos exclusivamente em `next.config.js` (fonte única).
- Deploy na Vercel com mitigação DDoS automática.
- Backups automáticos e point-in-time recovery no Supabase.
- Auditoria periódica de dependências usando `npm audit` e GitHub advisories.

## Security Checklist (Pre-Production)

- [ ] Variáveis de ambiente configuradas e protegidas.
- [ ] Políticas RLS testadas para cada role.
- [ ] Webhook Stripe validando assinatura.
- [ ] Rotas protegidas exigem autenticação e role correta.
- [ ] Nenhum segredo exposto em código/cliente.
- [ ] HTTPS/hsts ativo (Vercel default).
- [ ] Cabeçalhos de segurança configurados.
- [ ] Mensagens de erro não expõem detalhes sensíveis.
- [ ] Dependências auditadas (`npm audit`).
- [ ] URLs de OAuth/redirect conferidas.
- [ ] Chaves Stripe em modo Live antes de liberar.

## Vulnerability Reporting

Descobriu um problema? Responsibly disclose:
1. Não abra issue pública.
2. Envie e-mail para **security@symplepass.com** com descrição, passos para reproduzir, impacto potencial e sugestão de correção.
3. O time responde em até 48 horas com próximos passos.
4. Você será creditado (se desejar) após resolução.

## Security Updates & Monitoring

- Execute `npm audit` semanalmente e monitore alertas do GitHub.
- Assine boletins de segurança da Supabase, Stripe e Vercel.
- Aplique patches críticos em até 24h após divulgação.
- Rodar testes e smoke tests antes e depois de corrigir vulnerabilidades.

## Incident Response

1. Identificar escopo (serviços afetados, dados comprometidos).
2. Conter: revogue chaves, bloqueie acesso, aplique patches.
3. Comunicar stakeholders e usuários (LGPD exige aviso em até 72h).
4. Registrar cronologia, impacto e ações mitigatórias.
5. Conduzir post-mortem e implementar medidas preventivas.

## Compliance

- **LGPD:** coletar consentimento, permitir acesso/remoção dos dados, documentar finalidade, notificar incidentes.
- **PCI DSS:** todo processamento ocorre via Stripe Checkout (tokenização); nunca armazenar dados de cartão.

## Contact

- E-mail: security@symplepass.com
- SLA de resposta: 48h (emergências via suporte Vercel + equipe interna).
