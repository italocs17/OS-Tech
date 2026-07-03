# OS.Tech - Documento de Casos de Uso

## Visao Geral do Sistema

Sistema de gestao de assistencia tecnica de computadores, 100% offline, com operacao local, backup manual e captura de inventario via PowerShell.

---

## Atores

| Ator | Descricao |
|------|-----------|
| **Tecnico** | Profissional que executa o diagnostico, manutencao e reparo dos equipamentos |
| **Recepcionista** | Atendente que realiza o cadastro de clientes, abertura de OS e entrega de equipamentos |
| **Proprietario** | Dono da assistencia tecnica, responsavel por configuracoes, backups e relatorios gerenciais |
| **Gestor** | Responsavel por operacoes administrativas, relatorios e visao global do negocio |

---

## Casos de Uso

---

### UC-01: Cadastrar Cliente

| Campo | Descricao |
|-------|-----------|
| **Nome** | Cadastrar Cliente |
| **Ator** | Recepcionista |
| **Prioridade** | Alta |

**Pre-condicoes:**
- Sistema esta em execucao e conectado ao banco de dados local.
- Recepcionista esta autenticado no sistema.

**Fluxo Principal:**
1. Recepcionista seleciona a opcao "Clientes" no menu principal.
2. Sistema exibe a lista de clientes cadastrados.
3. Recepcionista clica em "Novo Cliente".
4. Sistema exibe o formulario de cadastro com os campos: Nome, CPF, Telefone, E-mail, Endereco.
5. Recepcionista preenche os campos obrigatorios (Nome, CPF, Telefone).
6. Recepcionista clica em "Salvar".
7. Sistema valida o formato do CPF.
8. Sistema verifica se o CPF ja existe na base.
9. Sistema registra o cliente com status "Ativo".
10. Sistema exibe mensagem de confirmacao "Cliente cadastrado com sucesso".
11. Sistema retorna a lista de clientes atualizada.

**Fluxos Alternativos:**

- **FA-01: CPF invalido**
  - No passo 7, se o CPF nao passar na validacao, sistema exibe mensagem "CPF invalido. Verifique os digitos." e retorna ao passo 5.

- **FA-02: CPF ja cadastrado**
  - No passo 8, se o CPF ja existir, sistema exibe mensagem "Cliente ja cadastrado" com opcao de visualizar o cadastro existente. Recepcionista pode cancelar ou atualizar o cadastro.

- **FA-03: Campo obrigatorio vazio**
  - No passo 6, se algum campo obrigatorio estiver vazio, sistema destaca o campo em vermelho e exibe "Campo obrigatorio".

**Pos-condicoes:**
- Cliente esta registrado no banco de dados local.
- Cliente disponivel para associacao a equipamentos e abertura de OS.

---

### UC-02: Cadastrar Equipamento

| Campo | Descricao |
|-------|-----------|
| **Nome** | Cadastrar Equipamento |
| **Ator** | Recepcionista |
| **Prioridade** | Alta |

**Pre-condicoes:**
- Sistema esta em execucao e conectado ao banco de dados local.
- Recepcionista esta autenticado.
- Cliente responsavel ja esta cadastrado (UC-01).

**Fluxo Principal:**
1. Recepcionista seleciona a opcao "Equipamentos" no menu principal.
2. Sistema exibe a lista de equipamentos cadastrados.
3. Recepcionista clica em "Novo Equipamento".
4. Sistema exibe o formulario de cadastro com os campos: Cliente (selecao), Tipo (Desktop/Notebook/Impressora/Outros), Marca, Modelo, Numero de Serie, Observacoes.
5. Recepcionista seleciona o cliente responsavel.
6. Recepcionista preenche os demais campos obrigatorios (Tipo, Marca, Modelo).
7. Recepcionista clica em "Salvar".
8. Sistema gera automaticamente uma etiqueta unica para o equipamento (ex: EQ-YYYYMMDD-XXXX).
9. Sistema registra o equipamento com status "Cadastrado".
10. Sistema exibe mensagem "Equipamento cadastrado com sucesso" e opcao de imprimir etiqueta.
11. Sistema retorna a lista de equipamentos atualizada.

