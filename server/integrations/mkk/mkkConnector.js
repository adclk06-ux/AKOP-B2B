// server/integrations/mkk/mkkConnector.js
// Mock MKK (Merkezi Kayıt Kuruluşu) connector

const MOCK_DELAY = 300

export async function fetchMkPortfolio(sicilNo) {
  await new Promise((r) => setTimeout(r, MOCK_DELAY))
  return {
    sicilNo,
    portfolio: [
      { symbol: 'GARAN', quantity: 1000, avgPrice: 45.20 },
      { symbol: 'THYAO', quantity: 500, avgPrice: 180.50 },
    ],
    lastUpdated: new Date().toISOString(),
  }
}

export async function fetchMkTransactions(sicilNo, dateFrom, dateTo) {
  await new Promise((r) => setTimeout(r, MOCK_DELAY))
  return {
    sicilNo,
    transactions: [
      { id: 'mk-tx-1', type: 'buy', symbol: 'GARAN', quantity: 100, price: 46.00, date: new Date().toISOString() },
    ],
  }
}

export async function verifyCustomer(sicilNo) {
  await new Promise((r) => setTimeout(r, MOCK_DELAY))
  return {
    sicilNo,
    verified: true,
    name: 'Mock Müşteri',
  }
}
