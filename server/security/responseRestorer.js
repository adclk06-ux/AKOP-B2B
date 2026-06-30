// server/security/responseRestorer.js
// Restores masked tokens in AI responses back to original values

export function restoreMaskedResponse(text, mappings) {
  if (!mappings || Object.keys(mappings).length === 0) return text

  let restored = text
  for (const [token, original] of Object.entries(mappings)) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    restored = restored.replace(new RegExp(escaped, 'g'), original)
  }
  return restored
}
