# OS.Tech - Estrategia de Logs e Auditoria

## Visao Geral

O OS.Tech e um sistema 100% offline (Electron + SQLite). A estrategia de logs deve ser **local-first**, **leve** e **privada**, garantindo rastreabilidade completa sem depender de servicos externos e respeitando a LGPD (dados do cliente final nunca sao expostos em logs).

---

## 1. Estrutura da Tabela de Logs no SQLite

```sql
CREATE TABLE IF NOT EXISTS logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    dataHora        TEXT    NOT NULL DEFAULT (datetime('now')),  -- ISO 8601 UTC
    nivel           TEXT    NOT NULL CHECK (nivel IN ('INFO', 'WARN', 'ERROR')),
    categoria       TEXT    NOT NULL,                            -- ex: AUTH, CLIENTE, OS, BACKUP, SISTEMA
    acao            TEXT    NOT NULL,                            -- ex: LOGIN, CREATE_CLIENTE, CHANGE_STATUS
    descricao       TEXT    NOT NULL,                            -- human-readable
    usuarioId       INTEGER,                                    -- nullable (erros de sistema podem nao ter usuario)
    dadosContexto   TEXT,                                       -- JSON serializado (dados relevantes, sem PII sensivel)
    ip              TEXT NULL,                                  -- sempre NULL no modo offline; reservo para futuro
    maquinaId       TEXT NULL,                                  -- identificador local da maquina (hash do hostname)
    versaoApp       TEXT NULL,                                  -- versao do OS.Tech no momento do evento
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_logs_dataHora ON logs(dataHora);
CREATE INDEX IF NOT EXISTS idx_logs_nivel    ON logs(nivel);
CREATE INDEX IF NOT EXISTS idx_logs_categoria ON logs(categoria);
CREATE INDEX IF NOT EXISTS idx_logs_usuario   ON logs(usuarioId);
CREATE INDEX IF NOT EXISTS idx_logs_acao      ON logs(acao);
```

### Justificativas

| Decisao | Motivo |
|---------|--------|
| `dataHora` em UTC (`datetime('now')`) | Evita ambiguidade de fuso; converte para local na exibicao |
| `dadosContexto` como JSON | Flexibilidade para campos variaveis por evento sem schema rigido |
| `usuarioId` nullable | Permite registrar erros de sistema antes do login |
| `maquinaId` como hash | Suporta multiplas maquinas sem expor hostname real |
| Indices separados | Consultas por data, nivel e categoria sao as mais frequentes na UI |

---

## 2. Niveis de Log

| Nivel | Cor na UI | Quando usar |
|-------|-----------|-------------|
| **INFO**  | Azul / branco | Operacoes de sucesso: login, criacao, alteracao, backup OK |
| **WARN**  | Amarelo | Situacoes recuperaveis: tentativa de login invalida, backup com pendencias, validacao falhou mas o sistema seguiu |
| **ERROR** | Vermelho | Falhas que impedem a operacao: erro de banco, restauracao falhou, excecao nao tratada |

### Mapeamento de eventos por nivel

```
INFO
  - Login bem-sucedido
  - Cliente criado
  - Cliente alterado
  - OS criada
  - Mudanca de status (com sucesso)
  - Backup concluido
  - Restauracao concluida
  - Inventario capturado

WARN
  - Tentativa de login (senha incorreta)
  - Validacao de dados rejeitada pelo usuario
  - Backup agendado nao executado (ex: app fechado)
  - Restauracao com aviso (backup de versao anterior)
  - Operacao demorada (> 3s conforme NFR)

ERROR
  - Excecao nao tratada
  - Falha de escrita no SQLite
  - Falha ao gerar PDF
  - Falha ao restaurar backup
  - Erro de permissao de arquivo
  - Corrupcao de dados detectada
```

---

## 3. Onde Armazenar Logs

### 3.1 Banco SQLite (principal)

- Tabela `logs` no proprio arquivo `ostech.db`
- Vantagem: consultas estruturadas, filtros, exportacao
- Acesso: funcao dedicada no Electron (IPC)

### 3.2 Arquivo de texto (secundario / fallback)

