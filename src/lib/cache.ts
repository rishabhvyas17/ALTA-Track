/**
 * In-Memory High-Performance Server Cache with TTL
 * 
 * Provides thread-safe, sub-millisecond in-memory caching for semi-static
 * database queries (Campuses, Challenge tracks, Problem lists, and Leaderboard rankings).
 * Drastically cuts down remote database round-trips and prevents connection pool exhaustion.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }
    const fresh = await fetcher();
    this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}

// Global singleton to persist across Next.js dev reloads
const globalForCache = globalThis as unknown as {
  altaMemoryCache: MemoryCache | undefined;
};

export const memoryCache = globalForCache.altaMemoryCache ?? new MemoryCache();
if (process.env.NODE_ENV !== "production") {
  globalForCache.altaMemoryCache = memoryCache;
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  CAMPUSES: 600, // 10 minutes (campuses rarely change)
  CHALLENGES: 300, // 5 minutes (system challenge tracks)
  PROBLEMS: 600, // 10 minutes (problem curriculum definitions)
  LEADERBOARD: 20, // 20 seconds (balances real-time rankings with high query efficiency)
};
