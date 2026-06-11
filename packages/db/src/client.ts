import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema.js'

export type RageDb = ReturnType<typeof createDb>

let pool: Pool | null = null
let database: RageDb | null = null

export function createPgPool(connectionString = process.env.DATABASE_URL): Pool {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for Rage AI database access')
  }

  return new Pool({
    connectionString,
    connectionTimeoutMillis: 3000,
    max: 5,
  })
}

export function getPgPool(): Pool {
  pool ??= createPgPool()
  return pool
}

export function createDb(client: Pool = getPgPool()) {
  return drizzle({ client, schema })
}

export function getDb(): RageDb {
  database ??= createDb()
  return database
}