**Fluxos Alternativos:**

- **FA-01: Cliente nao selecionado**
  - No passo 5, se nenhum cliente for selecionado, sistema exibe "Selecione um cliente" e retorna ao passo 4.

- **FA-02: Numero de serie duplicado**
  - No passo 7, se o numero de serie ja existir, sistema alerta "Equipamento com este numero de serie ja cadastrado" e permite verificar o registro.

- **FA-03: Impressao de etiqueta**
  - No passo 10, se Recepcionista optar por imprimir, sistema gera a etiqueta em formato PDF para impressao.

**Pos-condicoes:**
- Equipamento registrado com etiqueta unica.
- Equipamento associado ao cliente responsavel.
- Equipamento disponivel para abertura de OS.

---

### UC-03: Abrir OS (Ordem de Servico)

| Campo | Descricao |
|-------|-----------|
| **Nome** | Abrir OS |
| **Ator** | Recepcionista |
| **Prioridade** | Alta |

**Pre-condicoes:**
- Sistema esta em execucao e conectado ao banco de dados local.
- Recepcionista esta autenticado.
- Cliente responsavel ja esta cadastrado.
- Equipamento ja esta cadastrado com etiqueta.

**Fluxo Principal:**
1. Recepcionista seleciona a opcao "OS" no menu principal.
2. Sistema exibe a lista de OS existentes.
3. Recepcionista clica em "Nova OS".
4. Sistema exibe o formulario de abertura com os campos: Cliente, Equipamento (filtrado por cliente), Descricao do Problema, Prioridade (Alta/Media/Baixa), Tecnico responsavel.
5. Recepcionista seleciona o cliente.
6. Sistema filtra e exibe os equipamentos do cliente selecionado.
7. Recepcionista seleciona o equipamento.
8. Recepcionista preenche a descricao do problema e a prioridade.
9. Recepcionista seleciona o tecnico responsavel.
10. Recepcionista clica em "Abrir OS".
11. Sistema gera numero sequencial unico para a OS (ex: OS-00001).
12. Sistema registra a OS com status "ABERTA" e data/hora atual.
13. Sistema exibe mensagem "OS aberta com sucesso" e opcao de imprimir a OS.
14. Sistema retorna a lista de OS atualizada.

**Fluxos Alternativos:**

- **FA-01: Cliente sem equipamento**
  - No passo 6, se o cliente nao tiver equipamentos cadastrados, sistema exibe "Cliente sem equipamentos cadastrados" e oferece opcao de cadastrar equipamento (UC-02).

- **FA-02: Tecnico nao selecionado**
  - No passo 9, se nenhum tecnico for selecionado, sistema define automaticamente o tecnico padrao e permite continuacao.

- **FA-03: OS duplicada para mesmo equipamento**
  - No passo 10, se ja existir OS em aberto para o equipamento, sistema alerta e permite visualizar a OS existente ou continuar com nova OS.

**Pos-condicoes:**
- OS criada com numero unico, status "ABERTA" e data/hora de abertura.
- Equipamento associado a OS.
- Tecnico responsavel definido.

---

### UC-04: Registrar Evento na OS

| Campo | Descricao |
|-------|-----------|
| **Nome** | Registrar Evento na OS |
| **Ator** | Tecnico |
| **Prioridade** | Alta |

**Pre-condicoes:**
- Sistema esta em execucao e conectado ao banco de dados local.
- Tecnico esta autenticado.
- OS existe e esta em andamento (status: ABERTA, EM_EXECUCAO, ou AGUARDANDO_APROVACAO).

