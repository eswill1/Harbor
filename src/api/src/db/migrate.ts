import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import { config } from '../config'

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations')
const MIGRATIONS_TABLE = '_migrations'

const ensureMigrationsTable = async (pool: Pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id         SERIAL PRIMARY KEY,
      filename   TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

const getApplied = async (pool: Pool): Promise<Set<string>> => {
  const { rows } = await pool.query<{ filename: string }>(
    `SELECT filename FROM ${MIGRATIONS_TABLE} ORDER BY id`
  )
  return new Set(rows.map((r) => r.filename))
}

const run = async () => {
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
    ssl: config.isProduction ? { rejectUnauthorized: false } : false,
  })

  try {
    await ensureMigrationsTable(pool)
    const applied = await getApplied(pool)

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    const pending = files.filter((f) => !applied.has(f))

    if (pending.length === 0) {
      console.log('No pending migrations.')
      return
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
      console.log(`Applying: ${file}`)
      await pool.query(sql)
      await pool.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1)`,
        [file]
      )
      console.log(`Applied:  ${file}`)
    }

    console.log(`Done. ${pending.length} migration(s) applied.`)
  } finally {
    await pool.end()
  }
}

run().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
