import { Pool, PoolClient } from 'pg'
import { config } from '../config'

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.isProduction ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
})

pool.on('error', (err) => {
  console.error('Unexpected pg pool error', err)
})

export const query = <T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) => pool.query<T>(text, params)

export const withTransaction = async <T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