**Fluxo Principal:**
1. Tecnico seleciona a opcao "OS" no menu principal.
2. Sistema exibe a lista de OS.
3. Tecnico seleciona a OS desejada.
4. Sistema exibe os detalhes da OS com opcoes de acoes.
5. Tecnico clica em "Registrar Evento".
6. Sistema exibe formulario com campos: Descricao do Evento, Data/Hora (preenchido automaticamente), Categoria (Diagnostico/Manutencao/Reparo/Outros).
7. Tecnico preenche a descricao e categoria.
8. Tecnico clica em "Salvar Evento".
9. Sistema registra o evento com data/hora atual e tecnico responsavel.
10. Sistema atualiza o status da OS para "EM_EXECUCAO" (se estava "ABERTA").
11. Sistema exibe mensagem "Evento registrado com sucesso".
12. Sistema retorna aos detalhes da OS com o novo evento na linha do tempo.

**Fluxos Alternativos:**

- **FA-01: OS ja concluida**
  - No passo 3, se a OS ja estiver com status CONCLUIDA, sistema exibe "OS ja concluida. Eventos nao podem ser adicionados."

- **FA-02: OS cancelada**
  - No passo 3, se a OS estiver com status CANCELADA, sistema exibe "OS cancelada. Eventos nao podem ser adicionados."

- **FA-03: Anexo de arquivos**
  - No passo 7, Tecnico pode adicionar imagens ou documentos ao evento. Sistema salva os arquivos no diretorio local configurado.

**Pos-condicoes:**
- Evento registrado na linha do tempo da OS.
- Status da OS atualizado para "EM_EXECUCAO" (se aplicavel).
- Historico de eventos disponivel para consulta.

---

### UC-05: Adicionar Servico a OS

| Campo | Descricao |
|-------|-----------|
| **Nome** | Adicionar Servico a OS |
| **Ator** | Tecnico |
| **Prioridade** | Alta |

**Pre-condicoes:**
- Sistema esta em execucao e conectado ao banco de dados local.
- Tecnico esta autenticado.
- OS existe e esta em andamento.

**Fluxo Principal:**
1. Tecnico acessa a OS desejada (conforme UC-04).
2. Sistema exibe os detalhes da OS.
3. Tecnico clica em "Adicionar Servico".
4. Sistema exibe formulario com campos: Descricao do Servico, Valor (R$), Quantidade.
5. Tecnico preenche os campos.
6. Tecnico clica em "Adicionar".
7. Sistema registra o servico associado a OS.
8. Sistema calcula o valor total do servico (Valor x Quantidade).
9. Sistema atualiza o valor total da OS (soma de todos os servicos e pecas).
10. Sistema exibe mensagem "Servico adicionado com sucesso".
11. Sistema retorna aos detalhes da OS com o novo servico listado.

**Fluxos Alternativos:**

- **FA-01: Servico ja adicionado**
  - No passo 4, sistema pode sugerir servicos ja cadastrados anteriormente (base de conhecimento). Tecnico pode selecionar um servico existente ou criar um novo.

- **FA-02: Valor zero**
  - No passo 5, se o valor for zero, sistema alerta "Valor do servico e R$ 0,00. Confirma?" e permite continuacao ou correcao.

- **FA-03: Remover servico**
  - Apos adicionar, Tecnico pode remover um servico. Sistema recalcula o valor total da OS automaticamente.

**Pos-condicoes:**
- Servico registrado e associado a OS.
- Valor total da OS atualizado.
- Servico disponivel para relatorios e PDF.

---

### UC-06: Adicionar Peca a OS

| Campo | Descricao |
|-------|-----------|
| **Nome** | Adicionar Peca a OS |
| **Ator** | Tecnico |
| **Prioridade** | Alta |

**Pre-condicoes:**
- Sistema esta em execucao e conectado ao banco de dados local.
- Tecnico esta autenticado.
- OS existe e esta em andamento.

