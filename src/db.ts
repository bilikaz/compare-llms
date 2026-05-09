import type {
  Round,
  BenchSession,
  BenchRun,
  CustomSchedule,
} from './types';

// Schema (bumped versions trigger onupgradeneeded):
//   v1
//     compareRounds      keyPath: 'id'    indexes: startedAt
//     benchSessions      keyPath: 'id'    indexes: startedAt, status
//     benchRuns          keyPath: 'id'    indexes: sessionId, testId, ratedAt
//     customSchedules    keyPath: 'id'    indexes: createdAt

const DB_NAME = 'compare-llms';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('compareRounds')) {
        const s = db.createObjectStore('compareRounds', { keyPath: 'id' });
        s.createIndex('startedAt', 'startedAt');
      }
      if (!db.objectStoreNames.contains('benchSessions')) {
        const s = db.createObjectStore('benchSessions', { keyPath: 'id' });
        s.createIndex('startedAt', 'startedAt');
        s.createIndex('status', 'status');
      }
      if (!db.objectStoreNames.contains('benchRuns')) {
        const s = db.createObjectStore('benchRuns', { keyPath: 'id' });
        s.createIndex('sessionId', 'sessionId');
        s.createIndex('testId', 'testId');
        // ratedAt is undefined for unrated; IDB index excludes undefined keys, so an
        // index here naturally separates rated from unrated.
        s.createIndex('ratedAt', 'ratedAt');
      }
      if (!db.objectStoreNames.contains('customSchedules')) {
        const s = db.createObjectStore('customSchedules', { keyPath: 'id' });
        s.createIndex('createdAt', 'createdAt');
      }
    };
  });
  return dbPromise;
}

type StoreName = 'compareRounds' | 'benchSessions' | 'benchRuns' | 'customSchedules';

async function tx<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let result: T | undefined;
    Promise.resolve(fn(s)).then((r) => {
      // If fn returned an IDBRequest, listen for it; else use the value.
      const isReq = r && typeof (r as IDBRequest).readyState === 'string';
      if (isReq) {
        const req = r as unknown as IDBRequest<T>;
        req.onsuccess = () => { result = req.result; };
        req.onerror = () => reject(req.error);
      } else {
        result = r as T;
      }
    });
    t.oncomplete = () => resolve(result as T);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

function getAllFromIndex<T>(store: IDBObjectStore, index?: string): IDBRequest<T[]> {
  return index ? store.index(index).getAll() : store.getAll();
}

// ── Compare rounds ────────────────────────────────────────────────────────

export async function getCompareRounds(): Promise<Round[]> {
  const rows = await tx<Round[]>('compareRounds', 'readonly', (s) =>
    getAllFromIndex(s, 'startedAt'),
  );
  return rows;
}

export async function putCompareRound(r: Round): Promise<void> {
  await tx<undefined>('compareRounds', 'readwrite', (s) => s.put(r) as unknown as IDBRequest<undefined>);
}

export async function deleteCompareRound(id: string): Promise<void> {
  await tx<undefined>('compareRounds', 'readwrite', (s) => s.delete(id) as unknown as IDBRequest<undefined>);
}

// ── Bench sessions ────────────────────────────────────────────────────────

export async function getBenchSessions(): Promise<BenchSession[]> {
  return tx<BenchSession[]>('benchSessions', 'readonly', (s) => getAllFromIndex(s, 'startedAt'));
}

export async function getBenchSession(id: string): Promise<BenchSession | undefined> {
  return tx<BenchSession | undefined>('benchSessions', 'readonly', (s) => s.get(id) as IDBRequest<BenchSession | undefined>);
}

export async function putBenchSession(s: BenchSession): Promise<void> {
  await tx<undefined>('benchSessions', 'readwrite', (st) => st.put(s) as unknown as IDBRequest<undefined>);
}

export async function deleteBenchSession(id: string): Promise<void> {
  // Delete the session and cascade-delete its runs.
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(['benchSessions', 'benchRuns'], 'readwrite');
    t.objectStore('benchSessions').delete(id);
    const idx = t.objectStore('benchRuns').index('sessionId');
    const cursorReq = idx.openCursor(IDBKeyRange.only(id));
    cursorReq.onsuccess = () => {
      const c = cursorReq.result;
      if (c) { c.delete(); c.continue(); }
    };
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

// ── Bench runs ────────────────────────────────────────────────────────────

export async function getBenchRunsBySession(sessionId: string): Promise<BenchRun[]> {
  return tx<BenchRun[]>('benchRuns', 'readonly', (s) => s.index('sessionId').getAll(IDBKeyRange.only(sessionId)));
}

export async function getBenchRunsByTest(testId: string): Promise<BenchRun[]> {
  return tx<BenchRun[]>('benchRuns', 'readonly', (s) => s.index('testId').getAll(IDBKeyRange.only(testId)));
}

export async function getBenchRun(id: string): Promise<BenchRun | undefined> {
  return tx<BenchRun | undefined>('benchRuns', 'readonly', (s) => s.get(id) as IDBRequest<BenchRun | undefined>);
}

export async function putBenchRun(r: BenchRun): Promise<void> {
  await tx<undefined>('benchRuns', 'readwrite', (s) => s.put(r) as unknown as IDBRequest<undefined>);
}

export async function deleteBenchRun(id: string): Promise<void> {
  await tx<undefined>('benchRuns', 'readwrite', (s) => s.delete(id) as unknown as IDBRequest<undefined>);
}

// ── Custom schedules ──────────────────────────────────────────────────────

export async function getCustomSchedules(): Promise<CustomSchedule[]> {
  return tx<CustomSchedule[]>('customSchedules', 'readonly', (s) => getAllFromIndex(s, 'createdAt'));
}

export async function putCustomSchedule(c: CustomSchedule): Promise<void> {
  await tx<undefined>('customSchedules', 'readwrite', (s) => s.put(c) as unknown as IDBRequest<undefined>);
}

export async function deleteCustomSchedule(id: string): Promise<void> {
  await tx<undefined>('customSchedules', 'readwrite', (s) => s.delete(id) as unknown as IDBRequest<undefined>);
}

// ── localStorage → IndexedDB migration ────────────────────────────────────
// One-shot: if the old `llm-compare-v1` blob has rounds, copy them in and
// rewrite the localStorage entry without rounds. Configs stay in localStorage
// (small, sync, single-tab).

const LEGACY_KEY = 'llm-compare-v1';
const MIGRATION_FLAG = 'compare-llms.migrated.v1';

export async function migrateLegacyRounds(): Promise<{ migrated: number }> {
  if (localStorage.getItem(MIGRATION_FLAG)) return { migrated: 0 };
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) { localStorage.setItem(MIGRATION_FLAG, '1'); return { migrated: 0 }; }
  let parsed: { rounds?: Round[]; configA?: unknown; configB?: unknown } = {};
  try { parsed = JSON.parse(raw); } catch { /* corrupt — leave alone */ return { migrated: 0 }; }
  const rounds = Array.isArray(parsed.rounds) ? parsed.rounds : [];
  for (const r of rounds) {
    if (r && typeof r === 'object' && typeof r.id === 'string') {
      await putCompareRound(r);
    }
  }
  // Strip rounds from the legacy entry; keep configA/configB.
  const next = { configA: parsed.configA, configB: parsed.configB };
  localStorage.setItem(LEGACY_KEY, JSON.stringify(next));
  localStorage.setItem(MIGRATION_FLAG, '1');
  return { migrated: rounds.length };
}
