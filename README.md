# OS.Tech — Sistema de Gestão para Assistência Técnica

Sistema desktop (Electron) 100% offline para gestão de assistência técnica de computadores: cadastro de clientes, equipamentos, ordens de serviço com máquina de status, inventário de hardware (manual), geração de PDFs, backup/restore e logs de auditoria.

**Versão atual:** 1.2.1

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Desktop | Electron 41 + electron-vite 2.3 |
| Frontend | React 18 + TypeScript + TailwindCSS 3.4 |
| Roteamento | React Router 6 (HashRouter — necessário para `file://` no Electron) |
| Estado servidor | TanStack React Query 5 (staleTime: 5min, query keys unificadas) |
| Backend | Node.js (processo main Electron) |
| ORM | Prisma 6 + SQLite (single file, `asar: false` para compatibilidade) |
| Validação | Zod 4 (main process, camada dupla: schema + regras de negócio) |
| PDF | PDFKit 0.19 (6 tipos de relatório, A4, margem 50pts) |
| Testes | Vitest + jsdom + Testing Library (5 suites, 28 testes) |
| Distribuição | electron-builder 24 (NSIS installer + portable) |
| Autenticação | `crypto.pbkdf2Sync` (210k iterações, SHA-512, salt 32-byte, hash 64-byte) |

---

## Arquitetura (Layered)

```
Renderer (React)                     →   useQuery/useMutation
  ↓ window.osTech.<domain>.<method>()    →   contextBridge (tipado via electron.d.ts)
Preload (ipcRenderer.invoke)          →   canal IPC {dominio}:{acao}
Main process (ipcMain.handle)         →   Service (Zod + regras)
  ↓
Repository (Prisma ORM)               →   SQLite (resources/db/ostech.db)
```

- `contextIsolation: true`, `nodeIntegration: false` — segurança total
- Código compartilhado em `src/shared/` (types + constantes IPC)
- Nenhum import cruzado entre main e renderer
- Cada domínio segue o pattern: `preload` → `ipc` → `service` → `repository`

---

## Estrutura do Projeto

```
src/
├── main/                           # Electron main process
│   ├── index.ts                    # App lifecycle, window, IPC registry
│   ├── database/
│   │   ├── connection.ts           # Prisma singleton + auto-seed
│   │   ├── generated/              # Prisma Client (autogerado)
│   │   └── repositories/           # 7 repositories (CRUD puro, sem regras)
│   ├── services/                   # 11 services (regras de negócio)
│   │   ├── os.service.ts           # FLUXO PRINCIPAL: CRUD + status machine
│   │   ├── pdf.service.ts          # 6 relatórios PDF
│   │   ├── backup.service.ts       # Gzip + SHA-256 manifest
│   │   ├── log.service.ts          # Auditoria com rotação (50k registros)
│   │   ├── password.service.ts     # PBKDF2 hash/verify
│   │   ├── inventario.service.ts   # Hardware inventory CRUD
│   │   ├── inventory-capture.service.ts  # Stub (referência ao PS script)
│   │   ├── client.service.ts
│   │   ├── equipment.service.ts
│   │   ├── etiqueta.service.ts     # Geração de etiqueta única [A-Z0-9]{5}
│   │   ├── numero-os.service.ts    # Sequencial ANO/MÊS/SEQUENCIAL
│   │   └── usuario.service.ts
│   ├── ipc/                        # 9 handlers IPC (finos, delegam ao service)
│   └── validators/                 # Zod schemas (4 validators)
├── preload/                        # 7 preloads (contextBridge API)
├── renderer/                       # React SPA
│   ├── pages/                      # 9 páginas
│   │   └── OS/Detail/index.tsx     # ~740 linhas — página mais complexa
│   ├── components/
│   │   ├── forms/                  # client-form, equipment-form, os-form
│   │   ├── layout/                 # sidebar, header, app-layout
│   │   └── shared/                 # modal, data-table, currency-input, status-badge, etc.
│   ├── lib/
│   │   ├── auth-context.tsx        # Contexto + sessionStorage
│   │   ├── constants.ts            # APP_NAME, APP_VERSION (via Vite define)
│   │   └── utils.ts                # formatDate, formatCurrency, formatCPF, etc.
│   ├── routes/index.tsx            # HashRouter, 8 rotas
│   └── test/                       # Vitest (5 suites, 28 testes)
└── shared/
    ├── constants/ipc-channels.ts   # 40+ canais IPC tipados
    └── types/
        ├── entities.types.ts       # Interfaces + DTOs + enums
        └── electron.d.ts           # window.osTech API type declarations
```

