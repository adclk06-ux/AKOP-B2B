const seen = new Map()
const events = []

export function buildWatchKey(sourceId, item) {
  const raw = `${sourceId}:${item.url || ''}:${item.title || ''}:${item.publishedAt || item.date || ''}`
  return raw.toLowerCase().replace(/\s+/g, ' ').trim()
}

export function hasSeenWatchItem(sourceId, item) {
  return seen.has(buildWatchKey(sourceId, item))
}

export function markWatchItemSeen(sourceId, item) {
  const key = buildWatchKey(sourceId, item)
  seen.set(key, { sourceId, item, seenAt: new Date().toISOString() })
  return key
}

export function addIntegrationEvent(event) {
  const item = {
    id: event.id || `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...event,
  }
  events.unshift(item)
  if (events.length > 250) events.pop()
  return item
}

export function listIntegrationEvents(limit = 50) {
  return events.slice(0, limit)
}

export function getSeenStats() {
  return {
    seenItems: seen.size,
    retainedEvents: events.length,
  }
}
