# Guia: Sistema de Tamanhos de Camiseta por Gênero

## 📋 Visão Geral

O sistema agora suporta configuração de tamanhos de camiseta por gênero (Masculino, Feminino, Infantil), permitindo que cada evento tenha grades de tamanhos específicas para cada gênero.

## 🗄️ Estrutura do Banco de Dados

### Campo `shirt_sizes_config` (JSONB)

```sql
-- Estrutura esperada:
{
  "masculino": ["PP", "P", "M", "G", "GG", "XGG"],
  "feminino": ["PP", "P", "M", "G", "GG"],
  "infantil": ["2", "4", "6", "8", "10", "12", "14"]
}
```

### Migration

Execute o script SQL no Supabase SQL Editor:

**Arquivo:** `supabase/manual_migrations/add_shirt_sizes_config.sql`

```sql
ALTER TABLE events
ADD COLUMN IF NOT EXISTS shirt_sizes_config JSONB DEFAULT NULL;

COMMENT ON COLUMN events.shirt_sizes_config IS
'Gender-based shirt size configuration.
Expected JSON structure:
{
  "masculino": ["PP", "P", "M", "G", "GG", "XGG"],
  "feminino": ["PP", "P", "M", "G", "GG"],
  "infantil": ["2", "4", "6", "8", "10", "12", "14"]
}
If NULL, the system will use default size grids defined in the frontend.';

CREATE INDEX IF NOT EXISTS idx_events_shirt_sizes_config
ON events USING GIN (shirt_sizes_config);
```

## 🎨 Frontend: Configuração no Admin

### Localização

**Painel Admin → Eventos → Criar/Editar Evento → Seção "Tamanhos de Camiseta por Gênero"**

### Como usar:

1. **Selecione o gênero** (Masculino, Feminino ou Infantil)
2. **Digite o tamanho** no campo de texto (ex: PP, M, G, 2, 4)
3. **Clique em "Adicionar"** ou pressione Enter
4. **Reordene** os tamanhos com as setas ↑ ↓
5. **Remova** tamanhos clicando no ícone de lixeira
6. **Restaure padrões** com o botão "Restaurar tamanhos padrão"

### Grades Padrão

Se você não configurar, o sistema usa estas grades:

- **Masculino**: PP, P, M, G, GG, XGG
- **Feminino**: PP, P, M, G, GG
- **Infantil**: 2, 4, 6, 8, 10, 12, 14

### Exemplo de Configuração

```json
{
  "masculino": ["P", "M", "G", "GG", "XG", "2XG"],
  "feminino": ["PP", "P", "M", "G", "GG"],
  "infantil": ["4", "6", "8", "10", "12"]
}
```

## 👤 Frontend: Experiência do Usuário

### Fluxo de Inscrição

1. **Modal de Seleção de Categoria**
   - Usuário seleciona o **gênero** (botões em azul ciano)
   - Grid de **tamanhos** é filtrado automaticamente
   - Tamanho inicial é selecionado automaticamente

2. **Página de Revisão (Para Duplas)**
   - Mesma interface para selecionar tamanho do **parceiro(a)**
   - Gênero e tamanho são salvos em `registration_data.partner`

### Campos Salvos

```json
{
  "partner": {
    "name": "Nome do Parceiro",
    "email": "email@example.com",
    "cpf": "000.000.000-00",
    "phone": "(00) 00000-0000",
    "shirtSize": "M",
    "shirtGender": "masculino"
  }
}
```

## 🔧 Arquivos Modificados/Criados

### Novos Arquivos

1. **`lib/constants/shirt-sizes.ts`**
   - Constantes de gênero e tamanhos padrão
   - Funções utilitárias

2. **`components/admin/shirt-sizes-config.tsx`**
   - Componente de configuração para admin
   - Interface visual para gerenciar tamanhos por gênero

3. **`supabase/migrations/020_add_shirt_sizes_config.sql`**
   - Migration automática

4. **`supabase/manual_migrations/add_shirt_sizes_config.sql`**
   - Script para executar manualmente

### Arquivos Modificados

1. **`types/index.ts`**
   - `ShirtGender` type
   - `ShirtSizesByGender` interface
   - `PartnerData.shirtGender`
   - `EventFormDataAdmin.shirt_sizes_config`

2. **`types/database.types.ts`**
   - `Event.shirt_sizes_config`

3. **`components/evento/category-selection-modal.tsx`**
   - Seletor de gênero
   - Grade de tamanhos filtrada

4. **`app/inscricao/review-client.tsx`**
   - Seleção de gênero para parceiro
   - `partnerData` inclui `shirtGender`

5. **`components/admin/event-form.tsx`**
   - Usa novo componente `ShirtSizesConfig`
   - Schema atualizado

6. **`lib/data/admin-events.ts`**
   - `createEvent` aceita `shirt_sizes_config`

## 🔄 Compatibilidade

### Backward Compatibility

✅ **Eventos antigos** (sem `shirt_sizes_config`)
- Continuam funcionando
- Usam grades padrão automaticamente

✅ **Campo `shirt_sizes`** (array simples)
- Mantido para compatibilidade
- `shirt_sizes_config` tem prioridade

✅ **Eventos novos**
- Podem usar `shirt_sizes_config`
- Grades customizadas por gênero

## 📊 Exemplo de Uso Completo

### 1. Criar Evento no Admin

```
Admin → Eventos → Novo Evento

1. Preencher dados básicos (título, descrição, etc.)
2. Na seção "Tamanhos de Camiseta por Gênero":
   - Selecionar "Masculino"
   - Adicionar: P, M, G, GG, XG
   - Selecionar "Feminino"
   - Adicionar: PP, P, M, G, GG
   - Selecionar "Infantil"
   - Adicionar: 4, 6, 8, 10, 12
3. Salvar evento
```

### 2. Usuário se Inscreve

```
1. Página do Evento → Selecionar Categoria
2. Modal: Escolher gênero "Masculino"
3. Aparecem apenas: P, M, G, GG, XG
4. Seleciona "M"
5. Se tiver parceiro:
   - Página de revisão
   - Escolher gênero do parceiro "Feminino"
   - Aparecem: PP, P, M, G, GG
   - Seleciona "P"
6. Confirmar inscrição
```

### 3. Dados Salvos

```json
{
  "registration_data": {
    "partner": {
      "name": "Maria Silva",
      "email": "maria@email.com",
      "cpf": "111.222.333-44",
      "phone": "(11) 98765-4321",
      "shirtSize": "P",
      "shirtGender": "feminino"
    }
  }
}
```

## 🎯 Próximos Passos (Futuro)

- [ ] Exibir gênero da camiseta no email de confirmação
- [ ] Exibir gênero na página de confirmação
- [ ] Relatório de tamanhos por gênero para organizadores
- [ ] Validação de estoque por gênero

## 🐛 Troubleshooting

### Migration não aplicada?

Execute manualmente no Supabase SQL Editor:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'events' AND column_name = 'shirt_sizes_config';
```

Se retornar vazio, execute o script em `supabase/manual_migrations/add_shirt_sizes_config.sql`

### Tamanhos não aparecem?

Verifique:
1. Evento tem `shirt_sizes_config` configurado?
2. Se não, sistema usa grades padrão
3. Limpe cache do navegador

### Erro ao salvar?

Verifique:
1. Estrutura JSON está correta?
2. Todos os três gêneros estão presentes?
3. Arrays não estão vazios?

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique este guia primeiro
- Consulte o código em `lib/constants/shirt-sizes.ts`
- Revise os tipos em `types/index.ts`
