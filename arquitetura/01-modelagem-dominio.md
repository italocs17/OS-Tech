# OS.Tech - Modelagem de Domínio

## 1. Visão Geral do Domínio

O sistema OS.Tech é uma aplicação de gestão de assistência técnica de computadores, 100% offline, com banco de dados SQLite local. O domínio central gira em torno da **Ordem de Serviço (OS)**, que registra o ciclo de vida de um equipamento em manutenção — desde a entrada até a entrega ou cancelamento.

### Mapa de Relacionamentos

```
┌──────────┐     1:N     ┌──────────────┐     1:N     ┌─────────────┐
│  Cliente  │────────────▶│  Equipamento  │────────────▶│   ItemOS    │
└──────────┘             └──────────────┘             └─────────────┘
     │                         │                            │
     │ 1:N                     │ 1:N                        │ N:1
     ▼                         ▼                            ▼
┌──────────┐  1:N  ┌──────────────┐  1:N  ┌──────────┐  ┌──────────┐
│    OS    │◀──────│   EventoOS   │       │  Servico │  │   Peca   │
└──────────┘       └──────────────┘       └──────────┘  └──────────┘
     │                                       (referenciaId)
     │ 1:1                                    tipoItem =
     ▼                                       SERVICO | PECA
┌────────────┐        ┌──────────┐
│ Inventario │        │ Usuario  │
└────────────┘        └──────────┘
```

### Agregados e Contextos Delimitados

| Agregado | Raiz | Descrição |
|----------|------|-----------|
| Cliente | Cliente | Dados cadastrais e equipamentos associados |
| Equipamento | Equipamento | Vinculado a um cliente, rastreável por etiqueta |
| Ordem de Servico | OrdemServico | Ciclo de vida do serviço prestado |
| Catalogo | Servico / Peca | Itens disponíveis para composição de OS |
| Usuario | Usuario | Acesso ao sistema por perfis |

---

## 2. Detalhamento das Entidades

### 2.1 Cliente

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | INTEGER | PK, AUTOINCREMENT, NOT NULL | Identificador único |
| nome | TEXT | NOT NULL, LENGTH >= 2 | Nome completo ou razão social |
| cpf | TEXT | UNIQUE, NOT NULL, formato VÁLIDO | CPF (11 dígitos) |
| rg | TEXT | NULLABLE | RG do cliente |
| telefone | TEXT | NULLABLE | Telefone fixo |
| whatsapp | TEXT | NULLABLE | Número WhatsApp |
| email | TEXT | NULLABLE, formato VÁLIDO | E-mail |
| endereco | TEXT | NULLABLE | Endereço completo |
| observacoes | TEXT | NULLABLE | Observações gerais |
| dataCadastro | TEXT | NOT NULL, ISO 8601 | Data de cadastro (UTC) |
| ativo | INTEGER | NOT NULL, DEFAULT 1 | 1 = ativo, 0 = inativo |

**Relacionamentos:**
- 1:N → Equipamento
- 1:N → OrdemServico

**Índices:**
- UNIQUE INDEX on `cpf`
- INDEX on `nome`

---

### 2.2 Equipamento

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | INTEGER | PK, AUTOINCREMENT, NOT NULL | Identificador único |
| clienteId | INTEGER | FK → Cliente.id, NOT NULL | Cliente proprietário |
| etiqueta | TEXT | UNIQUE, NOT NULL, LENGTH = 5, UPPERCASE | Etiqueta alfanumérica gerada automaticamente |
| tipo | TEXT | NOT NULL | Ex: Desktop, Notebook, Impressora, etc. |
| marca | TEXT | NOT NULL | Marca do equipamento |
| modelo | TEXT | NOT NULL | Modelo do equipamento |
| numeroSerie | TEXT | NULLABLE | Número de série do fabricante |
| observacoes | TEXT | NULLABLE | Observações técnicas |
| dataCadastro | TEXT | NOT NULL, ISO 8601 | Data de cadastro (UTC) |
| ativo | INTEGER | NOT NULL, DEFAULT 1 | 1 = ativo, 0 = inativo |

