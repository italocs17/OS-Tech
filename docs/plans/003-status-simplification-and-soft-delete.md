# Plano: Simplificacao de Status + Soft Delete

> **Versao alvo:** v2.5.0  
> **Data de inicio:** 20/07/2026  
> **Status:** Em andamento  

---

## Visao Geral

Duas mudancas arquiteturais principais:

1. **Simplificacao do sistema de status** — Reduzir de 8 status uniaxiais para 5 status tecnicos + 3 status logisticos (eixo independente)
2. **Soft delete universal (toggle)** — Remover botoes "Excluir", substituir por toggle ativo/inativo em todas as entidades do catalogo

---

## FASE 1 — Schema + Migration + Types

### 1.1 Prisma Schema (`prisma/schema.prisma`)

**Mudancas no enum `StatusOS`:**
- Remover: `ABERTA`, `EM_DIAGNOSTICO`, `AGUARDANDO_APROVACAO`, `AGUARDANDO_PECA`, `EM_EXECUCAO`, `ENTREGUE`
- Adicionar: `AGUARDANDO_ATENDIMENTO`, `EM_ATENDIMENTO`, `PAUSADO`
- Manter: `CONCLUIDA`, `CANCELADA`
- Default: `AGUARDANDO_ATENDIMENTO`

```prisma
enum StatusOS {
  AGUARDANDO_ATENDIMENTO
  EM_ATENDIMENTO
  PAUSADO
  CONCLUIDA
  CANCELADA
}
```

**Novo enum `StatusLogistico`:**
```prisma
enum StatusLogistico {
  PENDENTE
  RECEBIDO
  ENTREGUE
}
```

**Campo novo em `OrdemServico`:**
```prisma
statusLogistico StatusLogistico @default(PENDENTE)
```

### 1.2 Migration SQL

```sql
-- Criar enums novos
CREATE TABLE "_new_ordem_servico" (...com ambos os enums...);

-- Mapeamento de dados existentes (status tecnico)
-- ABERTA            -> AGUARDANDO_ATENDIMENTO
-- EM_DIAGNOSTICO    -> EM_ATENDIMENTO
-- AGUARDANDO_APROVACAO -> EM_ATENDIMENTO
-- AGUARDANDO_PECA   -> PAUSADO
-- EM_EXECUCAO       -> EM_ATENDIMENTO
-- CONCLUIDA         -> CONCLUIDA
-- ENTREGUE          -> CONCLUIDA (status logistico: ENTREGUE)
-- CANCELADA         -> CANCELADA

-- Status logistico:
-- Se status original era ENTREGUE -> statusLogistico = ENTREGUE
-- Se equipamentoId IS NOT NULL     -> statusLogistico = RECEBIDO
-- Caso contrario                  -> statusLogistico = PENDENTE
```

### 1.3 Types TypeScript (`src/shared/types/entities.types.ts`)

```typescript
export type StatusOS =
  | 'AGUARDANDO_ATENDIMENTO'
  | 'EM_ATENDIMENTO'
  | 'PAUSADO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type StatusLogistico =
  | 'PENDENTE'
  | 'RECEBIDO'
  | 'ENTREGUE';
```

Interface `OrdemServico` ganha campo:
```typescript
statusLogistico: StatusLogistico;
```

DTOs `CreateOrdemServicoDTO` e `UpdateOrdemServicoDTO` ganham:
```typescript
statusLogistico?: StatusLogistico;
```

---

## FASE 2 — Backend

### 2.1 Validator (`src/main/validators/os.validator.ts`)

**Array `STATUS_OS` atualizado** com 5 valores.

**Novo schema:**
```typescript
export const changeStatusLogisticoSchema = z.object({
  status: z.enum(['PENDENTE', 'RECEBIDO', 'ENTREGUE']),
});

export const pausarRetomarSchema = z.object({
  justificativa: z.string().min(3, 'Justificativa e obrigatoria'),
});
```

**Mapa `TRANSICOES_PERMITIDAS` atualizado:**
```typescript
AGUARDANDO_ATENDIMENTO: ['EM_ATENDIMENTO', 'CANCELADA'],
EM_ATENDIMENTO: ['PAUSADO', 'CONCLUIDA', 'CANCELADA'],
PAUSADO: ['EM_ATENDIMENTO', 'CANCELADA'],
CONCLUIDA: [],
CANCELADA: [],
```

**Novo mapa `TRANSICOES_LOGISTICAS`:**
```typescript
PENDENTE: ['RECEBIDO'],
RECEBIDO: ['ENTREGUE'],
ENTREGUE: [],
```

### 2.2 Service (`src/main/services/os.service.ts`)

