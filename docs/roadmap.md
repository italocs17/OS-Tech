# OS.Tech — Roadmap

> Planejamento das próximas versões e funcionalidades futuras.
> Itens marcados com `[x]` já foram implementados.

---

## v2.0.0 — Solicitações por E-mail

Implementado em: 03/07/2026

- [x] Modelos Prisma: `ClienteContato`, `EmailSolicitacao`, `Configuracao`, enum `StatusEmail`
- [x] IMAP inbox (Gmail + App Password criptografada)
- [x] Polling automático a cada 5min + botão "Verificar E-mails"
- [x] Reconhecimento automático de remetentes cadastrados
- [x] Vincular cliente manual para remetentes não cadastrados
- [x] Conversão automática em OS (assunto → observações, corpo → diagnóstico)
- [x] Página "Chamados 💬" com abas: Aguardando / Não cadastrados / Convertidos / Rejeitados
- [x] Badge de pendências na sidebar
- [x] Gerenciamento de múltiplos contatos por cliente

---

## v2.1 — Notificações por E-mail

Implementado em: 16/07/2026

- [x] **Notificação de eventos** — Ao adicionar um evento em OS, enviar e-mail para o contato que iniciou a solicitacao (via EmailSolicitacao.contatoId) ou fallback para Cliente.email
- [x] **Envio de PDF na conclusão** — Quando a OS transitar para `CONCLUIDA` ou `ENTREGUE`, enviar o PDF analítico como anexo
- [x] **Serviço SMTP** — Reutilizar credenciais já armazenadas no `email-config.service.ts` (Gmail suporta IMAP + SMTP)

---

## v2.2 — Categorias de Serviços

Implementado em: 16/07/2026 (incluído no v2.3.0)

- [x] Modelo `CategoriaServico` (`id`, `nome` unique, `descricao`, `ativo`)
- [x] Campo `categoriaId` opcional em `Servico`
- [x] CRUD de categorias na interface (criar, ativar, inativar)
- [x] Filtro por categoria no catálogo de serviços
- [x] Categorização manual da OS pelo operador (especialmente para OSs vindas de e-mail)

---

## v2.3 — Subcategorias, Equipes e Controle de Acesso

Implementado em: 16/07/2026

**Objetivo:** Hierarquização de serviços, gestão de equipes e controle de acesso baseado em perfil.

### Funcionalidades

- [x] **Subcategorias de Serviço** — Hierarquia simples (Categoria → Subcategorias), unique por categoria
- [x] **Gestão de Equipes** — CRUD de equipes vinculadas a categorias via N:N (`EquipeCategoria`)
- [x] **Vínculo Usuário × Equipe** — Usuários vinculados a equipes via N:N (`UsuarioEquipe`)
- [x] **Controle de Acesso por Perfil** — `hasAccessToCategoria()` no auth context; sidebar dinâmica filtrada por `perfis`
- [x] **Catálogo com 4 abas** — Serviços | Peças | Categorias | Subcategorias
- [x] **Formulário de OS com categorias filtradas** — Restrito à equipe do usuário para TECNICO/RECEPCIONISTA
- [x] **Controles restritos no detalhe da OS** — Desconto e pagamento bloqueados para TECNICO/RECEPCIONISTA
- [x] **Formulário de Usuário com equipes** — Vínculo de equipes via checkbox
- [x] **Página de Equipes** — `/equipes` com CRUD, categorias e gestão de membros

### Backend

- [x] Modelos: `SubcategoriaServico`, `Equipe`, `EquipeCategoria`, `UsuarioEquipe`
- [x] Campo `subcategoriaId` em `Servico`, `tecnicoId` em `OrdemServico`
- [x] 3 novos repositories + services + validators + IPC handlers + preloads
- [x] Migration `20260716165301_add_subcategorias_equipes`
- [x] Seed: 5 categorias, 11 subcategorias, 5 equipes, 5 vínculos UE

### Instalador

- [x] NSIS `OS.Tech Setup 2.3.0.exe` (111.5 MB)
- [x] Portátil `OS.Tech 2.3.0.exe` (111.3 MB)

---

## v2.4 — Contratos e Recorrência

Pré-planejado em: 03/07/2026

**Objetivo:** Suporte a contratos de suporte mensal/recorrente, com geração automática de OS.

### Funcionalidades

- [ ] Modelo `Contrato` (cliente, tipo, vigência, valor recorrente)
- [ ] Geração automática de OS a partir de contrato ativo
- [ ] Relatório financeiro separando serviços avulsos × contratos

---

## v2.5 — Agendamento e Calendário

Pré-planejado em: 03/07/2026

**Objetivo:** Gerenciar visitas técnicas presenciais com alocação de técnicos.

### Funcionalidades

- [ ] Visão calendário para OSs com `tipoAtendimento: EXTERNO`
- [ ] Alocação de técnico responsável com data/hora prevista
- [ ] Lembretes de visitas agendadas (requer v2.1)

---

## v3.0 — Expansão WEB

Pré-planejado em: 03/07/2026

**Objetivo:** Migrar para arquitetura cliente-servidor quando a equipe crescer.

### Funcionalidades

- [ ] Backend HTTP (NestJS / Fastify)
- [ ] SPA React consumindo API (reuso máximo do frontend existente)
- [ ] Multi-usuário concorrente com sessões simultâneas
- [ ] Portal do cliente para acompanhamento de OS

---

## Registro de Problemas / Dívida Técnica

| ID | Versão | Descrição | Status |
|----|--------|-----------|--------|
| — | — | — | — |
