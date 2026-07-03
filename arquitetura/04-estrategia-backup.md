# Estratégia de Backup — OS.Tech

> **Versão:** 1.0
> **Data:** 2026-06-24
> **Autor:** Engenharia de Software
> **Contexto:** Aplicativo desktop Electron + SQLite, 100% offline

---

## 1. Visão Geral

A estratégia de backup do OS.Tech foi projetada para garantir **zero perda de dados** em ambiente totalmente offline. O formato ZIP foi escolhido por ser nativo do sistema operacional, permitir compressão sem perdas e facilitar inspeção manual pelo usuário caso necessário.

O sistema deve suportar dois modos de backup:
- **Backup Manual:** disparado explicitamente pelo usuário a qualquer momento.
- **Backup Automático:** disparado por eventos do ciclo de vida da aplicação e por agendamento diário.

---

## 2. Estrutura do Arquivo ZIP de Backup

Todo backup ZIP deve conter a estrutura interna abaixo, com metadados versionados para permitir migrações futuras durante a restauração.

```
OSTech_Backup_20260624_143052.zip
│
├── manifest.json                    # Metadados do backup (obrigatório)
├── database/
│   └── os_tech.db                   # Cópia completa do banco SQLite
├── inventories/
│   ├── inventario_001.json          # JSON completo de cada inventário
│   ├── inventario_002.json
│   └── ...
├── settings/
│   ├── app_config.json              # Configurações da aplicação
│   └── user_preferences.json        # Preferências do usuário
├── logs/
│   ├── log_2026-06-24.log           # Logs do dia
│   ├── log_2026-06-23.log
│   └── ...
└── checksums.sha256                 # Hashes SHA-256 de cada arquivo
```

### 2.1. Formato do `manifest.json`

```json
{
  "backup_version": "1.0",
  "app_version": "1.0.0",
  "created_at": "2026-06-24T14:30:52-03:00",
  "backup_type": "automatic | manual",
  "device_id": "uuid-do-dispositivo",
  "contents": {
    "database": {
      "file": "database/os_tech.db",
      "size_bytes": 10485760,
      "sha256": "a1b2c3d4e5f6...",
      "page_count": 2560,
      "wal_checkpointed": true
    },
    "inventories": {
      "count": 42,
      "files": ["inventories/inventario_001.json", "..."],
      "total_size_bytes": 524288
    },
    "settings": {
      "files": ["settings/app_config.json", "settings/user_preferences.json"],
      "total_size_bytes": 8192
    },
    "logs": {
      "count": 7,
      "files": ["logs/log_2026-06-24.log", "..."],
      "total_size_bytes": 102400
    }
  },
  "integrity": {
    "manifest_sha256": "f6e5d4c3b2a1...",
    "signature": "opcional-para-futura-assinatura-digital"
  }
}
```

### 2.2. Formato do `checksums.sha256`

```
a1b2c3d4e5f6...  database/os_tech.db
f6e5d4c3b2a1...  inventories/inventario_001.json
1234abcd5678ef...  settings/app_config.json
9876543210ab...  logs/log_2026-06-24.log
```

---

## 3. Quando o Backup Automático Deve Ocorrer

O backup automático deve ser disparado pelos seguintes eventos, em ordem de prioridade:

| Evento | Prioridade | Ação |
|--------|-----------|------|
| **Fechamento da aplicação** | Alta | Backup silencioso antes de encerrar |
| **A cada 4 horas de uso contínuo** | Média | Backup silencioso em background (após inatividade de 30s) |
| **Diário (horário configurável, padrão: 23:00)** | Média | Backup completo ao atingir o horário |
| **Após mudança de status de OS** | Baixa | Backup incremental do banco apenas (debounce de 5 min) |
| **Após criar/editar inventário** | Baixa | Backup incremental do banco apenas (debounce de 5 min) |

### 3.1. Regras de Debounce

- Eventos de "mudança de dados" (criação/edição de OS, cliente, equipamento) acumulam-se e disparam **um único backup** após 5 minutos de inatividade.
- Isso evita explosão de backups durante uso intenso.

### 3.2. Controle de Execução