---

## Máquina de Status (OrdemServico)

8 status com transições rigidamente validadas (Zod):

```
ABERTA → EM_DIAGNOSTICO → AGUARDANDO_APROVACAO → AGUARDANDO_PECA → EM_EXECUCAO → CONCLUIDA → ENTREGUE
└─────────────────────────────── QUALQUER → CANCELADA ───────────────────────────────────────────────┘
```

**Regras de bloqueio:**
- `ENTREGUE` / `CANCELADA` — terminais, nenhuma modificação permitida
- `CONCLUIDA` / `ENTREGUE` / `CANCELADA` — itens bloqueados
- `ENTREGUE` / `CANCELADA` — eventos e desconto bloqueados
- `CONCLUIDA` exige ao menos 1 item (peça ou serviço)

---

## Banco de Dados (Prisma + SQLite)

### Models (9)
| Model | Key Relationships |
|-------|------------------|
| **Cliente** | → Equipamento[], OrdemServico[] |
| **Equipamento** | → Cliente, OrdemServico[] (etiqueta única `[A-Z0-9]{5}`) |
| **OrdemServico** | → Cliente, Equipamento, EventoOS[], ItemOS[], Inventario[] |
| **EventoOS** | → OrdemServico (cascade), Usuario (append-only) |
| **ItemOS** | → OrdemServico (cascade) — `tipoItem` + `referenciaId` (polimórfico) |
| **Inventario** | → OrdemServico (cascade) — `jsonCompleto` (JSON string), múltiplos por OS |
| **Servico** / **Peca** | Catálogo, referenciado por ItemOS |
| **Usuario** | → EventoOS[], Log[] (soft delete via `ativo`) |
| **Log** | → Usuario? (set null) — 7 categorias, rotação 50k |

### Enums (8)
`StatusOS` (8), `PerfilUsuario` (4), `TipoItem`, `TipoDesconto`, `TipoAtendimento`, `FormaPagamento`, `NivelLog`, `CategoriaLog`

---

## APIs Expostas (`window.osTech`)

```typescript
client:     list, get, create, update, delete
equipment:  list, listByClient, get, create, update, delete
os:         list, listByClient, listByPeriod, get, create (tipoAtendimento),
            update (tipoAtendimento), delete, changeStatus, addEvent, addItem,
            removeItem, getItens, getEventos, calcularTotal, countByStatus
user:       list, get, create, update, delete, login, changePassword
inventory:  get, list, saveManual, listByOs, listByEquipamento
backup:     create, list, restore
report:     generate, financial, osByPeriod, save
log:        list, export
```

---

## Funcionalidades

### Autenticação
- Login com PBKDF2 (sem bcrypt), sessão em `sessionStorage`
- 4 perfis: PROPRIETÁRIO (tudo), GESTOR (relatórios), TÉCNICO (execução), RECEPCIONISTA (cadastro)
- Usuário padrão: `admin / admin123` (criado automaticamente na primeira execução)

### Clientes (CRUD)
- Nome + CPF (obrigatórios, CPF único), soft delete
- Formatação automática: CPF, telefone, UPPERCASE

### Equipamentos (CRUD)
- Vínculo com cliente, tipo, etiqueta única auto-gerada
- Campos em UPPERCASE

### Ordens de Serviço
- Fluxo completo com máquina de status validada
- Itens (serviços/peças), eventos (histórico), desconto global (R$ ou %), forma de pagamento
- Tipo de Atendimento: **Interno** (bancada/remoto) ou **Externo** (visita técnica)
- Equipamento opcional na abertura da OS — opção **ND** (Não Determinado) para serviços remotos
- Eventos ordenados do mais antigo ao mais recente
- Busca por nº OS ou cliente

