import { runIntegrationWatchScan } from '../services/realIntegrationRegistry.js'

export async function runIntegrationWatchJob() {
  const startedAt = new Date().toISOString()
  const result = await runIntegrationWatchScan({ createNotifications: true })
  return {
    job: 'integration-watch',
    startedAt,
    finishedAt: new Date().toISOString(),
    ...result,
  }
}

if (process.argv[1]?.endsWith('integrationWatchJob.js')) {
  runIntegrationWatchJob()
    .then((result) => {
      console.info('[Integration Watch Job]', JSON.stringify(result))
    })
    .catch((err) => {
      console.error('[Integration Watch Job] failed:', err)
      process.exitCode = 1
    })
}
