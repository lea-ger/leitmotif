/**
 * Minimal Promise-based IndexedDB key-value store.
 * Database: "leitmotif", object store: "keyval"
 *
 * Provides a localStorage-compatible API (getItem / setItem / removeItem)
 * but with no size constraints and full async operation.
 */

const DB_NAME    = 'leitmotif'
const STORE_NAME = 'keyval'
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result)
    req.onerror   = () => { dbPromise = null; reject(req.error) }
  })

  return dbPromise
}

export async function getItem<T = unknown>(key: string): Promise<T | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly')
                  .objectStore(STORE_NAME)
                  .get(key)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror   = () => reject(req.error)
  })
}

export async function setItem(key: string, value: unknown): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readwrite')
                  .objectStore(STORE_NAME)
                  .put(value, key)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

export async function removeItem(key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readwrite')
                  .objectStore(STORE_NAME)
                  .delete(key)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}
