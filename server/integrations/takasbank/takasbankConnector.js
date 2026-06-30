// server/integrations/takasbank/takasbankConnector.js
// Mock Takasbank connector

const MOCK_DELAY = 300

export async function fetchTakasbankSettlement(date) {
  await new Promise((r) => setTimeout(r, MOCK_DELAY))
  return {
    date,
    settlements: [
      { id: 'tk-1', type: 'nakit', amount: 1250000, currency: 'TRY', status: 'completed' },
      { id: 'tk-2', type: 'menkul', symbol: 'GARAN', quantity: 1000, status: 'completed' },
    ],
  }
}

export async function fetchTakasbankPositions(accountNo) {
  await new Promise((r) => setTimeout(r, MOCK_DELAY))
  return {
    accountNo,
    positions: [
      { symbol: 'GARAN', blocked: 0, free: 1000 },
      { symbol: 'THYAO', blocked: 100, free: 400 },
    ],
  }
}

export async function reconcileWithTakasbank(internalRecords, date) {
  await new Promise((r) => setTimeout(r, MOCK_DELAY))
  return {
    date,
    matched: internalRecords.length,
    unmatched: 0,
    differences: [],
  }
}
