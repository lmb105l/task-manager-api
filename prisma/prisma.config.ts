import { defineConfig } from '@prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { Client } from 'pg'

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    adapter: new PrismaPg(new Client({
      connectionString: process.env.DATABASE_URL!,
    })),
  },
})
