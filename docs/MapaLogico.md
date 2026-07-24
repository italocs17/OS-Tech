# OS.Tech v2.4.1 — Mapa de Lógica e Regras de Negócio

## 1. Arquitetura Geral

```
Renderer (React/TS) ──useQuery/useMutation──→ window.osTech.<domain>.<method>()
       ↓ contextBridge                              ↓ ipcRenderer.invoke
Preload (tipado) ──IPC {dominio}:{acao}──→ ipcMain.handle
       ↓                                        ↓
Main Process ──Service (Zod + regras)──→ Repository (Prisma ORM)
       ↓                                        ↓
    SQLite (resources/db/ostech.db)
```

- **Zero SQL raw** — 100% Prisma Client
- **~90 canais IPC** em 14 módulos, ~85 métodos expostos no preload
- **contextIsolation: true**, nodeIntegration: false

---

## 2. Banco de Dados (15 Models + 10 Enums)

### Models Principais

```
Cliente ──────→ Equipamento[]
    │               └──→ OrdemServico[]
    ├──→ OrdemServico[]
    └──→ ClienteContato[] ──→ OrdemServico[] (contatoId)

OrdemServico ──→ EventoOS[] (cascade, imutável)
    │           → ItemOS[] (cascade, polimórfico: SERVICO|PECA)
    │           → Inventario[] (cascade, JSON serializado)
    │           → EmailSolicitacao[]
    └──→ FKs: clienteId, equipamentoId?, tecnicoId?, contatoId?, categoriaServicoId?

CategoriaServico ──→ SubcategoriaServico[] (unique: nome+categoriaId)
    │               → Servico[]
    └──→ EquipeCategoria[] ←→ Equipe (N:N)

Equipe ←→ Usuario (via UsuarioEquipe, N:N)
```

### Enums (10)

| Enum | Valores |
|------|---------|
| StatusOS | AGUARDANDO_ATENDIMENTO, EM_ATENDIMENTO, PAUSADO, CONCLUIDA, CANCELADA |
| StatusLogistico | PENDENTE, RECEBIDO, ENTREGUE |
| PerfilUsuario | PROPRIETARIO, GESTOR, TECNICO, RECEPCIONISTA |
| TipoItem | SERVICO, PECA |
| TipoDesconto | ABSOLUTO, PERCENTUAL |
| TipoAtendimento | INTERNO, EXTERNO |
| FormaPagamento | CONTRATO, PIX, ESPECIE, DEBITO, CREDITO_A_VISTA, CREDITO_PARCELADO |
| StatusEmail | NAO_CADASTRADO, AGUARDANDO_ATENDIMENTO, CONVERTIDO, REJEITADO |
| NivelLog | INFO, WARN, ERROR |
| CategoriaLog | AUTH, CLIENTE, OS, BACKUP, SISTEMA, RESTAURACAO |

### Constraints Únicos

cpfCnpj, etiqueta, numeroOS, login, mensagemId, chave (Configuracao), email (ClienteContato), nome (CategoriaServico, Equipe), (nome + categoriaId) (SubcategoriaServico), (equipeId + categoriaId), (usuarioId + equipeId).

### Índices Principais

OrdemServico: 8 índices (clienteId, equipamentoId, tecnicoId, contatoId, categoriaServicoId, status, statusLogistico, dataEntrada). Log: 4 índices (dataHora, nivel, categoria, usuarioId).

---

## 3. Máquinas de Status

### Status Técnico (5 valores)

```
AGUARDANDO_ATENDIMENTO ──→ EM_ATENDIMENTO
                         ──→ CANCELADA

EM_ATENDIMENTO ──→ PAUSADO
                ──→ CONCLUIDA
                ──→ CANCELADA

PAUSADO ──→ EM_ATENDIMENTO (retomar)
         ──→ CANCELADA

CONCLUIDA ──→ (terminal — nada permitido)
CANCELADA  ──→ (terminal — nada permitido)
```

### Status Logístico (3 valores, independente)

```
PENDENTE ──→ RECEBIDO ──→ ENTREGUE ──→ (terminal)
```

---

## 4. Regras de Negócio por Domínio

