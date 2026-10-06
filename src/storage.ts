export interface RecordEntry {
  time: number;
  crystals: number;
  falls: number;
}
export type Records = Record<string, RecordEntry>;
const KEY = 'skyhop-records-v1';
export function loadRecords(): Records {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    return Object.fromEntries(
      Object.entries(data).filter(([, v]) => {
        const r = v as RecordEntry;
        return (
          r &&
          Number.isFinite(r.time) &&
          r.time > 0 &&
          Number.isInteger(r.crystals) &&
          r.crystals >= 0 &&
          r.crystals <= 7 &&
          Number.isInteger(r.falls) &&
          r.falls >= 0
        );
      }),
    ) as Records;
  } catch {
    return {};
  }
}
export function saveRecord(id: string, record: RecordEntry) {
  const records = loadRecords();
  const best = records[id];
  const isBest = !best || record.time < best.time;
  if (isBest) records[id] = record;
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
    return { isBest, saved: true };
  } catch {
    return { isBest, saved: false };
  }
}