**Relacionamentos:**
- N:1 → Cliente
- 1:N → OrdemServico

**Índices:**
- UNIQUE INDEX on `etiqueta`
- INDEX on `clienteId`
- INDEX on `tipo`

---

### 2.3 OrdemServico (OS)

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | INTEGER | PK, AUTOINCREMENT, NOT NULL | Identificador único |
| numeroOS | TEXT | UNIQUE, NOT NULL, formato "0001" | Número sequencial da OS |
| clienteId | INTEGER | FK → Cliente.id, NOT NULL | Cliente da OS |
| equipamentoId | INTEGER | FK → Equipamento.id, NOT NULL | Equipamento em serviço |
| status | TEXT | NOT NULL, ENUM | Ver lista de status abaixo |
| dataEntrada | TEXT | NOT NULL, ISO 8601 | Data de abertura da OS |
| dataPrevisao | TEXT | NULLABLE, ISO 8601 | Previsão de conclusão |
| dataConclusao | TEXT | NULLABLE, ISO 8601 | Data de conclusão/entrega |
| observacoes | TEXT | NULLABLE | Observações gerais |

**Status possíveis:**
```
ABERTA → EM_DIAGNOSTICO → AGUARDANDO_APROVACAO → AGUARDANDO_PECA → EM_EXECUCAO → CONCLUIDA → ENTREGUE
                                                                   ↘ CANCELADA
```

**Relacionamentos:**
- N:1 → Cliente
- N:1 → Equipamento
- 1:N → EventoOS
- 1:N → ItemOS
- 1:1 → Inventario

**Índices:**
- UNIQUE INDEX on `numeroOS`
- INDEX on `clienteId`
- INDEX on `equipamentoId`
- INDEX on `status`
- INDEX on `dataEntrada`

---

### 2.4 EventoOS

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | INTEGER | PK, AUTOINCREMENT, NOT NULL | Identificador único |
| osId | INTEGER | FK → OrdemServico.id, NOT NULL | OS associada |
| usuarioId | INTEGER | FK → Usuario.id, NOT NULL | Usuário que registrou |
| dataHora | TEXT | NOT NULL, ISO 8601 | Momento do evento (UTC) |
| descricao | TEXT | NOT NULL, LENGTH >= 1 | Descrição do evento (imutável) |

**Relacionamentos:**
- N:1 → OrdemServico
- N:1 → Usuario

**Índices:**
- INDEX on `osId`
- INDEX on `usuarioId`
- INDEX on `dataHora`

---

### 2.5 Servico

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | INTEGER | PK, AUTOINCREMENT, NOT NULL | Identificador único |
| descricao | TEXT | NOT NULL, LENGTH >= 2 | Descrição do serviço |
| valorPadrao | REAL | NOT NULL, >= 0 | Valor padrão do serviço |
| ativo | INTEGER | NOT NULL, DEFAULT 1 | 1 = ativo, 0 = inativo |

**Relacionamentos:**
- Referenciado por ItemOS (tipoItem = 'SERVICO', referenciaId = id)

**Índices:**
- INDEX on `descricao`

---

### 2.6 Peca

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | INTEGER | PK, AUTOINCREMENT, NOT NULL | Identificador único |
| descricao | TEXT | NOT NULL, LENGTH >= 2 | Descrição da peça |
| fabricante | TEXT | NULLABLE | Fabricante da peça |
| valorReferencia | REAL | NOT NULL, >= 0 | Valor de referência |
| ativo | INTEGER | NOT NULL, DEFAULT 1 | 1 = ativo, 0 = inativo |

**Relacionamentos:**
- Referenciado por ItemOS (tipoItem = 'PECA', referenciaId = id)

**Índices:**
- INDEX on `descricao`

---