### Inventário de Hardware
- Registro manual via textarea (descrição livre), append-only (imutável)
- Múltiplos registros por OS, exibidos do mais antigo ao mais recente

### Relatórios (PDF)
| Relatório | Geração |
|-----------|---------|
| OS | Dados do cliente, equipamento, itens, eventos |
| Laudo Técnico | Cliente, equipamento, inventário, diagnóstico, assinatura |
| Inventário | Todas as capturas de hardware (sequencial) |
| Recibo | Cliente, equipamento, serviços, assinatura dupla |
| Financeiro | Resumo por período + forma de pagamento + descontos |
| OS por Período | Listagem por intervalo de datas |

Rodapé em todas as páginas: "OS.Tech - Sistema de Gestão para Assistência Técnica" + numeração

### Backup & Restore
- Gzip + manifest JSON com SHA-256, diretório `%USERPROFILE%\Documents\OS.Tech\backups\`
- Restore com backup de segurança pré-restauração

### Logs de Auditoria
- 7 categorias, 3 níveis, rotação automática (50k registros)
- Exportação CSV/JSON, filtros por data/nível/categoria

---

## Padrões e Decisões Críticas

- **HashRouter**: necessário para `file://` no Electron
- **`asar: false`**: mantém arquivos descompactados para compatibilidade Prisma + SQLite
- **Versão dinâmica**: injetada via Vite `define` em `vite.config.ts` (`__APP_VERSION__`)
- **Campos opcionais**: `z.preprocess()` converte `""` → `undefined`
- **CurrencyInput**: dígitos são centavos (ex: `5` → R$ 0,05)
- **Nº OS**: incremental via transação Prisma (`ANO/MÊS/SEQUENCIAL`)
- **Etiqueta**: 5 caracteres aleatórios `[A-Z0-9]` com retry em colisão
- **Desconto**: calculado via SQL aggregate no repositório, aplicado ao subtotal
- **Inventory capture**: script PowerShell removido da UI, mantido como referência em `scripts/inventory.ps1`
- **Todas as queries usam `inventarios`** (plural — o campo de relação em OrdemServico), nunca `inventario` (singular — nome do modelo Prisma)
- **Tipo de atendimento**: campo `tipoAtendimento` na OS (`INTERNO` ou `EXTERNO`), com default `INTERNO`. O ID de sessão remota (AnyDesk, TeamViewer) é registrado como evento textual, não como campo estruturado
- **Equipamento opcional**: `equipamentoId` nullable na OS — permite abrir ordens sem equipamento vinculado (útil para atendimentos remotos onde o equipamento não é identificado ou não faz sentido cadastrar)
- **CurrencyInput unificado**: todos os campos de valor (catálogo, OS, descontos) usam o mesmo componente `CurrencyInput` com máscara `pt-BR`, modo centavos e prefixo `R$` inline
- **Ordenação cronológica**: eventos da OS e listas de OS ordenados do mais antigo ao mais recente (ascendente), tanto no backend (Prisma `orderBy`) quanto no frontend (`.sort()` defensivo)
- **Banco pre-semeado com dados de teste**: `init-db.js` agora gera um banco completo com 5 clientes, 8 equipamentos, catálogo de serviços/peças, 7 OS, eventos, itens, inventários e logs — eliminando a necessidade de povoar manualmente a cada instalação limpa

---

## Comandos

```bash
npm test                          # vitest (28 testes)
npm run dev                       # Vite dev (renderer only)
npm run electron:dev              # Electron dev completo
npm run build                     # tsc + vite build (renderer)
npm run electron:build            # Prisma generate + init-db + build + electron-vite build
npm run dist                      # electron:build + electron-builder --win
npm run prisma:generate           # Gera Prisma Client
npm run prisma:migrate            # Cria migration
npm run prisma:seed               # Popula banco
```

---

## Build & Distribuição