**Constantes atualizadas:**
- `STATUS_BLOQUEADOS_EVENTO`: `[CONCLUIDA, CANCELADA]` (remove ENTREGUE)
- `STATUS_BLOQUEADOS_ITEM`: `[CONCLUIDA, CANCELADA]` (remove ENTREGUE)

**`changeStatus` atualizado:**
- Remover `ENTREGUE` do check de `dataConclusao` (so CONCLUIDA)
- Remover `ENTREGUE` do check de `notifyConclusao` (so CONCLUIDA)

**Novos metodos:**

```typescript
async pausar(id: number, justificativa: string, usuarioId: number)
// Valida: EM_ATENDIMENTO -> PAUSADO
// Registra evento: "OS pausada: {justificativa}"
// Notifica cliente

async retomar(id: number, justificativa: string, usuarioId: number)
// Valida: PAUSADO -> EM_ATENDIMENTO
// Registra evento: "OS retomada: {justificativa}"
// Notifica cliente

async changeStatusLogistico(id: number, novoStatus: StatusLogistico, usuarioId: number)
// Valida transicao logistica
// Registra evento: "Status logistico alterado de X para Y"
// Se RECEBIDO: gera recibo de recebimento + abre PDF
// Se ENTREGUE: gera recibo de entrega + abre PDF
```

### 2.3 IPC Channels (`src/shared/constants/ipc-channels.ts`)

Adicionar em `OS`:
```typescript
PAUSAR: 'os:pausar',
RETOMAR: 'os:retomar',
CHANGE_LOGISTICO_STATUS: 'os:change-logistico-status',
```

### 2.4 IPC Handlers (`src/main/ipc/os.ipc.ts`)

```typescript
ipcMain.handle(IPC_CHANNELS.OS.PAUSAR, async (_, id, justificativa, usuarioId) => {
  return osService.pausar(id, justificativa, usuarioId);
});

ipcMain.handle(IPC_CHANNELS.OS.RETOMAR, async (_, id, justificativa, usuarioId) => {
  return osService.retomar(id, justificativa, usuarioId);
});

ipcMain.handle(IPC_CHANNELS.OS.CHANGE_LOGISTICO_STATUS, async (_, id, status, usuarioId) => {
  return osService.changeStatusLogistico(id, status, usuarioId);
});
```

### 2.5 Preload (`src/preload/os.preload.ts`)

```typescript
pausar: (id: number, justificativa: string, usuarioId: number) =>
  ipcRenderer.invoke(IPC_CHANNELS.OS.PAUSAR, id, justificativa, usuarioId),
retomar: (id: number, justificativa: string, usuarioId: number) =>
  ipcRenderer.invoke(IPC_CHANNELS.OS.RETOMAR, id, justificativa, usuarioId),
changeLogisticoStatus: (id: number, status: string, usuarioId: number) =>
  ipcRenderer.invoke(IPC_CHANNELS.OS.CHANGE_LOGISTICO_STATUS, id, status, usuarioId),
```

### 2.6 Types Electron (`src/shared/types/electron.d.ts`)

Adicionar na `OsAPI`:
```typescript
pausar: (id: number, justificativa: string, usuarioId: number) => Promise<OrdemServico>;
retomar: (id: number, justificativa: string, usuarioId: number) => Promise<OrdemServico>;
changeLogisticoStatus: (id: number, status: string, usuarioId: number) => Promise<OrdemServico>;
```

### 2.7 Email Service (`src/main/services/email.service.ts`)

`autoConvertToOS` — prisma default muda automaticamente para `AGUARDANDO_ATENDIMENTO`. Nenhuma mudanca necessaria no codigo (o default do schema cuida disso).

### 2.8 PDF Service (`src/main/services/pdf.service.ts`)

**Novo metodo `generateReciboRecebimento`:**
- Titulo: `RECIBO DE RECEBIMENTO - N {numeroOS}`
- Secoes: DADOS DO CLIENTE, EQUIPAMENTO, data/hora recebimento, assinatura do tecnico
- SEM secao de servicos/valores (equipamento ainda nao foi reparado)
- Seguir padrao identico ao `generateRecibo` existente

**`report.ipc.ts`:** Adicionar case `'recibo-recebimento'` no switch.

---

## FASE 3 — Frontend UI

### 3.1 Constants (`src/renderer/lib/constants.ts`)

**`STATUS_OS` atualizado:**
```typescript
[
  { value: 'AGUARDANDO_ATENDIMENTO', label: 'Aguardando Atendimento', color: 'blue' },
  { value: 'EM_ATENDIMENTO', label: 'Em Atendimento', color: 'yellow' },
  { value: 'PAUSADO', label: 'Pausado', color: 'orange' },
  { value: 'CONCLUIDA', label: 'Concluida', color: 'green' },
  { value: 'CANCELADA', label: 'Cancelada', color: 'red' },
]
```