**Fluxo Principal:**
1. Tecnico acessa a OS desejada (conforme UC-04).
2. Sistema exibe os detalhes da OS.
3. Tecnico clica em "Adicionar Peca".
4. Sistema exibe formulario com campos: Descricao da Peca, Quantidade, Valor Unitario (R$), Fornecedor (opcional).
5. Tecnico preenche os campos.
6. Tecnico clica em "Adicionar".
7. Sistema registra a peca associada a OS.
8. Sistema calculo o valor total da peca (Quantidade x Valor Unitario).
9. Sistema atualiza o valor total da OS (soma de todos os servicos e pecas).
10. Sistema exibe mensagem "Peca adicionada com sucesso".
11. Sistema retorna aos detalhes da OS com a nova peca listada.

**Fluxos Alternativos:**

- **FA-01: Peca sem estoque**
  - No passo 5, se a peca for nova e nao tiver em estoque, sistema alerta "Peca sem estoque cadastrado" e permite continuar (peca sob encomenda).

- **FA-02: Peca ja adicionada**
  - No passo 4, sistema pode sugerir pecas ja adicionadas anteriormente. Tecnico pode incrementar quantidade ou adicionar nova.

- **FA-03: Remover peca**
  - Apos adicionar, Tecnico pode remover uma peca. Sistema recalcula o valor total da OS automaticamente.

**Pos-condicoes:**
- Peca registrada e associada a OS.
- Valor total da OS atualizado.
- Peca disponivel para relatorios e PDF.

---

### UC-07: Concluir OS

| Campo | Descricao |
|-------|-----------|
| **Nome** | Concluir OS |
| **Ator** | Tecnico |
| **Prioridade** | Alta |

**Pre-condicoes:**
- Sistema esta em execucao e conectado ao banco de dados local.
- Tecnico esta autenticado.
- OS existe e esta em andamento (status: ABERTA ou EM_EXECUCAO).
- Pelo menos um servico ou peca foi adicionado a OS.

**Fluxo Principal:**
1. Tecnico acessa a OS desejada (conforme UC-04).
2. Sistema exibe os detalhes da OS.
3. Tecnico clica em "Concluir OS".
4. Sistema exibe tela de confirmacao com resumo da OS (cliente, equipamento, servicos, pecas, valor total).
5. Tecnico confirma a conclusao.
6. Sistema solicita a solucao final (campo obrigatorio).
7. Tecnico preenche a solucao final.
8. Tecnico clica em "Confirmar Conclusao".
9. Sistema atualiza o status da OS para "CONCLUIDA".
10. Sistema registra a data/hora da conclusao.
11. Sistema exibe mensagem "OS concluida com sucesso".
12. Sistema oferece opcao de gerar PDF da OS.

**Fluxos Alternativos:**

- **FA-01: OS sem servico ou peca**
  - No passo 3, se nao houver servicos ou pecas adicionados, sistema exiba "Adicione ao menos um servico ou peca antes de concluir" e retorna ao passo 2.

- **FA-02: Cancelar conclusao**
  - No passo 5 ou 8, Tecnico pode cancelar a operacao. Sistema retorna aos detalhes da OS sem alterar o status.

- **FA-03: OS com pendencias**
  - Se houver pendencias registradas, sistema alerta e permite concluir mesmo assim ou resolver pendencias primeiro.

**Pos-condicoes:**
- OS com status "CONCLUIDA" e data/hora de conclusao.
- Solucao final registrada.
- Equipamento disponivel para entrega.
- PDF da OS disponivel para geracao.

---

### UC-08: Entregar Equipamento

| Campo | Descricao |
|-------|-----------|
| **Nome** | Entregar Equipamento |
| **Ator** | Recepcionista |
| **Prioridade** | Alta |

**Pre-condicoes:**
- Sistema esta em execucao e conectado ao banco de dados local.
- Recepcionista esta autenticado.
- OS esta concluida.
- Cliente responsavel esta cadastrado.

