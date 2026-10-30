import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("====================================================")
  console.log("Iniciando carga de dados especializada para:")
  console.log("GridStock - Suporte & Manutenção Especializada de Impressoras")
  console.log("====================================================")

  // 1. Limpeza controlada de dados existentes (para carga limpa)
  console.log("Limpando registros anteriores...")
  await prisma.importBatchRow.deleteMany()
  await prisma.importBatch.deleteMany()
  await prisma.quickIssueItem.deleteMany()
  await prisma.quickIssue.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.stock.deleteMany()
  await prisma.stockReceiptItem.deleteMany()
  await prisma.stockReceipt.deleteMany()
  await prisma.materialReturnItem.deleteMany()
  await prisma.materialReturn.deleteMany()
  await prisma.materialRequestItem.deleteMany()
  await prisma.materialRequest.deleteMany()
  await prisma.stockTransferItem.deleteMany()
  await prisma.stockTransfer.deleteMany()
  await prisma.inventoryDivergence.deleteMany()
  await prisma.inventoryCollectionItem.deleteMany()
  await prisma.inventoryCollection.deleteMany()
  await prisma.inventoryOperator.deleteMany()
  await prisma.inventoryLocation.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.product.deleteMany()
  await prisma.productCategory.deleteMany()
  await prisma.productUnit.deleteMany()
  await prisma.userWarehouseAccess.deleteMany()
  await prisma.userWorksiteAccess.deleteMany()
  await prisma.warehouseLocation.deleteMany()
  await prisma.warehouse.deleteMany()
  await prisma.worksite.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.loginAttempt.deleteMany()
  await prisma.systemSetting.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.supplier.deleteMany()

  // 2. Permissões Globais
  console.log("Cadastrando permissões do sistema...")
  const permissionsList = [
    { key: "PRODUCT_VIEW", name: "Visualizar Peças e Insumos", description: "Ver catálogo de peças, toners e suprimentos" },
    { key: "PRODUCT_CREATE", name: "Cadastrar Peças e Insumos", description: "Cadastrar novos componentes e suprimentos de impressoras" },
    { key: "PRODUCT_UPDATE", name: "Editar Peças e Insumos", description: "Alterar dados de compatibilidade e custos" },
    { key: "PRODUCT_DELETE", name: "Excluir Peças e Insumos", description: "Remover itens obsoletos do catálogo" },
    { key: "STOCK_VIEW", name: "Visualizar Estoque", description: "Consultar saldos físicos em cada almoxarifado/viatura" },
    { key: "STOCK_ENTRY", name: "Registrar Entrada", description: "Recebimento de notas e compras de fornecedores" },
    { key: "STOCK_EXIT", name: "Registrar Saída", description: "Baixa de peças para ordens de serviço e chamados" },
    { key: "STOCK_ADJUST", name: "Ajuste de Estoque", description: "Ajuste manual de saldos e perdas" },
    { key: "STOCK_TRANSFER", name: "Transferência de Peças", description: "Transferência entre Almoxarifado Central e Viaturas Técnicas" },
    { key: "REQUEST_CREATE", name: "Criar Requisição de Peças", description: "Técnico solicita peças para manutenção de impressoras" },
    { key: "REQUEST_APPROVE", name: "Aprovar Requisição", description: "Coordenador autoriza liberação de peças de alto custo" },
    { key: "REQUEST_FULFILL", name: "Atender Requisição", description: "Almoxarife entrega e separa peças para o técnico" },
    { key: "INVENTORY_CREATE", name: "Abrir Inventário", description: "Iniciar balanço cíclico ou geral de suprimentos" },
    { key: "INVENTORY_COUNT", name: "Contagem de Estoque", description: "Bipagem de toners e peças via leitor/celular" },
    { key: "INVENTORY_REVIEW", name: "Revisar Divergências", description: "Conferir sobras e quebras de peças" },
    { key: "INVENTORY_APPROVE", name: "Aprovar Inventário", description: "Efetivar ajustes após inventário" },
    { key: "REPORT_VIEW", name: "Visualizar Relatórios", description: "Acessar relatórios de consumo por cliente/máquina" },
    { key: "REPORT_EXPORT", name: "Exportar Relatórios", description: "Exportar consumo para PDF e Excel" },
    { key: "USER_VIEW", name: "Visualizar Usuários", description: "Ver lista de técnicos e almoxarifes" },
    { key: "USER_MANAGE", name: "Gerenciar Equipe", description: "Criar e gerenciar logins de técnicos e supervisores" },
    { key: "CONFIG_MANAGE", name: "Configurações Globais", description: "Ajustar parâmetros da empresa e sistema" },
    { key: "AUDIT_VIEW", name: "Trilha de Auditoria", description: "Consultar histórico de quem retirou cada peça" },
  ]

  for (const p of permissionsList) {
    await prisma.permission.create({ data: p })
  }

  // 3. Perfis de Acesso (Roles)
  console.log("Configurando papéis e permissões...")
  const adminRole = await prisma.role.create({
    data: {
      name: "ADMIN",
      description: "Administrador Geral - Acesso irrestrito a todo o sistema",
    },
  })

  const tecRole = await prisma.role.create({
    data: {
      name: "TECNICO",
      description: "Técnico de Suporte & Manutenção de Impressoras",
    },
  })

  const almoxRole = await prisma.role.create({
    data: {
      name: "ALMOXARIFE",
      description: "Almoxarife de Peças, Suprimentos e Logística Interna",
    },
  })

  // Vincular permissões ao ADMIN
  const allPerms = await prisma.permission.findMany()
  for (const perm of allPerms) {
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: perm.id },
    })
  }

  // Permissões do Técnico
  const tecPermKeys = [
    "PRODUCT_VIEW", "STOCK_VIEW", "STOCK_EXIT", "REQUEST_CREATE",
    "STOCK_TRANSFER", "REPORT_VIEW"
  ]
  for (const perm of allPerms.filter(p => tecPermKeys.includes(p.key))) {
    await prisma.rolePermission.create({
      data: { roleId: tecRole.id, permissionId: perm.id },
    })
  }

  // Permissões do Almoxarife
  const almoxPermKeys = [
    "PRODUCT_VIEW", "PRODUCT_CREATE", "PRODUCT_UPDATE", "STOCK_VIEW",
    "STOCK_ENTRY", "STOCK_EXIT", "STOCK_ADJUST", "STOCK_TRANSFER",
    "REQUEST_CREATE", "REQUEST_APPROVE", "REQUEST_FULFILL",
    "INVENTORY_CREATE", "INVENTORY_COUNT", "INVENTORY_REVIEW", "INVENTORY_APPROVE",
    "REPORT_VIEW", "REPORT_EXPORT"
  ]
  for (const perm of allPerms.filter(p => almoxPermKeys.includes(p.key))) {
    await prisma.rolePermission.create({
      data: { roleId: almoxRole.id, permissionId: perm.id },
    })
  }

  // 4. Usuários do Sistema
  console.log("Criando usuários (Admin, Técnico e Almoxarife)...")
  const adminPasswordHash = await bcrypt.hash("Admin@GridStock2026", 10)
  const tecPasswordHash = await bcrypt.hash("Tecnico@2026", 10)
  const almoxPasswordHash = await bcrypt.hash("Almox@2026", 10)

  const adminUser = await prisma.user.create({
    data: {
      name: "Lucas Ximenes (Admin)",
      email: "admin@gridstock.com",
      passwordHash: adminPasswordHash,
      document: "11122233344",
      phone: "(11) 98765-4321",
      employeeCode: "ADM-001",
      loginEnabled: true,
      allWarehouseAccess: true,
      status: "ACTIVE",
      roles: { connect: [{ id: adminRole.id }] },
    },
  })

  const tecUser = await prisma.user.create({
    data: {
      name: "Carlos Silva - Técnico de Campo",
      email: "tecnico@gridstock.com",
      passwordHash: tecPasswordHash,
      document: "22233344455",
      phone: "(11) 97654-3210",
      employeeCode: "TEC-101",
      loginEnabled: true,
      allWarehouseAccess: true,
      status: "ACTIVE",
      roles: { connect: [{ id: tecRole.id }] },
    },
  })

  const almoxUser = await prisma.user.create({
    data: {
      name: "Mariana Souza - Gestora de Estoque",
      email: "almoxarife@gridstock.com",
      passwordHash: almoxPasswordHash,
      document: "33344455566",
      phone: "(11) 96543-2109",
      employeeCode: "ALM-201",
      loginEnabled: true,
      allWarehouseAccess: true,
      status: "ACTIVE",
      roles: { connect: [{ id: almoxRole.id }] },
    },
  })

  // 5. Parâmetros Globais do Sistema (SystemSetting)
  console.log("Configurando parâmetros da empresa...")
  await prisma.systemSetting.createMany({
    data: [
      { key: "SYSTEM_NAME", value: "GridStock", description: "Nome da plataforma", updatedById: adminUser.id },
      { key: "COMPANY_NAME", value: "PrintTech Soluções em Impressão", description: "Razão Social / Nome Fantasia", updatedById: adminUser.id },
      { key: "COMPANY_DOC", value: "28.456.789/0001-12", description: "CNPJ da empresa", updatedById: adminUser.id },
      { key: "SUPPORT_PHONE", value: "(11) 3210-9000", description: "Telefone do HelpDesk", updatedById: adminUser.id },
      { key: "DEFAULT_WAREHOUSE_CODE", value: "ALM-MATRIZ", description: "Código do almoxarifado principal", updatedById: adminUser.id },
    ],
  })

  // 6. Contratos / Obras / Clientes Corporativos (Worksite)
  console.log("Cadastrando clientes corporativos de suporte...")
  const worksiteMatriz = await prisma.worksite.create({
    data: {
      code: "LAB-MATRIZ",
      name: "Laboratório Técnico Central (Bancada)",
      description: "Oficina central de diagnóstico e reparo de impressoras",
      status: "ACTIVE",
    },
  })

  const worksiteHospital = await prisma.worksite.create({
    data: {
      code: "CLI-HOSPITAL",
      name: "Hospital Metropolitano (Contrato 45 Impressoras)",
      description: "Parque térmico de pulseiras e multifuncionais laser nos andares",
      status: "ACTIVE",
    },
  })

  const worksiteTribunal = await prisma.worksite.create({
    data: {
      code: "CLI-TRIBUNAL",
      name: "Tribunal Regional (Contrato 120 Impressoras)",
      description: "Parque corporativo com impressoras duplex de alta tiragem",
      status: "ACTIVE",
    },
  })

  // 7. Almoxarifados Especializados (Warehouse)
  console.log("Criando almoxarifados de suporte...")
  const whMatriz = await prisma.warehouse.create({
    data: {
      code: "ALM-MATRIZ",
      name: "Almoxarifado Central de Peças & Insumos",
      description: "Estoque central de peças novas, toners e kits de manutenção",
      status: "ACTIVE",
      worksiteId: worksiteMatriz.id,
    },
  })

  const whLab = await prisma.warehouse.create({
    data: {
      code: "ALM-LAB",
      name: "Laboratório de Reparo & Peças em Teste",
      description: "Peças em avaliação, placas recondicionadas e carcaças",
      status: "ACTIVE",
      worksiteId: worksiteMatriz.id,
    },
  })

  const whViatura = await prisma.warehouse.create({
    data: {
      code: "ALM-VAN01",
      name: "Viatura Técnica 01 - Atendimento Móvel",
      description: "Estoque volante do carro de atendimento externo (Carlos Silva)",
      status: "ACTIVE",
      worksiteId: worksiteHospital.id,
    },
  })

  // Vínculos de Acesso
  await prisma.userWarehouseAccess.createMany({
    data: [
      { userId: adminUser.id, warehouseId: whMatriz.id },
      { userId: adminUser.id, warehouseId: whLab.id },
      { userId: adminUser.id, warehouseId: whViatura.id },
      { userId: almoxUser.id, warehouseId: whMatriz.id },
      { userId: almoxUser.id, warehouseId: whLab.id },
      { userId: tecUser.id, warehouseId: whViatura.id },
      { userId: tecUser.id, warehouseId: whMatriz.id },
    ],
  })

  // 8. Locais de Armazenamento Hierárquicos (WarehouseLocation)
  console.log("Criando prateleiras e gavetas organizadas...")
  const locCorredorA = await prisma.warehouseLocation.create({
    data: {
      warehouseId: whMatriz.id,
      code: "CORR-A",
      name: "Corredor A - Toners e Cartuchos de Tinta",
      description: "Estantes climatizadas de consumíveis",
      status: "ACTIVE",
    },
  })

  const locPratA1 = await prisma.warehouseLocation.create({
    data: {
      warehouseId: whMatriz.id,
      parentId: locCorredorA.id,
      code: "PRAT-A1",
      name: "Prateleira A1 - Toners HP / Samsung",
      status: "ACTIVE",
    },
  })

  const locPratA2 = await prisma.warehouseLocation.create({
    data: {
      warehouseId: whMatriz.id,
      parentId: locCorredorA.id,
      code: "PRAT-A2",
      name: "Prateleira A2 - Toners & Cilindros Brother",
      status: "ACTIVE",
    },
  })

  const locPratA3 = await prisma.warehouseLocation.create({
    data: {
      warehouseId: whMatriz.id,
      parentId: locCorredorA.id,
      code: "PRAT-A3",
      name: "Prateleira A3 - Refis de Tinta Epson & Canon",
      status: "ACTIVE",
    },
  })

  const locCorredorB = await prisma.warehouseLocation.create({
    data: {
      warehouseId: whMatriz.id,
      code: "CORR-B",
      name: "Corredor B - Mecânica e Fusão",
      description: "Unidades fusoras, engrenagens e roletes",
      status: "ACTIVE",
    },
  })

  const locPratB1 = await prisma.warehouseLocation.create({
    data: {
      warehouseId: whMatriz.id,
      parentId: locCorredorB.id,
      code: "PRAT-B1",
      name: "Prateleira B1 - Fusores e Películas Térmicas",
      status: "ACTIVE",
    },
  })

  const locPratB2 = await prisma.warehouseLocation.create({
    data: {
      warehouseId: whMatriz.id,
      parentId: locCorredorB.id,
      code: "PRAT-B2",
      name: "Prateleira B2 - Roletes Pick-up & Separação",
      status: "ACTIVE",
    },
  })

  const locCorredorC = await prisma.warehouseLocation.create({
    data: {
      warehouseId: whMatriz.id,
      code: "CORR-C",
      name: "Corredor C - Eletrônica & Cabeças de Impressão",
      status: "ACTIVE",
    },
  })

  const locPratC1 = await prisma.warehouseLocation.create({
    data: {
      warehouseId: whMatriz.id,
      parentId: locCorredorC.id,
      code: "PRAT-C1",
      name: "Prateleira C1 - Cabeças de Impressão Epson/Canon",
      status: "ACTIVE",
    },
  })

  const locPratC2 = await prisma.warehouseLocation.create({
    data: {
      warehouseId: whMatriz.id,
      parentId: locCorredorC.id,
      code: "PRAT-C2",
      name: "Prateleira C2 - Fontes e Placas Lógicas",
      status: "ACTIVE",
    },
  })

  // Local na Viatura Técnica
  const locVanBancada = await prisma.warehouseLocation.create({
    data: {
      warehouseId: whViatura.id,
      code: "VAN-BANCADA",
      name: "Maleta de Reparo Rápido - Viatura",
      description: "Peças de giro imediato no porta-malas",
      status: "ACTIVE",
    },
  })

  // 9. Unidades de Medida (ProductUnit)
  console.log("Cadastrando unidades de medida...")
  const uUnidade = await prisma.productUnit.create({
    data: { code: "UN", name: "Unidade", description: "Unidade individual de peça ou cartucho" },
  })
  const uKit = await prisma.productUnit.create({
    data: { code: "KIT", name: "Kit de Manutenção", description: "Conjunto completo para manutenção preventiva" },
  })
  const uCaixa = await prisma.productUnit.create({
    data: { code: "CX", name: "Caixa", description: "Embalagem fechada com múltiplos itens" },
  })
  const uFrasco = await prisma.productUnit.create({
    data: { code: "FR", name: "Frasco / Garrafa", description: "Garrafa de refil de tinta 65ml a 1000ml" },
  })
  const uLitro = await prisma.productUnit.create({
    data: { code: "L", name: "Litro", description: "Volume de líquido solvente / limpeza" },
  })

  // 10. Categorias de Suprimentos & Peças (ProductCategory)
  console.log("Cadastrando categorias especializadas em impressoras...")
  const catToner = await prisma.productCategory.create({
    data: { name: "Toners Laser", description: "Cartuchos de toner monocromáticos e coloridos" },
  })
  const catCilindro = await prisma.productCategory.create({
    data: { name: "Cilindros & Unidades de Imagem (Drum)", description: "Tambores fotocondutores e unidades de imagem" },
  })
  const catFusor = await prisma.productCategory.create({
    data: { name: "Unidades Fusoras & Películas", description: "Fusores completos, lâmpadas halógenas, rolos pressores e películas" },
  })
  const catRoletes = await prisma.productCategory.create({
    data: { name: "Roletes & Tracionadores de Papel", description: "Pick-up rollers, separation pads e buchas de tracionamento" },
  })
  const catCabecas = await prisma.productCategory.create({
    data: { name: "Cabeças de Impressão & Tintas", description: "Cabeças térmicas e piezoelétricas, refis de tinta original e sublimática" },
  })
  const catEletronica = await prisma.productCategory.create({
    data: { name: "Placas Lógicas & Fontes", description: "Fontes chaveadas de alta tensão e placas principais" },
  })
  const catKits = await prisma.productCategory.create({
    data: { name: "Kits de Manutenção Preventiva", description: "Kits periódicos de 50k, 100k e 200k páginas" },
  })

  // 11. Fornecedores Especializados (Supplier)
  console.log("Cadastrando fornecedores de peças de impressora...")
  const supPrintMax = await prisma.supplier.create({
    data: {
      name: "PrintMax Suprimentos e Peças para Impressoras Ltda",
      tradeName: "PrintMax Distribuidora",
      document: "19.345.678/0001-90",
      email: "vendas@printmaxpecas.com.br",
      phone: "(11) 4004-8090",
      address: "Av. Industrial, 1500 - Galpão 4",
      city: "São Paulo",
      state: "SP",
      zipCode: "03001-000",
      notes: "Fornecedor principal de peças originais HP, Brother e roletes importados",
    },
  })

  const supLaserParts = await prisma.supplier.create({
    data: {
      name: "LaserParts Soluções Térmicas e Fusores S/A",
      tradeName: "LaserParts Brasil",
      document: "33.789.012/0001-44",
      email: "pedidos@laserparts.com.br",
      phone: "(41) 3322-1100",
      address: "Rua das Máquinas, 880",
      city: "Curitiba",
      state: "PR",
      zipCode: "80020-100",
      notes: "Especialista em fusores recondicionados com garantia e películas cerâmicas",
    },
  })

  const supEpsonDist = await prisma.supplier.create({
    data: {
      name: "MegaInk Tintas e Cabeças de Impressão Ltda",
      tradeName: "MegaInk Suprimentos",
      document: "54.210.987/0001-22",
      email: "contato@megaink.com.br",
      phone: "(19) 3871-5522",
      address: "Rodovia Anhanguera, km 112",
      city: "Campinas",
      state: "SP",
      zipCode: "13060-000",
      notes: "Distribuidor credenciado de garrafas de tinta Epson EcoTank e Canon MegaTank",
    },
  })

  // 12. Produtos / Peças de Reposição (Product)
  console.log("Cadastrando peças, toners, fusores e suprimentos de impressoras...")

  const productsData = [
    {
      code: "TON-HP-W1105A",
      barcode: "193015558117",
      name: "Toner HP 105A Preto (W1105A)",
      shortDescription: "Laser 107a / 107w / MFP 135a / MFP 137fnw - Rendimento 1.000 pág.",
      categoryId: catToner.id,
      unitId: uUnidade.id,
      brand: "HP",
      model: "W1105A (105A)",
      minimumStock: 10,
      maximumStock: 50,
      averageCost: 89.50,
      defaultLocationId: locPratA1.id,
      quantityCentral: 28,
      quantityVan: 4,
    },
    {
      code: "TON-BRO-TN1060",
      barcode: "012502638841",
      name: "Toner Brother TN-1060 Preto Original",
      shortDescription: "HL-1112 / HL-1202 / HL-1212W / DCP-1512 / DCP-1602 - 1.000 pág.",
      categoryId: catToner.id,
      unitId: uUnidade.id,
      brand: "Brother",
      model: "TN-1060",
      minimumStock: 15,
      maximumStock: 60,
      averageCost: 75.00,
      defaultLocationId: locPratA2.id,
      quantityCentral: 42,
      quantityVan: 6,
    },
    {
      code: "TON-BRO-TN3472",
      barcode: "012502641506",
      name: "Toner Brother TN-3472 Alto Rendimento Preto",
      shortDescription: "DCP-L5652DN / MFC-L5902DW / HL-L6202DW - 12.000 páginas",
      categoryId: catToner.id,
      unitId: uUnidade.id,
      brand: "Brother",
      model: "TN-3472",
      minimumStock: 8,
      maximumStock: 30,
      averageCost: 198.00,
      defaultLocationId: locPratA2.id,
      quantityCentral: 18,
      quantityVan: 2,
    },
    {
      code: "DRUM-BRO-DR1060",
      barcode: "012502638858",
      name: "Unidade de Cilindro Brother DR-1060",
      shortDescription: "Unidade fotocondutora para DCP-1602 / HL-1212W - 10.000 pág.",
      categoryId: catCilindro.id,
      unitId: uUnidade.id,
      brand: "Brother",
      model: "DR-1060",
      minimumStock: 5,
      maximumStock: 25,
      averageCost: 110.00,
      defaultLocationId: locPratA2.id,
      quantityCentral: 14,
      quantityVan: 2,
    },
    {
      code: "DRUM-BRO-DR3440",
      barcode: "012502641520",
      name: "Unidade de Cilindro Brother DR-3440 (50k)",
      shortDescription: "Fotocondutor para linha Brother L5000 / L6000 - Rendimento 50.000 pág.",
      categoryId: catCilindro.id,
      unitId: uUnidade.id,
      brand: "Brother",
      model: "DR-3440",
      minimumStock: 4,
      maximumStock: 15,
      averageCost: 345.00,
      defaultLocationId: locPratA2.id,
      quantityCentral: 9,
      quantityVan: 1,
    },
    {
      code: "FUS-HP-M402-110",
      barcode: "889894215033",
      name: "Unidade Fusora HP LaserJet Pro M402 / M426 (110V)",
      shortDescription: "Conjunto fusor completo código OEM RM2-5399 / RM2-2554",
      categoryId: catFusor.id,
      unitId: uUnidade.id,
      brand: "HP",
      model: "RM2-5399-000CN",
      minimumStock: 3,
      maximumStock: 10,
      averageCost: 480.00,
      defaultLocationId: locPratB1.id,
      quantityCentral: 6,
      quantityVan: 1,
    },
    {
      code: "FUS-BRO-L5652",
      barcode: "789123456701",
      name: "Unidade Fusora Brother DCP-L5652DN / L5502 (110V)",
      shortDescription: "Fusor original montado com rolo de calor e rolo pressor - D005M4001",
      categoryId: catFusor.id,
      unitId: uUnidade.id,
      brand: "Brother",
      model: "D005M4001",
      minimumStock: 3,
      maximumStock: 12,
      averageCost: 520.00,
      defaultLocationId: locPratB1.id,
      quantityCentral: 7,
      quantityVan: 1,
    },
    {
      code: "PEL-HP-P1102",
      barcode: "789123456702",
      name: "Película Metálica Térmica de Fixação HP P1102 / M1132",
      shortDescription: "Película com graxa de alta temperatura inclusa para LaserJet P1102w / M1212",
      categoryId: catFusor.id,
      unitId: uUnidade.id,
      brand: "HP",
      model: "RG9-1483-FILM",
      minimumStock: 10,
      maximumStock: 40,
      averageCost: 32.00,
      defaultLocationId: locPratB1.id,
      quantityCentral: 30,
      quantityVan: 5,
    },
    {
      code: "ROL-HP-M1132",
      barcode: "789123456703",
      name: "Rolete Pick-up Roller Alimentador de Papel HP P1102 / M1132",
      shortDescription: "Rolete de borracha de alta aderência para bandeja 1 (RL1-2593-000)",
      categoryId: catRoletes.id,
      unitId: uUnidade.id,
      brand: "HP",
      model: "RL1-2593-000",
      minimumStock: 20,
      maximumStock: 80,
      averageCost: 14.50,
      defaultLocationId: locPratB2.id,
      quantityCentral: 65,
      quantityVan: 10,
    },
    {
      code: "ROL-BRO-L2540",
      barcode: "789123456704",
      name: "Kit Roletes Tração + Separação Brother L2540DW / L2360",
      shortDescription: "Kit contendo pick-up roller e separation pad para bandeja inferior",
      categoryId: catRoletes.id,
      unitId: uKit.id,
      brand: "Brother",
      model: "LY9047001 / LY9048001",
      minimumStock: 15,
      maximumStock: 50,
      averageCost: 28.00,
      defaultLocationId: locPratB2.id,
      quantityCentral: 35,
      quantityVan: 8,
    },
    {
      code: "CAB-EPS-L3150",
      barcode: "789123456705",
      name: "Cabeça de Impressão Epson EcoTank L3150 / L3250 / L4150",
      shortDescription: "Cabeça piezoelétrica original código FA04000 / FA04010 nova com teste",
      categoryId: catCabecas.id,
      unitId: uUnidade.id,
      brand: "Epson",
      model: "FA04000",
      minimumStock: 3,
      maximumStock: 12,
      averageCost: 310.00,
      defaultLocationId: locPratC1.id,
      quantityCentral: 8,
      quantityVan: 2,
    },
    {
      code: "TIN-EPS-T544-BK",
      barcode: "010343941457",
      name: "Refil de Tinta Epson T544 Preto Original 65ml (T544120)",
      shortDescription: "Tinta corante preta para Epson L3110, L3150, L3250, L5190, L5290",
      categoryId: catCabecas.id,
      unitId: uFrasco.id,
      brand: "Epson",
      model: "T544120-AL",
      minimumStock: 25,
      maximumStock: 100,
      averageCost: 42.00,
      defaultLocationId: locPratA3.id,
      quantityCentral: 80,
      quantityVan: 12,
    },
    {
      code: "TIN-EPS-T544-CY",
      barcode: "010343941464",
      name: "Refil de Tinta Epson T544 Ciano Original 65ml (T544220)",
      shortDescription: "Tinta corante ciano para EcoTank série L3000 / L5000",
      categoryId: catCabecas.id,
      unitId: uFrasco.id,
      brand: "Epson",
      model: "T544220-AL",
      minimumStock: 15,
      maximumStock: 60,
      averageCost: 42.00,
      defaultLocationId: locPratA3.id,
      quantityCentral: 45,
      quantityVan: 6,
    },
    {
      code: "TIN-EPS-T544-MG",
      barcode: "010343941471",
      name: "Refil de Tinta Epson T544 Magenta Original 65ml (T544320)",
      shortDescription: "Tinta corante magenta para EcoTank série L3000 / L5000",
      categoryId: catCabecas.id,
      unitId: uFrasco.id,
      brand: "Epson",
      model: "T544320-AL",
      minimumStock: 15,
      maximumStock: 60,
      averageCost: 42.00,
      defaultLocationId: locPratA3.id,
      quantityCentral: 44,
      quantityVan: 6,
    },
    {
      code: "TIN-EPS-T544-YW",
      barcode: "010343941488",
      name: "Refil de Tinta Epson T544 Amarelo Original 65ml (T544420)",
      shortDescription: "Tinta corante amarela para EcoTank série L3000 / L5000",
      categoryId: catCabecas.id,
      unitId: uFrasco.id,
      brand: "Epson",
      model: "T544420-AL",
      minimumStock: 15,
      maximumStock: 60,
      averageCost: 42.00,
      defaultLocationId: locPratA3.id,
      quantityCentral: 46,
      quantityVan: 6,
    },
    {
      code: "PLA-LOG-BRO-L5652",
      barcode: "789123456706",
      name: "Placa Principal Lógica Brother DCP-L5652DN",
      shortDescription: "Placa-mãe controladora de rede e painel touchscreen recondicionada e testada",
      categoryId: catEletronica.id,
      unitId: uUnidade.id,
      brand: "Brother",
      model: "LT3215001",
      minimumStock: 2,
      maximumStock: 8,
      averageCost: 590.00,
      defaultLocationId: locPratC2.id,
      quantityCentral: 4,
      quantityVan: 0,
    },
    {
      code: "KIT-MAN-HP-M607",
      barcode: "889894803926",
      name: "Kit de Manutenção 225k HP LaserJet Enterprise M607 / M608",
      shortDescription: "Kit OEM L0H24A: Fusor 110V + Rolete de Transferência + 5 Roletes de Bandeja",
      categoryId: catKits.id,
      unitId: uKit.id,
      brand: "HP",
      model: "L0H24A",
      minimumStock: 2,
      maximumStock: 6,
      averageCost: 1450.00,
      defaultLocationId: locPratB1.id,
      quantityCentral: 4,
      quantityVan: 0,
    },
    {
      code: "LIQ-DES-CAB",
      barcode: "789123456707",
      name: "Solução Desentupidora Especial para Cabeças de Impressão 1L",
      shortDescription: "Líquido solvente desincrustante para desentupimento térmico e piezo",
      categoryId: catCabecas.id,
      unitId: uLitro.id,
      brand: "CleanPrint",
      model: "SOLV-1000",
      minimumStock: 5,
      maximumStock: 20,
      averageCost: 38.00,
      defaultLocationId: locPratC1.id,
      quantityCentral: 16,
      quantityVan: 3,
    },
  ]

  // Cadastrar produtos, saldo de estoque e histórico de movimentação inicial
  for (const item of productsData) {
    const prod = await prisma.product.create({
      data: {
        code: item.code,
        barcode: item.barcode,
        name: item.name,
        shortDescription: item.shortDescription,
        categoryId: item.categoryId,
        unitId: item.unitId,
        brand: item.brand,
        model: item.model,
        minimumStock: item.minimumStock,
        maximumStock: item.maximumStock,
        averageCost: item.averageCost,
        defaultLocationId: item.defaultLocationId,
        status: "ACTIVE",
      },
    })

    // Estoque no Almoxarifado Central
    if (item.quantityCentral > 0) {
      await prisma.stock.create({
        data: {
          productId: prod.id,
          warehouseId: whMatriz.id,
          locationId: item.defaultLocationId,
          quantity: item.quantityCentral,
          reservedQuantity: 0,
        },
      })

      await prisma.stockMovement.create({
        data: {
          productId: prod.id,
          warehouseId: whMatriz.id,
          locationId: item.defaultLocationId,
          type: "ENTRY",
          quantity: item.quantityCentral,
          unitCost: item.averageCost,
          totalCost: Number(item.averageCost) * item.quantityCentral,
          referenceType: "INITIAL_BALANCE",
          documentNumber: "INVENTARIO-INICIAL-2026",
          reason: "Implantação de saldo inicial do sistema de suporte",
          performedById: adminUser.id,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
        },
      })
    }

    // Estoque na Viatura Técnica 01
    if (item.quantityVan > 0) {
      await prisma.stock.create({
        data: {
          productId: prod.id,
          warehouseId: whViatura.id,
          locationId: locVanBancada.id,
          quantity: item.quantityVan,
          reservedQuantity: 0,
        },
      })

      await prisma.stockMovement.create({
        data: {
          productId: prod.id,
          warehouseId: whViatura.id,
          locationId: locVanBancada.id,
          type: "TRANSFER_IN",
          quantity: item.quantityVan,
          unitCost: item.averageCost,
          totalCost: Number(item.averageCost) * item.quantityVan,
          referenceType: "TRANSFER",
          documentNumber: `TRANSF-VAN01-${item.code}`,
          reason: "Carga de kit móvel para atendimento externo de suporte",
          performedById: almoxUser.id,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 dia atrás
        },
      })
    }
  }

  // 13. Exemplo Realista de Recebimento de Mercadorias (StockReceipt)
  console.log("Registrando nota fiscal de entrada de fornecedor...")
  const prodTonerHP = await prisma.product.findFirstOrThrow({ where: { code: "TON-HP-W1105A" } })
  const prodPickHP = await prisma.product.findFirstOrThrow({ where: { code: "ROL-HP-M1132" } })

  const receipt = await prisma.stockReceipt.create({
    data: {
      supplierId: supPrintMax.id,
      warehouseId: whMatriz.id,
      documentNumber: "NF-e 045.892",
      documentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      receivedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      status: "COMPLETED",
      subtotal: 1980.00,
      total: 1980.00,
      notes: "Recebimento conferido por Mariana Souza. Lote de reposição para chamados corporativos.",
      createdById: almoxUser.id,
      items: {
        create: [
          {
            productId: prodTonerHP.id,
            locationId: locPratA1.id,
            quantity: 15,
            unitCost: 89.50,
            totalCost: 1342.50,
            notes: "Embalagens lacradas com selo de autenticidade",
          },
          {
            productId: prodPickHP.id,
            locationId: locPratB2.id,
            quantity: 44,
            unitCost: 14.50,
            totalCost: 638.00,
            notes: "Roletes originais OEM",
          },
        ],
      },
    },
  })

  // 14. Exemplo Realista de Requisição de Peças para Atendimento (MaterialRequest)
  console.log("Registrando requisição de peças em campo...")
  const prodFusorHP = await prisma.product.findFirstOrThrow({ where: { code: "FUS-HP-M402-110" } })

  await prisma.materialRequest.create({
    data: {
      requestNumber: "REQ-2026-001",
      requesterId: tecUser.id,
      warehouseId: whMatriz.id,
      status: "APPROVED",
      priority: "HIGH",
      notes: "Atendimento emergencial no Hospital Metropolitano (Pronto-Socorro). Impressora atolando no fusor.",
      approvedById: adminUser.id,
      requestedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 6 * 60 * 1000),
      items: {
        create: [
          {
            productId: prodFusorHP.id,
            unitId: uUnidade.id,
            requestedQuantity: 1,
            approvedQuantity: 1,
            separatedQuantity: 1,
            deliveredQuantity: 0,
            notes: "Troca de fusor danificado por grampo de papel",
          },
          {
            productId: prodPickHP.id,
            unitId: uUnidade.id,
            requestedQuantity: 2,
            approvedQuantity: 2,
            separatedQuantity: 2,
            deliveredQuantity: 0,
            notes: "Prevenção de patinamento de bandeja",
          },
        ],
      },
    },
  })

  // 15. Auditoria Inicial
  console.log("Registrando logs de auditoria...")
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: "DATABASE_INITIALIZED",
      entityType: "System",
      entityId: "SYSTEM_SETUP",
      metadata: {
        segment: "Printer Maintenance and Support",
        totalProducts: productsData.length,
        version: "GridStock v1.0",
      },
    },
  })

  console.log("====================================================")
  console.log("Sucesso! O banco de dados do GridStock está completo!")
  console.log("====================================================")
}

main()
  .catch((e) => {
    console.error("Erro durante o seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
