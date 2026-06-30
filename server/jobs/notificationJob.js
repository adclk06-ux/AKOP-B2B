// server/jobs/notificationJob.js
// Scheduled job skeleton for notification dispatch

export async function runNotificationJob() {
  console.info('[Job] Notification job started at', new Date().toISOString())
  try {
    // Placeholder: process pending notifications and dispatch via email/push
    console.info('[Job] Notification job completed')
  } catch (err) {
    console.error('[Job] Notification job failed:', err.message)
  }
}

export function scheduleNotificationJob(intervalMs = 5 * 60 * 1000) {
  console.info(`[Job] Notification dispatch scheduled every ${intervalMs}ms`)
  return setInterval(runNotificationJob, intervalMs)
}