### 2.7 ItemOS

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | INTEGER | PK, AUTOINCREMENT, NOT NULL | Identificador único |
| osId | INTEGER | FK → OrdemServico.id, NOT NULL | OS associada |
| tipoItem | TEXT | NOT NULL, ENUM ('SERVICO', 'PECA') | Tipo do item |
| referenciaId | INTEGER | NOT NULL | FK → Servico.id ou Peca.id |
| descricao | TEXT | NOT NULL, LENGTH >= 2 | Descrição do item na OS |
| quantidade | REAL | NOT NULL, > 0 | Quantidade |
| valorUnitario | REAL | NOT NULL, >= 0 | Valor unitário no momento |
| valorTotal | REAL | NOT NULL, >= 0 | quantidade × valorUnitario |

**Relacionamentos:**
- N:1 → OrdemServico
- N:1 → Servico (quando tipoItem = 'SERVICO')
- N:1 → Peca (quando tipoItem = 'PECA')

**Índices:**
- INDEX on `osId`
- INDEX on `tipoItem, referenciaId`

---

### 2.8 Inventario

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | INTEGER | PK, AUTOINCREMENT, NOT NULL | Identificador único |
| osId | INTEGER | FK → OrdemServico.id, UNIQUE, NOT NULL | OS associada (1:1) |
| dataCaptura | TEXT | NOT NULL, ISO 8601 | Momento da captura (UTC) |
| jsonCompleto | TEXT | NOT NULL, JSON válido | Snapshot completo do inventário |

**Relacionamentos:**
- 1:1 → OrdemServico

**Índices:**
- UNIQUE INDEX on `osId`

---

### 2.9 Usuario

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | INTEGER | PK, AUTOINCREMENT, NOT NULL | Identificador único |
| nome | TEXT | NOT NULL, LENGTH >= 2 | Nome do usuário |
| login | TEXT | UNIQUE, NOT NULL, LENGTH >= 3 | Login para autenticação |
| senhaHash | TEXT | NOT NULL | Hash da senha (bcrypt/argon2) |
| perfil | TEXT | NOT NULL, ENUM | Ver lista de perfis abaixo |
| ativo | INTEGER | NOT NULL, DEFAULT 1 | 1 = ativo, 0 = inativo |

**Perfis possíveis:**
```
TECNICO        - Executa serviços, registra eventos
RECEPCIONISTA  - Abre OS, cadastra clientes/equipamentos
PROPRIETARIO   - Acesso total ao sistema
GESTOR         - Relatórios, gestão de catálogo
```

**Relacionamentos:**
- 1:N → EventoOS

**Índices:**
- UNIQUE INDEX on `login`
- INDEX on `perfil`

---

## 3. Regras de Negócio por Entidade

### 3.1 Cliente

1. **CPF único**: Não pode haver dois clientes com o mesmo CPF.
2. **CPF válido**: Deve ser validado por algoritmo de dígitos verificadores.
3. **Soft delete**: Clientes nunca são excluídos; `ativo = 0` indica inativação.
4. **Cliente com OS ativa**: Não pode ser inativado se possuir OS com status diferente de ENTREGUE ou CANCELADA.
5. **Data de cadastro imutável**: Definida no momento da criação, nunca alterada.

### 3.2 Equipamento

1. **Etiqueta automática**: Gerada no momento do cadastro, composta por 5 caracteres alfanuméticos maiúsculos (ex: `A3K9Z`).
2. **Etiqueta única**: Nunca se repete no sistema, mesmo após inativação do equipamento.
3. **Etiqueta imutável**: Uma vez gerada, não pode ser alterada.
4. **Geração segura**: Em caso de colisão, gerar nova etiqueta até obter unicidade.
5. **Equipamento com OS ativa**: Não pode ser inativado se possuir OS com status diferente de ENTREGUE ou CANCELADA.

### 3.3 OrdemServico