```
%APPDATA%/OS.Tech/logs/
    os-tech-2026-06-24.log      <-- arquivo diario
    os-tech-2026-06-23.log
    ...
```

**Formato do arquivo:**

```
[2026-06-24T14:32:05.123Z] [INFO]  [AUTH]       LOGIN | usuario_id=1 | tecnico=joao.silva
[2026-06-24T14:33:10.456Z] [INFO]  [CLIENTE]    CREATE_CLIENTE | cliente_id=42 | nome=Maria Silva
[2026-06-24T14:35:00.789Z] [WARN]  [AUTH]       LOGIN_FAILED | login_digitado=admin | motivo=senha_incorreta
[2026-06-24T14:40:22.012Z] [ERROR] [SISTEMA]    DB_WRITE_FAIL | tabela=clientes | erro=UNIQUE constraint failed
```

**Quando o arquivo e usado:**
- Se o banco estiver corrompido, o arquivo ainda preserva os logs
- Exportacao rapida (CSV / texto) sem precisar abrir o banco
- Debug em campo (usuario pode anexar ao chamado)

### 3.3 Decisao de escrita

```
Evento ocorre
    |
    v
+--> Grava na tabela logs (SQLite)
    |
    +--> Em caso de falha no SQLite, grava no arquivo .log
    |
    +--> Em caso de falha no arquivo, exibe toast de erro no app
```

---

## 4. Rotacao de Logs

### 4.1 Limites

| Recurso | Limite | Acao ao atingir |
|---------|--------|-----------------|
| Linhas na tabela `logs` | 100.000 registros | Apaga os mais antigos mantendo 50.000 |
| Arquivo `.log` diario | 5 MB | Cria novo arquivo com data do dia |
| Arquivos `.log` no diretorio | 30 dias | Remove arquivos com mais de 30 dias |
| Espaco total em disco (logs) | 50 MB | Alerta o usuario e para de gravar novos logs antigos |

### 4.2 Estrategia de limpeza

```sql
-- Executado a cada inicializacao do app (e uma vez por dia)
DELETE FROM logs
WHERE id NOT IN (
    SELECT id FROM logs
    ORDER BY dataHora DESC
    LIMIT 50000
);
```

```typescript
// Limpeza de arquivos (executada no main process)
const logDir = path.join(app.getPath('appData'), 'OS.Tech', 'logs');
const files = await fs.readdir(logDir);
const now = Date.now();
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

for (const file of files) {
    const filePath = path.join(logDir, file);
    const stat = await fs.stat(filePath);
    if (now - stat.mtimeMs > THIRTY_DAYS) {
        await fs.unlink(filePath);
    }
}
```

### 4.3 Backup inclui logs

Conforme PRD (secao 15), o backup em ZIP inclui o banco de dados (que contem a tabela `logs`). A restauracao tambem restaura os logs.

---

## 5. Como o Usuario Visualiza Logs

### 5.1 Tela: "Auditoria" (menu lateral)

```
+----------------------------------------------------------+
|  AUDITORIA                                    [Exportar]  |
+----------------------------------------------------------+
| Filtros:                                                 |
|   Nivel: [Todos v]   Categoria: [Todos v]   Busca: [___] |
|   Data: [2026-06-01] a [2026-06-24]      [Filtrar]       |
+----------------------------------------------------------+
| Data/Hora         | Nivel | Categoria | Acao | Usuario   |
| 2026-06-24 14:32  | INFO  | AUTH      | LOGIN| joao      |
| 2026-06-24 14:33  | INFO  | CLIENTE   | Criar| joao      |
| 2026-06-24 14:35  | WARN  | AUTH      | LOGN | ---       |
| 2026-06-24 14:40  | ERROR | SISTEMA   | DB   | ---       |
+----------------------------------------------------------+
| [Ver detalhes]                                           |
+----------------------------------------------------------+
```

### 5.2 Detalhes do evento (modal)

Ao clicar em uma linha:

