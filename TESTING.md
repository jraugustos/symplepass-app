# Symplepass Testing Guide

Comprehensive end-to-end (E2E) manual testing instructions for validating every core workflow in production. Execute each flow before a release, document evidence (screenshots/video), and file issues for any regression.

## User Flow Testing Scenarios

### Discovery Flow
1. Acesse a home e confirme banners/carrossel.
2. Use a busca por termo e valide resultados.
3. Aplique filtros por modalidade e localização.
4. Abra detalhes do evento, valide categorias, preços, kit e CTA de inscrição.

### Registration Flow
1. Escolha categoria e verifique vagas/preço.
2. Defina tamanho da camisa e itens adicionais.
3. Revise resumo e taxas.
4. Preencha dados pessoais, aceite termos.
5. Redirecione para Stripe Checkout; simule pagamento com cartão válido.
6. Após sucesso, valide página de confirmação com QR Code e botão para baixar ingresso/PDF.

### User Panel Flow
1. Faça login e confirme métricas no dashboard.
2. Abra "Meus Eventos" e valide status/ações disponíveis.
3. Baixe ticket em PDF e confirme dados.
4. Revise histórico de pagamentos, perfil e preferências.
5. Teste gerenciamento de sessões (logout de outros dispositivos, se disponível).

### Authentication Flow
1. Registre nova conta e confirme e-mail.
2. Faça login e teste persistência de sessão.
3. Recupere senha via link enviado.
4. Atualize senha logado.
5. Execute login social (Google) e valide consentimento/retorno.

## Admin Flow Testing Scenarios

### Event Management
1. Acesse painel admin/organizador.
2. Crie novo evento, suba banner (Supabase Storage) e selecione datas/local.
3. Adicione categorias com preço e limites.
4. Publique e confirme visibilidade na listagem pública.
5. Edite informações (descrição, kit, regulamento).
6. Visualize inscrições, exporte lista de atletas, arquive evento concluído.

### User Management
1. Abra lista de usuários, filtre por nome/e-mail.
2. Acesse detalhes do usuário, revise histórico de inscrições.
3. Consulte pagamentos vinculados.
4. Atualize função para organizer/admin (com logs ou confirmação).

### Financial Reports
1. Verifique métricas do dashboard (receita, inscrições, tickets vendidos).
2. Use filtros por intervalo de datas.
3. Analise gráficos de tendência de vendas e status de pagamento.
4. Exporte relatório CSV e valide colunas.
5. Confirme cálculos de receita com Stripe Dashboard.

### Coupon Management
1. Crie cupom com percentual de desconto e período de validade.
2. Configure limites de uso e eventos elegíveis.
3. Teste aplicação durante checkout (valor atualizado e validação de regras).
4. Consulte estatísticas de uso e revogue quando necessário.

## Cross-cutting Testing

- **Responsive Design:** testar breakpoints 375px, 768px, 1024px, 1280px, 1536px.
- **Browser Compatibility:** Chrome, Firefox, Safari, Edge (últimas versões).
- **Performance:** Lighthouse (Performance >90, Accessibility >95, Best Practices >90, SEO >90).
- **Security:** validar rotas protegidas, RBAC, prevenção de SQL injection, proteção XSS.
- **Error Handling:** simular falhas de rede, inputs inválidos, sessões expiradas, falha de pagamento.

## Test Checklist Template

Use o modelo abaixo para registrar evidências por fluxo:

```markdown
### <Nome do Fluxo>
- [ ] Passo: <Descrição>  
      Esperado: <Resultado esperado>  
      Resultado real: <Observado>  
      Status: ✅/⚠️/❌  
      Evidências: screenshots/<arquivo>.png, gravação em videos/<arquivo>.mp4
```

Armazene screenshots em `docs/screenshots/<data>` e vídeos em `docs/videos/<data>`. Recomenda-se usar Loom ou Vercel Replay para gravações curtas.

## Automated Unit Testing

O projeto agora possui testes automatizados configurados com **Vitest**.

### Scripts disponíveis

```bash
npm run test          # Roda testes em modo watch
npm run test:run      # Roda testes uma vez
npm run test:coverage # Roda testes com relatório de cobertura
npm run test:ui       # Interface visual do Vitest
```

### Estrutura de testes

```
tests/
├── setup.ts                    # Configuração global (mocks)
├── unit/
│   ├── utils.test.ts           # Testes de funções utilitárias
│   └── registration-guards.test.ts # Testes de validação de inscrição
└── integration/                # (reservado para testes de integração)
```

### Cobertura atual

- **65 testes** para funções utilitárias (`lib/utils.ts`)
  - Formatação de moeda, datas, CPF, telefone
  - Validação de e-mail, CPF, senha
  - Cálculo de lotes, taxas de serviço
  - Geração de CSV, slugify, etc.

- **5 testes** para guards de registro (`lib/validations/registration-guards.ts`)
  - Validação de evento não encontrado
  - Validação de janela de inscrição
  - Validação de permissão de dupla

### Adicionando novos testes

1. Crie arquivos em `tests/unit/` ou `tests/integration/`
2. Use a convenção `*.test.ts` ou `*.spec.ts`
3. Importe helpers do Vitest: `import { describe, it, expect, vi } from 'vitest'`
4. Use mocks definidos em `tests/setup.ts` para Supabase e Next.js

## E2E Testing Recommendations

- Para fluxos E2E, considerar Playwright ou Cypress
- Reutilizar cenários descritos nas seções de fluxo acima
- Adotar CI com execução agendada (cron) e relatórios automáticos

Mantenha este documento atualizado ao lançar novas funcionalidades.