### 4.1 Ordem de Serviço (OS) — O Fluxo Principal

| Regra | Descrição |
|-------|-----------|
| R1 | Numeração incremental via transação Prisma (ANO/MÊS/SEQUENCIAL) |
| R2 | Conclusão requer ao menos 1 item (peça ou serviço) |
| R3 | Status terminal (CONCLUIDA/CANCELADA) bloqueia: eventos, itens, desconto, pagamento, equipamento, hardware |
| R4 | Pausar/Retomar exige justificativa (mín. 3 caracteres), registrada como evento |
| R5 | Auto-set dataConclusao ao concluir |
| R6 | Desconto bloqueado em OS finalizada/cancelada |
| R7 | Equipamento opcional (opção "ND" para serviços remotos) |
| R8 | Receber equipamento → evento "Em posse do equipamento" |
| R9 | Entregar equipamento → evento "Equipamento Entregue" |
| R10 | Ao concluir → email com PDF anexo (fire-and-forget) |
| R11 | Conclusão requer `categoriaServicoId` preenchido (validação em `changeStatus`) |

### 4.2 Cliente

| Regra | Descrição |
|-------|-----------|
| R1 | CPF/CNPJ único, validação algorítmica (módulo 11) |
| R2 | CNPJ alfanumérico (IN RFB 2.229/2024) |
| R3 | Contato padrão automático (primeiro contato válido = isPadrao) |
| R4 | Soft delete (toggle ativo/inativo) — inativos visíveis com esmaecimento (`opacity-50`), nunca ocultos. Ação registrada em auditoria como `TOGGLE_ATIVO` |
| R5 | CPF/CNPJ imutável na atualização |
| R6 | Dual listing: list() = ativos (dropdowns), listAll() = todos (gestão) |
| R7 | Validação de ativo no vínculo: `linkClient()` rejeita contato inativo |
| R8 | Validação de ativo na conversão: `convertToOS()` rejeita contato inativo vinculado |

### 4.3 Equipamento

| Regra | Descrição |
|-------|-----------|
| R1 | Etiqueta auto-gerada: 5 chars [A-Z0-9]{5} com retry (10 tentativas) |
| R2 | Campos em UPPERCASE |
| R3 | Soft delete |

### 4.4 Catálogo (Serviços, Peças, Categorias, Subcategorias)

| Regra | Descrição |
|-------|-----------|
| R1 | Dual listing: list() = ativos, listAll() = todos |
| R2 | Soft delete para todas as entidades (toggle inativo) — inativos visíveis com esmaecimento (`opacity-50`), nunca ocultos |
| R3 | Subcategoria única por categoria (@@unique) — schema mantido, UI removida |
| R4 | Serviço vinculado a categoria + subcategoria (cascata) |
| R5 | Auditoria de toggle: ação `TOGGLE_ATIVO` registrada em `update()` de cada service (servico, categoria-servico, subcategoria-servico, peca) |
| R6 | Bloqueio de vinculação: OS não pode ser concluída com categoria inativa (`changeStatus()` valida `status: true`) |
| R7 | Bloqueio de atribuição: OS não pode ter categoria inativa atribuída via `update()` |

### 4.5 Contratos

| Regra | Descrição |
|-------|-----------|
| R1 | Contrato vinculado a cliente (FK obrigatória) |
| R2 | Número do contrato obrigatório |
| R3 | Data de início deve ser anterior à data de fim |
| R4 | Soft delete (toggle ativo/inativo) — inativos visíveis com esmaecimento |
| R5 | Status: ATIVO, SUSPENSO, ENCERRADO — com default ATIVO |
| R6 | Auditoria: toggle registrado como TOGGLE_ATIVO no service |
| R7 | Badge visual: Ativo (verde), Vencendo ≤30d (amarelo), Vencido (vermelho), Suspenso (cinza), Encerrado (cinza) |
| R8 | listByCliente(clienteId) retorna contratos de um cliente específico |

### 4.6 Alertas

