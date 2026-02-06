// Lightweight fallback mockData for the frontend. The primary mock dataset
// has been moved to the local dev server (`server/mockServer.js`).

export function createMockData() {
  return {
    inbound: [],
    shipments: [],
    manifestsByShipmentId: {},
    receiveSeedByShipmentId: {},
    shipmentHistoryById: {},
    shipmentContentsById: {},
    tagItemsByShipmentId: {},
    tagQueue: [],
    sourceMeals: [],
    stacks: {},
    moveLog: [],
  };
}

export function sumExpected(lines) {
  return (lines || []).reduce((a, l) => a + (Number(l.expected) || 0), 0);
}

export function sumCounted(lines) {
  return (lines || []).reduce((a, l) => a + (Number(l.counted) || 0), 0);
}
