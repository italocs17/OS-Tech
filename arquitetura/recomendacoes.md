# Recomendações Pós-Bloco C

Baseada em análise de código em 01/07/2026 — v1.1.0.

Todas as tarefas abaixo foram identificadas via exploração sistemática do código-fonte (gaps entre schema/routes/IPC/services/UI, inconsistências e código não conectado).

---

## 🔴 Prioridade 1 — Correções (crítico)

### 1. Status enum inconsistente no relatório "OS por Status"

**Arquivo:** `src/renderer/pages/Reports/index.tsx:15-22`

**Problema:** O array `OS_STATUS` usado no `<select>` do modal contém valores que **não existem** no enum real do Prisma:

```typescript
// Atual (ERRADO):
const OS_STATUS = [
  'ABERTA',
  'EM_ANDAMENTO',        // ← não existe
  'AGUARDANDO_PECAS',    // ← não existe
  'AGUARDANDO_CLIENTE',  // ← não existe
  'CONCLUIDA',
  'ENTREGUE',
  'CANCELADA',
];

// Correto (deve espelhar o enum StatusOS do schema):
// ABERTA, EM_DIAGNOSTICO, AGUARDANDO_APROVACAO, AGUARDANDO_PECA,
// EM_EXECUCAO, CONCLUIDA, ENTREGUE, CANCELADA
```

**Impacto:** Usuário seleciona `EM_ANDAMENTO` → IPC envia `status: 'EM_ANDAMENTO'` → Prisma não encontra OS com esse status → relatório gerado com "Nenhuma OS encontrada". Relatório silenciosamente quebrado.

**Solução:** Substituir o array `OS_STATUS` pelo enum real de 8 valores (definido em `prisma/schema.prisma:14-23`).

---

### 2. Seed usa bcrypt, produção usa PBKDF2

**Arquivos:** `prisma/seed.ts` vs `src/main/services/password.service.ts`

**Problema:** O seed (`prisma/seed.ts`) hasheia senhas com `bcrypt`, mas o sistema de autenticação real (`password.service.ts`) usa `crypto.pbkdf2Sync` com 210k iterações, SHA-512, salt 32-byte, hash 64-byte. Usuários criados pelo seed **não conseguem fazer login** porque o hash está no formato errado.

```typescript
// seed.ts (ERRADO — usa bcrypt)
const senhaHash = await bcrypt.hash('admin123', 10);

// password.service.ts (correto — usado em produção)
crypto.pbkdf2Sync(senha, salt, 210000, 64, 'sha512').toString('hex');
```

**Impacto:** `npm run prisma:seed` popula o banco com dados de exemplo, mas nenhum usuário consegue logar. Impede testar a aplicação.

**Solução:** Substituir `bcrypt.hash()` por `passwordService.hashPassword()` em `prisma/seed.ts`. O seed já importa serviços de `src/main/services/`, então é só usar o método existente.

---

## 🟡 Prioridade 2 — Catálogo de Serviços e Peças

### 3. CRUD de Serviços e Peças

**Motivação:** Os models `Servico` e `Peca` existem no schema com campos `nome`, `descricao`, `valorSugerido`, `ativo`, mas não há IPC handlers, service, repository ou UI para gerenciá-los. Os relatórios de Serviços Realizados e Peças Utilizadas (`pdf.service.ts`) já fazem lookup por `referenciaId` nos catálogos — mas sem dados cadastrados, o fallback usa `item.descricao` (texto livre digitado na OS).

**O que falta:**

| Camada | Status | Arquivo de referência |
|--------|--------|----------------------|
| Schema | ✅ Existe | `prisma/schema.prisma:188-210` |
| Repository | ❌ | `src/main/database/repositories/` |
| Service | ❌ | `src/main/services/` |
| IPC handlers | ❌ | `src/main/ipc/` |
| Preload | ❌ | `src/preload/` |
| Types (electron.d.ts) | ❌ | `src/shared/types/electron.d.ts` |
| UI (list + form) | ❌ | `src/renderer/pages/` |
| Routes | ❌ | `src/renderer/routes/index.tsx` |

**Padrão a seguir:** Seguir exatamente a estrutura de `cliente` (o domínio mais simples):

1. `servico.repository.ts` — `findAll`, `findById`, `create`, `update`, `softDelete`
2. `servico.service.ts` — delegar ao repository + Zod validation
3. `servico.ipc.ts` — registrar canais `servico:list/get/create/update/delete`
4. `servico.preload.ts` — expor métodos via `contextBridge`
5. `electron.d.ts` — tipar `ServicoAPI`
6. Página `Servicos/index.tsx` + `Pecas/index.tsx` (ou unificada em "Catálogo")
7. Registrar rota em `routes/index.tsx`

**Importante:** Ao criar o IPC handler `servico:list`, a query deve filtrar `{ where: { ativo: true } }` para respeitar soft delete.

---

## 🟡 Prioridade 3 — Gestão de Usuários

### 4. Página de Usuários (CRUD)

**Motivação:** Handlers IPC (`user:list/get/create/update/delete`), service (`usuario.service.ts`) e repository (`usuario.repository.ts`) já existem e estão funcionais. A única lacuna é a página React. Sem ela, o único jeito de gerenciar usuários é via seed script ou SQL direto.

