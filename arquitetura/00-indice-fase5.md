# Fase 5 — Inventário Técnico: Índice e Status

> **Status:** ✅ Concluída
> **Data:** 2026-06-24

---

## Arquivos Criados/Atualizados

| Arquivo | Descrição |
|---------|-----------|
| `scripts/inventory.ps1` | Script PowerShell para captura de hardware/software |
| `src/main/services/inventory-capture.service.ts` | Serviço que executa o script PowerShell |
| `src/main/ipc/inventory.ipc.ts` | Atualizado para usar captura real |
| `src/shared/constants/ipc-channels.ts` | Adicionado CAPTURE_TO_FILE |
| `src/shared/types/entities.types.ts` | Interface InventarioHardware atualizada |

---

## Script PowerShell — Informações Coletadas

| Categoria | Dados |
|-----------|-------|
| Sistema Operacional | Nome, versão, build, arquitetura, serial |
| Processador | Modelo, núcleos, threads, frequência, socket |
| Memória RAM | Total, tipo, velocidade, slots usados/total |
| Discos | Modelo, tipo, capacidade, serial, saúde (SMART) |
| Rede | Nome, IP local, MAC, tipo (Wi-Fi/Ethernet) |
| Placa-mãe | Fabricante, modelo, serial |
| Placa de vídeo | Modelo, VRAM, driver |
| Programas Instalados | Nome, versão, fabricante (até 100) |
| Impressoras | Nome, driver, porta, padrão |

---

## Serviço de Captura

### InventoryCaptureService
- `capture(): Promise<InventoryData>` — Executa script e retorna dados em memória
- `captureToFile(outputPath): Promise<string>` — executa script e salva em arquivo
- Timeout de 60 segundos
- Detecção de ambiente (desenvolvimento vs empacotado)
- Tratamento de erros: timeout, JSON inválido, script não encontrado

---

## Verificação Final

```
npx tsc --noEmit    → ✅ 0 erros
```

---

*Pronto para avançar para a Fase 6 — Relatórios e PDFs.*
