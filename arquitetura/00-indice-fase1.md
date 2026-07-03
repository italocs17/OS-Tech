# Fase 1 — Arquitetura: Índice e Status

> **Status:** ✅ Concluída e revisada
> **Data:** 2026-06-24

---

## Documentos

| # | Arquivo | Descrição |
|---|---------|-----------|
| 01 | `01-modelagem-dominio.md` | Entidades, campos, regras de negócio, invariantes, DDL SQLite |
| 02 | `02-casos-de-uso.md` | 14 casos de uso com fluxos principais e alternativos |
| 03 | `03-arquitetura-pastas.md` | Estrutura de diretórios, padrões de nomenclatura, fluxo IPC |
| 04 | `04-estrategia-backup.md` | Backup manual/automático, restauração, recuperação de desastres |
| 05 | `05-estrategia-logs.md` | Auditoria, rotação, LGPD, tela de Auditoria |
| 06 | `06-diagrama-entidades.md` | Diagrama ER em Mermaid |

---

## Decisões Consolidadas

### Nomenclatura
- **Status de OS:** Sempre em maiúsculas com underline (`ABERTA`, `EM_EXECUCAO`, `CONCLUIDA`, etc.)
- **Campos:** Português (`nome`, `cpf`, `telefone`, `endereco`, `dataCadastro`)
- **Canais IPC:** `domínio:acao` (ex: `client:create`, `os:list`)

### Relacionamentos
- Cliente 1:N Equipamento
- Cliente 1:N OrdemServico
- Equipamento 1:N OrdemServico
- OrdemServico 1:N EventoOS
- OrdemServico 1:N ItemOS
- **OrdemServico 1:1 Inventario** (captura única por OS)
- Servico 1:N ItemOS (polimorfismo via tipoItem)
- Peca 1:N ItemOS (polimorfismo via tipoItem)
- Usuario 1:N EventoOS

### Regras Críticas
- **Etiqueta:** 5 chars `[A-Z0-9]`, gerada automaticamente, única, imutável
- **Numeração OS:** Sequencial `%04d`, nunca reutiliza, nunca reinicia
- **Eventos:** Imutáveis (CREATE only)
- **ItemOS:** Polimorfismo via `tipoItem` + `referenciaId`
- **Inventario:** 1:1 com OS, snapshot JSON imutável
- **Backup:** ZIP com manifest + SHA-256, max 30 automáticos (FIFO)
- **Logs:** SQLite + arquivo .log (fallback), UTC, rotação 30 dias

### Stack
- Electron + React + TypeScript
- TailwindCSS + Shadcn/UI
- Prisma ORM + SQLite
- React Query + Zod
- PDFKit
- PowerShell (inventário)

---

## Correções Aplicadas (Revisão)

| Correção | Arquivos afetados |
|----------|-------------------|
| Status padronizados para formato PRD | `02-casos-de-uso.md` |
| Campos em português (nome, cpf, telefone, etc.) | `03-arquitetura-pastas.md` |
| Relacionamento Inventario corrigido para 1:1 | `06-diagrama-entidades.md` |
| Validação de duplicidade alterada de email para CPF | `03-arquitetura-pastas.md` |

---

## Checklist de Prontidão para Fase 2

- [x] Todas as 9 entidades modeladas
- [x] Relacionamentos definidos e validados
- [x] Regras de negócio documentadas
- [x] DDL SQLite gerado
- [x] Estratégia de backup definida
- [x] Estratégia de logs definida
- [x] Arquitetura de pastas definida
- [x] Fluxo IPC documentado
- [x] Nomenclatura padronizada
- [x] Diagrama ER criado

---

*Pronto para avançar para a Fase 2 — Banco de Dados.*
