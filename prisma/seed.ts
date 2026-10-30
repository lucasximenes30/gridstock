import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const permissions = [
  { key: 'PRODUCT_VIEW', name: 'Visualizar Produtos', description: 'Visualizar catálogo de produtos' },
  { key: 'PRODUCT_CREATE', name: 'Criar Produtos', description: 'Cadastrar novos produtos' },
  { key: 'PRODUCT_UPDATE', name: 'Editar Produtos', description: 'Atualizar dados de produtos' },
  { key: 'PRODUCT_DELETE', name: 'Excluir Produtos', description: 'Remover produtos do catálogo' },
  { key: 'STOCK_VIEW', name: 'Visualizar Estoque', description: 'Visualizar posições e saldos' },
  { key: 'STOCK_ENTRY', name: 'Registrar Entrada', description: 'Entrada de materiais' },
  { key: 'STOCK_EXIT', name: 'Registrar Saída', description: 'Saída/baixa de materiais' },
  { key: 'STOCK_ADJUST', name: 'Ajuste de Estoque', description: 'Ajuste manual de quantidades' },
  { key: 'STOCK_TRANSFER', name: 'Transferência', description: 'Transferência entre locais' },
  { key: 'REQUEST_CREATE', name: 'Criar Requisição', description: 'Solicitar materiais' },
  { key: 'REQUEST_APPROVE', name: 'Aprovar Requisição', description: 'Aprovar pedidos de materiais' },
  { key: 'REQUEST_FULFILL', name: 'Atender Requisição', description: 'Separar e entregar pedidos' },
  { key: 'INVENTORY_CREATE', name: 'Criar Inventário', description: 'Iniciar ciclo de inventário' },
  { key: 'INVENTORY_COUNT', name: 'Contagem de Inventário', description: 'Registrar contagens físicas' },
  { key: 'INVENTORY_REVIEW', name: 'Revisar Inventário', description: 'Analisar divergências' },
  { key: 'INVENTORY_APPROVE', name: 'Aprovar Inventário', description: 'Ajustar estoque após contagem' },
  { key: 'REPORT_VIEW', name: 'Visualizar Relatórios', description: 'Acessar relatórios' },
  { key: 'REPORT_EXPORT', name: 'Exportar Relatórios', description: 'Exportar relatórios em Excel/PDF' },
  { key: 'USER_VIEW', name: 'Visualizar Usuários', description: 'Visualizar usuários cadastrados' },
  { key: 'USER_MANAGE', name: 'Gerenciar Usuários', description: 'Criar e editar usuários e perfis' },
  { key: 'CONFIG_MANAGE', name: 'Gerenciar Configurações', description: 'Parâmetros globais do sistema' },
  { key: 'AUDIT_VIEW', name: 'Visualizar Auditoria', description: 'Consultar trilha de auditoria' },
]

async function main() {
  console.log("Iniciando seed do GridStock...")

  // 1. Cadastrar permissões
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { name: perm.name, description: perm.description },
      create: perm,
    })
  }
  console.log("Permissões cadastradas com sucesso.")

  // 2. Cadastrar Role ADMIN
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "Administrador com acesso irrestrito ao sistema",
    },
  })

  // Vincular todas as permissões ao papel ADMIN
  const allPerms = await prisma.permission.findMany()
  for (const p of allPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: p.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: p.id,
      },
    })
  }

  // 3. Cadastrar Almoxarifado padrão se nenhum existir
  const warehouseCount = await prisma.warehouse.count()
  let defaultWarehouse = null
  if (warehouseCount === 0) {
    defaultWarehouse = await prisma.warehouse.create({
      data: {
        code: "ALM-01",
        name: "Almoxarifado Central",
        description: "Depósito principal da operação",
        status: "ACTIVE",
      },
    })
    console.log("Almoxarifado padrão criado: ALM-01 (Almoxarifado Central)")
  }

  // 4. Cadastrar Usuário Administrador inicial se não existir
  const adminEmail = "admin@gridstock.com"
  const existingAdmin = await prisma.user.findFirst({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123", 10)
    await prisma.user.create({
      data: {
        name: "Administrador GridStock",
        email: adminEmail,
        passwordHash,
        loginEnabled: true,
        allWarehouseAccess: true,
        status: "ACTIVE",
        roles: {
          connect: [{ id: adminRole.id }],
        },
      },
    })
    console.log("Usuário administrador criado: admin@gridstock.com (senha: admin123)")
  } else {
    console.log("Usuário administrador já existente.")
  }

  console.log("Seed finalizado com sucesso!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
