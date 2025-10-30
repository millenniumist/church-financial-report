// In-memory cache for financial data
let cachedData = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedData() {
  if (!cachedData || !cacheTimestamp) {
    return null;
  }
  
  const now = Date.now();
  if (now - cacheTimestamp > CACHE_DURATION) {
    return null; // Cache expired
  }
  
  return cachedData;
}

export function setCachedData(data) {
  cachedData = data;
  cacheTimestamp = Date.now();
}

export function clearCache() {
  cachedData = null;
  cacheTimestamp = null;
}
