// server/integrations/email/emailProvider.js
// Email provider facade for regulatory notifications.
// Uses Resend HTTP API when RESEND_API_KEY is configured.

const RESEND_API_URL = 'https://api.resend.com/emails'
import { getDurableAlertEmails, isDurableWatchEnabled } from '../../stores/regulatoryWatchStore.js'

async function getRecipients() {
  const envRecipients = (process.env.ALERT_EMAIL_TO || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const storedRecipients = isDurableWatchEnabled() ? await getDurableAlertEmails() : []
  return Array.from(new Set([...envRecipients, ...storedRecipients]))
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function isEmailEnabled() {
  const recipients = await getRecipients()
  return Boolean(process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_FROM && recipients.length > 0)
}

export async function sendRegulatoryEmail({ notification }) {
  const recipients = await getRecipients()
  if (!process.env.RESEND_API_KEY || !process.env.ALERT_EMAIL_FROM || recipients.length === 0) {
    return { success: false, provider: 'resend', skipped: true, error: 'Email env is not configured.' }
  }

  const subject = `[AKOP] ${notification.authority} yeni bildirim: ${notification.title}`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
      <h2 style="margin:0 0 12px">Yeni düzenleyici bildirim</h2>
      <p><strong>Kurum:</strong> ${escapeHtml(notification.authority)}</p>
      <p><strong>Etki:</strong> ${escapeHtml(notification.impactLevel)}</p>
      <p><strong>Başlık:</strong> ${escapeHtml(notification.title)}</p>
      <p>${escapeHtml(notification.message)}</p>
      ${notification.url ? `<p><a href="${escapeHtml(notification.url)}">Kaynağı incele</a></p>` : ''}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0" />
      <p style="font-size:12px;color:#64748b">AKOP Regulatory Watch tarafından otomatik gönderildi.</p>
    </div>
  `

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.ALERT_EMAIL_FROM,
      to: recipients,
      subject,
      html,
    }),
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    return { success: false, provider: 'resend', error: body?.message || `HTTP ${response.status}` }
  }
  return { success: true, provider: 'resend', messageId: body?.id }
}
