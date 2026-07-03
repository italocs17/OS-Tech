# Fase 3 — Core Backend: Índice e Status

> **Status:** ✅ Concluída e revisada
> **Data:** 2026-06-24

---

## Arquivos Criados/Atualizados

### Repositories (8 arquivos)
| Arquivo | Entidade | Métodos |
|---------|----------|---------|
| `src/main/database/repositories/client.repository.ts` | Cliente | findMany, findById, findByCpf, create, update, delete, count |
| `src/main/database/repositories/equipment.repository.ts` | Equipamento | findMany, findById, findByEtiqueta, findByClienteId, create, update, delete, count |
| `src/main/database/repositories/os.repository.ts` | OrdemServico | findMany, findById, findByNumeroOS, findByClienteId, findByEquipamentoId, findByStatus, create, update, delete, count, countByStatus |
| `src/main/database/repositories/evento.repository.ts` | EventoOS | findByOSId, create (imutável) |
| `src/main/database/repositories/item-os.repository.ts` | ItemOS | findByOSId, create, createMany, delete, deleteByOSId, calcularTotalOS |
| `src/main/database/repositories/usuario.repository.ts` | Usuario | findMany, findById, findByLogin, create, update, delete, count |
| `src/main/database/repositories/inventario.repository.ts` | Inventario | findByOSId, create, delete, count |
| `src/main/database/repositories/log.repository.ts` | Log | (não criado - log usa tabela via Prisma model) |

### Validators (4 arquivos)
| Arquivo | Schemas |
|---------|--------|
| `src/main/validators/client.validator.ts` | createClientSchema (com validação CPF), updateClientSchema |
| `src/main/validators/equipment.validator.ts` | createEquipmentSchema, updateEquipmentSchema |
| `src/main/validators/os.validator.ts` | createOSSchema, updateOSSchema, changeStatusSchema, createEventoSchema, createItemOSSchema, validarTransicaoStatus |
| `src/main/validators/usuario.validator.ts` | createUsuarioSchema, updateUsuarioSchema, loginSchema |

### Services (8 arquivos)
| Arquivo | Entidade | Regras de Negócio |
|---------|----------|-------------------|
| `src/main/services/client.service.ts` | Cliente | Valida CPF duplicado, soft delete |
| `src/main/services/equipment.service.ts` | Equipamento | Gera etiqueta automática, soft delete |
| `src/main/services/os.service.ts` | OrdemServico | Gera número sequencial, valida transição de status, cria evento automático, bloqueia eventos/itens em status terminais |
| `src/main/services/usuario.service.ts` | Usuario | Login único, bcrypt, soft delete, login com verificação |
| `src/main/services/inventario.service.ts` | Inventario | 1:1 por OS, parse JSON, log de auditoria |
| `src/main/services/backup.service.ts` | Backup | Gzip + SHA-256, manifest JSON, restore com safety copy |
| `src/main/services/etiqueta.service.ts` | Etiqueta | Geração [A-Z0-9]{5}, verificação unicidade |
| `src/main/services/numero-os.service.ts` | Numeração OS | Sequencial %04d, transação atômica |

### IPC Handlers (7 arquivos)
| Arquivo | Canais |
|---------|--------|
| `src/main/ipc/client.ipc.ts` | CLIENT: LIST, GET, CREATE, UPDATE, DELETE |
| `src/main/ipc/equipment.ipc.ts` | EQUIPMENT: LIST, GET, CREATE, UPDATE, DELETE |
| `src/main/ipc/os.ipc.ts` | OS: LIST, GET, CREATE, UPDATE, DELETE, CHANGE_STATUS, ADD_EVENT, ADD_ITEM, REMOVE_ITEM, GET_ITENS, GET_EVENTOS, CALCULAR_TOTAL, COUNT_BY_STATUS |
| `src/main/ipc/usuario.ipc.ts` | USER: LIST, GET, CREATE, UPDATE, DELETE, LOGIN |
| `src/main/ipc/inventory.ipc.ts` | INVENTORY: CAPTURE, GET, LIST |
| `src/main/ipc/backup.ipc.ts` | BACKUP: CREATE, LIST, RESTORE |
| `src/main/ipc/index.ts` | Registro central de todos os handlers |

### Shared (2 arquivos)
| Arquivo | Descrição |
|---------|-----------|
| `src/shared/constants/ipc-channels.ts` | Constantes de todos os canais IPC |
| `src/shared/types/entities.types.ts` | Interfaces DTO de todas as entidades |

---

## Correções Aplicadas (Revisão)

| Correção | Arquivo | Motivo |
|----------|---------|--------|
| `etiqueta` opcional no create | `equipment.validator.ts` | Service gera etiqueta automaticamente |
| `create` recebe `senha` (não `senhaHash`) | `usuario.service.ts` | Validator espera senha plain text, service gera hash |
| `createUsuarioSchema` valida senha plain text | `usuario.service.ts` | DTO recebe senhaHash mas criação usa senha |

---

## Resumo da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        RENDERER PROCESS                         │
│  Pages → Hooks → API Client → Preload → IPC                   │
├─────────────────────────────────────────────────────────────────┤
│                     MAIN PROCESS                                │
│  IPC Handlers → Validators → Services → Repositories → Prisma  │
├─────────────────────────────────────────────────────────────────┤
│                        SQLite Database                          │
│  Tables: cliente, equipamento, ordem_servico, evento_os,       │
│          servico, peca, item_os, inventario, usuario, log      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Checklist de Prontidão para Fase 4

- [x] 8 repositories implementados
- [x] 4 validators com Zod
- [x] 8 services com regras de negócio
- [x] 7 IPC handlers registrados
- [x] Validação de CPF com dígitos verificadores
- [x] Validação de transição de status
- [x] Geração automática de etiqueta e número OS
- [x] Autenticação com bcrypt
- [x] Soft delete em todas as entidades
- [x] Auditoria via log.service nos serviços
- [x] Backup com gzip + SHA-256

---

*Pronto para avançar para a Fase 4 — Interface do Usuário.*
