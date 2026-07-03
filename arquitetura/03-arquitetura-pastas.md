# OS.Tech - Arquitetura de Pastas

> Aplicação Electron + React para gestão de Ordens de Serviço (OS).

---

## 1. Árvore de Diretórios Completa

```
OS.Tech/
├── .electron-builder/              # Configuração de build do Electron Builder
├── prisma/
│   ├── schema.prisma               # Definição do schema Prisma
│   ├── migrations/                 # Migrações do banco de dados
│   └── seed.ts                     # Dados iniciais de exemplo
├── release/                        # Binários gerados (build)
├── resources/                      # Recursos estáticos (ícones, imagens)
│   ├── icons/
│   └── images/
├── scripts/
│   ├── dev.ts                      # Script de inicialização dev
│   ├── build.ts                    # Script de build de produção
│   └── postinstall.ts              # Scripts pós-instalação
├── src/
│   ├── main/                       # ──────────────────────────────────────
│   │   │                           #  ELECTRON MAIN PROCESS
│   │   │                           #  Lógica do processo principal
│   │   ├── index.ts                # Entry point do main process
│   │   ├── ipc/
│   │   │   ├── index.ts            # Registro central de handlers IPC
│   │   │   ├── client.ipc.ts       # Handlers de clientes
│   │   │   ├── equipment.ipc.ts    # Handlers de equipamentos
│   │   │   ├── os.ipc.ts           # Handlers de OS
│   │   │   ├── user.ipc.ts         # Handlers de usuários
│   │   │   └── report.ipc.ts       # Handlers de relatórios/PDF
│   │   ├── services/
│   │   │   ├── client.service.ts   # Regra de negócio - clientes
│   │   │   ├── equipment.service.ts# Regra de negócio - equipamentos
│   │   │   ├── os.service.ts       # Regra de negócio - OS
│   │   │   ├── user.service.ts     # Regra de negócio - usuários
│   │   │   └── report.service.ts   # Geração de PDF/relatórios
│   │   ├── database/
│   │   │   ├── connection.ts       # Instância do Prisma Client
│   │   │   └── repositories/
│   │   │       ├── client.repository.ts
│   │   │       ├── equipment.repository.ts
│   │   │       ├── os.repository.ts
│   │   │       └── user.repository.ts
│   │   ├── validators/
│   │   │   ├── client.validator.ts # Schemas Zod para clientes
│   │   │   ├── equipment.validator.ts
│   │   │   ├── os.validator.ts
│   │   │   └── user.validator.ts
│   │   ├── config/
│   │   │   ├── app.config.ts       # Configurações gerais da aplicação
│   │   │   └── menu.config.ts      # Configuração do menu nativo
│   │   ├── utils/
│   │   │   ├── logger.ts           # Logger estruturado
│   │   │   └── paths.ts            # Resolução de caminhos
│   │   └── types/
│   │       ├── ipc.types.ts        # Tipos dos canais IPC
│   │       └── entities.types.ts   # Tipos das entidades do banco
│   │
│   ├── preload/                    # ──────────────────────────────────────
│   │   │                           #  PRELOAD SCRIPT (ponte segura)
│   │   ├── index.ts                # Entry point do preload
│   │   ├── client.preload.ts       # APIs expostas para clientes
│   │   ├── equipment.preload.ts    # APIs expostas para equipamentos
│   │   ├── os.preload.ts           # APIs expostas para OS
│   │   ├── user.preload.ts         # APIs expostas para usuários
│   │   └── report.preload.ts       # APIs expostas para relatórios
│   │
│   ├── renderer/                   # ──────────────────────────────────────
│   │   │                           #  REACT RENDERER PROCESS
│   │   │                           #  Interface do usuário
│   │   ├── index.tsx               # Entry point React (ReactDOM.createRoot)
│   │   ├── App.tsx                 # Componente raiz com rotas
│   │   ├── providers/
│   │   │   ├── query-provider.tsx  # React Query Provider
│   │   │   ├── theme-provider.tsx  # Tema (dark/light)
│   │   │   └── toast-provider.tsx  # Notificações toast
│   │   ├── routes/
│   │   │   ├── index.tsx           # Configuração de rotas (React Router)
│   │   │   └── routes.tsx          # Definição das rotas
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   │   └── index.tsx
│   │   │   ├── Clients/
│   │   │   │   ├── index.tsx       # Listagem de clientes
│   │   │   │   ├── create.tsx      # Criação de cliente
│   │   │   │   └── [id].tsx        # Detalhe/edição de cliente
│   │   │   ├── Equipment/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── create.tsx
│   │   │   │   └── [id].tsx
│   │   │   ├── OS/
│   │   │   │   ├── index.tsx       # Listagem de OS
│   │   │   │   ├── create.tsx      # Criação de OS
│   │   │   │   └── [id].tsx        # Detalhe/edição de OS
│   │   │   └── Reports/
│   │   │       └── index.tsx       # Página de relatórios
│   │   ├── hooks/
│   │   │   ├── use-clients.ts      # Hooks de clientes
│   │   │   ├── use-equipment.ts    # Hooks de equipamentos
│   │   │   ├── use-os.ts           # Hooks de OS
│   │   │   ├── use-users.ts        # Hooks de usuários
│   │   │   ├── use-reports.ts      # Hooks de relatórios
│   │   │   └── use-ipc.ts          # Hook genérico para IPC
│   │   ├── components/
│   │   │   ├── ui/                 # ──────────────────────────────────
│   │   │   │   │                   #  Componentes base do Shadcn/UI
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   └── ...
│   │   │   ├── layout/
│   │   │   │   ├── app-layout.tsx  # Layout principal (sidebar + header)
│   │   │   │   ├── sidebar.tsx     # Menu lateral
│   │   │   │   ├── header.tsx      # Cabeçalho superior
│   │   │   │   └── page-header.tsx # Cabeçalho de página
│   │   │   ├── domain/             # ──────────────────────────────────
│   │   │   │   #  Componentes específicos de domínio
│   │   │   │   ├── client-card.tsx
│   │   │   │   ├── client-form.tsx
│   │   │   │   ├── equipment-card.tsx
│   │   │   │   ├── equipment-form.tsx
│   │   │   │   ├── os-card.tsx
│   │   │   │   ├── os-form.tsx
│   │   │   │   ├── status-badge.tsx
│   │   │   │   └── search-input.tsx
│   │   │   └── shared/             # ──────────────────────────────────
│   │   │       #  Componentes utilitários compartilhados
│   │   │       ├── empty-state.tsx
│   │   │       ├── loading-spinner.tsx
│   │   │       ├── error-boundary.tsx
│   │   │       ├── confirm-dialog.tsx
│   │   │       └── data-table.tsx
│   │   ├── services/
│   │   │   └── api.ts              # Cliente de API (chamadas IPC tipadas)
│   │   ├── store/
│   │   │   └── app-store.ts        # Estado global leve (Zustand)
│   │   ├── lib/
│   │   │   ├── utils.ts            # Utilidades (cn, formatação, etc.)
│   │   │   ├── constants.ts        # Constantes da aplicação
│   │   │   └── formatters.ts       # Formatadores (data, moeda, etc.)
│   │   ├── styles/
│   │   │   └── globals.css         # Estilos globais + Tailwind
│   │   └── types/
│   │       ├── client.types.ts     # Tipos TypeScript de cliente
│   │       ├── equipment.types.ts  # Tipos TypeScript de equipamento
│   │       ├── os.types.ts         # Tipos TypeScript de OS
│   │       ├── user.types.ts       # Tipos TypeScript de usuário
│   │       └── ipc.types.ts        # Tipos dos canais IPC
│   │
│   └── shared/                     # ──────────────────────────────────────
│       │                           #  CÓDIGO COMPARTILHADO
│       │                           #  Tipos e utilidades usadas por
│       │                           #  main E renderer
│       ├── types/
│       │   ├── api.types.ts        # Tipos de requisição/resposta da API
│       │   └── entities.types.ts   # Entidades do banco (Prisma types)
│       ├── constants/
│       │   ├── app.constants.ts   # Constantes da aplicação
│       │   └── ipc-channels.ts    # Nomes dos canais IPC
│       └── utils/
│           └── cn.ts              # Utilidade de classes Tailwind
│
├── .env                            # Variáveis de ambiente
├── .env.example                    # Template de variáveis
├── .eslintrc.cjs                   # Configuração ESLint
├── .prettierrc                     # Configuração Prettier
├── tailwind.config.ts              # Configuração TailwindCSS
├── tsconfig.json                   # Configuração TypeScript base
├── tsconfig.main.json              # TS Config para main process
├── tsconfig.renderer.json          # TS Config para renderer process
├── vite.config.ts                  # Configuração Vite (renderer)
├── electron.vite.config.ts         # Configuração electron-vite (main)
├── package.json
└── README.md
```