```
+---------------------------------------------+
| Evento #1234                                 |
+---------------------------------------------+
| Data:       24/06/2026 14:32:05              |
| Nivel:      INFO                             |
| Categoria:  AUTH                             |
| Acao:       LOGIN                            |
| Usuario:    joao.silva (ID: 1)               |
| Maquina:    a3f2b... (hash)                  |
| Versao:     1.2.0                            |
|                                             |
| Contexto:                                   |
| {                                           |
|   "login": "joao.silva",                    |
|   "perfil": "tecnico",                       |
|   "sessao_id": "abc-123"                    |
| }                                           |
+---------------------------------------------+
```

### 5.3 Exportacao

- **CSV**: exporta os logs filtrados
- **JSON**: exporta os logs filtrados (incluindo `dadosContexto`)
- **Arquivo .log**: copia o arquivo de texto bruto

### 5.4 Alertas visiveis

- Badge de contagem de erros na barra lateral (laranja/vermelho)
- Toast de notificacao para ERRORs criticos

---

## 6. Formato dos Logs

### 6.1 Formato estruturado (JSON interno)

```json
{
    "id": 1234,
    "dataHora": "2026-06-24T14:32:05.123Z",
    "nivel": "INFO",
    "categoria": "CLIENTE",
    "acao": "CREATE_CLIENTE",
    "descricao": "Cliente Maria Silva cadastrado com sucesso",
    "usuarioId": 1,
    "dadosContexto": {
        "clienteId": 42,
        "nome": "Maria Silva",
        "cidade": "Sao Paulo"
    },
    "maquinaId": "a3f2b9c1",
    "versaoApp": "1.2.0"
}
```

### 6.2 Formato do arquivo .log (texto)

```
[ISO8601] [NIVEL]  [CATEGORIA]  ACAO | campo1=valor1 | campo2=valor2
```

Regras:
- Campos com espacos usam aspas: `nome="Maria Silva"`
- Dados sensiveis nunca aparecem (ver secao 7)
- Pipe `|` como separador

### 6.3 Categorias e Acoes validas

| Categoria | Acoes |
|-----------|-------|
| AUTH | `LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `SESSION_EXPIRED` |
| CLIENTE | `CREATE_CLIENTE`, `UPDATE_CLIENTE`, `DELETE_CLIENTE` |
| OS | `CREATE_OS`, `UPDATE_OS`, `CHANGE_STATUS`, `ADD_EVENTO`, `DELETE_OS` |
| EQUIPAMENTO | `CREATE_EQUIPAMENTO`, `UPDATE_EQUIPAMENTO` |
| BACKUP | `BACKUP_START`, `BACKUP_DONE`, `BACKUP_FAIL` |
| RESTAURACAO | `RESTORE_START`, `RESTORE_DONE`, `RESTORE_FAIL`, `RESTORE_VALIDATE` |
| SISTEMA | `APP_START`, `APP_CLOSE`, `DB_ERROR`, `PDF_ERROR`, `INVENTARIO_CAPTURA` |

---

## 7. Privacidade e Seguranca

### 7.1 O que **NAO** registrar (absolutamente proibido)

| Dado | Motivo |
|------|--------|
| Senha (plain text ou hash) | Seguranca - nunca registrar credenciais |
| CPF completo | LGPD - dado pessoal sensivel |
| RG completo | LGPD - dado pessoal sensivel |
| Endereco completo | LGPD - dado pessoal |
| Numero de serie do equipamento | Pode ser usado para identificacao indireta |
| Token / chave de criptografia | Seguranca |
| Conteudo de observacoes livres | Pode conter dados pessoais do cliente final |

### 7.2 O que registrar com cautela

| Dado | Como registrar |
|------|----------------|
| Nome do cliente | Apenas nos logs de auditoria (nao em debug) |
| ID do cliente/OS | Sempre registrar (chave tecnica, nao e PII) |
| Login do usuario | Sempre registrar (e o identificador de sessao) |
| Nome do tecnico | Sempre registrar (responsavel pela acao) |
| Cidade/UF | Apenas se necessario para auditoria |

### 7.3 Regra pratica

> **Se o dado permite identificar uma pessoa fisica do cliente final, NAO va para o log.**
> **Se o dado e apenas tecnico (ID, etiqueta, numero OS), va para o log.**

### 7.4 Criptografia

- A tabela `logs` nao usa criptografia extra (SQLite ja esta no disco local do usuario)
- Se o usuario ativar criptografia no nivel do disco (BitLocker), os logs estao protegidos
- O arquivo `.log` segue a mesma politica

### 7.5 Retencao e LGPD

- Logs sao dados operacionais, nao dados pessoais do cliente final
- A limpeza automatica (30 dias) garante retencao minima
- O usuario pode exportar e apagar logs manualmente pela UI
- Logs de auditoria podem ser retidos por mais tempo se o usuario configurar

---

## 8. Implementacao Tecnica (Electron)

### 8.1 Servico de logs (main process)

```typescript
// src/main/services/logService.ts

