import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { Pool } from 'pg'
import { loadActiveConfig } from '../lib/rankingConfig'

/**
 * Metrics Monitor Worker
 *
 * Runs on a scheduled interval. Calculates regret rate over the active
 * rollback window. If the rate exceeds the threshold defined in the active
 * ranking config, automatically rolls back to the previous config version
 * and logs the event to ranking_rollback_events.
 *
 * Phase 2: regret_rate trigger only.
 * Phase 3: extend with AEI high-band, dogpile velocity triggers.
 */

const QUEUE_NAME = 'metrics-monitor'
const JOB_NAME   = 'check-metrics'

export function startMetricsMonitor(db: Pool, redisUrl: string) {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null })

  const queue = new Queue(QUEUE_NAME, { connection })

  // Schedule recurring job — runs every hour
  queue.add(
    JOB_NAME,
    {},
    {
      repeat:   { every: 60 * 60 * 1000 },
      jobId:    'metrics-monitor-recurring',
      removeOnComplete: { count: 48 },
      removeOnFail:     { count: 10 },
    },
  )

  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      if (job.name !== JOB_NAME) return

      const config = await loadActiveConfig(db)

      // ── Calculate regret rate over rolling window ─────────────────────────

      const windowStart = new Date(Date.now() - config.rollback_window_hours * 60 * 60 * 1000)

      const { rows: rateRows } = await db.query<{
        total:   string
        regrets: string
      }>(
        `SELECT
           COUNT(*)                                             AS total,
           COUNT(*) FILTER (WHERE regret = 3)                  AS regrets
         FROM sessions
         WHERE regret_prompted = true
           AND ended_at >= $1
           AND regret IS NOT NULL`,
        [windowStart],
      )

      const total   = parseInt(rateRows[0].total,   10)
      const regrets = parseInt(rateRows[0].regrets, 10)

      // Need a minimum sample size before triggering — avoid false positives
      // from tiny sample windows
      if (total < 20) {
        console.log(`[metrics-monitor] Skipping — only ${total} regret responses in window (need ≥20)`)
        return
      }

      const regretRate = regrets / total
      console.log(`[metrics-monitor] Regret rate: ${(regretRate * 100).toFixed(1)}% (${regrets}/${total}) — threshold: ${config.regret_rate_rollback_threshold * 100}%`)

      if (regretRate <= config.regret_rate_rollback_threshold) return

      // ── Threshold breached — find previous config to roll back to ─────────

      const { rows: versions } = await db.query<{ version: string }>(
        `SELECT version FROM ranking_config_versions
          WHERE is_active = false
          ORDER BY deployed_at DESC
          LIMIT 1`,
      )

      if (versions.length === 0) {
        console.error('[metrics-monitor] Rollback triggered but no previous config version found')
        return
      }

      const fromVersion = config.version
      const toVersion   = versions[0].version

      // Atomic swap — deactivate current, activate previous
      await db.query('BEGIN')
      try {
        await db.query(`UPDATE ranking_config_versions SET is_active = false WHERE version = $1`, [fromVersion])
        await db.query(`UPDATE ranking_config_versions SET is_active = true  WHERE version = $1`, [toVersion])

        await db.query(
          `INSERT INTO ranking_rollback_events
             (trigger_metric, metric_value, threshold, window_hours, from_version, to_version, note)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            'regret_rate',
            regretRate,
            config.regret_rate_rollback_threshold,
            config.rollback_window_hours,
            fromVersion,
            toVersion,
            `Auto-rollback: regret rate ${(regretRate * 100).toFixed(1)}% exceeded ${config.regret_rate_rollback_threshold * 100}% threshold over ${config.rollback_window_hours}h window (n=${total})`,
          ],
        )

        await db.query('COMMIT')
        console.warn(`[metrics-monitor] ⚠ AUTO-ROLLBACK: ${fromVersion} → ${toVersion} (regret rate ${(regretRate * 100).toFixed(1)}%)`)
      } catch (err) {
        await db.query('ROLLBACK')
        throw err
      }
    },
    { connection },
  )

  worker.on('failed', (job, err) => {
    console.error(`[metrics-monitor] Job failed: ${err.message}`)
  })

  return { queue, worker }
}