---

## 2. Descrição de Cada Pasta

### Nível Raiz

| Pasta | Descrição |
|-------|-----------|
| `prisma/` | Contém o schema do Prisma ORM, migrações e seeders. Responsável pela definição e manipulação do banco SQLite. |
| `resources/` | Arquivos estáticos como ícones da aplicação, logos e imagens usadas na UI. |
| `scripts/` | Scripts auxiliares para desenvolvimento, build e automação. |
| `release/` | Diretório de saída para os binários compilados do Electron. |
| `.electron-builder/` | Configuração específica do electron-builder para gerar instaladores. |

### `src/main/` — Electron Main Process

| Pasta | Descrição |
|-------|-----------|
| `src/main/index.ts` | Ponto de entrada do processo principal. Cria janelas, inicializa serviços e registra handlers IPC. |
| `src/main/ipc/` | Handlers que recebem chamadas do renderer via IPC. Cada arquivo agrupa handlers de um domínio. |
| `src/main/services/` | Camada de serviço — contém toda a regra de negócio. Os handlers IPC delegam para estes serviços. |
| `src/main/database/` | Configuração do Prisma e repositórios (camada de acesso a dados). |
| `src/main/validators/` | Schemas Zod para validação de dados no main process (antes de persistir no banco). |
| `src/main/config/` | Configurações da aplicação (caminhos, preferências, menu nativo). |
| `src/main/utils/` | Utilidades do main process (logger, resolução de caminhos). |
| `src/main/types/` | Definições de tipos TypeScript específicas do main process. |

