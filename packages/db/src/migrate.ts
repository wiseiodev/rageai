import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { createDb, getPgPool } from './client.js'

const pool = getPgPool()
const db = createDb(pool)

await migrate(db, { migrationsFolder: './drizzle' })
await pool.end()