1. **Numeração sequencial**: `numeroOS` é gerado sequencialmente (0001, 0002, 0003...).
2. **Numeração nunca reutiliza**: Uma OS cancelada mantém seu número para sempre.
3. **Numeração nunca reinicia**: A sequência é monotônica crescente.
4. **Status válido**: Apenas os 8 status definidos são aceitos.
5. **Transição de status**: Deve seguir o fluxo definido (ver diagrama de estados).
6. **Data de conclusão**: Preenchida automaticamente quando status = CONCLUIDA ou ENTREGUE.
7. **OS não editável após CONCLUIDA/ENTREGUE/CANCELADA**: Apenas leitura.
8. **Equipamento deve pertencer ao cliente**: Validação de integridade referencial.

### 3.4 EventoOS

1. **Imutabilidade total**: Eventos nunca são editados ou excluídos.
2. **Apenas adição**: Operação de escrita é exclusivamente CREATE.
3. **Ordenação cronológica**: Eventos são exibidos em ordem de `dataHora`.
4. **Rastreabilidade**: Todo evento registra qual usuário o criou.
5. **Descrição obrigatória**: Não permite eventos vazios.

### 3.5 Servico / Peca

1. **Soft delete**: Itens nunca são excluídos; `ativo = 0` indica descontinuação.
2. **Valor não negativo**: `valorPadrao` e `valorReferencia` devem ser >= 0.
3. **Itens históricos**: Mesmo desativados, permanecem referenciáveis em OSs antigas.
4. **Unicidade de descrição**: Evitar duplicatas no catálogo (validação sugerida).

### 3.6 ItemOS

1. **TipoItem válido**: Deve ser 'SERVICO' ou 'PECA'.
2. **Referência válida**: `referenciaId` deve apontar para um item ativo do tipo correto.
3. **Valor congelado**: `valorUnitario` é capturado no momento da adição, independente de alterações futuras no catálogo.
4. **Cálculo automático**: `valorTotal = quantidade × valorUnitario`.
5. **Quantidade positiva**: Deve ser maior que zero.

### 3.7 Inventario

1. **Uma captura por OS**: Relacionamento 1:1 com OS.
2. **Snapshot imutável**: O `jsonCompleto` é um snapshot no momento da captura.
3. **JSON válido**: Deve ser um JSON bem formado.
4. **Data automática**: `dataCaptura` é definida no momento da gravação.

### 3.8 Usuario

1. **Login único**: Não pode haver dois usuários com o mesmo login.
2. **Senha segura**: Armazenar apenas hash (bcrypt ou argon2).
3. **Perfil válido**: Apenas os 4 perfis definidos são aceitos.
4. **Usuário ativo**: Apenas usuários com `ativo = 1` podem autenticar.
5. **Impedir auto-desativação**: Usuário logado não pode desativar a si mesmo.
6. **Único proprietário**: Deve existir exatamente um usuário com perfil PROPRIETARIO.

---

## 4. Invariantes e Validações

### 4.1 Invariantes Globais

| ID | Invariante | Regra |
|----|-----------|-------|
| INV-001 | Unicidade de etiqueta | Nenhuma etiqueta pode se repetir na tabela Equipamento |
| INV-002 | Unicidade de CPF | Nenhum CPF pode se repetir na tabela Cliente |
| INV-003 | Unicidade de login | Nenhum login pode se repetir na tabela Usuario |
| INV-004 | Unicidade de numeroOS | Nenhum numeroOS pode se repetir na tabela OrdemServico |
| INV-005 | Integridade referencial | Toda FK deve referenciar um registro existente |
| INV-006 | Sequência numérica | numeroOS é estritamente crescente |
| INV-007 | Eventos imutáveis | Nenhum EventoOS pode ter UPDATE ou DELETE |
| INV-008 | Inventário único | Cada OS possui no máximo um Inventario |

### 4.2 Validações de Campo

| Campo | Validação |
|-------|-----------|
| cpf | Formato XXX.XXX.XXX-XX + dígitos verificadores |
| email | Formato RFC 5322 simplificado |
| telefone | Apenas dígitos, 10 ou 11 caracteres |
| whatsapp | Apenas dígitos, 10 ou 11 caracteres |
| etiqueta | Regex `^[A-Z0-9]{5}$` |
| numeroOS | Regex `^\d{4,}$` (mínimo 4 dígitos, zeros à esquerda) |
| senhaHash | Minimo 60 caracteres (bcrypt) |
| jsonCompleto | Deve ser parseável como JSON válido |

