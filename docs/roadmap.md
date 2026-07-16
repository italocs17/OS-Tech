# OS.Tech — Roadmap

> Planejamento das próximas versões e funcionalidades futuras.
> Itens marcados com `[x]` já foram implementados.

---

## v2.0.0 (Atual) — Solicitações por E-mail

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

### Problemas detectados nesta versão

| ID | Problema | Status |
|----|----------|--------|
| — | *(Nenhum reportado ainda)* | — |

---

## v2.1 — Notificações por E-mail

Implementado em: 16/07/2026

- [x] **Notificação de eventos** — Ao adicionar um evento em OS, enviar e-mail para o contato que iniciou a solicitacao (via EmailSolicitacao.contatoId) ou fallback para Cliente.email
- [x] **Envio de PDF na conclusão** — Quando a OS transitar para `CONCLUIDA` ou `ENTREGUE`, enviar o PDF analítico como anexo
- [x] **Serviço SMTP** — Reutilizar credenciais já armazenadas no `email-config.service.ts` (Gmail suporta IMAP + SMTP)

---

## v2.2 — Categorias de Serviços

Pré-planejado em: 03/07/2026

**Objetivo:** Agrupar serviços do catálogo em categorias (Bancada, Rede, CFTV, Servidores, WEB) e permitir categorização manual da OS.

### Funcionalidades

- [ ] Modelo `CategoriaServico` (`id`, `nome` unique, `descricao`, `ativo`)
- [ ] Campo `categoriaId` opcional em `Servico`
- [ ] CRUD de categorias na interface (criar, ativar, inativar)
- [ ] Filtro por categoria no catálogo de serviços
- [ ] Categorização manual da OS pelo operador (especialmente para OSs vindas de e-mail)

### Migração

```prisma
model CategoriaServico {
  id        Int      @id @default(autoincrement())
  nome      String   @unique
  descricao String?
  ativo     Boolean  @default(true)
  servicos  Servico[]

  @@map("categoria_servico")
}

// Servico ganha:
model Servico {
  ...
  categoriaId Int?
  categoria   CategoriaServico? @relation(fields: [categoriaId], references: [id])
  ...
}
```

---

## v2.3 — Contratos e Recorrência

Pré-planejado em: 03/07/2026

**Objetivo:** Suporte a contratos de suporte mensal/recorrente, com geração automática de OS.

### Funcionalidades

- [ ] Modelo `Contrato` (cliente, tipo, vigência, valor recorrente)
- [ ] Geração automática de OS a partir de contrato ativo
- [ ] Relatório financeiro separando serviços avulsos × contratos

---

## v2.4 — Agendamento e Calendário

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