**Novo `STATUS_LOGISTICO`:**
```typescript
[
  { value: 'PENDENTE', label: 'Pendente', color: 'gray' },
  { value: 'RECEBIDO', label: 'Recebido', color: 'blue' },
  { value: 'ENTREGUE', label: 'Entregue', color: 'green' },
]
```

### 3.2 StatusBadge (`src/renderer/components/shared/status-badge.tsx`)

- Atualizar mapa de cores com 5 status tecnicos
- Novo componente `StatusLogisticoBadge` para o eixo logistico

### 3.3 OS Detail (`src/renderer/pages/OS/Detail/index.tsx`)

**Guard atualizados:**
```typescript
const isTerminal = ['CONCLUIDA', 'CANCELADA'].includes(osData.status);
const isItemBlocked = ['CONCLUIDA', 'CANCELADA'].includes(osData.status);
const isDiscountBlocked = ['CONCLUIDA', 'CANCELADA'].includes(osData.status);
```

**Dropdown de status:** Filtrar apenas transicoes validas do `TRANSICOES_PERMITIDAS` (melhor UX).

**Novos botoes na sidebar "Acoes":**
- **Pausar**: Visivel quando `status === 'EM_ATENDIMENTO'` → abre modal com textarea obrigatoria
- **Retomar**: Visivel quando `status === 'PAUSADO'` → abre modal com textarea obrigatoria

**Modal de justificativa:**
```tsx
<Modal open={pausarModal} title="Pausar OS" onClose={() => setPausarModal(false)} size="sm">
  <FormField label="Justificativa">
    <textarea value={justificativa} onChange={...} rows={3} />
  </FormField>
  <div className="flex justify-end gap-2">
    <button onClick={() => setPausarModal(false)}>Cancelar</button>
    <button onClick={() => pausarMutation.mutate()} disabled={!justificativa || pausarMutation.isPending}>
      {pausarMutation.isPending ? 'Pausando...' : 'Pausar'}
    </button>
  </div>
</Modal>
```

**Eixo logistico sempre visivel:**
- Se PENDENTE: botao "Receber Equipamento" (azul)
- Se RECEBIDO: botao "Entregar Equipamento" (verde) + badge
- Se ENTREGUE: apenas badge (nenhum botao)
- Botoes desabilitados quando `isTerminal`

**Status badge:** Mostrar ambos os badges (tecnico + logistico).

### 3.4 OS List (`src/renderer/pages/OS/index.tsx`)

Exibir badge de status logistico ao lado do badge tecnico.

### 3.5 Reports (`src/renderer/pages/Reports/index.tsx`)

`OS_STATUS` array atualizado com 5 valores.

### 3.6 PDF (`src/main/services/pdf.service.ts`)

- `renderOSAnalytical`: Adicionar linha `Status Logistico: {statusLogistico}`
- `generateOS`: Filtrar `{ status: { in: ['CONCLUIDA'] } }` para relatorio financeiro (remove ENTREGUE)

---

## FASE 4 — Soft Delete (Toggle)

### 4.1 Toggle Component (novo: `src/renderer/components/shared/toggle-switch.tsx`)

```tsx
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}
```

Estilo: pill com dot animado (verde quando ligado, cinza quando desligado). Acessivel: `role="switch"`, `aria-checked`.

### 4.2 Backend — Todos os Services

Adicionar metodo `ativar(id)` em cada service:
```typescript
async ativar(id: number) {
  return this.repository.update(id, { ativo: true });
}
```

Metodo `delete(id)` continua existindo (desativa). Nenhuma mudanca necessaria.

### 4.3 IPC + Preload

Novos canais para cada entidade:
- `servico:activate`, `peca:activate`, `categoria-servico:activate`, `subcategoria-servico:activate`
- `user:activate`, `equipe:activate`, `client:activate`, `equipment:activate`
- `email:activate-contato`

Ou abordagem generica: reuse o canal `*-update` com `{ ativo: true }` (menos mudanca).

### 4.4 UI — Catalog (`src/renderer/pages/Catalog/index.tsx`)

- Substituir botao "Excluir" por `<ToggleSwitch>` que chama `update({ ativo: !current })`
- Adicionar checkbox "Mostrar inativos" (default: false)
- Quando inativo aparece: row com estilo atenuado + toggle desligado
- Categorias: NUNCA botao de excluir, apenas toggle

### 4.5 UI — Users (`src/renderer/pages/Users/index.tsx`)

- Substituir "Excluir" por toggle
- Ja mostra Ativo/Inativo — toggle substitui o texto

### 4.6 UI — Teams (`src/renderer/pages/Teams/index.tsx`)