**Fluxo Principal:**
1. Recepcionista acessa a OS desejada.
2. Sistema exibe os detalhes da OS com status "CONCLUIDA".
3. Recepcionista clica em "Entregar Equipamento".
4. Sistema exibe tela com dados do cliente e equipamento.
5. Recepcionista confirma a identidade do cliente (CPF ou nome).
6. Sistema solicita a assinatura do cliente (digital ou manual).
7. Recepcionista registra a assinatura.
8. Recepcionista clica em "Confirmar Entrega".
9. Sistema atualiza o status da OS para "ENTREGUE".
10. Sistema registra a data/hora da entrega.
11. Sistema exibe mensagem "Equipamento entregue com sucesso".
12. Sistema oferece opcao de gerar recibo de entrega.

**Fluxos Alternativos:**

- **FA-01: Cliente nao presente**
  - No passo 5, se o cliente nao estiver presente, sistema permite entrega com responsavel autorizado (nome e CPF do responsavel).

- **FA-02: OS nao concluida**
  - No passo 2, se a OS nao estiver concluida, sistema exibe "OS nao concluida. Conclua antes de entregar."

- **FA-03: Pagamento pendente**
  - Se houver valores pendentes, sistema alerta e permite registrar pagamento ou gerar fatura.

**Pos-condicoes:**
- OS com status "ENTREGUE" e data/hora de entrega.
- Equipamento devolvido ao cliente.
- Recibo de entrega disponivel para impressao.

---

### UC-09: Capturar Inventario Tecnico (via PowerShell)

| Campo | Descricao |
|-------|-----------|
| **Nome** | Capturar Inventario Tecnico |
| **Ator** | Tecnico |
| **Prioridade** | Media |

**Pre-condicoes:**
- Sistema esta em execucao e conectado ao banco de dados local.
- Tecnico esta autenticado.
- Computador onde o sistema esta instalado possui permissao de administrador para executar scripts PowerShell.
- Script PowerShell de inventario esta disponivel no sistema.

**Fluxo Principal:**
1. Tecnico seleciona a opcao "Inventario" no menu principal.
2. Sistema exibe a tela de inventario com opcoes: "Nova Captura", "Historico".
3. Tecnico clica em "Nova Captura".
4. Sistema exibe aviso: "A captura ira coletar informacoes do hardware e software. Continuar?"
5. Tecnico confirma.
6. Sistema executa o script PowerShell de inventario.
7. Script coleta informacoes: Processador, Memoria RAM, Disco, Placa de Rede, Sistema Operacional, Software instalado, etc.
8. Sistema exibe barra de progresso durante a captura.
9. Sistema processa e organiza os dados coletados.
10. Sistema salva o inventario no banco de dados com data/hora atual.
11. Sistema exibe o inventario formatado com todas as informacoes.
12. Sistema oferece opcao de gerar PDF do inventario.

**Fluxos Alternativos:**

- **FA-01: Permissao negada**
  - No passo 6, se o script nao tiver permissao de administrador, sistema execa "Permissao negada. Execute o sistema como administrador." e retorna ao passo 2.

- **FA-02: Script falha**
  - No passo 7, se o script falhar, sistema exibe mensagem de erro com detalhes e permite tentar novamente.

- **FA-03: Captura cancelada**
  - No passo 4 ou 5, Tecnico pode cancelar a operacao. Sistema retorna ao menu de inventario.

**Pos-condicoes:**
- Inventario registrado no banco de dados com data/hora.
- Informacoes de hardware e software disponiveis para consulta.
- PDF do inventario disponivel para geracao.

---

### UC-10: Gerar Relatorio

| Campo | Descricao |
|-------|-----------|
| **Nome** | Gerar Relatorio |
| **Ator** | Gestor, Proprietario |
| **Prioridade** | Media |

**Pre-condicoes:**
- Sistema esta em execucao e conectado ao banco de dados local.
- Gestor ou Proprietario esta autenticado.
- Existem dados cadastrados no sistema.

