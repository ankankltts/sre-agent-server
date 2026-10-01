import { getStationsData } from "./getStationsData.js";

let cachedStationsData = [];
let lastUpdatedAt = null;
let refreshInProgress = false;

export async function refreshStationsDataCache() {
  if (refreshInProgress) {
    return cachedStationsData;
  }

  try {
    refreshInProgress = true;

    const stationData = await getStationsData();

    if (Array.isArray(stationData)) {
      cachedStationsData = stationData;
      lastUpdatedAt = new Date().toISOString();

      console.log("Station data cache updated:", {
        count: cachedStationsData.length,
        lastUpdatedAt
      });
    } else {
      console.warn("Station data cache refresh returned non-array data");
    }

    return cachedStationsData;

  } catch (error) {
    console.error("Station data cache refresh failed:", error.message);
    return cachedStationsData;

  } finally {
    refreshInProgress = false;
  }
}

export function getCachedStationsData() {
  return cachedStationsData;
}

export function getStationDataCacheMeta() {
  return {
    count: cachedStationsData.length,
    lastUpdatedAt
  };
}

export function startStationDataCacheScheduler(intervalMs = 20 * 60 * 1000) {
  console.log(`Station data cache scheduler started. Interval: ${intervalMs}ms`);

  refreshStationsDataCache();

  setInterval(async () => {
    await refreshStationsDataCache();
  }, intervalMs);
}