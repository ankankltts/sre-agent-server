import {
  getCachedStationsData,
  refreshStationsDataCache
} from "../../services/stationDataCache.js";

import { processEvQuery } from "../agents/ev-query-agent/index.js";

export async function evQueryController(req, res) {
  try {
    const {
      query,
      sessionId
    } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Query is required"
      });
    }

    let stationsData = await getCachedStationsData();

    if (!Array.isArray(stationsData) || stationsData.length === 0) {
      stationsData = await refreshStationsDataCache();
    }

    const result = await processEvQuery({
      query,
      stationsData,
      sessionId
    });

    return res.json(result);

  } catch (err) {
    console.error("LangChain agent controller error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal error"
    });
  }
}