| Regra | Descrição |
|-------|-----------|
| R1 | Configuração via KV store (modelo Configuracao existente) |
| R2 | Dois tipos: CONTRATO_VENCENDO (dias configuráveis, default 30) e CONTRATO_VENCIDO |
| R3 | Alertas gerados dinamicamente: query contratos ATIVOS + cálculo de dias restantes |
| R4 | Sino no header: badge com contagem + dropdown com lista |
| R5 | Dashboard: card de alertas com contagem por tipo |
| R6 | Página /alerts: configuração (dias, toggle por tipo) + lista de alertas ativos |
| R7 | Polling a cada 60s para atualização automática |

### 4.7 Equipes e Controle de Acesso

| Regra | Descrição |
|-------|-----------|
| R1 | PROPRIETARIO/GESTOR: acesso total |
| R2 | TECNICO/RECEPCIONISTA: restrito às categorias da sua equipe |
| R3 | Sidebar dinâmica: itens filtrados por perfil |
| R4 | Equipe vinculada a categorias (N:N) e usuários (N:N) |
| R5 | Menu Cadastro: Equipes/Usuários \| Clientes e Contatos/Equipamentos \| Catálogo (unificado com abas: Serviços, Peças, Categorias — Contatos integrado ao modal do cliente) |

### 4.8 Autenticação

| Regra | Descrição |
|-------|-----------|
| R1 | PBKDF2: SHA-512, 210k iterações, salt 32-byte, hash 64-byte |
| R2 | Sessão em sessionStorage (sobrevive refresh, não tab close) |
| R3 | Usuário padrão: admin / admin123 (auto-seed na primeira execução) |
| R4 | Login imutável após criação |
| R5 | Comparação timing-safe contra timing attacks |

### 4.9 Inventário de Hardware

| Regra | Descrição |
|-------|-----------|
| R1 | Registro manual (textarea livre), append-only |
| R2 | JSON serializado como string no banco |
| R3 | Múltiplos registros por OS |
| R4 | Hard delete |

### 4.10 E-mail (Pipeline Completo)

| Regra | Descrição |
|-------|-----------|
| R1 | IMAP hardcoded Gmail (port 993, TLS) |
| R2 | Deduplicação por messageId |
| R3 | Detecção de respostas via In-Reply-To/References → evento na OS original |
| R4 | Match automático por e-mail do remetente (ClienteContato) |
| R5 | Conversão automática → OS com dados pré-preenchidos |
| R6 | Concorrência: flag checking impede check simultâneo |
| R7 | Anexos baixados para disco + registrados no banco |
| R8 | Conciliação de chamados duplicados |
| R9 | Extração de corpo via parser MIME: boundary detection, quoted-printable, base64, HTML→texto |
| R10 | Re-parse: `reparseEmailBody()` re-busca corpo de emails com `(Corpo nao disponivel)` |
| R11 | Anexos de email vinculados à OS via IPC `email:list-attachments-by-os` |
| R12 | Validação de e-mail no vinculamento: `linkClient()` compara `contato.email` com `emailRemetente` (case-insensitive) — rejeita se divergir |
| R13 | Validação de e-mail na conversão: `convertToOS()` re-verifica se `contato.email` corresponde ao remetente (defesa em profundidade) |
| R14 | Polling de e-mail: `checkMail()` inicializa `checking = false`, executa em try/finally — primeira verificação imediata no startup (não espera 60s) |
| R15 | Ação "Revisar": move email REJEITADO → AGUARDANDO_ATENDIMENTO (se tem cliente vinculado) ou NAO_CADASTRADO (se não) |
| R16 | Validação de ativo no vínculo: `linkClient()` rejeita contato inativo |
| R17 | Validação de ativo na conversão: `convertToOS()` rejeita contato inativo vinculado |
| R18 | Service layer: `ClienteContatoService` com regras de negócio (email único por cliente) e auditoria no toggle |

### 4.11 E-mail (Notificações SMTP)

| Regra | Descrição |
|-------|-----------|
| R1 | SMTP hardcoded Gmail (port 465, TLS/SSL) |
| R2 | Resolução de destinatário: contato vinculado → emailSolicitacao → cliente.email |
| R3 | Threading via In-Reply-To/References |
| R4 | Conclusão: gera PDF temporário, anexa, envia, deleta temp |
| R5 | Fire-and-forget: erros logados, nunca propagados |

### 4.12 Backup & Restore