- **Instalador:** `release/OS.Tech Setup X.Y.Z.exe` (NSIS, oneClick=false, perMachine=false)
- **Portátil:** `release/OS.Tech X.Y.Z.exe`
- Atualizar versão em `package.json` antes de rodar `npm run dist`
- Recursos extras: `prisma/` (schema), `scripts/`, `resources/db/`

---

## Migrations

```
prisma/migrations/
├── 20260624145456_init/                            # Schema inicial
├── 20260626134355_add_desconto_formapagamento/    # Desconto + formaPagamento
└── 20260702210400_add_tipo_atendimento/           # TipoAtendimento + equipamentoId opcional
```

Após alterar `schema.prisma`:
```bash
npx prisma generate
npx prisma migrate dev --name <nome>
```

---

## Histórico de Versões

### ✅ v1.2.1 (Atual)

**Banco pre-semeado com dados de teste:**
- `init-db.js` agora gera banco completo com 5 clientes, 8 equipamentos, catálogo (8 serviços + 6 peças), 7 OS, 24 eventos, 10 itens, 2 inventários e 10 logs
- Usuários de teste: `admin/admin123` (PROPRIETÁRIO), `joao.silva/tec123` (TÉCNICO), `maria.santos/rec123` (RECEPCIONISTA), `carlos.oliveira/gest123` (GESTOR)

**Tipo de Atendimento:**
- Novo campo `tipoAtendimento: INTERNO | EXTERNO` na OS
- `equipamentoId` passou a ser opcional — permite abrir OS sem equipamento (opção "ND — Não Determinado")
- Badge colorido na listagem e detalhes da OS (azul = Interno, laranja = Externo)
- ID de sessão remota registrado como evento textual

**Campos de valor unificados:**
- Catálogo (serviços e peças) agora usa `CurrencyInput` com máscara `pt-BR` e prefixo `R$` inline, igual aos demais campos de valor do sistema

**Ordenação cronológica:**
- Eventos da OS: do mais antigo ao mais recente (ascendente)
- Listagem de OS: da mais antiga à mais recente
- Aplicado em todas as queries (backend + frontend)

### ✅ v1.2.0

**Catálogo de Serviços e Peças (CRUD completo):**
- 8 novos arquivos (repositories, services, validators, IPC handlers, preloads)
- Página `/catalog` com abas Serviços/Peças, DataTable, busca, modal de formulário, soft delete
- Rota e sidebar adicionadas

**Gestão de Usuários (página CRUD):**
- Página `/users` com DataTable, busca, modal de formulário, soft delete
- Rota e sidebar adicionadas

**Correções:**
- `OS_STATUS` no relatório corrigido para 8 valores reais do enum `StatusOS`
- Seed corrigido: `bcrypt.hash()` → `hashPassword()` (PBKDF2, 210k iterações)
- Canal `inventario:delete` agora usa constante `IPC_CHANNELS.INVENTORY.DELETE`
- Canais mortos `USER.LOGOUT` e `BACKUP.VALIDATE` removidos
- `updateClientSchema` estendido com `ativo?: boolean`
- `UpdateUsuarioDTO.senhaHash` → `senha`
- `UpdateOrdemServicoDTO.status` removido (status só via `changeStatus`)
- Repositories usam `Record<string, unknown>` para `update()` (Prisma client custom path)
- Troca de Senha conectado (já existia, só faltava ligação na sidebar)

### ✅ v1.1.0

- 4 relatórios implementados com data range + modo simplificado/analítico (OS por Status, Serviços Realizados, Peças Utilizadas, Clientes Recorrentes)
- Ícones emoji restaurados na página de Relatórios

---

## Roadmap

O planejamento das próximas versões e funcionalidades futuras está documentado em:

📄 [`docs/roadmap.md`](docs/roadmap.md)

Inclui: notificações por e-mail (v2.1), categorias de serviços (v2.2),
contratos/recorrência (v2.3), agendamento (v2.4) e expansão WEB (v3.0).

Problemas detectados entre versões devem ser registrados em `docs/roadmap.md`
na seção "Registro de Problemas / Dívida Técnica".

---

## Licença

ISC
