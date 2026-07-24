# OS.Tech — Sistema de Gestão para Assistência Técnica

Sistema desktop (Electron) 100% offline para gestão de assistência técnica de computadores: cadastro de clientes, equipamentos, ordens de serviço com máquina de status, inventário de hardware (manual), geração de PDFs, backup/restore e logs de auditoria.

**Versão atual:** 2.4.1

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
| E-mail | Nodemailer 9 + IMAPFlow 1.4 (monitoramento de caixa de entrada) |
| Testes | Vitest + jsdom + Testing Library |
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
│   │   └── repositories/           # 10 repositories (CRUD puro, sem regras)
│   ├── services/                   # 14 services (regras de negócio)
│   │   ├── os.service.ts           # FLUXO PRINCIPAL: CRUD + status machine
│   │   ├── pdf.service.ts          # 6 relatórios PDF
│   │   ├── backup.service.ts       # Gzip + SHA-256 manifest
│   │   ├── log.service.ts          # Auditoria com rotação (50k registros)
│   │   ├── password.service.ts     # PBKDF2 hash/verify
│   │   ├── inventario.service.ts   # Hardware inventory CRUD
│   │   ├── email.service.ts        # IMAP + SMTP (leitura + envio)
│   │   ├── email-notification.service.ts  # Notificações por e-mail
│   │   ├── client.service.ts
│   │   ├── equipment.service.ts
│   │   ├── servico.service.ts
│   │   ├── categoria-servico.service.ts
│   │   ├── subcategoria-servico.service.ts
│   │   └── equipe.service.ts       # CRUD + vinculo usuario-equipe
│   ├── ipc/                        # 13 handlers IPC (finos, delegam ao service)
│   └── validators/                 # 7 validators (Zod schemas)
├── preload/                        # 13 preloads (contextBridge API)
├── renderer/                       # React SPA
│   ├── pages/                      # 11 páginas
│   │   ├── OS/Detail/index.tsx     # ~830 linhas — página mais complexa
│   │   ├── Teams/index.tsx         # Gestão de equipes
│   │   ├── EmailInbox/             # Monitor de e-mail
│   │   └── Reports/                # 9 relatórios
│   ├── components/
│   │   ├── forms/                  # client-form, equipment-form, os-form
│   │   ├── layout/                 # sidebar, header, app-layout
│   │   └── shared/                 # modal, data-table, currency-input, status-badge, etc.
│   ├── lib/
│   │   ├── auth-context.tsx        # Contexto + sessionStorage + controle de acesso por equipe
│   │   ├── constants.ts            # APP_NAME, APP_VERSION (via Vite define)
│   │   └── utils.ts                # formatDate, formatCurrency, formatCPF_CNPJ, etc.
│   ├── routes/index.tsx            # HashRouter, 12 rotas
│   └── test/                       # Vitest
└── shared/
    ├── constants/ipc-channels.ts   # 60+ canais IPC tipados
    └── types/
        ├── entities.types.ts       # Interfaces + DTOs + enums
        └── electron.d.ts           # window.osTech API type declarations
```

---

## Máquina de Status (OrdemServico)

Dois eixos independentes (v2.3.2):

### Status Técnico (5 valores)
```
AGUARDANDO_ATENDIMENTO → EM_ATENDIMENTO → CONCLUIDA
                         EM_ATENDIMENTO → PAUSADO → EM_ATENDIMENTO
                         EM_ATENDIMENTO → CANCELADA
