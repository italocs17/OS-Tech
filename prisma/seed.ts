const { PrismaClient, StatusOS, TipoItem, PerfilUsuario, NivelLog, CategoriaLog } = require('../src/main/database/generated');
import { hashPassword } from '../src/main/services/password.service';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateEtiqueta(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateSequentialOS(index: number): string {
  return String(index).padStart(4, '0');
}

function randomDateWithinDays(daysBack: number): Date {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return new Date(
    past.getTime() + Math.random() * (now.getTime() - past.getTime())
  );
}

// ─── Main Seed ──────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed do banco de dados OS.Tech...\n');

  // ── 0. Limpar dados existentes (ordem correta para FKs) ──────────────
  console.log('🧹 Limpando dados existentes...');
  await prisma.log.deleteMany();
  await prisma.eventoOS.deleteMany();
  await prisma.itemOS.deleteMany();
  await prisma.inventario.deleteMany();
  await prisma.ordemServico.deleteMany();
  await prisma.equipamento.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.servico.deleteMany();
  await prisma.subcategoriaServico.deleteMany();
  await prisma.categoriaServico.deleteMany();
  await prisma.peca.deleteMany();
  await prisma.usuarioEquipe.deleteMany();
  await prisma.equipeCategoria.deleteMany();
  await prisma.equipe.deleteMany();
  await prisma.usuario.deleteMany();
  console.log('   Dados limpos com sucesso.\n');

  // ── 1. Usuários ───────────────────────────────────────────────────────
  console.log('👤 Criando usuários...');

  const usuarios = await Promise.all([
    prisma.usuario.create({
      data: {
        nome: 'Admin OS.Tech',
        login: 'admin',
        senhaHash: hashPassword('admin123'),
        perfil: PerfilUsuario.PROPRIETARIO,
        ativo: true,
      },
    }),
    prisma.usuario.create({
      data: {
        nome: 'João Silva',
        login: 'joao.silva',
        senhaHash: hashPassword('tec123'),
        perfil: PerfilUsuario.TECNICO,
        ativo: true,
      },
    }),
    prisma.usuario.create({
      data: {
        nome: 'Maria Santos',
        login: 'maria.santos',
        senhaHash: hashPassword('rec123'),
        perfil: PerfilUsuario.RECEPCIONISTA,
        ativo: true,
      },
    }),
    prisma.usuario.create({
      data: {
        nome: 'Carlos Oliveira',
        login: 'carlos.oliveira',
        senhaHash: hashPassword('gest123'),
        perfil: PerfilUsuario.GESTOR,
        ativo: true,
      },
    }),
  ]);
  console.log(`   ${usuarios.length} usuários criados.\n`);

  // ── 2. Clientes ───────────────────────────────────────────────────────
  console.log('👥 Criando clientes...');
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        nome: 'Pedro Henrique Almeida',
        cpfCnpj: '529.982.247-25',
        rg: '12.345.678-9',
        telefone: '(11) 3456-7890',
        whatsapp: '(11) 99876-5432',
        email: 'pedro.almeida@email.com',
        endereco: 'Rua das Flores, 123 - Centro, São Paulo - SP',
        observacoes: 'Cliente preferencial. Atendimento prioritário.',
        dataCadastro: randomDateWithinDays(90),
        ativo: true,
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Ana Beatriz Souza',
        cpfCnpj: '262.735.830-70',
        rg: '98.765.432-1',
        telefone: '(21) 2345-6789',
        whatsapp: '(21) 98765-4321',
        email: 'ana.souza@gmail.com',
        endereco: 'Av. Brasil, 456 - Copacabana, Rio de Janeiro - RJ',
        dataCadastro: randomDateWithinDays(60),
        ativo: true,
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Marcos Tech Solutions LTDA',
        cpfCnpj: '12.345.678/0001-90',
        telefone: '(31) 3344-5566',
        whatsapp: '(31) 99988-7766',
        email: 'contato@marcostech.com.br',
        endereco: 'Rua da Bahia, 789 - Centro, Belo Horizonte - MG',
        observacoes: 'Pessoa jurídica. CNPJ para notas fiscais.',
        dataCadastro: randomDateWithinDays(120),
        ativo: true,
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Fernanda Lima Costa',
        cpfCnpj: '155.442.540-90',
        rg: '45.678.912-3',
        telefone: '(71) 3232-1111',
        whatsapp: '(71) 98888-2222',
        email: 'fernanda.lima@yahoo.com',
        endereco: 'Rua Pitangueiras, 32 - Pituba, Salvador - BA',
        dataCadastro: randomDateWithinDays(45),
        ativo: true,
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Ricardo Mendes Pereira',
        cpfCnpj: '852.147.963-02',
        rg: '32.165.498-7',
        telefone: '(41) 3555-4444',
        whatsapp: '(41) 97777-3333',
        email: 'ricardo.pereira@hotmail.com',
        endereco: 'Av. Ipiranga, 1000 - Centro, Curitiba - PR',
        observacoes: 'Cliente inativo desde 2025-10-01. Sem novos pedidos.',
        dataCadastro: randomDateWithinDays(180),
        ativo: false,
      },
    }),
  ]);
  console.log(`   ${clientes.length} clientes criados (1 inativo).\n`);

  // ── 3. Equipamentos ──────────────────────────────────────────────────
  console.log('🖥️  Criando equipamentos...');
  const equipamentos = await Promise.all([
    prisma.equipamento.create({
      data: {
        clienteId: clientes[0].id,
        etiqueta: generateEtiqueta(),
        tipo: 'Desktop',
        marca: 'Dell',
        modelo: 'OptiPlex 7090',
        numeroSerie: 'DL7090-XK29F',
        observacoes: 'Torre com LED azul. Pequeno arranhão no painel lateral.',
        dataCadastro: randomDateWithinDays(60),
        ativo: true,
      },
    }),
    prisma.equipamento.create({
      data: {
        clienteId: clientes[0].id,
        etiqueta: generateEtiqueta(),
        tipo: 'Notebook',
        marca: 'Lenovo',
        modelo: 'ThinkPad T14',
        numeroSerie: 'LNV-T14-8KM3P',
        observacoes: 'Algumas marcas de uso na carcaça. Teclado com desgaste.',
        dataCadastro: randomDateWithinDays(50),
        ativo: true,
      },
    }),
    prisma.equipamento.create({
      data: {
        clienteId: clientes[1].id,
        etiqueta: generateEtiqueta(),
        tipo: 'Notebook',
        marca: 'Apple',
        modelo: 'MacBook Pro 14"',
        numeroSerie: 'C02FN3XXMD6T',
        observacoes: 'Cliente reclamou de aquecimento excessivo.',
        dataCadastro: randomDateWithinDays(30),
        ativo: true,
      },
    }),
    prisma.equipamento.create({
      data: {
        clienteId: clientes[2].id,
        etiqueta: generateEtiqueta(),
        tipo: 'Desktop',
        marca: 'HP',
        modelo: 'ProDesk 400 G7',
        numeroSerie: 'HP400-3NM7K',
        dataCadastro: randomDateWithinDays(90),
        ativo: true,
      },
    }),
    prisma.equipamento.create({
      data: {
        clienteId: clientes[2].id,
        etiqueta: generateEtiqueta(),
        tipo: 'Workstation',
        marca: 'Dell',
        modelo: 'Precision 5560',
        numeroSerie: 'DL5560-9FK2W',
        observacoes: 'Workstation para desenvolvimento. 32GB RAM.',
        dataCadastro: randomDateWithinDays(100),
        ativo: true,
      },
    }),
    prisma.equipamento.create({
      data: {
        clienteId: clientes[3].id,
        etiqueta: generateEtiqueta(),
        tipo: 'Notebook',
        marca: 'Asus',
        modelo: 'ZenBook 14',
        numeroSerie: 'ASUS-ZB4-HN5R8',
        dataCadastro: randomDateWithinDays(20),
        ativo: true,
      },
    }),
    prisma.equipamento.create({
      data: {
        clienteId: clientes[3].id,
        etiqueta: generateEtiqueta(),
        tipo: 'Desktop',
        marca: 'Lenovo',
        modelo: 'ThinkCentre M720q',
        numeroSerie: 'LNV-M720-4JN9L',
        dataCadastro: randomDateWithinDays(40),
        ativo: true,
      },
    }),
    prisma.equipamento.create({
      data: {
        clienteId: clientes[4].id,
        etiqueta: generateEtiqueta(),
        tipo: 'Notebook',
        marca: 'HP',
        modelo: 'Pavilion 15',
        numeroSerie: 'HP15-PV-7TR2K',
        observacoes: 'Equipamento inativo. Cliente solicitou baixa.',
        dataCadastro: randomDateWithinDays(150),
        ativo: false,
      },
    }),
  ]);
  console.log(`   ${equipamentos.length} equipamentos criados (1 inativo).\n`);

  // ── 4. Categorias de Serviços ───────────────────────────────────────
  console.log('🏷️  Criando categorias de serviços...');
  const categorias = await Promise.all([
    prisma.categoriaServico.create({
      data: {
        nome: 'Bancada',
        descricao: 'Servicos realizados na bancada de trabalho',
        ativo: true,
        subcategorias: {
          create: [
            { nome: 'Manutencao Preventiva', descricao: 'Limpeza, troca de pasta termica, verificacao geral', ativo: true },
            { nome: 'Instalacao', descricao: 'Instalacao de sistemas operacionais e drivers', ativo: true },
            { nome: 'Formatacao', descricao: 'Formatacao completa e configuracao de software', ativo: true },
          ],
        },
      },
    }),
    prisma.categoriaServico.create({
      data: {
        nome: 'Rede',
        descricao: 'Configuracao e manutencao de redes',
        ativo: true,
        subcategorias: {
          create: [
            { nome: 'Configuracao de Rede', descricao: 'Setup de roteadores, switches e firewalls', ativo: true },
            { nome: 'Cabeamento Estruturado', descricao: 'Instalacao e manutencao de cabeamento de rede', ativo: true },
          ],
        },
      },
    }),
    prisma.categoriaServico.create({
      data: {
        nome: 'CFTV',
        descricao: 'Instalacao e manutencao de sistemas de vigilancia',
        ativo: true,
        subcategorias: {
          create: [
            { nome: 'Instalacao CFTV', descricao: 'Instalacao de cameras e gravadores', ativo: true },
            { nome: 'Manutencao CFTV', descricao: 'Manutencao preventiva e corretiva de sistemas de vigilancia', ativo: true },
          ],
        },
      },
    }),
    prisma.categoriaServico.create({
      data: {
        nome: 'Servidores',
        descricao: 'Manutencao e configuracao de servidores',
        ativo: true,
        subcategorias: {
          create: [
            { nome: 'Manutencao Servidor', descricao: 'Manutencao preventiva e corretiva de servidores', ativo: true },
            { nome: 'Configuracao Servidor', descricao: 'Setup e configuracao de servidores', ativo: true },
          ],
        },
      },
    }),
    prisma.categoriaServico.create({
      data: {
        nome: 'WEB',
        descricao: 'Servicos web, hospedagem e dominios',
        ativo: true,
        subcategorias: {
          create: [
            { nome: 'Hospedagem', descricao: 'Configuracao e manutencao de hospedagem web', ativo: true },
            { nome: 'Dominio', descricao: 'Gerenciamento de dominios e DNS', ativo: true },
          ],
        },
      },
    }),
  ]);
  console.log(`   ${categorias.length} categorias criadas com subcategorias.\n`);

  // Buscar subcategorias criadas para vincular aos serviços
  const subcategoriasAll = await prisma.subcategoriaServico.findMany({
    include: { categoria: true },
    orderBy: [{ categoriaId: 'asc' }, { id: 'asc' }],
  });
  const subByCategoria: Record<number, typeof subcategoriasAll> = {};
  for (const s of subcategoriasAll) {
    if (!subByCategoria[s.categoriaId]) subByCategoria[s.categoriaId] = [];
    subByCategoria[s.categoriaId].push(s);
  }

  // ── 5. Equipes ──────────────────────────────────────────────────────
  console.log('🏢 Criando equipes...');
  const equipes = await Promise.all([
    prisma.equipe.create({
      data: {
        nome: 'Equipe Bancada',
        descricao: 'Equipe responsavel por servicos de bancada',
        ativo: true,
        categorias: {
          create: [{ categoriaId: categorias[0].id }],
        },
      },
    }),
    prisma.equipe.create({
      data: {
        nome: 'Equipe Rede',
        descricao: 'Equipe responsavel por servicos de rede',
        ativo: true,
        categorias: {
          create: [{ categoriaId: categorias[1].id }],
        },
      },
    }),
    prisma.equipe.create({
      data: {
        nome: 'Equipe CFTV',
        descricao: 'Equipe responsavel por servicos de CFTV',
        ativo: true,
        categorias: {
          create: [{ categoriaId: categorias[2].id }],
        },
      },
    }),
    prisma.equipe.create({
      data: {
        nome: 'Equipe Servidores',
        descricao: 'Equipe responsavel por servicos de servidores',
        ativo: true,
        categorias: {
          create: [{ categoriaId: categorias[3].id }],
        },
      },
    }),
    prisma.equipe.create({
      data: {
        nome: 'Equipe Suporte',
        descricao: 'Equipe de suporte geral - atendimento presencial e remoto',
        ativo: true,
        categorias: {
          create: [
            { categoriaId: categorias[4].id },
            { categoriaId: categorias[0].id },
          ],
        },
      },
    }),
  ]);
  console.log(`   ${equipes.length} equipes criadas.\n`);

  // ── 6. Vínculos Usuário-Equipe ───────────────────────────────────────
  console.log('🔗 Criando vinculos usuario-equipe...');
  await prisma.usuarioEquipe.createMany({
    data: [
      // João Silva (Técnico) → Equipe Bancada + Equipe Suporte
      { usuarioId: usuarios[1].id, equipeId: equipes[0].id },
      { usuarioId: usuarios[1].id, equipeId: equipes[4].id },
      // Maria Santos (Recepcionista) → Equipe Bancada + Equipe Rede + Equipe CFTV
      { usuarioId: usuarios[2].id, equipeId: equipes[0].id },
      { usuarioId: usuarios[2].id, equipeId: equipes[1].id },
      { usuarioId: usuarios[2].id, equipeId: equipes[2].id },
    ],
  });
  console.log('   5 vinculos criados (Joao→Bancada+Suporte, Maria→Bancada+Rede+CFTV).\n');

  // ── 7. Catálogo de Serviços ───────────────────────────────────────────
  console.log('🔧 Criando catálogo de serviços...');
  const catBancada = subByCategoria[categorias[0].id] ?? [];
  const servicos = await Promise.all([
    prisma.servico.create({
      data: { descricao: 'Formatação de Sistema Operacional', valorPadrao: 150, ativo: true, categoriaId: categorias[0].id, subcategoriaId: catBancada[2]?.id },
    }),
    prisma.servico.create({
      data: { descricao: 'Limpeza Interna e Externa', valorPadrao: 80, ativo: true, categoriaId: categorias[0].id, subcategoriaId: catBancada[0]?.id },
    }),
    prisma.servico.create({
      data: { descricao: 'Troca de SSD', valorPadrao: 120, ativo: true, categoriaId: categorias[0].id, subcategoriaId: catBancada[0]?.id },
    }),
    prisma.servico.create({
      data: { descricao: 'Instalação Windows 11 Pro', valorPadrao: 200, ativo: true, categoriaId: categorias[0].id, subcategoriaId: catBancada[1]?.id },
    }),
    prisma.servico.create({
      data: { descricao: 'Recuperação de Dados', valorPadrao: 500, ativo: true, categoriaId: categorias[0].id, subcategoriaId: catBancada[2]?.id },
    }),
    prisma.servico.create({
      data: { descricao: 'Troca de Bateria Notebook', valorPadrao: 180, ativo: true, categoriaId: categorias[0].id, subcategoriaId: catBancada[0]?.id },
    }),
    prisma.servico.create({
      data: { descricao: 'Troca de Tela Notebook', valorPadrao: 450, ativo: true, categoriaId: categorias[0].id, subcategoriaId: catBancada[0]?.id },
    }),
    prisma.servico.create({
      data: { descricao: 'Backup Completo de Dados', valorPadrao: 50, ativo: false },
    }),
  ]);
  console.log(`   ${servicos.length} serviços criados (1 inativo).\n`);

  // ── 8. Catálogo de Peças ──────────────────────────────────────────────
  console.log('🔩 Criando catálogo de peças...');
  const pecas = await Promise.all([
    prisma.peca.create({
      data: {
        descricao: 'SSD 240GB',
        fabricante: 'Kingston',
        valorReferencia: 189.90,
        ativo: true,
      },
    }),
    prisma.peca.create({
      data: {
        descricao: 'SSD 512GB',
        fabricante: 'Samsung',
        valorReferencia: 349.90,
        ativo: true,
      },
    }),
    prisma.peca.create({
      data: {
        descricao: 'Memória RAM 8GB DDR4',
        fabricante: 'Corsair',
        valorReferencia: 159.90,
        ativo: true,
      },
    }),
    prisma.peca.create({
      data: {
        descricao: 'Memória RAM 16GB DDR4',
        fabricante: 'Kingston',
        valorReferencia: 289.90,
        ativo: true,
      },
    }),
    prisma.peca.create({
      data: {
        descricao: 'Bateria Notebook',
        fabricante: 'HP',
        valorReferencia: 220.00,
        ativo: true,
      },
    }),
    prisma.peca.create({
      data: {
        descricao: 'Tela Notebook 14"',
        fabricante: 'LG',
        valorReferencia: 450.00,
        ativo: false,
      },
    }),
  ]);
  console.log(`   ${pecas.length} peças criadas (1 inativa).\n`);

  // ── 9. Ordens de Serviço ──────────────────────────────────────────────
  console.log('📋 Criando ordens de serviço...');
  const osList = await Promise.all([
    prisma.ordemServico.create({
      data: {
        numeroOS: generateSequentialOS(1),
        clienteId: clientes[0].id,
        equipamentoId: equipamentos[0].id,
        status: StatusOS.ENTREGUE,
        dataEntrada: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        dataPrevisao: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
        dataConclusao: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
        observacoes: 'Computador lento. Cliente solicitou formatação e limpeza.',
      },
    }),
    prisma.ordemServico.create({
      data: {
        numeroOS: generateSequentialOS(2),
        clienteId: clientes[0].id,
        equipamentoId: equipamentos[1].id,
        status: StatusOS.CONCLUIDA,
        dataEntrada: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        dataPrevisao: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        dataConclusao: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        observacoes: 'Notebook com SSD lento. Troca de SSD e instalação Windows.',
      },
    }),
    prisma.ordemServico.create({
      data: {
        numeroOS: generateSequentialOS(3),
        clienteId: clientes[1].id,
        equipamentoId: equipamentos[2].id,
        status: StatusOS.EM_EXECUCAO,
        dataEntrada: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        dataPrevisao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        observacoes: 'MacBook aquecendo muito. Limpeza e troca de pasta térmica.',
      },
    }),
    prisma.ordemServico.create({
      data: {
        numeroOS: generateSequentialOS(4),
        clienteId: clientes[2].id,
        equipamentoId: equipamentos[3].id,
        status: StatusOS.AGUARDANDO_APROVACAO,
        dataEntrada: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dataPrevisao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        observacoes: 'Diagnóstico: HD com setores defeituosos. Aguardando aprovação para troca.',
      },
    }),
    prisma.ordemServico.create({
      data: {
        numeroOS: generateSequentialOS(5),
        clienteId: clientes[3].id,
        equipamentoId: equipamentos[5].id,
        status: StatusOS.EM_DIAGNOSTICO,
        dataEntrada: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        dataPrevisao: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        observacoes: 'Notebook não liga. Em diagnóstico inicial.',
      },
    }),
    prisma.ordemServico.create({
      data: {
        numeroOS: generateSequentialOS(6),
        clienteId: clientes[3].id,
        equipamentoId: equipamentos[6].id,
        status: StatusOS.ABERTA,
        dataEntrada: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        dataPrevisao: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        observacoes: 'Cliente solicitou orçamento para upgrade de memória.',
      },
    }),
    prisma.ordemServico.create({
      data: {
        numeroOS: generateSequentialOS(7),
        clienteId: clientes[0].id,
        tipoAtendimento: 'INTERNO' as any,
        status: StatusOS.EM_EXECUCAO,
        dataEntrada: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        dataPrevisao: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        observacoes: 'Atendimento remoto: cliente solicitou instalação de antivírus e configuração de e-mail.',
      },
    }),
  ]);
  console.log(`   ${osList.length} ordens de serviço criadas.\n`);

  // ── 10. Eventos ───────────────────────────────────────────────────────
  console.log('📝 Criando eventos...');
  const eventosData = [
    // OS 0001 - ENTREGUE
    { osId: osList[0].id, usuarioId: usuarios[2].id, descricao: 'Equipamento recebido na recepção. Cliente deixou computador e carregador.', dataHora: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
    { osId: osList[0].id, usuarioId: usuarios[1].id, descricao: 'Diagnóstico inicial: sistema operacional corrompido, muitos programas em segundo plano.', dataHora: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000) },
    { osId: osList[0].id, usuarioId: usuarios[1].id, descricao: 'Formatação concluída. Windows 11 Pro instalado e drivers atualizados.', dataHora: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000) },
    { osId: osList[0].id, usuarioId: usuarios[1].id, descricao: 'Limpeza interna realizada. Removida 2kg de poeira do cooler.', dataHora: new Date(Date.now() - 22.5 * 24 * 60 * 60 * 1000) },
    { osId: osList[0].id, usuarioId: usuarios[2].id, descricao: 'Equipamento entregue ao cliente. Teste de estabilidade OK.', dataHora: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000) },

    // OS 0002 - CONCLUIDA
    { osId: osList[1].id, usuarioId: usuarios[2].id, descricao: 'Notebook recebido. Cliente relatou lentidão extrema.', dataHora: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000) },
    { osId: osList[1].id, usuarioId: usuarios[1].id, descricao: 'Diagnóstico: SSD Samsung 240GB com saúde em 15%. Necessária troca urgente.', dataHora: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000) },
    { osId: osList[1].id, usuarioId: usuarios[1].id, descricao: 'SSD substituído por Kingston 512GB. Dados migrados com sucesso.', dataHora: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000) },
    { osId: osList[1].id, usuarioId: usuarios[1].id, descricao: 'Windows 11 instalado. Todos os drivers Lenovo atualizados.', dataHora: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
    { osId: osList[1].id, usuarioId: usuarios[3].id, descricao: 'OS concluída. Aguardando cliente para retirada.', dataHora: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },

    // OS 0003 - EM_EXECUCAO
    { osId: osList[2].id, usuarioId: usuarios[2].id, descricao: 'MacBook Pro recebido. Cliente relatou aquecimento e desligamentos.', dataHora: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    { osId: osList[2].id, usuarioId: usuarios[1].id, descricao: 'Diagnóstico: ventoinha obstruída, pasta térmica ressecada.', dataHora: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) },
    { osId: osList[2].id, usuarioId: usuarios[1].id, descricao: 'Limpeza interna concluída. Pasta térmica substituída.', dataHora: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },

    // OS 0004 - AGUARDANDO_APROVACAO
    { osId: osList[3].id, usuarioId: usuarios[2].id, descricao: 'HP ProDesk recebido para diagnóstico.', dataHora: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    { osId: osList[3].id, usuarioId: usuarios[1].id, descricao: 'HD com 876 setores defeituosos. Risco iminente de perda de dados.', dataHora: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
    { osId: osList[3].id, usuarioId: usuarios[3].id, descricao: 'Orçamento enviado ao cliente: SSD 512GB Samsung + instalação. Aguardando aprovação.', dataHora: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },

    // OS 0005 - EM_DIAGNOSTICO
    { osId: osList[4].id, usuarioId: usuarios[2].id, descricao: 'Asus ZenBook recebido. Não liga.', dataHora: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { osId: osList[4].id, usuarioId: usuarios[1].id, descricao: 'Teste de fonte: OK. Verificando placa-mãe.', dataHora: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },

    // OS 0006 - ABERTA
    { osId: osList[5].id, usuarioId: usuarios[2].id, descricao: 'Solicitação de upgrade de memória registrada. Cliente quer aumentar de 8GB para 16GB.', dataHora: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },

    // OS 0007 - INTERNO - Instalação remota de antivírus
    { osId: osList[6].id, usuarioId: usuarios[2].id, descricao: 'Cliente ligou solicitando instalação de antivírus e configuração de e-mail no Outlook.', dataHora: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { osId: osList[6].id, usuarioId: usuarios[2].id, descricao: 'Acesso remoto via AnyDesk. ID de sessão: 123 456 789.', dataHora: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000) },
    { osId: osList[6].id, usuarioId: usuarios[1].id, descricao: 'Antivírus Avast Free instalado e configurado. Verificação completa realizada sem ameaças.', dataHora: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000) },
    { osId: osList[6].id, usuarioId: usuarios[1].id, descricao: 'E-mail configurado no Outlook 365. Conta do cliente (pedro@email.com) testada e funcionando.', dataHora: new Date(Date.now() - 1.2 * 24 * 60 * 60 * 1000) },
    { osId: osList[6].id, usuarioId: usuarios[1].id, descricao: 'Atendimento remoto finalizado. Cliente confirmou que tudo está funcionando.', dataHora: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  ];

  await prisma.eventoOS.createMany({ data: eventosData });
  console.log(`   ${eventosData.length} eventos criados.\n`);

  // ── 11. Itens de OS (serviços e peças) ─────────────────────────────────
  console.log('📦 Criando itens de OS...');
  const itensOS = await prisma.$transaction([
    // OS 0001 - Formatação + Limpeza
    prisma.itemOS.create({
      data: {
        osId: osList[0].id,
        tipoItem: TipoItem.SERVICO,
        referenciaId: servicos[0].id,
        descricao: 'Formatação de Sistema Operacional',
        quantidade: 1,
        valorUnitario: 150,
        valorTotal: 150,
      },
    }),
    prisma.itemOS.create({
      data: {
        osId: osList[0].id,
        tipoItem: TipoItem.SERVICO,
        referenciaId: servicos[1].id,
        descricao: 'Limpeza Interna e Externa',
        quantidade: 1,
        valorUnitario: 80,
        valorTotal: 80,
      },
    }),
    // OS 0002 - Troca SSD + Instalação Windows + SSD peça
    prisma.itemOS.create({
      data: {
        osId: osList[1].id,
        tipoItem: TipoItem.SERVICO,
        referenciaId: servicos[2].id,
        descricao: 'Troca de SSD',
        quantidade: 1,
        valorUnitario: 120,
        valorTotal: 120,
      },
    }),
    prisma.itemOS.create({
      data: {
        osId: osList[1].id,
        tipoItem: TipoItem.SERVICO,
        referenciaId: servicos[3].id,
        descricao: 'Instalação Windows 11 Pro',
        quantidade: 1,
        valorUnitario: 200,
        valorTotal: 200,
      },
    }),
    prisma.itemOS.create({
      data: {
        osId: osList[1].id,
        tipoItem: TipoItem.PECA,
        referenciaId: pecas[1].id,
        descricao: 'SSD 512GB Samsung',
        quantidade: 1,
        valorUnitario: 349.90,
        valorTotal: 349.90,
      },
    }),
    // OS 0003 - Limpeza
    prisma.itemOS.create({
      data: {
        osId: osList[2].id,
        tipoItem: TipoItem.SERVICO,
        referenciaId: servicos[1].id,
        descricao: 'Limpeza Interna e Externa',
        quantidade: 1,
        valorUnitario: 80,
        valorTotal: 80,
      },
    }),
    // OS 0004 - Aguardando aprovação (serviços orçados)
    prisma.itemOS.create({
      data: {
        osId: osList[3].id,
        tipoItem: TipoItem.SERVICO,
        referenciaId: servicos[2].id,
        descricao: 'Troca de SSD (orçamento)',
        quantidade: 1,
        valorUnitario: 120,
        valorTotal: 120,
      },
    }),
    prisma.itemOS.create({
      data: {
        osId: osList[3].id,
        tipoItem: TipoItem.PECA,
        referenciaId: pecas[1].id,
        descricao: 'SSD 512GB Samsung (orçamento)',
        quantidade: 1,
        valorUnitario: 349.90,
        valorTotal: 349.90,
      },
    }),
    // OS 0006 - Upgrade memória
    prisma.itemOS.create({
      data: {
        osId: osList[5].id,
        tipoItem: TipoItem.PECA,
        referenciaId: pecas[3].id,
        descricao: 'Memória RAM 16GB DDR4 Kingston',
        quantidade: 1,
        valorUnitario: 289.90,
        valorTotal: 289.90,
      },
    }),
    // OS 0007 - Atendimento remoto antivírus
    prisma.itemOS.create({
      data: {
        osId: osList[6].id,
        tipoItem: TipoItem.SERVICO,
        referenciaId: servicos[0].id,
        descricao: 'Instalação de Antivírus',
        quantidade: 1,
        valorUnitario: 150,
        valorTotal: 150,
      },
    }),
  ]);
  console.log(`   ${itensOS.length} itens de OS criados.\n`);

  // ── 12. Inventários ────────────────────────────────────────────────────
  console.log('🔍 Criando inventários...');
  await prisma.inventario.create({
    data: {
      osId: osList[0].id,
      dataCaptura: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
      jsonCompleto: JSON.stringify({
        sistema_operacional: { nome: 'Windows 10 Home', versao: '22H2', build: '19045.3803' },
        processador: { modelo: 'Intel Core i5-11400', nucleos: 6, threads: 12, frequencia_ghz: 2.6 },
        memoria_ram: { total_gb: 8, tipo: 'DDR4', velocidade_mhz: 3200, slots_usados: 1 },
        discos: [
          { modelo: 'WD Blue 1TB', tipo: 'HDD', capacidade_gb: 1000, saude: 95 },
          { modelo: 'Kingston A400 240GB', tipo: 'SSD', capacidade_gb: 240, saude: 78 },
        ],
        rede: { ip_local: '192.168.1.45', mac_address: 'A1:B2:C3:D4:E5:F6', tipo_conexao: 'Ethernet' },
        placa_mae: { fabricante: 'Dell', modelo: 'OptiPlex 7090', bios_version: '1.15.0' },
        programas_instalados: [
          'Google Chrome v120',
          'Microsoft Office 2019',
          'WinRAR 6.24',
          'Adobe Reader XI',
          'Skype',
          'CCleaner',
          '23 programas em segundo plano',
        ],
        observacoes: 'Sistema com muitos programas desnecessários em inicialização. HD fragmentado.',
      }),
    },
  });

  await prisma.inventario.create({
    data: {
      osId: osList[1].id,
      dataCaptura: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
      jsonCompleto: JSON.stringify({
        sistema_operacional: { nome: 'Windows 10 Pro', versao: '21H2', build: '19044.1826' },
        processador: { modelo: 'Intel Core i7-1185G7', nucleos: 4, threads: 8, frequencia_ghz: 3.0 },
        memoria_ram: { total_gb: 8, tipo: 'DDR4', velocidade_mhz: 3200, slots_usados: 1 },
        discos: [
          { modelo: 'Samsung PM871b 256GB', tipo: 'SSD', capacidade_gb: 256, saude: 15 },
        ],
        rede: { ip_local: '10.0.0.87', mac_address: 'F6:E5:D4:C3:B2:A1', tipo_conexao: 'Wi-Fi' },
        placa_mae: { fabricante: 'Lenovo', modelo: 'ThinkPad T14 Gen 2', bios_version: '1.35' },
        programas_instalados: [
          'Google Chrome v119',
          'Microsoft Office 365',
          'Slack Desktop',
          'Zoom 5.13',
          'Node.js v20',
          'VS Code 1.85',
          'Docker Desktop',
        ],
        observacoes: 'SSD em estado crítico. Sistema lento para inicializar. 45 minutos para boot.',
      }),
    },
  });
  console.log('   2 inventários criados.\n');

  // ── 13. Logs ───────────────────────────────────────────────────────────
  console.log('📜 Criando logs de sistema...');
  const logsData = [
    { dataHora: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), nivel: NivelLog.INFO, categoria: CategoriaLog.AUTH, acao: 'LOGIN', descricao: 'Usuário admin realizou login com sucesso.', usuarioId: usuarios[0].id },
    { dataHora: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000), nivel: NivelLog.INFO, categoria: CategoriaLog.CLIENTE, acao: 'CLIENTE_CRIADO', descricao: 'Cliente Pedro Henrique Almeida cadastrado (CPF: 123.456.789-00).', usuarioId: usuarios[2].id },
    { dataHora: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000), nivel: NivelLog.INFO, categoria: CategoriaLog.OS, acao: 'OS_CRIADA', descricao: 'OS 0001 criada para Pedro Henrique Almeida - Desktop Dell OptiPlex 7090.', usuarioId: usuarios[2].id },
    { dataHora: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), nivel: NivelLog.INFO, categoria: CategoriaLog.OS, acao: 'STATUS_ALTERADO', descricao: 'OS 0001 status alterado para CONCLUIDA.', usuarioId: usuarios[1].id },
    { dataHora: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), nivel: NivelLog.INFO, categoria: CategoriaLog.AUTH, acao: 'LOGIN', descricao: 'Usuário joao.silva realizou login com sucesso.', usuarioId: usuarios[1].id },
    { dataHora: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), nivel: NivelLog.INFO, categoria: CategoriaLog.OS, acao: 'OS_CRIADA', descricao: 'OS 0002 criada para Pedro Henrique Almeida - Notebook Lenovo ThinkPad T14.', usuarioId: usuarios[2].id },
    { dataHora: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), nivel: NivelLog.INFO, categoria: CategoriaLog.BACKUP, acao: 'BACKUP_CONCLUIDO', descricao: 'Backup automático do banco de dados realizado com sucesso.', usuarioId: usuarios[0].id },
    { dataHora: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), nivel: NivelLog.INFO, categoria: CategoriaLog.CLIENTE, acao: 'CLIENTE_CRIADO', descricao: 'Cliente Ana Beatriz Souza cadastrado (CPF: 987.654.321-11).', usuarioId: usuarios[2].id },
    { dataHora: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), nivel: NivelLog.INFO, categoria: CategoriaLog.OS, acao: 'STATUS_ALTERADO', descricao: 'OS 0004 status alterado para AGUARDANDO_APROVACAO. Orçamento enviado ao cliente.', usuarioId: usuarios[3].id },
    { dataHora: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), nivel: NivelLog.INFO, categoria: CategoriaLog.AUTH, acao: 'LOGIN', descricao: 'Usuário maria.santos realizou login com sucesso.', usuarioId: usuarios[2].id },
  ];

  await prisma.log.createMany({ data: logsData });
  console.log(`   ${logsData.length} logs inseridos no banco.\n`);

  // ── Resumo Final ───────────────────────────────────────────────────────
  console.log('\n✅ Seed concluído com sucesso!');
  console.log('   ──────────────────────────────────────');
  console.log(`   👤 Usuários:        ${usuarios.length}`);
  console.log(`   👥 Clientes:        ${clientes.length} (1 inativo)`);
  console.log(`   🖥️  Equipamentos:    ${equipamentos.length} (1 inativo)`);
  console.log(`   🏷️  Categorias:      ${categorias.length}`);
  console.log(`   📂 Subcategorias:   ${subcategoriasAll.length}`);
  console.log(`   🏢 Equipes:         ${equipes.length}`);
  console.log(`   🔗 Vinculos UE:     5`);
  console.log(`   🔧 Serviços:        ${servicos.length} (1 inativo)`);
  console.log(`   🔩 Peças:           ${pecas.length} (1 inativa)`);
  console.log(`   📋 Ordens de Serviço: ${osList.length}`);
  console.log(`   📝 Eventos:         ${eventosData.length}`);
  console.log(`   📦 Itens de OS:     ${itensOS.length}`);
  console.log(`   🔍 Inventários:     2`);
  console.log(`   📜 Logs:            ${logsData.length}`);
  console.log('   ──────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
