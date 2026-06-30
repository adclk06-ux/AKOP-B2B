// server/services/spkPdfParser.js
// Fetches and extracts text from SPK PDF bulletins

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParseModule = require('pdf-parse')
const pdfParse = pdfParseModule.PDFParse || pdfParseModule

/**
 * Parse PDF buffer and extract text
 * @param {Buffer} buffer
 * @returns {Promise<string>} - Extracted text or empty string
 */
export async function parsePdfBuffer(buffer) {
  try {
    const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    const parser = new pdfParse(uint8)
    const result = await parser.getText()
    return result.text?.slice(0, 12000) || ''
  } catch (err) {
    console.warn('[PDF] Parse buffer failed:', err.message || err)
    return ''
  }
}

/**
 * Fetch PDF content and extract text
 * @param {string} url - PDF URL
 * @returns {Promise<string|null>} - Extracted text or null on failure
 */
export async function fetchSpkPdfText(url) {
  if (!url || !url.endsWith('.pdf')) {
    return null
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AKOP-Bot/1.0)',
        Accept: 'application/pdf',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.warn(`[PDF] HTTP ${res.status} from ${url}`)
      return null
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    const text = await parsePdfBuffer(buffer)

    console.info(`[PDF] Extracted ${text.length} chars from ${url}`)
    return text
  } catch (err) {
    console.warn('[PDF] Parse failed:', err.message || err)
    return null
  }
}