**Arquivos existentes (apenas UI falta):**

| Componente | Status |
|-----------|--------|
| `src/main/ipc/usuario.ipc.ts` | ✅ Registra todos os 6 handlers |
| `src/main/services/usuario.service.ts` | ✅ CRUD + regras (inclui validação de PROPRIETARIO único) |
| `src/preload/usuario.preload.ts` | ✅ Expõe `list, get, create, update, delete, login, changePassword` |
| `src/shared/types/electron.d.ts` — `UserAPI` | ✅ Interface completa |
| `src/renderer/pages/` | ❌ Nenhuma página de usuário |
| `src/renderer/routes/index.tsx` | ❌ Nenhuma rota de usuário |

**Implementação:** Seguir o mesmo padrão da página de Clientes (`Clients/index.tsx`):
- Lista com `DataTable` (colunas: nome, email, perfil, ativo)
- Modal de criação/edição com `FormField`
- Soft delete com confirmação
- Rota `/users` na sidebar

---

### 5. Trocar Senha (componente existe, não conectado)

**Arquivo:** `src/renderer/components/shared/change-password-modal.tsx`

**Problema:** O componente `ChangePasswordModal` está implementado, mas nunca é importado ou renderizado em nenhuma página. O IPC `user:changePassword` funciona.

**Solução simples:** Adicionar um botão "Alterar Senha" no sidebar (dentro do bloco do usuário logado) ou na página de Dashboard. Ao clicar, abrir o modal.

```tsx
// Exemplo de uso (em qualquer página):
import { ChangePasswordModal } from '../../components/shared/change-password-modal';
// ...
const [showChangePwd, setShowChangePwd] = useState(false);
// ...
<ChangePasswordModal
  open={showChangePwd}
  onClose={() => setShowChangePwd(false)}
/>
```

---

## 🟢 Prioridade 4 — Melhorias

### 6. Dashboard com métricas reais

**Arquivo:** `src/renderer/pages/Dashboard/index.tsx`

**Estado atual:** Dashboard mostra cards com valores hardcoded (`totalOS`, `totalClientes`, etc.) e lista de OS recentes. O IPC `countByStatus` existe mas não é chamado.

**Sugestão:** Substituir valores fixos por `useQuery` chamando os IPC existentes:
- `window.osTech.os.countByStatus()` → já existe no IPC
- `window.osTech.os.listByPeriod()` com mês atual
- Gráfico simples de barras (CSS puro, sem lib extra) mostrando OS por status

### 7. Backup validate não conectado

**Arquivo:** `src/main/ipc/backup.ipc.ts`

**Problema:** O handler `IPC_CHANNELS.BACKUP.VALIDATE` está registrado no main process, mas nunca é chamado do renderer. A página de Backup (`src/renderer/pages/Backup/index.tsx`) não tem botão de validação.

### 8. Save PDF para relatórios de lista

**Arquivo:** `src/main/ipc/report.ipc.ts` — handler `SAVE_PDF`

**Problema:** O `report:save-pdf` só trata 4 tipos (`os`, `laudo`, `inventario`, `recibo`). Os relatórios de lista (período, financeiro, status, cliente, equipamento, serviços, peças, recorrentes) não podem ser salvos via diálogo — apenas gerados + auto-abertos.

**Solução:** Estender o switch do handler `SAVE_PDF` para aceitar todos os tipos de relatório de lista, chamando o método correspondente do `pdfService` com o `outputPathOverride`.

### 9. Duplicidade `Servico`/`Peca` no seed

**Arquivo:** `prisma/seed.ts`

**Problema:** O seed cria usuários, clientes, equipamentos e OS, mas **não cria registros** nas tabelas `Servico` e `Peca`. Após implementar o catálogo (item 3), o seed deve ser atualizado para popular dados de exemplo.

---

## ⚠️ Observações Técnicas

### Inconsistência seed vs service (detalhamento)

O seed (`prisma/seed.ts`) importa `passwordService` de `src/main/services/password.service.ts` nas linhas iniciais, mas usa `bcrypt.hash()` em vez do método do serviço. Isso é um bug claro — provavelmente o seed foi escrito antes da migração de bcrypt para PBKDF2.

```typescript
// Linha atual (aproximada linha 10-15 do seed):
import { passwordService } from '../src/main/services/password.service';
// ... mas nunca usa passwordService.hashPassword()
```

### Sobre o enum StatusOS

Definição completa em `prisma/schema.prisma`:

```prisma
enum StatusOS {
  ABERTA
  EM_DIAGNOSTICO
  AGUARDANDO_APROVACAO
  AGUARDANDO_PECA
  EM_EXECUCAO
  CONCLUIDA
  ENTREGUE
  CANCELADA
}
```

O array em `Reports/index.tsx` deve espelhar exatamente esses 8 valores.

---

## Como retomar

1. **Correções críticas (itens 1-2):** ~15 minutos. Editar arquivos diretamente.
2. **Catálogo (item 3):** Seguir o padrão `cliente` como template — é o domínio mais simples e completo.
3. **Usuários (itens 4-5):** A infra IPC/service já existe — é só criar a página React.

Cada item é independente e pode ser implementado separadamente.
