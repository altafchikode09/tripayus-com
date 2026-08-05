import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const demos = [
    { email: 'admin@tripay.ai', password: 'admin123', name: 'Admin User', role: 'admin' },
    { email: 'sarah@tripay.ai', password: 'analyst123', name: 'Sarah Chen', role: 'analyst' },
    { email: 'mike@tripay.ai', password: 'analyst123', name: 'Michael Ross', role: 'analyst' },
    { email: 'client@acme.com', password: 'client123', name: 'Client Viewer', role: 'client' }
  ]

  for (const d of demos) {
    const exists = await prisma.user.findUnique({ where: { email: d.email } })
    if (!exists) {
      const hash = await bcrypt.hash(d.password, 12)
      await prisma.user.create({ data: { ...d, password: hash } })
      console.log('Created user:', d.email)
    }
  }

  console.log('✅ Seed complete')
}

main().catch(console.error).finally(() => prisma.$disconnect())
