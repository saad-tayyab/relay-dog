import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/relayscope'

// postgres.js client
const client = postgres(DATABASE_URL)

// Drizzle ORM instance
export const db = drizzle(client, { schema })

export { DATABASE_URL }
