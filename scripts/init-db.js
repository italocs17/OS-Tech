const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { PrismaClient } = require('../src/main/database/generated');

const dbPath = path.join(__dirname, '..', 'resources', 'db', 'ostech.db');
const dbDir = path.dirname(dbPath);

function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 210000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function randomDateWithinDays(daysBack) {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

function generateEtiqueta() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateSequentialOS(index) {
  return String(index).padStart(4, '0');
}

async function main() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: { url: `file:${dbPath}` },
    },
  });

  await prisma.$connect();

  // ── Apply migrations ─────────────────────────────────────────────────
  const migrationDir = path.join(__dirname, '..', 'prisma', 'migrations');
  const dirs = fs.readdirSync(migrationDir)
    .filter((d) => fs.statSync(path.join(migrationDir, d)).isDirectory())
    .sort();

  for (const dir of dirs) {
    const sql = fs.readFileSync(path.join(migrationDir, dir, 'migration.sql'), 'utf-8');
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      await prisma.$executeRawUnsafe(stmt);
    }
  }

  // ── Usuários ──────────────────────────────────────────────────────────
  const usuarios = await Promise.all([
    prisma.usuario.create({
      data: { nome: 'Admin OS.Tech', login: 'admin', senhaHash: hashPassword('admin123'), perfil: 'PROPRIETARIO', ativo: true },
    }),
    prisma.usuario.create({
      data: { nome: 'João Silva', login: 'joao.silva', senhaHash: hashPassword('tec123'), perfil: 'TECNICO', ativo: true },
    }),
    prisma.usuario.create({
      data: { nome: 'Maria Santos', login: 'maria.santos', senhaHash: hashPassword('rec123'), perfil: 'RECEPCIONISTA', ativo: true },
    }),
    prisma.usuario.create({
      data: { nome: 'Carlos Oliveira', login: 'carlos.oliveira', senhaHash: hashPassword('gest123'), perfil: 'GESTOR', ativo: true },
    }),
  ]);

  // ── Clientes ───────────────────────────────────────────────────────────
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        nome: 'Pedro Henrique Almeida', cpf: '529.982.247-25', rg: '12.345.678-9',
        telefone: '(11) 3456-7890', whatsapp: '(11) 99876-5432', email: 'pedro.almeida@email.com',
        endereco: 'Rua das Flores, 123 - Centro, São Paulo - SP',
        observacoes: 'Cliente preferencial. Atendimento prioritário.',
        dataCadastro: randomDateWithinDays(90), ativo: true,
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Ana Beatriz Souza', cpf: '262.735.830-70', rg: '98.765.432-1',
        telefone: '(21) 2345-6789', whatsapp: '(21) 98765-4321', email: 'ana.souza@gmail.com',
        endereco: 'Av. Brasil, 456 - Copacabana, Rio de Janeiro - RJ',
        dataCadastro: randomDateWithinDays(60), ativo: true,
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Marcos Tech Solutions LTDA', cpf: '12.345.678/0001-90',
        telefone: '(31) 3344-5566', whatsapp: '(31) 99988-7766', email: 'contato@marcostech.com.br',
        endereco: 'Rua da Bahia, 789 - Centro, Belo Horizonte - MG',
        observacoes: 'Pessoa jurídica. CNPJ para notas fiscais.',
        dataCadastro: randomDateWithinDays(120), ativo: true,
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Fernanda Lima Costa', cpf: '155.442.540-90', rg: '45.678.912-3',
        telefone: '(71) 3232-1111', whatsapp: '(71) 98888-2222', email: 'fernanda.lima@yahoo.com',
        endereco: 'Rua Pitangueiras, 32 - Pituba, Salvador - BA',
        dataCadastro: randomDateWithinDays(45), ativo: true,
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Ricardo Mendes Pereira', cpf: '852.147.963-02', rg: '32.165.498-7',
        telefone: '(41) 3555-4444', whatsapp: '(41) 97777-3333', email: 'ricardo.pereira@hotmail.com',
        endereco: 'Av. Ipiranga, 1000 - Centro, Curitiba - PR',
        observacoes: 'Cliente inativo desde 2025-10-01. Sem novos pedidos.',
        dataCadastro: randomDateWithinDays(180), ativo: false,
      },
    }),
  ]);

  // ── Equipamentos ───────────────────────────────────────────────────────
  const equipamentos = await Promise.all([
    prisma.equipamento.create({
      data: { clienteId: clientes[0].id, etiqueta: generateEtiqueta(), tipo: 'Desktop', marca: 'Dell', modelo: 'OptiPlex 7090', numeroSerie: 'DL7090-XK29F', observacoes: 'Torre com LED azul. Pequeno arranhão no painel lateral.', dataCadastro: randomDateWithinDays(60), ativo: true },
    }),
    prisma.equipamento.create({
      data: { clienteId: clientes[0].id, etiqueta: generateEtiqueta(), tipo: 'Notebook', marca: 'Lenovo', modelo: 'ThinkPad T14', numeroSerie: 'LNV-T14-8KM3P', observacoes: 'Algumas marcas de uso na carcaça. Teclado com desgaste.', dataCadastro: randomDateWithinDays(50), ativo: true },
    }),
    prisma.equipamento.create({
      data: { clienteId: clientes[1].id, etiqueta: generateEtiqueta(), tipo: 'Notebook', marca: 'Apple', modelo: 'MacBook Pro 14"', numeroSerie: 'C02FN3XXMD6T', observacoes: 'Cliente reclamou de aquecimento excessivo.', dataCadastro: randomDateWithinDays(30), ativo: true },
    }),
    prisma.equipamento.create({
      data: { clienteId: clientes[2].id, etiqueta: generateEtiqueta(), tipo: 'Desktop', marca: 'HP', modelo: 'ProDesk 400 G7', numeroSerie: 'HP400-3NM7K', dataCadastro: randomDateWithinDays(90), ativo: true },
    }),
    prisma.equipamento.create({
      data: { clienteId: clientes[2].id, etiqueta: generateEtiqueta(), tipo: 'Workstation', marca: 'Dell', modelo: 'Precision 5560', numeroSerie: 'DL5560-9FK2W', observacoes: 'Workstation para desenvolvimento. 32GB RAM.', dataCadastro: randomDateWithinDays(100), ativo: true },
    }),
    prisma.equipamento.create({
      data: { clienteId: clientes[3].id, etiqueta: generateEtiqueta(), tipo: 'Notebook', marca: 'Asus', modelo: 'ZenBook 14', numeroSerie: 'ASUS-ZB4-HN5R8', dataCadastro: randomDateWithinDays(20), ativo: true },
    }),
    prisma.equipamento.create({
      data: { clienteId: clientes[3].id, etiqueta: generateEtiqueta(), tipo: 'Desktop', marca: 'Lenovo', modelo: 'ThinkCentre M720q', numeroSerie: 'LNV-M720-4JN9L', dataCadastro: randomDateWithinDays(40), ativo: true },
    }),
    prisma.equipamento.create({
      data: { clienteId: clientes[4].id, etiqueta: generateEtiqueta(), tipo: 'Notebook', marca: 'HP', modelo: 'Pavilion 15', numeroSerie: 'HP15-PV-7TR2K', observacoes: 'Equipamento inativo. Cliente solicitou baixa.', dataCadastro: randomDateWithinDays(150), ativo: false },
    }),
  ]);

  // ── Serviços ───────────────────────────────────────────────────────────
  const servicos = await Promise.all([
    prisma.servico.create({ data: { descricao: 'Formatação de Sistema Operacional', valorPadrao: 150, ativo: true } }),
    prisma.servico.create({ data: { descricao: 'Limpeza Interna e Externa', valorPadrao: 80, ativo: true } }),
    prisma.servico.create({ data: { descricao: 'Troca de SSD', valorPadrao: 120, ativo: true } }),
    prisma.servico.create({ data: { descricao: 'Instalação Windows 11 Pro', valorPadrao: 200, ativo: true } }),
    prisma.servico.create({ data: { descricao: 'Recuperação de Dados', valorPadrao: 500, ativo: true } }),
    prisma.servico.create({ data: { descricao: 'Troca de Bateria Notebook', valorPadrao: 180, ativo: true } }),
    prisma.servico.create({ data: { descricao: 'Troca de Tela Notebook', valorPadrao: 450, ativo: true } }),
    prisma.servico.create({ data: { descricao: 'Backup Completo de Dados', valorPadrao: 50, ativo: false } }),
  ]);

  // ── Peças ──────────────────────────────────────────────────────────────
  const pecas = await Promise.all([
    prisma.peca.create({ data: { descricao: 'SSD 240GB', fabricante: 'Kingston', valorReferencia: 189.90, ativo: true } }),
    prisma.peca.create({ data: { descricao: 'SSD 512GB', fabricante: 'Samsung', valorReferencia: 349.90, ativo: true } }),
    prisma.peca.create({ data: { descricao: 'Memória RAM 8GB DDR4', fabricante: 'Corsair', valorReferencia: 159.90, ativo: true } }),
    prisma.peca.create({ data: { descricao: 'Memória RAM 16GB DDR4', fabricante: 'Kingston', valorReferencia: 289.90, ativo: true } }),
    prisma.peca.create({ data: { descricao: 'Bateria Notebook', fabricante: 'HP', valorReferencia: 220.00, ativo: true } }),
    prisma.peca.create({ data: { descricao: 'Tela Notebook 14"', fabricante: 'LG', valorReferencia: 450.00, ativo: false } }),
  ]);

  // ── Ordens de Serviço ──────────────────────────────────────────────────
  const osList = await Promise.all([
    prisma.ordemServico.create({
      data: {
        numeroOS: generateSequentialOS(1), clienteId: clientes[0].id, equipamentoId: equipamentos[0].id,
        status: 'ENTREGUE',
        dataEntrada: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        dataPrevisao: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
        dataConclusao: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
        observacoes: 'Computador lento. Cliente solicitou formatação e limpeza.',
      },
    }),
    prisma.ordemServico.create({
      data: {
        numeroOS: generateSequentialOS(2), clienteId: clientes[0].id, equipamentoId: equipamentos[1].id,
        status: 'CONCLUIDA',
        dataEntrada: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        dataPrevisao: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        dataConclusao: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        observacoes: 'Notebook com SSD lento. Troca de SSD e instalação Windows.',
      },
    }),
    prisma.ordemServico.create({
      data: {
        numeroOS: generateSequentialOS(3), clienteId: clientes[1].id, equipamentoId: equipamentos[2].id,
        status: 'EM_EXECUCAO',
        dataEntrada: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        dataPrevisao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        observacoes: 'MacBook aquecendo muito. Limpeza e troca de pasta térmica.',
      },
    }),
    prisma.ordemServico.create({
      data: {
        numeroOS: generateSequentialOS(4), clienteId: clientes[2].id, equipamentoId: equipamentos[3].id,
        status: 'AGUARDANDO_APROVACAO',
        dataEntrada: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dataPrevisao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        observacoes: 'Diagnóstico: HD com setores defeituosos. Aguardando aprovação para troca.',
      },
    }),
    prisma.ordemServico.create({
      data: {
        numeroOS: generateSequentialOS(5), clienteId: clientes[3].id, equipamentoId: equipamentos[5].id,
        status: 'EM_DIAGNOSTICO',
        dataEntrada: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        dataPrevisao: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        observacoes: 'Notebook não liga. Em diagnóstico inicial.',
      },
    }),
    prisma.ordemServico.create({
      data: {
        numeroOS: generateSequentialOS(6), clienteId: clientes[3].id, equipamentoId: equipamentos[6].id,
        status: 'ABERTA',
        dataEntrada: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        dataPrevisao: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        observacoes: 'Cliente solicitou orçamento para upgrade de memória.',
      },
    }),
    prisma.ordemServico.create({
      data: {
        numeroOS: generateSequentialOS(7), clienteId: clientes[0].id, equipamentoId: null,
        tipoAtendimento: 'INTERNO',
        status: 'EM_EXECUCAO',
        dataEntrada: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        dataPrevisao: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        observacoes: 'Atendimento remoto: cliente solicitou instalação de antivírus e configuração de e-mail.',
      },
    }),
  ]);

  // ── Eventos ─────────────────────────────────────────────────────────────
  const eventosData = [
    { osId: osList[0].id, usuarioId: usuarios[2].id, descricao: 'Equipamento recebido na recepção. Cliente deixou computador e carregador.', dataHora: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
    { osId: osList[0].id, usuarioId: usuarios[1].id, descricao: 'Diagnóstico inicial: sistema operacional corrompido, muitos programas em segundo plano.', dataHora: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000) },
    { osId: osList[0].id, usuarioId: usuarios[1].id, descricao: 'Formatação concluída. Windows 11 Pro instalado e drivers atualizados.', dataHora: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000) },
    { osId: osList[0].id, usuarioId: usuarios[1].id, descricao: 'Limpeza interna realizada. Removida 2kg de poeira do cooler.', dataHora: new Date(Date.now() - 22.5 * 24 * 60 * 60 * 1000) },
    { osId: osList[0].id, usuarioId: usuarios[2].id, descricao: 'Equipamento entregue ao cliente. Teste de estabilidade OK.', dataHora: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000) },
    { osId: osList[1].id, usuarioId: usuarios[2].id, descricao: 'Notebook recebido. Cliente relatou lentidão extrema.', dataHora: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000) },
    { osId: osList[1].id, usuarioId: usuarios[1].id, descricao: 'Diagnóstico: SSD Samsung 240GB com saúde em 15%. Necessária troca urgente.', dataHora: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000) },
    { osId: osList[1].id, usuarioId: usuarios[1].id, descricao: 'SSD substituído por Kingston 512GB. Dados migrados com sucesso.', dataHora: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000) },
    { osId: osList[1].id, usuarioId: usuarios[1].id, descricao: 'Windows 11 instalado. Todos os drivers Lenovo atualizados.', dataHora: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
    { osId: osList[1].id, usuarioId: usuarios[3].id, descricao: 'OS concluída. Aguardando cliente para retirada.', dataHora: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    { osId: osList[2].id, usuarioId: usuarios[2].id, descricao: 'MacBook Pro recebido. Cliente relatou aquecimento e desligamentos.', dataHora: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    { osId: osList[2].id, usuarioId: usuarios[1].id, descricao: 'Diagnóstico: ventoinha obstruída, pasta térmica ressecada.', dataHora: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) },
    { osId: osList[2].id, usuarioId: usuarios[1].id, descricao: 'Limpeza interna concluída. Pasta térmica substituída.', dataHora: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
    { osId: osList[3].id, usuarioId: usuarios[2].id, descricao: 'HP ProDesk recebido para diagnóstico.', dataHora: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    { osId: osList[3].id, usuarioId: usuarios[1].id, descricao: 'HD com 876 setores defeituosos. Risco iminente de perda de dados.', dataHora: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
    { osId: osList[3].id, usuarioId: usuarios[3].id, descricao: 'Orçamento enviado ao cliente: SSD 512GB Samsung + instalação. Aguardando aprovação.', dataHora: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { osId: osList[4].id, usuarioId: usuarios[2].id, descricao: 'Asus ZenBook recebido. Não liga.', dataHora: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { osId: osList[4].id, usuarioId: usuarios[1].id, descricao: 'Teste de fonte: OK. Verificando placa-mãe.', dataHora: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { osId: osList[5].id, usuarioId: usuarios[2].id, descricao: 'Solicitação de upgrade de memória registrada. Cliente quer aumentar de 8GB para 16GB.', dataHora: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { osId: osList[6].id, usuarioId: usuarios[2].id, descricao: 'Cliente ligou solicitando instalação de antivírus e configuração de e-mail no Outlook.', dataHora: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { osId: osList[6].id, usuarioId: usuarios[2].id, descricao: 'Acesso remoto via AnyDesk. ID de sessão: 123 456 789.', dataHora: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000) },
    { osId: osList[6].id, usuarioId: usuarios[1].id, descricao: 'Antivírus Avast Free instalado e configurado. Verificação completa realizada sem ameaças.', dataHora: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000) },
    { osId: osList[6].id, usuarioId: usuarios[1].id, descricao: 'E-mail configurado no Outlook 365. Conta do cliente (pedro@email.com) testada e funcionando.', dataHora: new Date(Date.now() - 1.2 * 24 * 60 * 60 * 1000) },
    { osId: osList[6].id, usuarioId: usuarios[1].id, descricao: 'Atendimento remoto finalizado. Cliente confirmou que tudo está funcionando.', dataHora: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  ];
  await prisma.eventoOS.createMany({ data: eventosData });

  // ── Itens de OS ─────────────────────────────────────────────────────────
  await prisma.$transaction([
    prisma.itemOS.create({ data: { osId: osList[0].id, tipoItem: 'SERVICO', referenciaId: servicos[0].id, descricao: 'Formatação de Sistema Operacional', quantidade: 1, valorUnitario: 150, valorTotal: 150 } }),
    prisma.itemOS.create({ data: { osId: osList[0].id, tipoItem: 'SERVICO', referenciaId: servicos[1].id, descricao: 'Limpeza Interna e Externa', quantidade: 1, valorUnitario: 80, valorTotal: 80 } }),
    prisma.itemOS.create({ data: { osId: osList[1].id, tipoItem: 'SERVICO', referenciaId: servicos[2].id, descricao: 'Troca de SSD', quantidade: 1, valorUnitario: 120, valorTotal: 120 } }),
    prisma.itemOS.create({ data: { osId: osList[1].id, tipoItem: 'SERVICO', referenciaId: servicos[3].id, descricao: 'Instalação Windows 11 Pro', quantidade: 1, valorUnitario: 200, valorTotal: 200 } }),
    prisma.itemOS.create({ data: { osId: osList[1].id, tipoItem: 'PECA', referenciaId: pecas[1].id, descricao: 'SSD 512GB Samsung', quantidade: 1, valorUnitario: 349.90, valorTotal: 349.90 } }),
    prisma.itemOS.create({ data: { osId: osList[2].id, tipoItem: 'SERVICO', referenciaId: servicos[1].id, descricao: 'Limpeza Interna e Externa', quantidade: 1, valorUnitario: 80, valorTotal: 80 } }),
    prisma.itemOS.create({ data: { osId: osList[3].id, tipoItem: 'SERVICO', referenciaId: servicos[2].id, descricao: 'Troca de SSD (orçamento)', quantidade: 1, valorUnitario: 120, valorTotal: 120 } }),
    prisma.itemOS.create({ data: { osId: osList[3].id, tipoItem: 'PECA', referenciaId: pecas[1].id, descricao: 'SSD 512GB Samsung (orçamento)', quantidade: 1, valorUnitario: 349.90, valorTotal: 349.90 } }),
    prisma.itemOS.create({ data: { osId: osList[5].id, tipoItem: 'PECA', referenciaId: pecas[3].id, descricao: 'Memória RAM 16GB DDR4 Kingston', quantidade: 1, valorUnitario: 289.90, valorTotal: 289.90 } }),
    prisma.itemOS.create({ data: { osId: osList[6].id, tipoItem: 'SERVICO', referenciaId: servicos[0].id, descricao: 'Instalação de Antivírus', quantidade: 1, valorUnitario: 150, valorTotal: 150 } }),
  ]);

  // ── Inventários ─────────────────────────────────────────────────────────
  await prisma.inventario.create({
    data: {
      osId: osList[0].id, dataCaptura: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
      jsonCompleto: JSON.stringify({
        sistema_operacional: { nome: 'Windows 10 Home', versao: '22H2', build: '19045.3803' },
        processador: { modelo: 'Intel Core i5-11400', nucleos: 6, threads: 12, frequencia_ghz: 2.6 },
        memoria_ram: { total_gb: 8, tipo: 'DDR4', velocidade_mhz: 3200, slots_usados: 1 },
        discos: [{ modelo: 'WD Blue 1TB', tipo: 'HDD', capacidade_gb: 1000, saude: 95 }, { modelo: 'Kingston A400 240GB', tipo: 'SSD', capacidade_gb: 240, saude: 78 }],
        rede: { ip_local: '192.168.1.45', mac_address: 'A1:B2:C3:D4:E5:F6', tipo_conexao: 'Ethernet' },
        placa_mae: { fabricante: 'Dell', modelo: 'OptiPlex 7090', bios_version: '1.15.0' },
        programas_instalados: ['Google Chrome v120', 'Microsoft Office 2019', 'WinRAR 6.24', 'Adobe Reader XI', 'Skype', 'CCleaner', '23 programas em segundo plano'],
        observacoes: 'Sistema com muitos programas desnecessários em inicialização. HD fragmentado.',
      }),
    },
  });

  await prisma.inventario.create({
    data: {
      osId: osList[1].id, dataCaptura: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
      jsonCompleto: JSON.stringify({
        sistema_operacional: { nome: 'Windows 10 Pro', versao: '21H2', build: '19044.1826' },
        processador: { modelo: 'Intel Core i7-1185G7', nucleos: 4, threads: 8, frequencia_ghz: 3.0 },
        memoria_ram: { total_gb: 8, tipo: 'DDR4', velocidade_mhz: 3200, slots_usados: 1 },
        discos: [{ modelo: 'Samsung PM871b 256GB', tipo: 'SSD', capacidade_gb: 256, saude: 15 }],
        rede: { ip_local: '10.0.0.87', mac_address: 'F6:E5:D4:C3:B2:A1', tipo_conexao: 'Wi-Fi' },
        placa_mae: { fabricante: 'Lenovo', modelo: 'ThinkPad T14 Gen 2', bios_version: '1.35' },
        programas_instalados: ['Google Chrome v119', 'Microsoft Office 365', 'Slack Desktop', 'Zoom 5.13', 'Node.js v20', 'VS Code 1.85', 'Docker Desktop'],
        observacoes: 'SSD em estado crítico. Sistema lento para inicializar. 45 minutos para boot.',
      }),
    },
  });

  // ── Logs ────────────────────────────────────────────────────────────────
  const logsData = [
    { dataHora: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), nivel: 'INFO', categoria: 'AUTH', acao: 'LOGIN', descricao: 'Usuário admin realizou login com sucesso.', usuarioId: usuarios[0].id },
    { dataHora: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000), nivel: 'INFO', categoria: 'CLIENTE', acao: 'CLIENTE_CRIADO', descricao: 'Cliente Pedro Henrique Almeida cadastrado.', usuarioId: usuarios[2].id },
    { dataHora: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000), nivel: 'INFO', categoria: 'OS', acao: 'OS_CRIADA', descricao: 'OS 0001 criada para Pedro Henrique Almeida - Desktop Dell OptiPlex 7090.', usuarioId: usuarios[2].id },
    { dataHora: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), nivel: 'INFO', categoria: 'OS', acao: 'STATUS_ALTERADO', descricao: 'OS 0001 status alterado para CONCLUIDA.', usuarioId: usuarios[1].id },
    { dataHora: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), nivel: 'INFO', categoria: 'AUTH', acao: 'LOGIN', descricao: 'Usuário joao.silva realizou login com sucesso.', usuarioId: usuarios[1].id },
    { dataHora: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), nivel: 'INFO', categoria: 'OS', acao: 'OS_CRIADA', descricao: 'OS 0002 criada para Pedro Henrique Almeida - Notebook Lenovo ThinkPad T14.', usuarioId: usuarios[2].id },
    { dataHora: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), nivel: 'INFO', categoria: 'BACKUP', acao: 'BACKUP_CONCLUIDO', descricao: 'Backup automático do banco de dados realizado com sucesso.', usuarioId: usuarios[0].id },
    { dataHora: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), nivel: 'INFO', categoria: 'CLIENTE', acao: 'CLIENTE_CRIADO', descricao: 'Cliente Ana Beatriz Souza cadastrado.', usuarioId: usuarios[2].id },
    { dataHora: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), nivel: 'INFO', categoria: 'OS', acao: 'STATUS_ALTERADO', descricao: 'OS 0004 status alterado para AGUARDANDO_APROVACAO. Orçamento enviado ao cliente.', usuarioId: usuarios[3].id },
    { dataHora: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), nivel: 'INFO', categoria: 'AUTH', acao: 'LOGIN', descricao: 'Usuário maria.santos realizou login com sucesso.', usuarioId: usuarios[2].id },
  ];
  await prisma.log.createMany({ data: logsData });

  await prisma.$disconnect();
  console.log('Pre-seeded database created at', dbPath);
}

main().catch((e) => {
  console.error('Failed to initialize database:', e);
  process.exit(1);
});