| Regra | Descrição |
|-------|-----------|
| R1 | Gzip + manifest SHA-256 |
| R2 | Restore cria backup de segurança pré-restauração (PRE_RESTORE_*.db) |
| R3 | Suporta .gz (decompacta) e .db (cópia direta) |

### 4.13 Logs de Auditoria

| Regra | Descrição |
|-------|-----------|
| R1 | Rotação automática: máximo 50.000 registros |
| R2 | 7 categorias, 3 níveis |
| R3 | DadosContexto serializados como JSON |
| R4 | Exportação CSV/JSON com escape adequado |

### 4.14 PDF (9 relatórios)

| Regra | Descrição |
|-------|-----------|
| R1 | A4, margem 50pts, rodapé com numeração |
| R2 | Modo simplificado (condensado) e analítico (detalhado) |
| R3 | Desconto: PERCENTUAL = subtotal * (1 - desconto/100), ABSOLUTO = subtotal - desconto |
| R4 | Relatório financeiro filtra apenas OS CONCLUIDA |
| R5 | Laudo/Inventário tratam OS sem equipamento (null-checks) |

---

## 5. Fluxos Principais do Usuário

### Fluxo OS (Ciclo de Vida)

```
1. Criar OS (clienteId obrigatório, equipamentoId opcional)
   → Gera numeroOS incremental
   → Evento automático de abertura
   → Email notificação (fire-and-forget)

2. Atender OS (AGUARDANDO_ATENDIMENTO → EM_ATENDIMENTO)

3. Pausar/Retomar (com justificativa obrigatória)

4. Adicionar itens (peças/serviços com valores)

5. Registrar hardware (inventário manual)

6. Logística:
   PENDENTE → Receber Equipamento (evento "Em posse do equipamento")
   RECEBIDO → Entregar Equipamento (evento "Equipamento Entregue")

7. Financeiro:
   Definir pagamento (6 opções)
   Aplicar desconto (R$ ou %)

8. Concluir (EM_ATENDIMENTO → CONCLUIDA)
   → Exige ao menos 1 item
   → Exige categoriaServicoId preenchido
   → Auto-set dataConclusao
   → Email com PDF anexo

9. Gerar relatórios (OS, Laudo, Inventário, Recibo)
```

### Fluxo E-mail

```
1. Polling IMAP (60s) → busca não lidos
2. Deduplicação por messageId
3. Detecção de respostas → evento na OS original
4. Match por remetente → status AGUARDANDO_ATENDIMENTO
5. Sem match → status NAO_CADASTRADO
6. Ação do usuário:
   a. Vincular a cliente existente → VALIDAÇÃO: contato.email == emailRemetente
      ├── OK → AGUARDANDO_ATENDIMENTO
      └── Diferente → Erro (impedido)
   b. Atender (converter em OS) → VALIDAÇÃO: contato.email == emailRemetente (defesa em profundidade)
      ├── OK → OS criada
      └── Diferente → Erro (impedido)
   c. Rejeitar (com motivo)
   d. Revisar (REJEITADO → AGUARDANDO_ATENDIMENTO ou NAO_CADASTRADO)
   e. Conciliar (mesclar com chamado existente)
```

---

## 6. Matriz de Permissões

| Ação | PROPRIETARIO | GESTOR | RECEPCIONISTA | TECNICO |
|------|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Clientes/Contatos CRUD | ✅ | ✅ | ✅ | ❌ |
| Categorias CRUD | ✅ | ✅ | ✅ | ❌ |
| Equipamentos CRUD | ✅ | ✅ | ✅ | ❌ |
| Catálogo (tudo) | ✅ | ✅ | ✅ | ✅ |
| Usuários CRUD | ✅ | ✅ | ❌ | ❌ |
| Equipes CRUD | ✅ | ✅ | ❌ | ❌ |
| OS (listar/criar/editar) | ✅ | ✅ | ✅ | ✅ |
| Alterar Status/Pausar/Retomar | ✅ | ✅ | ✅ | ✅ |
| Logística (receber/entregar) | ✅ | ✅ | ✅ | ✅ |
| Pagamento | ✅ | ✅ | ❌ | ❌ |
| Desconto | ✅ | ✅ | ❌ | ❌ |
| Relatórios PDF | ✅ | ✅ | ❌ | ❌ |
| Chamados (email) | ✅ | ✅ | ✅ | ❌ |
| Backup | ✅ | ❌ | ❌ | ❌ |
| Auditoria (logs) | ✅ | ✅ | ❌ | ❌ |