interface LogEntry {
    nivel: 'INFO' | 'WARN' | 'ERROR';
    categoria: string;
    acao: string;
    descricao: string;
    usuarioId?: number;
    dadosContexto?: Record<string, unknown>;
}

class LogService {
    async registrar(entry: LogEntry): Promise<void> {
        // 1. Grava no SQLite
        await db.insert('logs', {
            ...entry,
            dadosContexto: JSON.stringify(entry.dadosContexto || {}),
            maquinaId: getMachineHash(),
            versaoApp: app.getVersion(),
        });

        // 2. Grava no arquivo .log (fallback)
        await this.escreverArquivo(entry);

        // 3. Verifica rotacao
        await this.verificarRotacao();
    }
}
```

### 8.2 Exemplo de uso no fluxo de login

```typescript
// No controlador de autenticacao
async function login(login: string, senha: string) {
    const usuario = await auth.verificar(login, senha);

    if (!usuario) {
        await logService.registrar({
            nivel: 'WARN',
            categoria: 'AUTH',
            acao: 'LOGIN_FAILED',
            descricao: `Falha de login para o usuario "${login}"`,
            dadosContexto: { login, motivo: 'senha_incorreta' },
        });
        throw new Error('Credenciais invalidas');
    }

    await logService.registrar({
        nivel: 'INFO',
        categoria: 'AUTH',
        acao: 'LOGIN',
        descricao: `Login bem-sucedido: ${usuario.nome}`,
        usuarioId: usuario.id,
        dadosContexto: { login: usuario.login, perfil: usuario.perfil },
    });

    return usuario;
}
```

### 8.3 IPC para o renderer acessar logs

```typescript
// src/main/ipc/logHandlers.ts
ipcMain.handle('logs:listar', async (_, filtros) => {
    return await logService.listar(filtros);
});

ipcMain.handle('logs:exportar', async (_, formato, filtros) => {
    return await logService.exportar(formato, filtros);
});
```

---

## 9. Resumo das Decisoes

| Decisao | Escolha |
|---------|---------|
| Armazenamento primario | SQLite (tabela `logs`) |
| Armazenamento secundario | Arquivo `.log` diario em `%APPDATA%` |
| Niveis | INFO, WARN, ERROR |
| Rotacao | 100k linhas / 30 dias / 5MB por arquivo |
| Fuso horario | UTC no armazenamento, local na exibicao |
| Dados sensiveis | Nunca registrar (senha, CPF, RG, endereco) |
| Exportacao | CSV, JSON, .log |
| UI | Tela "Auditoria" com filtros, detalhes e alertas |
| LGPD | Logs contem apenas dados tecnicos (IDs, acoes) |

---

## 10. Checklist de Implementacao

- [ ] Criar migracao Prisma para tabela `logs`
- [ ] Implementar `LogService` no main process
- [ ] Registrar eventos de AUTH (login, logout, falha)
- [ ] Registrar eventos de CLIENTE (create, update, delete)
- [ ] Registrar eventos de OS (create, status change, delete)
- [ ] Registrar eventos de BACKUP e RESTAURACAO
- [ ] Registrar eventos de SISTEMA (start, close, erros)
- [ ] Implementar rotacao automatica
- [ ] Criar tela "Auditoria" no renderer
- [ ] Implementar exportacao (CSV/JSON)
- [ ] Garantir que senhas e PII nunca sejam logadas
- [ ] Testar cenario de banco corrompido (fallback para arquivo)