### `src/preload/` — Preload Scripts

| Pasta | Descrição |
|-------|-----------|
| `src/preload/index.ts` | Preload principal — expõe APIs seguras via `contextBridge`. |
| `src/preload/*.preload.ts` | Um arquivo por domínio, expondo apenas as APIs necessárias ao renderer. |

### `src/renderer/` — React Renderer Process

| Pasta | Descrição |
|-------|-----------|
| `src/renderer/index.tsx` | Ponto de entrada React — monta a árvore de componentes. |
| `src/renderer/App.tsx` | Componente raiz com configuração de providers e rotas. |
| `src/renderer/providers/` | Contextos globais (React Query, tema, toast). |
| `src/renderer/routes/` | Configuração de roteamento (React Router). |
| `src/renderer/pages/` | Componentes de página — um diretório por domínio. |
| `src/renderer/hooks/` | Custom hooks que encapsulam chamadas IPC via React Query. |
| `src/renderer/components/ui/` | Componentes base reutilizáveis do Shadcn/UI. |
| `src/renderer/components/layout/` | Componentes estruturais (layout, sidebar, header). |
| `src/renderer/components/domain/` | Componentes específicos de cada domínio da aplicação. |
| `src/renderer/components/shared/` | Componentes utilitários compartilhados entre domínios. |
| `src/renderer/services/` | Cliente de API — camada que abstrai chamadas IPC. |
| `src/renderer/store/` | Estado global leve (Zustand) para preferências de UI. |
| `src/renderer/lib/` | Utilidades, constantes e formatação. |
| `src/renderer/styles/` | Arquivos CSS globais e configuração Tailwind. |
| `src/renderer/types/` | Tipos TypeScript do renderer. |

### `src/shared/` — Código Compartilhado

| Pasta | Descrição |
|-------|-----------|
| `src/shared/types/` | Tipos compartilhados entre main e renderer (entidades, API). |
| `src/shared/constants/` | Constantes compartilhadas (canais IPC, configurações). |
| `src/shared/utils/` | Utilidades compartilhadas (ex: `cn()` para classes Tailwind). |

---

## 3. Padrão de Nomenclatura

### Convenções Gerais

| Elemento | Padrão | Exemplo |
|----------|--------|---------|
| Arquivos TypeScript (utilitários) | `kebab-case.ts` | `client.service.ts`, `cn.ts` |
| Arquivos React (componentes) | `PascalCase.tsx` | `ClientCard.tsx`, `AppLayout.tsx` |
| Hooks | `use-kebab-case.ts` | `use-clients.ts`, `use-ipc.ts` |
| Tipos/Interfaces | `PascalCase` | `Client`, `CreateClientDTO`, `IpcChannels` |
| Constantes | `SCREAMING_SNAKE_CASE` | `IPC_CHANNELS`, `DB_PATH` |
| Variáveis/funções | `camelCase` | `createClient`, `getClientById` |
| Schemas Zod | `camelCase` + sufixo `Schema` | `createClientSchema` |
| Canais IPC | `kebab-case` com dois pontos | `client:create`, `client:list` |
| Pastas de domínio | `PascalCase` (plural) | `Clients/`, `Equipment/`, `OS/` |