- Substituir "Excluir" por toggle
- Adicionar coluna Ativo/Inativo

### 4.7 UI — Contacts (`src/renderer/pages/Contacts/index.tsx`)

- Substituir "Remover" por toggle

### 4.8 UI — EmailInbox contacts-modal (`src/renderer/pages/EmailInbox/components/contacts-modal.tsx`)

- Substituir "Remover" por toggle

### 4.9 Filtro de Inativos

Todas as listagens usam `findMany({ where: { ativo: true } })`. Checkbox "Mostrar inativos" muda para `findMany({ where: {} })`. Itens inativos NUNCA aparecem em dropdowns de selecao.

---

## FASE 5 — Seed + Migração de Dados

### 5.1 Seed (`prisma/seed.ts`, `scripts/init-db.js`)

Status inicial para novas OS: `AGUARDANDO_ATENDIMENTO`. Status logistico: `PENDENTE`.

### 5.2 Migration Data (SQL na migration)

```sql
-- Status tecnicos
UPDATE "OrdemServico" SET "status" = 'AGUARDANDO_ATENDIMENTO' WHERE "status" = 'ABERTA';
UPDATE "OrdemServico" SET "status" = 'EM_ATENDIMENTO' WHERE "status" IN ('EM_DIAGNOSTICO','AGUARDANDO_APROVACAO','EM_EXECUCAO');
UPDATE "OrdemServico" SET "status" = 'PAUSADO' WHERE "status" = 'AGUARDANDO_PECA';
UPDATE "OrdemServico" SET "status" = 'CONCLUIDA' WHERE "status" IN ('CONCLUIDA','ENTREGUE');
UPDATE "OrdemServico" SET "status" = 'CANCELADA' WHERE "status" = 'CANCELADA';

-- Status logistico
UPDATE "OrdemServico" SET "statusLogistico" = 'ENTREGUE' WHERE "status" = 'CONCLUIDA' AND "status" IN (SELECT "status" FROM "OrdemServico" WHERE "status" = 'CONCLUIDA');
-- (Ajustar com subquery para pegar OS que eram ENTREGUE)
UPDATE "OrdemServico" SET "statusLogistico" = 'RECEBIDO' WHERE "equipamentoId" IS NOT NULL AND "statusLogistico" IS NULL;
UPDATE "OrdemServico" SET "statusLogistico" = 'PENDENTE' WHERE "equipamentoId" IS NULL AND "statusLogistico" IS NULL;
```

### 5.3 Testes

- Atualizar mocks em `os-form.test.tsx`
- Testar transicoes novas (PAUSADO <-> EM_ATENDIMENTO)
- Testar toggle ativo/inativo

---

## Arquivos Impactados (~35)

| Camada | Arquivos |
|--------|----------|
| Schema | `prisma/schema.prisma`, `prisma/seed.ts` |
| Types | `src/shared/types/entities.types.ts`, `src/shared/types/electron.d.ts` |
| Validators | `src/main/validators/os.validator.ts` |
| Services | `src/main/services/os.service.ts`, `src/main/services/pdf.service.ts`, `src/main/services/email-notification.service.ts` |
| IPC | `src/main/ipc/os.ipc.ts`, `src/main/ipc/report.ipc.ts` |
| Channels | `src/shared/constants/ipc-channels.ts` |
| Preload | `src/preload/os.preload.ts`, `src/preload/index.ts` |
| UI Constants | `src/renderer/lib/constants.ts` |
| UI Components | `src/renderer/components/shared/status-badge.tsx`, `src/renderer/components/shared/toggle-switch.tsx` (novo) |
| UI Pages | `src/renderer/pages/OS/Detail/index.tsx`, `src/renderer/pages/OS/index.tsx`, `src/renderer/pages/Reports/index.tsx`, `src/renderer/pages/Catalog/index.tsx`, `src/renderer/pages/Users/index.tsx`, `src/renderer/pages/Teams/index.tsx`, `src/renderer/pages/Contacts/index.tsx`, `src/renderer/pages/EmailInbox/components/contacts-modal.tsx` |
| Scripts | `scripts/init-db.js` |
| Tests | `src/renderer/test/os-form.test.tsx` |

---

## Registro de Progresso

| Fase | Status | Data |
|------|--------|------|
| 1 — Schema + Migration + Types | Concluido | 20/07/2026 |
| 2 — Backend | Concluido | 20/07/2026 |
| 3 — Frontend UI | Concluido | 20/07/2026 |
| 4 — Soft Delete | Concluido | 20/07/2026 |
| 5 — Seed + Migration + Testes | Concluido | 20/07/2026 |
| Verificacao final | Concluido | 20/07/2026 |