### 4.3 Validações de Transição de Status

```
ABERTA                  → EM_DIAGNOSTICO | CANCELADA
EM_DIAGNOSTICO          → AGUARDANDO_APROVACAO | CANCELADA
AGUARDANDO_APROVACAO    → AGUARDANDO_PECA | EM_EXECUCAO | CANCELADA
AGUARDANDO_PECA         → EM_EXECUCAO | CANCELADA
EM_EXECUCAO             → CONCLUIDA | CANCELADA
CONCLUIDA               → ENTREGUE
ENTREGUE                → (terminal)
CANCELADA               → (terminal)
```

### 4.4 Validações de Negócio Transversais

| ID | Validação |
|----|-----------|
| VN-01 | Um equipamento só pode ter uma OS ativa por vez (status ≠ ENTREGUE/CANCELADA) |
| VN-02 | A dataPrevisao deve ser >= dataEntrada |
| VN-03 | A dataConclusao deve ser >= dataEntrada |
| VN-04 | Não é possível adicionar itens a uma OS com status CONCLUIDA/ENTREGUE/CANCELADA |
| VN-05 | Não é possível registrar eventos em uma OS com status ENTREGUE/CANCELADA |
| VN-06 | O cliente da OS deve ser o mesmo cliente do equipamento |
| VN-07 | Ao menos um serviço ou peça deve ser adicionado antes de EM_EXECUCAO |
| VN-08 | O inventário deve ser capturado antes do status CONCLUIDA |

### 4.5 Restrições de Acesso por Perfil

| Operação | TECNICO | RECEPCIONISTA | PROPRIETARIO | GESTOR |
|----------|---------|---------------|-------------|--------|
| Cadastrar cliente | ✗ | ✓ | ✓ | ✓ |
| Cadastrar equipamento | ✗ | ✓ | ✓ | ✓ |
| Abrir OS | ✗ | ✓ | ✓ | ✓ |
| Diagnosticar | ✓ | ✗ | ✓ | ✗ |
| Aprovar serviço | ✗ | ✗ | ✓ | ✗ |
| Executar serviço | ✓ | ✗ | ✓ | ✗ |
| Registrar evento | ✓ | ✓ | ✓ | ✓ |
| Gerenciar catálogo | ✗ | ✗ | ✓ | ✓ |
| Gerenciar usuários | ✗ | ✗ | ✓ | ✗ |
| Visualizar relatórios | ✗ | ✗ | ✓ | ✓ |
| Cancelar OS | ✗ | ✓ | ✓ | ✓ |

---

## 5. Estrutura de Dados SQLite (DDL de Referência)