### Padrão de Nomenclatura IPC

```
{domínio}:{ação}
```

Ações comuns:
- `{domain}:list` — Listar
- `{domain}:get` — Buscar por ID
- `{domain}:create` — Criar
- `{domain}:update` — Atualizar
- `{domain}:delete` — Deletar

Exemplos:
- `client:create`
- `equipment:list`
- `os:update`
- `report:generate`

### Padrão de Nomenclatura de Hooks

```
use-{domínio}{Sufixo}
```

- `use-clients` — Hook de listagem/query
- `use-client` — Hook de entidade única
- `use-create-client` — Hook de mutação (criação)
- `use-update-client` — Hook de mutação (atualização)
- `use-delete-client` — Hook de mutação (deleção)

---

## 4. Fluxo Completo: Criar Cliente (UI → Hook → IPC → Service → Banco)

### Diagrama do Fluxo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RENDERER PROCESS                             │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  CreatePage   │───▶│ useCreateClient│───▶│   api.createClient() │  │
│  │  (UI Form)    │    │  (Hook)       │    │   (IPC Bridge Call)  │  │
│  └──────────────┘    └──────────────┘    └──────────┬───────────┘  │
│                                                      │              │
└──────────────────────────────────────────────────────┼──────────────┘
                                                       │
                                     contextBridge (invoke)
                                                       │
┌──────────────────────────────────────────────────────┼──────────────┐
│                        MAIN PROCESS                   │              │
│                                                       ▼              │
│  ┌──────────────────────┐    ┌──────────────────────────────────┐  │
│  │  client.ipc.ts       │───▶│  client.service.ts               │  │
│  │  (IPC Handler)       │    │  (Valida com Zod → Salva)        │  │
│  └──────────────────────┘    └──────────────┬───────────────────┘  │
│                                              │                      │
│                                              ▼                      │
│                                 ┌────────────────────────┐          │
│                                 │  client.repository.ts  │          │
│                                 │  (Prisma Client)       │          │
│                                 └────────────┬───────────┘          │
│                                              │                      │
│                                              ▼                      │
│                                 ┌────────────────────────┐          │
│                                 │  SQLite Database       │          │
│                                 └────────────────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Passo a Passo Detalhado

#### Passo 1: UI — Página de Criação (`src/renderer/pages/Clients/create.tsx`)

```tsx
import { useCreateClient } from "@/hooks/use-clients";
import { ClientForm } from "@/components/domain/client-form";

export function CreateClientPage() {
  const createClient = useCreateClient();

  function handleSubmit(data: CreateClientDTO) {
    createClient.mutate(data, {
      onSuccess: () => {
        toast.success("Cliente criado com sucesso!");
        navigate("/clients");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  return (
    <ClientForm onSubmit={handleSubmit} isLoading={createClient.isPending} />
  );
}
```

#### Passo 2: Hook — Encapsula React Query (`src/renderer/hooks/use-clients.ts`)

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientDTO) => api.client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
```

#### Passo 3: API Client — Chamada IPC (`src/renderer/services/api.ts`)

```tsx
import type { CreateClientDTO, Client } from "@shared/types/api.types";

export const api = {
  client: {
    list: () => window.osTech.client.list(),
    get: (id: string) => window.osTech.client.get(id),
    create: (data: CreateClientDTO) => window.osTech.client.create(data),
    update: (id: string, data: UpdateClientDTO) => window.osTech.client.update(id, data),
    delete: (id: string) => window.osTech.client.delete(id),
  },
  // ... outros domínios
};
```

#### Passo 4: Preload — Ponte Segura (`src/preload/client.preload.ts`)

```ts
import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "@shared/constants/ipc-channels";

contextBridge.exposeInMainWorld("osTech", {
  client: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.CLIENT.LIST),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.CLIENT.GET, id),
    create: (data: CreateClientDTO) => ipcRenderer.invoke(IPC_CHANNELS.CLIENT.CREATE, data),
    update: (id: string, data: UpdateClientDTO) => ipcRenderer.invoke(IPC_CHANNELS.CLIENT.UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.CLIENT.DELETE, id),
  },
});
```

#### Passo 5: IPC Handler — Main Process (`src/main/ipc/client.ipc.ts`)

```ts
import { ipcMain } from "electron";
import { IPC_CHANNELS } from "@shared/constants/ipc-channels";
import { ClientService } from "@/services/client.service";

