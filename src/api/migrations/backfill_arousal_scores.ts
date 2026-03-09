/**
 * One-shot backfill: score all existing posts that have arousal_score IS NULL.
 *
 * Run from the API directory:
 *   npx ts-node migrations/backfill_arousal_scores.ts
 *
 * Safe to re-run — only touches rows where arousal_score IS NULL.
 * Batched in groups of 100 to avoid long-running transactions.
 */

import pg from 'pg'
import { computeArousalScore } from '../src/lib/arousal'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

async function run() {
  const client = await pool.connect()
  try {
    // Count rows needing backfill
    const { rows: [{ count }] } = await client.query<{ count: string }>(
      `SELECT COUNT(*) FROM content WHERE content_type = 'post' AND arousal_score IS NULL`,
    )
    const total = parseInt(count, 10)
    console.log(`Posts needing arousal score: ${total}`)
    if (total === 0) { console.log('Nothing to backfill.'); return }

    let offset = 0
    let updated = 0
    const BATCH = 100

    while (offset < total) {
      const { rows } = await client.query<{ id: string; body: string }>(
        `SELECT id, body FROM content
         WHERE content_type = 'post' AND arousal_score IS NULL
         ORDER BY created_at
         LIMIT $1 OFFSET $2`,
        [BATCH, offset],
      )
      if (rows.length === 0) break

      for (const row of rows) {
        const score = computeArousalScore(row.body)
        await client.query(
          `UPDATE content SET arousal_score = $1 WHERE id = $2`,
          [score, row.id],
        )
        updated++
      }

      offset += BATCH
      console.log(`  Scored ${updated} / ${total}...`)
    }

    console.log(`Done. ${updated} posts backfilled.`)
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => { console.error(err); process.exit(1) })
