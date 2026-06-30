// server/integrations/sms/smsProvider.js
// SMS provider facade. Currently routes to mock provider.
// Switch to a real provider by updating the import and sendSms function.

import { sendSms as mockSendSms } from './mockSmsProvider.js'

/**
 * Send an SMS notification.
 * @param {Object} params
 * @param {string} params.to - Recipient phone number (e.g. +905xxxxxxxxx)
 * @param {string} params.message - SMS body text
 * @param {string} [params.notificationId] - Optional AKOP notification ID for tracking
 * @returns {Promise<{ success: boolean, provider: string, messageId?: string, error?: string }>}
 */
export async function sendSms({ to, message, notificationId }) {
  // TODO: When integrating a real SMS provider (e.g. Twilio, Infobip, Netgsm),
  // replace the call below with the real provider's SDK.
  return mockSendSms({ to, message, notificationId })
}