const clientService = new ClientService();

export function registerClientIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.CLIENT.LIST, async () => {
    return clientService.list();
  });

  ipcMain.handle(IPC_CHANNELS.CLIENT.GET, async (_, id: string) => {
    return clientService.getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.CLIENT.CREATE, async (_, data: CreateClientDTO) => {
    return clientService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.CLIENT.UPDATE, async (_, id: string, data: UpdateClientDTO) => {
    return clientService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.CLIENT.DELETE, async (_, id: string) => {
    return clientService.delete(id);
  });
}
```

#### Passo 6: Service — Regra de Negócio (`src/main/services/client.service.ts`)

```ts
import { ClientRepository } from "@/database/repositories/client.repository";
import { createClientSchema } from "@/validators/client.validator";
import type { CreateClientDTO, UpdateClientDTO } from "@shared/types/api.types";

export class ClientService {
  private repository = new ClientRepository();

  async list() {
    return this.repository.findMany();
  }

  async getById(id: string) {
    const client = await this.repository.findById(id);
    if (!client) throw new Error("Cliente não encontrado");
    return client;
  }

  async create(data: CreateClientDTO) {
    // Validação com Zod
    const validated = createClientSchema.parse(data);

    // Regra de negócio: verificar duplicidade
    const existing = await this.repository.findByCpf(validated.cpf);
    if (existing) throw new Error("CPF já cadastrado");

    return this.repository.create(validated);
  }

  async update(id: string, data: UpdateClientDTO) {
    await this.getById(id); // garante existência
    const validated = updateClientSchema.parse(data);
    return this.repository.update(id, validated);
  }

  async delete(id: string) {
    await this.getById(id); // garante existência
    return this.repository.delete(id);
  }
}
```

#### Passo 7: Repository — Acesso a Dados (`src/main/database/repositories/client.repository.ts`)

```ts
import { prisma } from "../connection";
import type { CreateClientDTO, UpdateClientDTO } from "@shared/types/api.types";

export class ClientRepository {
  async findMany() {
    return prisma.client.findMany({
      orderBy: { dataCadastro: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.client.findUnique({ where: { id } });
  }

  async findByCpf(cpf: string) {
    return prisma.client.findUnique({ where: { cpf } });
  }

  async create(data: CreateClientDTO) {
    return prisma.client.create({ data });
  }

  async update(id: string, data: UpdateClientDTO) {
    return prisma.client.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.client.delete({ where: { id } });
  }
}
```

#### Passo 8: Validator — Schema Zod (`src/main/validators/client.validator.ts`)

```ts
import { z } from "zod";

export const createClientSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  cpf: z.string().min(11, "CPF inválido"),
  endereco: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
```

#### Passo 9: Banco — Schema Prisma (`prisma/schema.prisma`)

```prisma
model Client {
  id            String   @id @default(cuid())
  nome          String
  email         String   @unique
  telefone      String
  cpf           String   @unique
  endereco      String?
  dataCadastro  DateTime @default(now())
  dataAtualizacao DateTime @updatedAt

  os            OS[]
}
```

---

## Resumo das Camadas

```
┌─────────────────────────────────────────────────────────┐
│  Camada de Apresentação (Renderer)                      │
│  Pages → Hooks → API Client → Preload → IPC            │
├─────────────────────────────────────────────────────────┤
│  Camada de Comunicação                                  │
│  Preload Scripts (contextBridge) + IPC Handlers         │
├─────────────────────────────────────────────────────────┤
│  Camada de Serviço (Main)                               │
│  Validators → Services → Repositories                   │
├─────────────────────────────────────────────────────────┤
│  Camada de Dados                                        │
│  Prisma ORM → SQLite                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Princípios da Arquitetura

1. **Separação de responsabilidades**: O main process nunca importa React; o renderer nunca acessa Prisma diretamente.
2. **Segurança**: O preload expõe apenas APIs necessárias via `contextBridge`.
3. **Validação em duas camadas**: Zod no main (segurança) e no renderer (UX).
4. **Tipagem compartilhada**: Tipos em `src/shared/` são usados por ambos os processos.
5. **Testabilidade**: Services são classes independentes, testáveis sem Electron.
6. **Escalabilidade**: Novos domínios seguem o mesmo padrão: `ipc → service → repository → banco`.
