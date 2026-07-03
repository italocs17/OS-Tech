# Fase 2 — Banco de Dados: Índice e Status

> **Status:** ✅ Concluída
> **Data:** 2026-06-24

---

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `prisma/schema.prisma` | Schema completo com 10 modelos, 5 enums, índices e relações |
| `prisma/seed.ts` | Dados de teste: 4 usuários, 5 clientes, 8 equipamentos, 8 serviços, 6 peças, 6 OS, 17 eventos, 8 itens, 2 inventários, 10 logs |
| `src/main/database/connection.ts` | Conexão dinâmica (dev vs produção), funções connect/disconnect |
| `src/main/services/etiqueta.service.ts` | Geração de etiquetas únicas [A-Z0-9]{5} |
| `src/main/services/numero-os.service.ts` | Numeração sequencial transacional |
| `src/main/services/log.service.ts` | Serviço de auditoria com rotação automática |
| `src/shared/constants/ipc-channels.ts` | Constantes de canais IPC por domínio |
| `src/shared/types/entities.types.ts` | Interfaces TypeScript de todas as entidades |
| `.env` | Configuração do banco (DATABASE_URL) |
| `.env.example` | Template para novos ambientes |
| `.gitignore` | Exclusões padrão (node_modules, db, logs) |
| `package.json` | Atualizado com scripts e dependências |

---

## Schema Prisma — Resumo

### Enums
- `StatusOS`: ABERTA, EM_DIAGNOSTICO, AGUARDANDO_APROVACAO, AGUARDANDO_PECA, EM_EXECUCAO, CONCLUIDA, ENTREGUE, CANCELADA
- `PerfilUsuario`: TECNICO, RECEPCIONISTA, PROPRIETARIO, GESTOR
- `TipoItem`: SERVICO, PECA
- `NivelLog`: INFO, WARN, ERROR
- `CategoriaLog`: AUTH, CLIENTE, OS, BACKUP, SISTEMA, RESTAURACAO

### Modelos (10)
| Modelo | Tabela | Relacionamentos |
|--------|--------|-----------------|
| Cliente | cliente | 1:N Equipamento, 1:N OrdemServico |
| Equipamento | equipamento | N:1 Cliente, 1:N OrdemServico |
| OrdemServico | ordem_servico | N:1 Cliente/Equipamento, 1:N EventoOS/ItemOS, 1:1 Inventario |
| EventoOS | evento_os | N:1 OrdemServico/Usuario (imutável) |
| Servico | servico | Catálogo |
| Peca | peca | Catálogo |
| ItemOS | item_os | N:1 OrdemServico (polimórfico) |
| Inventario | inventario | 1:1 OrdemServico |
| Usuario | usuario | 1:N EventoOS, 1:N Log |
| Log | log | N:1 Usuario (nullable) |

---

## Serviços Implementados

### EtiquetaService
- `gerarEtiqueta(): Promise<string>` — 5 chars [A-Z0-9], verifica unicidade, max 10 tentativas

### NumeroOSService
- `proximoNumeroOS(): Promise<string>` — Sequencial %04d, transação atômica

### LogService
- `registrar(entry): Promise<void>` — Registra + rotação automática
- `listar(filtros): Promise<Log[]>` — Busca paginada com filtros
- `exportar(formato, filtros): Promise<string>` — CSV ou JSON
- Rotação: mantém 50.000 registros mais recentes

---

## Configuração do Banco

| Ambiente | Caminho |
|----------|---------|
| Desenvolvimento | `prisma/ostech.db` |
| Produção | `app.getPath('userData')/ostech.db` |

---

## Scripts Disponíveis

```bash
npm run prisma:generate   # Gerar Prisma Client
npm run prisma:migrate    # Executar migrações
npm run prisma:seed       # Popular banco com dados de teste
npm run prisma:reset      # Resetar banco (drop + recreate + seed)
npm run db:setup          # Setup completo (generate + migrate + seed)
```

---

## Correções Aplicadas

| Correção | Motivo |
|----------|--------|
| `Perfil` → `PerfilUsuario` no seed | Nome do enum no schema é `PerfilUsuario` |
| Adicionado `bcrypt` no package.json | Dependência necessária para o seed |
| Adicionado `.env` com DATABASE_URL | Prisma precisa da variável de ambiente |
| Adicionado scripts npm | Facilita setup do banco |

---

## Correções Aplicadas (Revisão)

| Correção | Motivo |
|----------|--------|
| `Perfil` → `PerfilUsuario` no seed | Nome do enum no schema é `PerfilUsuario` |
| `ativo: 1` → `ativo: true` em todo seed | Prisma SQLite espera Boolean, não Int |
| `$executeRaw` para logs → `prisma.log.deleteMany()` | Tabela `logs` agora é modelo Prisma |
| `$executeRaw` para insert logs → `prisma.log.createMany()` | Consistência com Prisma Client |
| CPFs do seed substituídos por CPFs válidos | Testes realistas com validação |
| `connection.ts`: `app?.isPackaged` com optional chaining | Evita erro se `app` não estiver pronto |
| Adicionado `bcrypt` no package.json | Dependência do seed |
| Adicionado `.env` com DATABASE_URL | Prisma precisa da variável |
| Adicionado scripts npm | Facilita setup |

## Verificação Final

```
npx prisma validate     → ✅ válido
npx prisma generate      → ✅ Client gerado (v6.19.3)
npx prisma migrate dev   → ✅ Migration aplicada
npx tsx prisma/seed.ts   → ✅ 77 registros inseridos
```

| Tabela | Registros |
|--------|-----------|
| usuario | 4 |
| cliente | 5 |
| equipamento | 8 |
| servico | 8 |
| peca | 6 |
| ordem_servico | 6 |
| evento_os | 19 |
| item_os | 9 |
| inventario | 2 |
| log | 10 |
| **Total** | **77** |

---

*Pronto para avançar para a Fase 3 — Core Backend.*
