# Fase 6 — Relatórios e PDFs: Índice e Status

> **Status:** ✅ Concluída
> **Data:** 2026-06-24

---

## Arquivos Criados/Atualizados

| Arquivo | Descrição |
|---------|-----------|
| `src/main/services/pdf.service.ts` | Serviço de geração de PDFs com 5 métodos |
| `src/main/ipc/report.ipc.ts` | Handlers IPC para geração de PDFs |
| `src/main/ipc/index.ts` | Atualizado para incluir relatórios |
| `package.json` | Adicionado pdfkit + @types/pdfkit |

---

## Métodos de Geração de PDF

| Método | Documento | Conteúdo |
|--------|-----------|----------|
| `generateOS(osId)` | Ordem de Serviço | Cliente, equipamento, status, itens, eventos |
| `generateLaudo(osId)` | Laudo Técnico | Cliente, equipamento, inventário, diagnóstico |
| `generateInventoryReport(osId)` | Inventário Técnico | Hardware completo (SO, CPU, RAM, discos, rede, etc.) |
| `generateRecibo(osId)` | Recibo de Entrega | Cliente, equipamento, serviços, assinaturas |
| `generateFinancialReport(inicio, fim)` | Relatório Financeiro | Resumo + detalhamento de OS concluídas |

---

## IPC Handlers

| Canal | Ação |
|-------|------|
| `REPORT.PDF` | Gera PDF e abre com programa padrão |
| `report:financial` | Gera relatório financeiro |
| `report:save-pdf` | Abre diálogo de salvar e gera PDF |

---

## Dependências

```json
"pdfkit": "^0.19.1",
"@types/pdfkit": "^0.17.6"
```

---

## Verificação Final

```
npx tsc --noEmit    → ✅ 0 erros
```

---

*Pronto para avançar para a Fase 7 — Backup e Recuperação.*