- Apenas **um backup automático por vez**. Se o usuário disparar um backup manual enquanto um automático está em andamento, o manual entra na fila e executa após o atual.
- Backups automáticos em background **não bloqueiam a UI**. Uma notificação discreta (toast) deve informar quando concluir.

---

## 4. Onde Salvar Backups

### 4.1. Local Padrão

| Sistema Operacional | Caminho Padrão |
|---------------------|----------------|
| **Windows** | `%USERPROFILE%\Documents\OS.Tech\backups\` |
| **macOS** | `~/Documents/OS.Tech/backups/` |
| **Linux** | `~/.ostech/backups/` |

### 4.2. Local Personalizado

O usuário pode configurar um diretório alternativo via interface de configurações. Caso configurado, o novo caminho substitui o padrão.

### 4.3. Regras de Armazenamento

- Manter no máximo **30 backups automáticos** no diretório. Ao exceder, o mais antigo é removido automaticamente (FIFO).
- Backups manuais **nunca são removidos automaticamente**.
- Alertar o usuário quando o espaço em disco for inferior a 500 MB no diretório de backups.

### 4.4. Cópia Externa (Opcional)

O usuário pode configurar um segundo destino (HD externo, pasta de rede mapeada) para cópia automática após cada backup. Se o destino estiver indisponível, o backup local é mantido e um alerta é exibido.

---

## 5. Como Validar a Integridade do Backup

A validação deve ocorrer **antes de qualquer restauração** e incluir as seguintes verificações:

### 5.1. Verificações Estruturais

1. **ZIP válido:** Verificar se o arquivo ZIP não está corrompido (todos os entries podem ser lidos).
2. **Manifest presente:** Verificar existência e parse válido do `manifest.json`.
3. **Versão compatível:** Verificar se `backup_version` é compatível com a versão atual do app.
4. **Arquivos obrigatórios presentes:** Confirmar que `database/os_tech.db` existe dentro do ZIP.

### 5.2. Verificações de Integridade Criptográfica

5. **SHA-256 por arquivo:** Para cada arquivo listado em `checksums.sha256`, calcular o hash e comparar com o esperado.
6. **Manifest íntegro:** Verificar o hash do próprio `manifest.json` contra o campo `integrity.manifest_sha256`.

### 5.3. Verificações de Banco de Dados

7. **SQLite integrity_check:** Após extrair o banco para pasta temporária, executar `PRAGMA integrity_check;` e confirmar resultado `ok`.
8. **SQLite foreign_key_check:** Executar `PRAGMA foreign_key_check;` e garantir que não há violações.
9. **Page count válido:** Verificar que `page_count` no manifest corresponde ao banco extraído.
10. **Quick check:** Executar `PRAGMA quick_check;` como validação adicional.

### 5.4. Resultado da Validação

| Status | Condição |
|--------|----------|
| **VÁLIDO** | Todas as verificações passaram |
| **AVISO** | ZIP válido mas com avisos (versão diferente, logs ausentes) |
| **INVÁLIDO** | Qualquer falha de hash, banco corrompido, ou arquivo ausente |

---

## 6. Processo de Restauração Passo a Passo

```
┌─────────────────────────────────────────────────┐
│  PASSO 1 — Seleção do Backup                    │
│  - Listar backups disponíveis (data, tipo,      │
│    tamanho, status de validação)                │
│  - Usuário seleciona um backup específico        │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  PASSO 2 — Validação de Integridade             │
│  - Executar todas as verificações da Seção 5    │
│  - Exibir resultado: VÁLIDO / AVISO / INVÁLIDO  │
│  - Se INVÁLIDO: impedir restauração              │
│  - Se AVISO: permitir com confirmação do usuário │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  PASSO 3 — Backup do Estado Atual               │
│  - Criar backup automático de segurança do       │
│    estado atual antes de sobrescrever           │
│  - Isso permite "desfazer" a restauração        │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  PASSO 4 — Fechar Conexões e Parar Serviços     │
│  - Fechar todas as conexões SQLite ativas       │
│  - Parar qualquer operação em andamento          │
│  - Notificar usuário para não fechar o app       │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  PASSO 5 — Restaurar Banco de Dados             │
│  - Copiar database/os_tech.db para o diretório  │
│    de dados da aplicação                         │
│  - Executar PRAGMA integrity_check no arquivo    │
│    restaurado                                    │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  PASSO 6 — Restaurar Inventários                │
│  - Os inventários já estão contidos no banco     │
│    SQLite (tabela Inventario com jsonCompleto)   │
│  - Se houver JSONs separados no ZIP, importar    │
│    para a tabela                                 │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  PASSO 7 — Restaurar Configurações              │
│  - Sobrescrever app_config.json e               │
│    user_preferences.json                         │
│  - Validar schema das configurações              │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  PASSO 8 — Restaurar Logs (Opcional)            │
│  - Perguntar ao usuário se deseja restaurar     │
│    logs históricos                               │
│  - Se sim, mesclar logs (não sobrescrever)       │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  PASSO 9 — Reinicialização e Verificação        │
│  - Reiniciar conexão com o banco                 │
│  - Executar migrações Prisma (se necessário)     │
│  - Exibir resumo da restauração                  │
│  - Registrar evento de restauração nos logs      │
└─────────────────────────────────────────────────┘
```

### 6.1. Pós-Restauração

- Exibir diálogo de confirmação com resumo: data do backup restaurado, quantidade de OS, clientes, equipamentos.
- Sugerir reinicialização da aplicação se houver mudança de versão do banco.
- Registrar log: `RESTAURACAO_CONCLUIDA | backup: <arquivo> | data: <timestamp> | usuario: <nome>`.

---

## 7. Nomenclatura dos Arquivos de Backup

### 7.1. Padrão de Nome

```
OSTech_Backup_<YYYYMMDD>_<HHMMSS>_<TIPO>_<DISPOSITIVO>.zip
```

### 7.2. Componentes

| Componento | Formato | Exemplo |
|-----------|---------|---------|
| Prefixo | Fixo | `OSTech_Backup_` |
| Data | `YYYYMMDD` | `20260624` |
| Hora | `HHMMSS` | `143052` |
| Tipo | `AUTO` ou `MANUAL` | `AUTO` |
| Dispositivo | Últimos 6 chars do device_id | `a1b2c3` |

### 7.3. Exemplos

```
OSTech_Backup_20260624_143052_AUTO_a1b2c3.zip
OSTech_Backup_20260623_230000_AUTO_a1b2c3.zip
OSTech_Backup_20260620_091530_MANUAL_a1b2c3.zip
```

### 7.4. Backup de Segurança (Pré-Restauração)

Antes de uma restauração, o sistema cria um backup automático com prefixo especial:

```
OSTech_Backup_20260624_143052_PRE_RESTORE_a1b2c3.zip
```

---

## 8. Tratamento de Erros

### 8.1. Erros de Backup

| Erro | Causa | Ação |
|------|-------|------|
| **Sem espaço em disco** | Disco cheio | Alertar usuário, sugerir outro local, não iniciar backup |
| **Banco corrompou durante cópia** | Falha I/O | Tentar novamente 1x; se falhar, alertar e abortar |
| **Permissão negada** | Diretório protegido | Solicitar permissão ou escolher outro local |
| **Arquivo ZIP inválido** | Interrupção durante criação | Deletar arquivo corrompido, tentar novamente |
| **Timeout** | Banco muito grande | Mostrar progresso, permitir cancelamento |

### 8.2. Erros de Restauração

| Erro | Causa | Ação |
|------|-------|------|
| **Backup inválido** | ZIP corrompido | Impedir restauração, sugerir outro backup |
| **Versão incompatível** | Backup de versão futura | Alertar, não permitir restauração |
| **Falha ao restaurar banco** | Permissão ou disco | Restaurar backup de segurança criado no Passo 3 |
| **Conflito de dados** | OS já existente | Sobrescrever (o backup é a fonte da verdade) |
| **App fechou durante restauração** | Crash ou energia | Na reinicialização, detectar restauração incompleta e oferecer continuar ou reverter |

### 8.3. Recuperação de Desastres

Se a restauração falhar e o banco ficar inutilizável:

1. Verificar automaticamente o backup de segurança (`PRE_RESTORE`).
2. Se válido, restaurar automaticamente o estado anterior.
3. Se inválido, oferecer selecionar outro backup da lista.
4. Em último caso, iniciar banco novo (factory reset) com confirmação explícita do usuário.

### 8.4. Logs de Erro

Todos os erros devem ser registrados com:

```
[ERRO] BACKUP_FALHOU | tipo: <AUTO/MANUAL> | codigo: <ERRO_XXX> | descricao: <detalhes> | timestamp: <ISO8601>
[ERRO] RESTAURACAO_FALHOU | passo: <1-9> | codigo: <ERRO_XXX> | descricao: <detalhes> | timestamp: <ISO8601>
```

---

## 9. Fluxo Visual Completo

```
                          ┌──────────────┐
                          │  Usuário ou  │
                          │   Sistema    │
                          └──────┬───────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │  Manual  │ │ Automático│ │ Pré-     │
              │  (UI)    │ │ (Evento)  │ │ Restaur. │
              └────┬─────┘ └────┬─────┘ └────┬─────┘
                   │            │            │
                   └────────────┼────────────┘
                                ▼
                    ┌───────────────────────┐
                    │  Verificar permissões │
                    │  e espaço em disco    │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │  Checkpoint WAL       │
                    │  (SQLite)             │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │  Copiar arquivos      │
                    │  (banco + configs +   │
                    │   logs + inventários) │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │  Gerar SHA-256 de     │
                    │  cada arquivo         │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │  Criar manifest.json  │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │  Empacotar em ZIP     │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │  Validar ZIP criado   │
                    │  (integrity check)    │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │  Salvar no diretório  │
                    │  de backups           │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │  Registrar log        │
                    │  (sucesso ou falha)   │
                    └───────────────────────┘
