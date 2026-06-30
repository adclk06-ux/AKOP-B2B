// server/security/piiScanner.js
// Detects PII in text content

const PATTERNS = {
  tcKimlik: { regex: /\b[1-9]\d{10}\b/g, type: 'TC_KIMLIK_NO', label: 'TC Kimlik No' },
  vkn: { regex: /\b\d{10}\b/g, type: 'VKN', label: 'Vergi Kimlik No' },
  phone: { regex: /\b0\d{10}\b|\+90\d{10}\b/g, type: 'PHONE', label: 'Telefon' },
  email: { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, type: 'EMAIL', label: 'E-posta' },
  iban: { regex: /\bTR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b/g, type: 'IBAN', label: 'IBAN' },
  mkkSicil: { regex: /\bMKK\s?Sicil\s?No[:\s]*([A-Z0-9]+)\b/gi, type: 'MKK_SICIL_NO', label: 'MKK Sicil No' },
}

export function scanPII(text) {
  const findings = []
  for (const key of Object.keys(PATTERNS)) {
    const { regex, type, label } = PATTERNS[key]
    const matches = [...text.matchAll(regex)]
    for (const match of matches) {
      findings.push({
        type,
        label,
        value: match[0],
        index: match.index,
        length: match[0].length,
      })
    }
  }
  return { findings }
}