**Fluxo Principal:**
1. Gestor seleciona a opcao "Relatorios" no menu principal.
2. Sistema exibe o menu de relatorios com opcoes: "Clientes", "Equipamentos", "OS", "Financeiro", "Inventario".
3. Gestor seleciona o tipo de relatorio desejado.
4. Sistema exibe filtros disponiveis (periodo, status, tecnico, cliente, etc.).
5. Gestor aplica os filtros desejados.
6. Gestor clica em "Gerar Relatorio".
7. Sistema processa os dados e exibe o relatorio na tela.
8. Sistema oferece opcoes de exportacao: PDF, CSV, Impressao.
9. Gestor seleciona a opcao desejada.
10. Sistema gera o arquivo no formato selecionado.
11. Sistema exibe mensagem "Relatorio gerado com sucesso".

**Fluxos Alternativos:**

- **FA-01: Nenhum dado encontrado**
  - No passo 7, se nenhum dado for encontrado com os filtros aplicados, sistema exibe "Nenhum registro encontrado" e permite ajustar os filtros.

- **FA-02: Relatorio vazio**
  - Se o sistema nao tiver dados suficientes, exibe mensagem informativa.

- **FA-03: Exportacao cancelada**
  - No passo 9, se Gestor nao quiser exportar, sistema apenas exibe o relatorio na tela.

**Pos-condicoes:**
- Relatorio disponivel na tela.
- Arquivo exportado (se solicitado).
- Dados filtrados e organizados conforme solicitacao.

---

### UC-11: Gerar PDF

| Campo | Descricao |
|-------|-----------|
| **Nome** | Gerar PDF |
| **Ator** | Tecnico, Recepcionista, Gestor, Proprietario |
| **Prioridade** | Alta |

**Pre-condicoes:**
- Sistema esta em execucao e conectado ao banco de dados local.
- Usuario esta autenticado.
- Dados necessarios estao disponiveis no banco de dados.

**Fluxo Principal:**
1. Usuario acessa o documento desejado (OS, Laudo, Inventario, Recibo).
2. Sistema exibe os detalhes do documento.
3. Usuario clica em "Gerar PDF".
4. Sistema exibe opcoes de template: "OS", "Laudo", "Inventario", "Recibo".
5. Usuario seleciona o template desejado.
6. Sistema gera o PDF com os dados do documento, incluindo logotipo da empresa (se configurado), dados do cliente, equipamento, servicos, pecas, valores, etc.
7. Sistema exibe o PDF em pre-visualizacao.
8. Usuario pode salvar o PDF em disco ou imprimir.
9. Sistema exibe mensagem "PDF gerado com sucesso".

**Fluxos Alternativos:**

- **FA-01: Template nao disponivel**
  - No passo 4, se o template nao estiver disponivel, sistema exibe "Template nao encontrado" e permite selecionar outro.

- **FA-02: Dados insuficientes**
  - No passo 6, se faltarem dados obrigatorios, sistema exibe "Dados insuficientes para gerar PDF" e lista os campos faltantes.

- **FA-03: Erro na geracao**
  - Se ocorrer erro na geracao, sistema exibe mensagem de erro e permite tentar novamente.

**Pos-condicoes:**
- PDF gerado e disponivel para visualizacao, salvamento ou impressao.
- Documento padronizado com identidade visual da empresa.

---

### UC-12: Realizar Backup

| Campo | Descricao |
|-------|-----------|
| **Nome** | Realizar Backup |
| **Ator** | Proprietario, Gestor |
| **Prioridade** | Alta |

**Pre-condicoes:**
- Sistema esta em execucao e conectado ao banco de dados local.
- Proprietario ou Gestor esta autenticado.
- Existe espaco em disco suficiente para o backup.
- Diretorio de backup esta configurado.

