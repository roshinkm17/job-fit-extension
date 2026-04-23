/**
 * Chrome's extension storage exposes an async key/value API that we adapt to
 * the shape Supabase-js expects (`getItem` / `setItem` / `removeItem`). Using
 * `chrome.storage.local` instead of `localStorage` means the session follows
 * the user across every content script and the popup in the same profile,
 * without each tab holding a fresh copy.
 */
export interface SupportsSupabaseStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * Read the raw chrome storage interface from the ambient globalThis so we
 * can fall back to an in-memory shim in non-extension environments (e.g.
 * Node-based tests). Real extension runtime always supplies `chrome`.
 */
interface ChromeStorageArea {
  get: (
    keys: string | string[] | Record<string, unknown> | null,
  ) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
  remove: (keys: string | string[]) => Promise<void>;
}

interface ChromeLike {
  readonly storage?: { readonly local?: ChromeStorageArea };
}

function getChromeLocal(): ChromeStorageArea | null {
  const globalScope = globalThis as { chrome?: ChromeLike };
  return globalScope.chrome?.storage?.local ?? null;
}

class InMemoryStorage implements SupportsSupabaseStorage {
  private readonly store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class ChromeLocalStorage implements SupportsSupabaseStorage {
  constructor(private readonly area: ChromeStorageArea) {}

  async getItem(key: string): Promise<string | null> {
    const items = await this.area.get(key);
    const value = items[key];
    return typeof value === "string" ? value : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.area.set({ [key]: value });
  }

  async removeItem(key: string): Promise<void> {
    await this.area.remove(key);
  }
}

/**
 * Returns the right storage backend for the current environment:
 * `chrome.storage.local` when it exists, otherwise an in-memory shim that
 * keeps tests deterministic.
 */
export function createExtensionStorage(): SupportsSupabaseStorage {
  const local = getChromeLocal();
  return local ? new ChromeLocalStorage(local) : new InMemoryStorage();
}