PAUSADO → CANCELADA
```

### Status Logístico (3 valores — independente do técnico)
```
PENDENTE → RECEBIDO → ENTREGUE
```

**Regras de bloqueio:**
- `CONCLUIDA` / `CANCELADA` — terminais, nenhuma modificação permitida
- `CONCLUIDA` / `CANCELADA` — itens bloqueados
- `CONCLUIDA` exige ao menos 1 item (peça ou serviço)
- Pausar/Retomar requer justificativa (mín. 3 caracteres), registrada como evento

---

## Banco de Dados (Prisma + SQLite)

### Models (13)
| Model | Key Relationships |
|-------|------------------|
| **Cliente** | → Equipamento[], OrdemServico[] |
| **Equipamento** | → Cliente, OrdemServico[] (etiqueta única `[A-Z0-9]{5}`) |
| **OrdemServico** | → Cliente, Equipamento?, Tecnico?, EventoOS[], ItemOS[], Inventario[] — status técnico (5) + logístico (3) |
| **EventoOS** | → OrdemServico (cascade), Usuario (append-only) |
| **ItemOS** | → OrdemServico (cascade) — `tipoItem` + `referenciaId` (polimórfico) |
| **Inventario** | → OrdemServico (cascade) — `jsonCompleto` (JSON string), múltiplos por OS |
| **Servico** | → CategoriaServico?, SubcategoriaServico? — catálogo referenciado por ItemOS |
| **Peca** | Catálogo, referenciado por ItemOS |
| **CategoriaServico** | → SubcategoriaServico[], EquipeCategoria[] |
| **SubcategoriaServico** | → CategoriaServico (unique: nome + categoriaId) |
| **Equipe** | → EquipeCategoria[], UsuarioEquipe[] |
| **Usuario** | → EventoOS[], Log[], UsuarioEquipe[] |
| **Log** | → Usuario? (set null) — 7 categorias, rotação 50k |

### Tabelas de Junção
| Model | Relação |
|-------|---------|
| **EquipeCategoria** | Equipe ↔ CategoriaServico (N:N) |
| **UsuarioEquipe** | Usuario ↔ Equipe (N:N) |

### Enums (9)
`StatusOS` (5), `StatusLogistico` (3), `PerfilUsuario` (4), `TipoItem`, `TipoDesconto`, `TipoAtendimento`, `FormaPagamento` (7 valores), `NivelLog`, `CategoriaLog`

---

## APIs Expostas (`window.osTech`)

```typescript
client:           list, get, create, update, delete, setContatoPadrao
equipment:        list, listByClient, get, getByTag, create, update, delete
os:               list, listByClient, listByPeriod, listByEquipamento, get, create,
                  update, delete, changeStatus, changeLogisticoStatus,
                  pausar, retomar, addEvent, addItem, removeItem,
                  getItens, getEventos, calcularTotal, countByStatus
user:             list, get, create, update, delete, login, changePassword
inventory:        get, list, saveManual, listByOs, listByEquipamento
backup:           create, list, restore
report:           generate, financial, osByPeriod, byClient, byEquipment, osByStatus,
                  servicosRealizados, pecasUtilizadas, clientesRecorrentes, save
log:              list, export
servico:          list, get, create, update, delete
categoriaServico: list, get, create, update, delete
subcategoriaServico: list, get, getByCategoria, create, update, delete
equipe:           list, get, create, update, delete, addUsuario, removeUsuario, getByUsuario
peca:             list, get, create, update, delete
email:            list, get, checkMail, linkClient, convertToOS, reject,
                  configGet, configSave, listByStatus, countPending,
                  listContatos, createContato, updateContato, deleteContato,
                  conciliar, listAttachmentsByOs
