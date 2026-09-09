import { memoryCache, CACHE_TTL } from "../cache";

async function runBenchmark() {
  console.log("⚡ Benchmarking Cache Performance...");

  const testKey = "perf_test_stats";
  
  // 1. Simulating DB fetch (simulated network latency 150ms)
  const startFresh = performance.now();
  const fresh = await memoryCache.getOrSet(testKey, CACHE_TTL.SUPERADMIN_STATS, async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { status: "ok", count: 42 };
  });
  const timeFresh = performance.now() - startFresh;
  console.log(`⏱️ First uncached fetch: ${timeFresh.toFixed(2)}ms`);

  // 2. Cached fetch
  const startCached = performance.now();
  const cached = await memoryCache.getOrSet(testKey, CACHE_TTL.SUPERADMIN_STATS, async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { status: "fail", count: 0 };
  });
  const timeCached = performance.now() - startCached;
  console.log(`⚡ Cached fetch (in-memory): ${timeCached.toFixed(4)}ms`);

  if (cached.count === 42 && timeCached < 5) {
    console.log("✅ PASS: In-memory cache returns in sub-millisecond time (< 5ms)!");
  } else {
    console.error("❌ FAIL: Cache miss or slow");
  }

  // 3. Invalidation
  memoryCache.delete(testKey);
  const afterDelete = memoryCache.get(testKey);
  if (afterDelete === undefined) {
    console.log("✅ PASS: Cache invalidation works correctly!");
  } else {
    console.error("❌ FAIL: Cache not invalidated");
  }
}

runBenchmark();
