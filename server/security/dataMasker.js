// server/security/dataMasker.js
// Masks sensitive data before sending to external AI providers

const MASK_PREFIXES = {
  TC_KIMLIK_NO: 'TC_NO',
  VKN: 'VKN',
  PHONE: 'TEL',
  EMAIL: 'EMAIL',
  IBAN: 'IBAN',
  MKK_SICIL_NO: 'MKK_SICIL',
  NAME: 'MUSTERI',
}

let maskCounter = 0
const mappings = new Map()

export function maskSensitiveData(text) {
  maskCounter = 0
  mappings.clear()

  // Simple name heuristic: Capitalized words before known PII
  let maskedText = text

  // Mask names first (naive approach)
  const namePattern = /([A-ZÇĞİÖŞÜ][a-zçğıöşü]+\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)/g
  maskedText = maskedText.replace(namePattern, (match) => {
    maskCounter++
    const token = `[${MASK_PREFIXES.NAME}_${maskCounter}]`
    mappings.set(token, match)
    return token
  })

  // Mask TC
  maskedText = maskedText.replace(/\b[1-9]\d{10}\b/g, (match) => {
    maskCounter++
    const token = `[${MASK_PREFIXES.TC_KIMLIK_NO}_${maskCounter}]`
    mappings.set(token, match)
    return token
  })

  // Mask VKN
  maskedText = maskedText.replace(/\b\d{10}\b/g, (match) => {
    maskCounter++
    const token = `[${MASK_PREFIXES.VKN}_${maskCounter}]`
    mappings.set(token, match)
    return token
  })

  // Mask phone
  maskedText = maskedText.replace(/\b0\d{10}\b|\+90\d{10}\b/g, (match) => {
    maskCounter++
    const token = `[${MASK_PREFIXES.PHONE}_${maskCounter}]`
    mappings.set(token, match)
    return token
  })

  // Mask email
  maskedText = maskedText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (match) => {
    maskCounter++
    const token = `[${MASK_PREFIXES.EMAIL}_${maskCounter}]`
    mappings.set(token, match)
    return token
  })

  // Mask IBAN
  maskedText = maskedText.replace(/\bTR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b/g, (match) => {
    maskCounter++
    const token = `[${MASK_PREFIXES.IBAN}_${maskCounter}]`
    mappings.set(token, match)
    return token
  })

  return {
    maskedText,
    mappings: Object.fromEntries(mappings),
  }
}