```

---

## 10. Considerações Técnicas de Implementação

### 10.1. Bibliotecas Recomendadas

| Função | Biblioteca |
|--------|-----------|
| ZIP | `adm-zip` ou `jszip` (Node.js nativo) |
| Hash SHA-256 | `crypto` (Node.js nativo) |
| SQLite checkpoint | `better-sqlite3` com `wal_checkpoint(TRUNCATE)` |
| Agendamento | `node-cron` ou `setInterval` com verificação de horário |

### 10.2. WAL Checkpoint

Antes de copiar o banco SQLite, executar:

```sql
PRAGMA wal_checkpoint(TRUNCATE);
```

Isso garante que o arquivo `.db` contenha todos os dados, sem dependência do arquivo `-wal`.

### 10.3. Criptografia (Futuro)

Para versões futuras, recomenda-se adicionar criptografia AES-256-GCM ao backup, protegido por senha definida pelo usuário. O campo `signature` no manifest já está reservado para essa evolução.

### 10.4. Testes Obrigatórios

- [ ] Backup com banco vazio
- [ ] Backup com banco grande (>100 MB)
- [ ] Backup durante uso simultâneo (concorrência)
- [ ] Restauração em versão diferente do app
- [ ] Restauração de backup corrompido (deve falhar com mensagem clara)
- [ ] Backup com disco quase cheio
- [ ] Backup para diretório sem permissão (deve falhar com mensagem clara)
- [ ] Restauração com app fechado durante processo (recuperação)

---

## 11. Referências no PRD

| Requisito | Seção PRD | Atendimento |
|-----------|-----------|-------------|
| Backup manual | Item 15 | Seção 3 (disparado via UI) |
| Backup automático | Item 15 | Seção 3 (eventos + agendamento) |
| Formato ZIP | Item 15 | Seção 2 (estrutura completa) |
| Conteúdo: Banco SQLite | Item 15 | Seção 2.1 (`database/os_tech.db`) |
| Conteúdo: Inventários | Item 15 | Seção 2.1 (`inventories/`) |
| Conteúdo: Configurações | Item 15 | Seção 2.1 (`settings/`) |
| Conteúdo: Logs | Item 15 | Seção 2.1 (`logs/`) |
| Selecionar backup | Item 16 | Seção 6.1 (Passo 1) |
| Validar integridade | Item 16 | Seção 5 (verificações completas) |
| Restaurar banco | Item 16 | Seção 6.1 (Passo 5) |
| Restaurar inventários | Item 16 | Seção 6.1 (Passo 6) |
| Restaurar configurações | Item 16 | Seção 6.1 (Passo 7) |
| Registro de logs | Item 17 | Seção 8.4 (logging de backup/restauração) |

---

*Fim do documento.*