```sql
CREATE TABLE cliente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL CHECK(LENGTH(nome) >= 2),
    cpf TEXT UNIQUE NOT NULL,
    rg TEXT,
    telefone TEXT,
    whatsapp TEXT,
    email TEXT,
    endereco TEXT,
    observacoes TEXT,
    dataCadastro TEXT NOT NULL DEFAULT (datetime('now')),
    ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN (0, 1))
);

CREATE TABLE equipamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clienteId INTEGER NOT NULL REFERENCES cliente(id),
    etiqueta TEXT UNIQUE NOT NULL CHECK(LENGTH(etiqueta) = 5 AND etiqueta GLOB '[A-Z0-9]*'),
    tipo TEXT NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    numeroSerie TEXT,
    observacoes TEXT,
    dataCadastro TEXT NOT NULL DEFAULT (datetime('now')),
    ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN (0, 1))
);

CREATE TABLE ordem_servico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numeroOS TEXT UNIQUE NOT NULL,
    clienteId INTEGER NOT NULL REFERENCES cliente(id),
    equipamentoId INTEGER NOT NULL REFERENCES equipamento(id),
    status TEXT NOT NULL CHECK(status IN ('ABERTA','EM_DIAGNOSTICO','AGUARDANDO_APROVACAO','AGUARDANDO_PECA','EM_EXECUCAO','CONCLUIDA','ENTREGUE','CANCELADA')),
    dataEntrada TEXT NOT NULL DEFAULT (datetime('now')),
    dataPrevisao TEXT,
    dataConclusao TEXT,
    observacoes TEXT
);

CREATE TABLE evento_os (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    osId INTEGER NOT NULL REFERENCES ordem_servico(id),
    usuarioId INTEGER NOT NULL REFERENCES usuario(id),
    dataHora TEXT NOT NULL DEFAULT (datetime('now')),
    descricao TEXT NOT NULL CHECK(LENGTH(descricao) >= 1)
);

CREATE TABLE servico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descricao TEXT NOT NULL CHECK(LENGTH(descricao) >= 2),
    valorPadrao REAL NOT NULL CHECK(valorPadrao >= 0),
    ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN (0, 1))
);

CREATE TABLE peca (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descricao TEXT NOT NULL CHECK(LENGTH(descricao) >= 2),
    fabricante TEXT,
    valorReferencia REAL NOT NULL CHECK(valorReferencia >= 0),
    ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN (0, 1))
);

CREATE TABLE item_os (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    osId INTEGER NOT NULL REFERENCES ordem_servico(id),
    tipoItem TEXT NOT NULL CHECK(tipoItem IN ('SERVICO', 'PECA')),
    referenciaId INTEGER NOT NULL,
    descricao TEXT NOT NULL CHECK(LENGTH(descricao) >= 2),
    quantidade REAL NOT NULL CHECK(quantidade > 0),
    valorUnitario REAL NOT NULL CHECK(valorUnitario >= 0),
    valorTotal REAL NOT NULL CHECK(valorTotal >= 0)
);

CREATE TABLE inventario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    osId INTEGER UNIQUE NOT NULL REFERENCES ordem_servico(id),
    dataCaptura TEXT NOT NULL DEFAULT (datetime('now')),
    jsonCompleto TEXT NOT NULL CHECK(json_valid(jsonCompleto))
);

CREATE TABLE usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL CHECK(LENGTH(nome) >= 2),
    login TEXT UNIQUE NOT NULL CHECK(LENGTH(login) >= 3),
    senhaHash TEXT NOT NULL,
    perfil TEXT NOT NULL CHECK(perfil IN ('TECNICO','RECEPCIONISTA','PROPRIETARIO','GESTOR')),
    ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN (0, 1))
);
```

---

## 6. Considerações Técnicas

### 6.1 Estratégia de Geração de Etiqueta

- Gerar string aleatória de 5 caracteres de `[A-Z0-9]`.
- Verificar unicidade na tabela.
- Em caso de colisão, regenerar (máximo 10 tentativas).
- Se esgotar tentativas, ampliar para 6 caracteres (política de contorno).

### 6.2 Estratégia de Numeração de OS

- Armazenar contador em tabela de configuração ou usar `MAX(numeroOS) + 1`.
- Usar transação para garantir atomicidade.
- Formatar com zeros à esquerda: `%04d` (expansível para mais dígitos).

### 6.3 Event Sourcing (Eventos)

- A tabela `evento_os` funciona como log de auditoria.
- Pode ser estendida para suportar reconstrução histórica completa.
- Nunca aplicar DELETE ou UPDATE nesta tabela.

### 6.4 Inventário como JSON

- O campo `jsonCompleto` armazena snapshot completo do hardware.
- Útil para rastrear alterações de configuração durante o serviço.
- Schema do JSON deve ser versionado para compatibilidade.

### 6.5 Segurança Offline

- Senhas com hash bcrypt (custo 12).
- SQLite com WAL mode para performance.
- Sem dependências de rede.

---

*Documento criado em 2026-06-24. Versão 1.0.*
