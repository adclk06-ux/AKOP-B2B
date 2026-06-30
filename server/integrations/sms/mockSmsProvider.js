// server/integrations/sms/mockSmsProvider.js
// Mock SMS provider: logs to console without making real API calls

export async function sendSms({ to, message, notificationId }) {
  const messageId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  console.info(`[MockSMS] ──────────────────────────────`)
  console.info(`[MockSMS] TO:        ${to || '+905xxxxxxxxx'}`)
  console.info(`[MockSMS] MESSAGE:   ${message || '(empty)'}`)
  console.info(`[MockSMS] NOTIF_ID:  ${notificationId || 'N/A'}`)
  console.info(`[MockSMS] MESSAGE_ID: ${messageId}`)
  console.info(`[MockSMS] STATUS:    simulated_sent`)
  console.info(`[MockSMS] ──────────────────────────────`)

  return {
    success: true,
    provider: 'mock',
    messageId,
  }
}