```

---

## Funcionalidades

### Autenticação
- Login com PBKDF2 (sem bcrypt), sessão em `sessionStorage`
- 4 perfis: PROPRIETÁRIO (tudo), GESTOR (quase tudo), TÉCNICO (execução), RECEPCIONISTA (cadastro)
- Controle de acesso baseado em equipe (TECNICO/RECEPCIONISTA)
- Usuário padrão: `admin / admin123` (criado automaticamente na primeira execução)

### Controle de Acesso por Equipe (v2.3)
- **Equipes** vinculadas a categorias de serviço (N:N) e usuários (N:N)
- **PROPRIETÁRIO/GESTOR**: acesso total a todas as funcionalidades
- **TECNICO/RECEPCIONISTA**: acesso restrito às categorias da sua equipe
  - Sidebar filtrada (itens administrativos ocultos)
  - Formulário de OS mostra apenas categorias da equipe
  - Controles de desconto e pagamento restritos no detalhe da OS
- Página de gestão de equipes com CRUD + vinculo de categorias e membros
- Menu "Cadastro" reorganizado com separadores: Equipes/Usuários | Clientes/Contatos/Equipamentos | Catálogo

### Clientes (CRUD)
- Nome + CPF/CNPJ (obrigatórios, único), soft delete
- Formatação automática: CPF, CNPJ (alfanumérico), telefone, UPPERCASE
- CPF/CNPJ aceita letras (formato XX.XXX.XXX/XXXX-XX para CNPJ)

### Equipamentos (CRUD)
- Vínculo com cliente, tipo, etiqueta única auto-gerada
- Campos em UPPERCASE

### Ordens de Serviço
- Fluxo completo com máquina de status (5 técnicos + 3 logísticos)
- Pausar/Retomar OS com justificativa obrigatória (registrada como evento)
- Status logístico independente: PENDENTE → RECEBIDO → ENTREGUE
- Eixo logístico sempre visível na tela de detalhes
- Recibo de recebimento (documento simples ao receber equipamento)
- Itens (serviços/peças), eventos (histórico), desconto global (R$ ou %), forma de pagamento
- Tipo de Atendimento: **Interno** (bancada/remoto) ou **Externo** (visita técnica)
- Equipamento opcional na abertura da OS — opção **ND** (Não Determinado) para serviços remotos
- Categoria do Serviço opcional na abertura, obrigatória apenas para concluir a OS
- Vinculação de contato do cliente (`contatoId` — FK para `ClienteContato`)
- Atribuição de técnico (`tecnicoId`)
- Lista de OS ordenada por data de entrada (mais recente primeiro)
- Botões de ação como dropdowns inline (sem modais)
- Layout do detalhe: coluna esquerda rolável + coluna direita fixa

### Catálogo de Serviços e Peças
- CRUD completo com abas: Serviços | Peças | Categorias
- Toggle ativo/inativo para todas as entidades (substitui botão Excluir)
- Categorias de serviço (subcategorias removidas do UI)
- Filtros por categoria na aba de serviços
- Formulário de serviço com seleção de categoria
- Campos de valor com `CurrencyInput` (máscara pt-BR, R$ inline)

### Gestão de Equipes (v2.3)
- CRUD de equipes (nome, descrição)
- Vinculação de categorias de serviço (checkbox)
- Gestão de membros (adicionar/remover usuários)
- Página dedicada com DataTable + modais

### Inventário de Hardware
- Registro manual via textarea (descrição livre), append-only (imutável)
- Múltiplos registros por OS, exibidos do mais antigo ao mais recente

### Notificações por E-mail (v2.1)
- Monitoramento de caixa de entrada via IMAP (polling a cada 60s)
- Badge de pendências na sidebar
- Vinculação de e-mail a cliente existente
- Conversão de e-mail em OS com dados pré-preenchidos
- Rejeição de e-mail com motivo
- Configuração de e-mail (host, porta, credenciais)
- Detecção de respostas (In-Reply-To/References) — respostas vinculadas automaticamente à OS original
- Conciliação de chamados duplicados (`email.conciliar`)
- Extração de corpo do email via parser MIME (quoted-printable, base64, HTML→texto)
- Re-parse de emails existentes com `reparseEmailBody()` para corpos indisponíveis
- Anexos do email exibidos no detalhe da OS (nome, tamanho, MIME type)

### Relatórios (PDF)
| Relatório | Geração |
|-----------|---------|
| OS | Dados do cliente, equipamento, itens, eventos |
| Laudo Técnico | Cliente, equipamento, inventário, diagnóstico, assinatura |
| Inventário | Todas as capturas de hardware (sequencial) |
| Recibo | Cliente, equipamento, serviços, assinatura dupla |
| Financeiro | Resumo por período + forma de pagamento + descontos |
| OS por Período | Listagem por intervalo de datas |
| OS por Status | Filtrado por status específico |
| Serviços Realizados | Serviços executados no período |
| Peças Utilizadas | Peças utilizadas no período |
| Clientes Recorrentes | Ranking de clientes por número de OS |

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
- **Tipo de atendimento**: campo `tipoAtendimento` na OS (`INTERNO` ou `EXTERNO`), com default `INTERNO`
- **Equipamento opcional**: `equipamentoId` nullable na OS — permite abrir ordens sem equipamento vinculado
- **CurrencyInput unificado**: todos os campos de valor usam o mesmo componente `CurrencyInput`
- **Ordenação cronológica**: eventos ordenados do mais recente ao mais antigo na UI; relatórios mantêm ordem ASC
- **CPF/CNPJ alfanumérico**: validação com ASCII-48 + módulo 11, aceita letras em CNPJ
- **Controle de acesso por equipe**: PROPRIETARIO/GESTOR têm acesso total; TECNICO/RECEPCIONISTA restrito às categorias da sua equipe via `hasAccessToCategoria()` no auth-context
- **Sidebar dinâmica**: itens de menu filtrados por `perfis` do usuário logado; "Catálogo" (`📦`) é item único do catálogo, navega para `/catalog`
- **Sidebar com separadores**: Menu Cadastro dividido em 3 grupos com separadores visuais (Equipes/Usuários | Clientes/Contatos/Equipamentos | Catálogo)
- **Status simplificado (v2.3.2)**: 5 status técnicos + 3 logísticos (independentes), substituindo 8 uniaxiais
- **Soft delete universal (v2.3.2)**: Toggle ativo/inativo em todas as entidades do catálogo (substitui botão Excluir)
- **Ações via dropdown (v2.3.2)**: componentes de ação na OS Detail usam `ActionDropdown` inline (sem modais)
- **Reload completo (v2.3.2)**: todas as mutations na OS Detail invalidam todas as queries relacionadas via `invalidateAllOS()`
- **categoriaServicoId opcional (v2.3.3)**: campo opcional na criação da OS, obrigatório apenas para concluir (validação em `changeStatus`)
- **Parser MIME robusto (v2.3.3)**: `extrairTexto()` parseia corpo de emails via boundary detection, decodifica quoted-printable/base64, fallback HTML→texto
- **Re-parse de emails (v2.3.3)**: `reparseEmailBody()` re-busca corpo de emails existentes com `(Corpo nao disponivel)` via IMAP
- **Anexos de email no detalhe da OS (v2.3.3)**: nova query IPC `email:list-attachments-by-os` para exibir anexos vinculados

---

## Comandos

```bash
npm test                          # vitest
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
├── 20260624145456_init/                                # Schema inicial
├── 20260626134355_add_desconto_formapagamento/        # Desconto + formaPagamento
├── 20260701172507_add_multiplos_inventarios/          # Múltiplos inventários por OS
├── 20260702210400_add_tipo_atendimento/               # TipoAtendimento + equipamentoId opcional
├── 20260703225334_add_email_solicitacao/              # EmailSolicitacao + ClienteContato
├── 20260703225441_add_configuracao/                   # Configuracao (chave-valor)
├── 20260715000000_rename_cpf_to_cpfCnpj/              # Renomear campo CPF para CPF/CNPJ
├── 20260715195759_rename_cpf_to_cpf_cnpj/            # Renomear campo CPF para CPF/CNPJ
├── 20260716135156_add_categoria_servico/              # CategoriaServico + FK em Servico
├── 20260716165301_add_subcategorias_equipes/          # SubcategoriaServico, Equipe, EquipeCategoria, UsuarioEquipe
├── 20260717183443_add_formas_pagamento_v2/            # Novas formas de pagamento (CONTRATO, CREDITO_A_VISTA, CREDITO_PARCELADO)
├── 20260717184543_add_contato_is_padrao/              # isPadrao em ClienteContato
├── 20260717184933_add_os_contato_id/                  # contatoId em OrdemServico (FK ClienteContato)
├── 20260720170916_add_categoria_to_os/                # categoriaServicoId em OrdemServico
├── 20260720170955_add_anexos_email/                   # AnexosEmail (anexos de e-mail)
└── 20260720184231_simplify_status_add_logistico/      # StatusOS (5), StatusLogistico (3), statusLogistico em OS
```

Após alterar `schema.prisma`:
```bash
npx prisma generate
npx prisma migrate dev --name <nome>
```

---

## Histórico de Versões

### ✅ v2.4.1 (Atual)

**Ordens de Serviço:**
- Botão "Atender" (verde) para OS aguardando atendimento — altera direto para Em Atendimento
- Botão "Alterar Status" (preto) para outros status não-terminais
- Opção "Pausado" removida do dropdown (já tem botão próprio)
- Campo de motivo obrigatório ao cancelar OS (registrado no histórico)
- Coluna "Etiqueta" na listagem de OS (entre Equipamento e Status)
- Busca por etiqueta habilitada (além de nº OS e cliente)
- Seções "Logística" e "Ações" reordenadas (Logística acima)
- Diálogos de ação centralizados na tela com backdrop
- Toggle: clicar no mesmo botão fecha o diálogo
- Botão que abriu o diálogo fica destacado (ring visual)
- Confirmação de entrega com modal "Esta ação não pode ser desfeita"

**Recibo de Entrega (PDF):**
- Texto de confirmação acima da assinatura: "Confirmo que o equipamento acima descrito, foi devolvido/entregue pela assistência técnica."

### v2.4.0

**Sistema de Contratos:**
- Nova entidade `Contrato` vinculada a clientes (Prisma model + migration)
- Aba "Contratos" no modal do cliente (3 abas: Dados, Contatos, Contratos)
- CRUD completo: número, descrição, data início/fim, observações, status (ATIVO/SUSPENSO/ENCERRADO)
- Toggle ativo/inativo com auditoria
- Badge de status: Ativo (verde), Vencendo ≤30d (amarelo), Vencido (vermelho), Suspenso (cinza), Encerrado (cinza)
- Backend completo: Repository, Service, IPC (7 canais), Preload, Zod validator

**Sistema de Alertas:**
- Configuração via página dedicada `/alerts` (menu Cadastro > Alertas)
- Alertas: "Contrato vencendo" (dias configuráveis) e "Contrato vencido"
- Sino 🔔 funcional no header com badge de contagem + dropdown com lista de alertas
- Card de alertas no Dashboard com contagem por tipo
- Configurações salvas no modelo `Configuracao` (KV store existente)
- Polling de alertas a cada 60s (mesmo padrão do email)

**Sidebar:**
- Novo item "Alertas" (🔔) no menu Cadastro (abaixo de Catálogo, com separador)
- Acesso: PROPRIETARIO/GESTOR

**Seed de teste:**
- 3 contratos de exemplo (1 ativo anual, 1 vencendo, 1 encerrado)

### v2.3.5

**Padronização visual de toggle ativo/inativo:**
- Regra: inativos **sempre visíveis**, esmaecidos (`opacity-50`), nunca invisíveis
- Novo componente `AtivoBadge` (verde INATIVO, vermelho ATIVO) em todas as telas
- Novo componente `ativoRowClass()` — aplica `opacity-50 bg-gray-50` em linhas de itens inativos
- `DataTable` suporta prop `rowClassName` para estilização por linha
- Implementado em: Usuários, Equipes, Catálogo (3 abas), Clientes, Contatos

**Dual listing padronizado (`listAll()`):**
- Novos canais IPC `*.{entity}:listAll` para 7 entidades: equipment, user, servico, categoria-servico, subcategoria-servico, equipe, peca
- `findAll()` adicionado a `EquipmentRepository` e `UsuarioRepository`
- `listAll()` adicionado a `EquipmentService` e `UsuarioService`
- Todas as páginas de gestão usam `listAll()` em vez de `list()`

**Auditoria no toggle ativo/inativo:**
- Ação `TOGGLE_ATIVO` registrada em `registrar()` no `update()` de 9 services: cliente, equipment, usuario, equipe, servico, categoria-servico, subcategoria-servico, peca, cliente-contato
- Dados incluem: `entidade`, `entidadeId`, `ação`, `novoValor`

**Validação de vinculação com itens inativos:**
- `changeStatus()`: bloqueia conclusão de OS com categoria inativa (`status: false`)
- `update()`: bloqueia atribuição de categoria inativa em OS existente

**Service layer para ClienteContato:**
- Novo `ClienteContatoService` (regra: email único por cliente)
- `email.ipc.ts` atualizado para usar service em vez de repository diretamente
- Auditoria de toggle em contato

**Correções de bugs:**
- Modal de edição de usuários: campos não preenchidos ao editar — fix com `key={editingUser?.id ?? 'new'}` para forçar remontagem + `useEffect` para inicializar equipes
- Catálogo: dados do formulário persistiam entre abas — fix com `key={`${tab}-${editingItem?.id ?? 'new'}`}` no `CatalogFormModal`

**Sidebar simplificada:**
- 3 itens separados (Categorias/Serviços/Peças) substituídos por um único item **"Catálogo"** (`📦`) navegando para `/catalog`

### v2.3.4

**Botão "Revisar" para chamados rejeitados:**
- Chamados com status REJEITADO podem ser revisados via botão "Revisar"
- Se possui cliente/contato vinculado → volta para AGUARDANDO_ATENDIMENTO
- Se não possui → vai para NAO_CADASTRADO
- Novo canal IPC `email:revisar` + preload + service

**Validação de e-mail no vinculamento de chamados:**
- `linkClient()`: valida se `contato.email` corresponde ao `emailRemetente` (case-insensitive)
- `convertToOS()`: re-verifica correspondência (defesa em profundidade)
- Modal de vinculação exibe e-mail do remetente e aviso de divergência
- Botão "Vincular" desabilitado quando emails não batem

**Verificação automática de emails (correção de bug):**
- Bug: `checking` flag travava em `true` quando `checkMail()` falhava antes do `try/finally`
- Fix: toda a função envolvida em `try/catch/finally` garantindo reset da flag
- Execução imediata ao iniciar o sistema (sem esperar 60s)
- Logs silenciosos no console para debug

### v2.3.3

**Categoria do Serviço opcional na OS:**
- `categoriaServicoId` tornada opcional no schema de criação da OS
- Validação em `changeStatus`: bloqueia transição para CONCLUIDA sem categoria atribuída
- Mensagem de erro: *"A OS precisa ter uma Categoria do Serviço atribuída antes de ser concluída"*
- Formulário de criação de OS: campo categoria não obrigatório
- Detalhe da OS: seletor de categoria com dropdown + mutation

**Sidebar reorganizada:**
- Menu Cadastro dividido em 3 grupos com separadores visuais (`MenuSeparator`)
- Ordem finalizada: Dashboard → Ordens de Serviço → Chamados → Cadastro → Relatórios → Auditoria → Backup
- Subcategorias removidas do UI (banco mantido para uso futuro)

**Extração de corpo do email (reescrita):**
- `extrairTexto()` agora funciona de forma síncrona a partir do `fetchResult.source` + `fetchResult.bodyStructure`
- Novo parser MIME: detecção de boundary, decodificação `quoted-printable` e `base64`, fallback HTML→texto
- Métodos auxiliares: `findPartByType`, `extractPartContent`, `extractMIMEBody`, `decodeBodyContent`, `decodeQuotedPrintable`, `htmlToText`
- `reparseEmailBody(solicitacaoId)`: re-busca corpo de emails existentes com `(Corpo nao disponivel)`

**Anexos de email no detalhe da OS:**
- Novo canal IPC: `email:list-attachments-by-os`
- Novo método preload: `listAttachmentsByOs(osId)`
- Novo repositório: `EmailRepository.findByOsId(osId)`
- Novo serviço: `EmailSolicitacaoService.listAnexosByOsId(osId)`
- Seção "Anexos do E-mail" no detalhe da OS com lista de arquivos (nome, tamanho, MIME type)

### ✅ v2.3.2

**Simplificação de Status:**
- 8 status uniaxiais → 5 técnicos + 3 logísticos (eixos independentes)
- Status técnico: AGUARDANDO_ATENDIMENTO, EM_ATENDIMENTO, PAUSADO, CONCLUIDA, CANCELADA
- Status logístico: PENDENTE, RECEBIDO, ENTREGUE
- Novos métodos: `pausar()`, `retomar()`, `changeLogisticoStatus()`
- Pausar/Retomar com justificativa obrigatória (mín. 3 caracteres), registrado como evento

**Recibo de Recebimento:**
- Novo tipo de PDF: `generateReciboRecebimento()` — documento simples com dados do cliente, equipamento, assinatura do técnico e data

**Soft Delete Universal:**
- Toggle ativo/inativo para: Cliente, Contato, Equipamento, Serviço, Categoria, Subcategoria, Peça, Equipe, Usuário
- Componente `ToggleSwitch` reutilizável
- Botão "Excluir" removido de todas as telas do catálogo
- Inativos **sempre visíveis**, esmaecidos (`opacity-50`), nunca ocultos
- Itens inativos nunca aparecem em dropdowns de seleção

**Ações via Dropdown:**
- Componente `ActionDropdown` — painéis inline abaixo dos botões de ação
- Substitui modais na seção "Ações" do detalhe da OS (9 modais → 9 dropdowns)
- Fecha com click outside ou Escape

**Menu Categorias:**
- Nova opção "Categorias" no menu lateral (abaixo de Clientes)
- Navega para `/catalog?tab=categorias` (ativa aba automaticamente)
- Catálogo lê aba ativa via `useSearchParams()`

**OS mais recente primeiro:**
- Lista de OS ordenada por `dataEntrada DESC` (mais recente primeiro)

**Reload completo:**
- Função `invalidateAllOS()` — invalida todas as 7 queries da OS após cada mutation
- Todas as mutations (status, evento, itens, desconto, pagamento, equipamento, pausar, retomar, logística, hardware) usam a função

**Migrations:**
- `20260720170916_add_categoria_to_os` — categoriaServicoId em OrdemServico
- `20260720170955_add_anexos_email` — AnexosEmail
- `20260720184231_simplify_status_add_logistico` — StatusOS (5), StatusLogistico (3), statusLogistico em OS

### ✅ v2.3.1

**Geração de PDFs (robustez):**
- Relatórios (OS, Laudo, Inventário, Recibo) não quebram mais quando OS não tem equipamento vinculado
- Null-checks em todas as seções que dependem de `os.equipamento`

**Sidebar reorganizada:**
- Novo grupo colapsável "Cadastro" com: Clientes, Equipamentos, Contatos, Catálogo, Usuários, Equipes

**Página de Contatos (nova):**
- Rota `/contacts` — CRUD de contatos de clientes (ClienteContato)
- Campo `isPadrao` — marca contato padrão do cliente
- `client.setContatoPadrao()` — define contato padrão via IPC

**Detalhe da OS (reescrito):**
- Layout: coluna central rolável + coluna direita fixa (ações, pagamentos, itens)
- Botões renomeados: "Novo Andamento", "Adicionar Peças/Serviços"
- Novos botões: **Selecionar Equipamento** (modal com lista do cliente), **Pagamento** (6 opções), **Desconto** (movido do InfoCard para Actions)
- Informações do contato vinculado exibidas (via `contatoId` ou fallback para `emailSolicitacao`)

**Eventos (ordenação invertida na UI):**
- Eventos exibidos do mais recente ao mais antigo na página de detalhe
- Botão "Ver mais" — mostra 3 eventos por padrão, expande ao clicar
- Relatórios mantêm ordem cronológica (ASC)

**E-mail (polling + respostas):**
- Intervalo de polling reduzido de 5 minutos para **60 segundos**
- Detecção de respostas via cabeçalhos `In-Reply-To`/`References`
- Respostas adicionadas automaticamente como eventos na OS original
- Notificações de e-mail incluem `In-Reply-To`/`References` para rastreio

**Conciliação de chamados:**
- Novo método `email.conciliar()` — vincula chamado duplicado a OS existente
- Modal "Conciliar Chamado" no inbox de e-mail
- Canal IPC `email:conciliar` + preload

**Contato vinculado à OS:**
- Campo `contatoId` (nullable) em OrdemServico — FK para ClienteContato
- Formulário de OS inclui dropdown de contatos do cliente
- Conversão automática de e-mail vincula contato pelo e-mail do remetente
- Serviço de notificação prioriza contato vinculado ao OS

**Formas de Pagamento expandidas:**
- `CONTRATO`, `PIX`, `ESPECIE`, `DEBITO`, `CREDITO_A_VISTA`, `CREDITO_PARCELADO`

### ✅ v2.3.0

**Subcategorias de Serviço:**
- Novo modelo `SubcategoriaServico` com relação N:1 com `CategoriaServico`
- Constraint `@@unique([nome, categoriaId])` — subcategoria única por categoria
- Aba "Subcategorias" no Catálogo com CRUD completo
- Filtros por categoria e subcategoria na aba de Serviços
- Formulário de serviço com seleção de categoria → subcategoria (cascata)

**Gestão de Equipes:**
- Novos modelos: `Equipe`, `EquipeCategoria` (N:N), `UsuarioEquipe` (N:N)
- Página `/equipes` com CRUD de equipes
- Vinculação de categorias de serviço a equipes (checkbox)
- Gestão de membros (adicionar/remover usuários)
- Rota e sidebar adicionadas

**Controle de Acesso Baseado em Equipe:**
- `auth-context.tsx`: novas funções `hasAccessToCategoria()`, `getCategoriasIds()`, `isProprietario`, `isGestor`
- Busca automática de equipes do usuário logado via `equipe.getByUsuario()`
- **Sidebar dinâmica**: itens de menu filtrados por perfil do usuário
  - PROPRIETÁRIO/GESTOR: acesso total
  - TÉCNICO/RECEPCIONISTA: apenas Dashboard, Equipamentos, OS, Catálogo, Chamados
  - Grupo "Cadastro" colapsável: Clientes, Equipamentos, Contatos, Catálogo, Usuários, Equipes
- **Formulário de OS**: categorias filtradas pela equipe do usuário
- **Detalhe da OS**: controles de desconto e pagamento restritos para TECNICO/RECEPCIONISTA

**Gestão de Usuários (atualizada):**
- Formulário de edição com seleção de equipes (checkbox)
- Vinculação/desvinculação automática ao salvar

**Seed de teste atualizado:**
- 5 categorias com 11 subcategorias
- 5 equipes vinculadas às categorias
- João (Técnico) → Equipe Bancada + Suporte
- Maria (Recepcionista) → Equipe Bancada + Rede + CFTV
- Admin/Gestor → acesso total

**Instalador v2.3.0:**
- `release/OS.Tech Setup 2.3.0.exe` (NSIS, 111.5 MB)
- `release/OS.Tech 2.3.0.exe` (portátil, 111.3 MB)
- `init-db.js` atualizado com subcategorias, equipes e vínculos

### ✅ v2.2.0

**Categorias de Serviço:**
- Novo modelo `CategoriaServico` com CRUD completo
- Aba "Categorias" no Catálogo com DataTable + modal
- Filtro por categoria na aba de Serviços
- Campo `categoriaId` obrigatório em Servico
- Seed com 5 categorias (Bancada, Rede, CFTV, Servidores, WEB)

### ✅ v2.1.0

**Notificações por E-mail:**
- Monitoramento IMAP com polling (60s)
- Badge de pendências na sidebar
- Conversão de e-mail em OS
- Vinculação de e-mail a cliente
- Rejeição com motivo

### ✅ v2.0.0

**CNPJ Alfanumérico:**
- Validação com ASCII-48 + módulo 11
- `formatCNPJ()` e `formatCPF_CNPJ()` preservam letras
- Placeholder atualizado com formato alfanumérico

**Dashboard Clicável:**
- StatCards navegam para rotas correspondentes
- Itens da lista de OS → `/os/:id`
- Lista de e-mails → `/email-inbox`

### ✅ v1.2.1

**Banco pre-semeado com dados de teste:**
- `init-db.js` gera banco completo com 5 clientes, 8 equipamentos, catálogo, 7 OS, eventos, itens, inventários e logs

**Tipo de Atendimento:**
- Campo `tipoAtendimento: INTERNO | EXTERNO` na OS
- `equipamentoId` opcional (opção "ND — Não Determinado")
- Badge colorido na listagem e detalhes

### ✅ v1.2.0

**Catálogo de Serviços e Peças (CRUD completo)**
**Gestão de Usuários (página CRUD)**

### ✅ v1.1.0

- 4 relatórios implementados com data range + modo simplificado/analítico

---

## Roadmap

O planejamento das próximas versões e funcionalidades futuras está documentado em:

📄 [`docs/roadmap.md`](docs/roadmap.md)

Inclui: notificações por e-mail (v2.1), categorias de serviços (v2.2),
subcategorias/equipes/controle de acesso (v2.3), simplificação de status/soft delete (v2.3.2), contratos/recorrência (v2.4), agendamento (v2.5) e expansão WEB (v3.0).

Problemas detectados entre versões devem ser registrados em `docs/roadmap.md`
na seção "Registro de Problemas / Dívida Técnica".

---

## Licença

ISC