---

## 7. Padrões Transversais

| Padrão | Detalhe |
|--------|---------|
| Validação dupla | Zod no main process + validação manual no frontend |
| Soft delete | Cliente, Equipamento, Serviço, Peca, Categoria, Subcategoria, Equipe, Usuario, ClienteContato — inativos esmaecidos (`opacity-50`), nunca ocultos |
| Hard delete | OS, ItemOS, Inventario, EventoOS (imutável) |
| Dual listing | list() = ativos (dropdowns), listAll() = todos (gestão) — Cliente, Contato, catálogo (7 entidades com IPC `listAll` separado) |
| z.preprocess | Converte "" → undefined para compatibilidade com formulários HTML |
| Fire-and-forget | Notificações por email nunca bloqueiam o fluxo principal |
| invalidateAllOS() | Após cada mutation na OS, invalida as 7 queries relacionadas atomicamente |
| CurrencyInput | Dígitos = centavos (ex: 5 → R$ 0,05) |
| Timestamp automático | Eventos e logs usam @default(now()) do Prisma |
| AtivoBadge | Componente visual que exibe "Ativo" (verde) ou "Inativo" (vermelho) em todas as telas de gestão |
| ativoRowClass() | Função helper que aplica `opacity-50 bg-gray-50` em linhas de itens inativos no DataTable |
| rowClassName (DataTable) | Prop que permite estilização por linha — usado para aplicar efeito visual em itens inativos |
| Auditoria toggle | Ação `TOGGLE_ATIVO` registrada em `update()` de 9 services ao inativar/ativar qualquer entidade |
| Validação de ativo (OS) | `changeStatus()` bloqueia conclusão com categoria inativa; `update()` bloqueia atribuição de categoria inativa |

---

## 8. Observações / Dívida Técnica Detectada

| # | Observação |
|---|-----------|
| 1 | Sem proteção de rotas: qualquer URL acessível diretamente, sem guard de autenticação |
| 2 | hasAccessToCategoria nunca chamado: controle de acesso por equipe existe no auth mas não é enforced no frontend |
| 3 | OS list sem filtro server-side: lista completa enviada ao cliente |
| 4 | Controles financeiros são UI-only: desconto/pagamento desabilitados no frontend mas a API aceita via preload |
| 5 | Sem confirmação em ações destrutivas: cancelar OS, transições logísticas, remoção de itens — tudo sem confirmação |
| 6 | ~~Email IPC mistura 4 services/repositories: contatos CRUD chama repository diretamente~~ — Resolvido em v2.3.5 via `ClienteContatoService` |
| 7 | Canal IPC inconsistente: inventario:delete (PT) vs inventory:* (EN) |
| 8 | Sem paginação no banco: todas as queries retornam todos os registros |
| 9 | hasAccessToCategoria importado mas não utilizado na OS List |
| 10 | Sem optimistic updates: todas as mutations aguardam resposta do servidor |
| 11 | SubcategoriaServico: schema mantido no banco mas UI removida — potencial para remoção futura |
| 12 | reparseEmailBody depende de conexão IMAP ativa — pode falhar se caixa indisponível |
| 13 | Clientes: modal tabulado (Dados + Contatos) substituiu páginas separadas — ContactsPage removida |
| 14 | Sidebar: "Contatos" removido como item independente — gerenciamento integrado ao modal do cliente |
| 15 | Dual listing: list() retorna apenas ativos (dropdowns), listAll() retorna todos (gestão) — inativos esmaecidos na UI |
| 16 | Sidebar simplificada (v2.3.5): 3 itens (Categorias/Serviços/Peças) unificados em "Catálogo" com 3 abas |
| 17 | Auditoria de toggle (v2.3.5): ação `TOGGLE_ATIVO` registrada em update() de 9 services — dados incluem `ação` e `novoValor` |