**Fluxo Principal:**
1. Proprietario seleciona a opcao "Backup" no menu principal.
2. Sistema exibe a tela de backup com opcoes: "Realizar Backup", "Restaurar Backup", "Configuracoes".
3. Proprietario clica em "Realizar Backup".
4. Sistema exibe aviso: "O backup sera realizado no diretorio configurado. Continuar?"
5. Proprietario confirma.
6. Sistema exibe barra de progresso.
7. Sistema copia o banco de dados e arquivos anexos para o diretorio de backup.
8. Sistema gera arquivo de backup com nome incluindo data/hora (ex: backup_20260624_143000.zip).
9. Sistema exibe mensagem "Backup realizado com sucesso".
10. Sistema exibe o tamanho do arquivo gerado e o local de armazenamento.

**Fluxos Alternativos:**

- **FA-01: Espaco insuficiente**
  - No passo 7, se nao houver espaco suficiente, sistema exibe "Espaco em disco insuficiente" e permite escolher outro diretorio.

- **FA-02: Diretorio nao configurado**
  - No passo 4, se o diretorio nao estiver configurado, sistema solicita a configuracao antes de continuar.

- **FA-03: Backup cancelado**
  - No passo 4 ou 5, Proprietario pode cancelar a operacao.

- **FA-04: Backup automatico**
  - Se configurado, o sistema realiza backup automaticamente em intervalos definidos (diario, semanal, mensal).

**Pos-condicoes:**
- Arquivo de backup gerado no diretorio configurado.
- Backup disponivel para restauracao.
- Registro de backup no log do sistema.

---

### UC-13: Restaurar Backup

| Campo | Descricao |
|-------|-----------|
| **Nome** | Restaurar Backup |
| **Ator** | Proprietario, Gestor |
| **Prioridade** | Alta |

**Pre-condicoes:**
- Sistema esta em execucao.
- Proprietario ou Gestor esta autenticado.
- Existe pelo menos um backup disponivel.
- Diretorio de backup esta acessivel.

**Fluxo Principal:**
1. Proprietario seleciona a opcao "Backup" no menu principal.
2. Sistema exibe a tela de backup.
3. Proprietario clica em "Restaurar Backup".
4. Sistema exibe a lista de backups disponiveis com data/hora e tamanho.
5. Proprietario seleciona o backup desejado.
6. Sistema exibe aviso: "A restauracao ira substituir todos os dados atuais. Esta acao nao pode ser desfeita. Continuar?"
7. Proprietario confirma.
8. Sistema solicita confirmacao adicional (digitar "CONFIRMAR").
9. Proprietario digita "CONFIRMAR".
10. Sistema exibe barra de progresso.
11. Sistema restaura o banco de dados e arquivos anexos.
12. Sistema exibe mensagem "Backup restaurado com sucesso. O sistema sera reiniciado."
13. Sistema reinicia automaticamente.

**Fluxos Alternativos:**

- **FA-01: Nenhum backup disponivel**
  - No passo 4, se nao houver backups, sistema exibe "Nenhum backup encontrado" e retorna ao passo 2.

- **FA-02: Backup corrompido**
  - No passo 10, se o backup estiver corrompido, sistema exibe "Backup corrompido. Nao e possivel restaurar." e permite selecionar outro backup.

- **FA-03: Restauracao cancelada**
  - No passo 6, 7 ou 9, Proprietario pode cancelar a operacao.

- **FA-04: Erro na restauracao**
  - Se ocorrer erro, sistema exibe mensagem de erro e mantem os dados atuais intactos.

**Pos-condicoes:**
- Dados restaurados conforme o backup selecionado.
- Sistema reiniciado e operacional.
- Estado do sistema conforme o momento do backup.

---

### UC-14: Pesquisar (Global)

| Campo | Descricao |
|-------|-----------|
| **Nome** | Pesquisar (Global) |
| **Ator** | Tecnico, Recepcionista, Gestor, Proprietario |
| **Prioridade** | Alta |

**Pre-condicoes:**
- Sistema esta em execucao e conectado ao banco de dados local.
- Usuario esta autenticado.

**Fluxo Principal:**
1. Usuario clica na barra de pesquisa (disponivel no topo de todas as telas) ou atalho de teclado (Ctrl+P).
2. Sistema exibe o campo de pesquisa com sugestoes de filtros: Nome, CPF, Etiqueta, OS, Status, Datas.
3. Usuario digita o termo de busca.
4. Sistema realiza a busca em todas as tabelas: Clientes, Equipamentos, OS, Servicos, Pecas.
5. Sistema exibe os resultados organizados por categoria.
6. Usuario pode clicar em um resultado para ver os detalhes.
7. Sistema exibe os detalhes do item selecionado.

**Fluxos Alternativos:**

- **FA-01: Nenhum resultado**
  - No passo 4, se nenhum resultado for encontrado, sistema exibe "Nenhum resultado encontrado para '[termo]'" e sugere verificar a digitacao ou usar filtros avancados.

- **FA-02: Multiplos resultados**
  - No passo 4, se houver multiplos resultados, sistema exibe os resultados paginados com opcoes de ordenacao (relevancia, data, nome).

- **FA-03: Filtros avancados**
  - No passo 2, Usuario pode selecionar filtros avancados para refinar a busca: periodo especifico, status, tecnico responsavel, tipo de equipamento, etc.

- **FA-04: Busca por CPF**
  - Se o termo digitado for um CPF valido, sistema busca diretamente o cliente e exibe todos os equipamentos e OS associados.

- **FA-05: Busca por Etiqueta**
  - Se o termo digitado corresponder a uma etiqueta de equipamento, sistema exibe o equipamento e todas as OS associadas.

- **FA-06: Busca por Numero de OS**
  - Se o termo digitado corresponder a um numero de OS, sistema exibe diretamente a OS.

**Pos-condicoes:**
- Resultados da busca exibidos na tela.
- Usuario pode navegar para os detalhes de qualquer resultado.
- Historico de buscas recentes disponivel (opcional).

---

## Resumo dos Casos de Uso

| Codigo | Nome | Ator | Prioridade |
|--------|------|------|------------|
| UC-01 | Cadastrar Cliente | Recepcionista | Alta |
| UC-02 | Cadastrar Equipamento | Recepcionista | Alta |
| UC-03 | Abrir OS | Recepcionista | Alta |
| UC-04 | Registrar Evento na OS | Tecnico | Alta |
| UC-05 | Adicionar Servico a OS | Tecnico | Alta |
| UC-06 | Adicionar Peca a OS | Tecnico | Alta |
| UC-07 | Concluir OS | Tecnico | Alta |
| UC-08 | Entregar Equipamento | Recepcionista | Alta |
| UC-09 | Capturar Inventario Tecnico | Tecnico | Media |
| UC-10 | Gerar Relatorio | Gestor, Proprietario | Media |
| UC-11 | Gerar PDF | Todos | Alta |
| UC-12 | Realizar Backup | Proprietario, Gestor | Alta |
| UC-13 | Restaurar Backup | Proprietario, Gestor | Alta |
| UC-14 | Pesquisar (Global) | Todos | Alta |

---

## Glossario

| Termo | Descricao |
|-------|-----------|
| OS | Ordem de Servico - documento que registra a manutencao de um equipamento |
| Etiqueta | Codigo unico gerado automaticamente para identificar o equipamento |
| Laudo | Documento tecnico que descreve o diagnostico e solucao aplicada |
| Inventario | Registro detalhado de hardware e software de um computador |
| Backup | Copia de seguranca dos dados do sistema |
| Evento | Registro de atividade ou ocorrencia durante o atendimento |
| Servico | Atividade tecnica executada no equipamento |
| Peca | Componente de hardware substituido ou adicionado |

---

*Documento gerado em 2026-06-24*
