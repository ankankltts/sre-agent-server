import express from "express";
import cors from "cors";

import apiRouter from "./routes/apiRouter.js";
import agentRoutes from "./Agent/agentRoutes/agentRoutes.js";

import { ensureDocsLoaded } from "./Agent/rag/vectorStore.js";

import {
  startStationDataCacheScheduler,
  refreshStationsDataCache
} from "./services/stationDataCache.js";


import {startProactiveStationAgent} from './Agent/agents/proactive-agent/index.js'



const app = express();

app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use(cors({ origin: "*" }));

const PORT = process.env.PORT || 5000;

app.use("/api", apiRouter);
app.use("/api/agent", agentRoutes);

app.listen(PORT, async () => {
  console.log("server is running on port", PORT);

  const ragReady = await ensureDocsLoaded();

  if (ragReady) {
    console.log("RAG warmup completed");
  } else {
    console.warn("RAG warmup failed");
  }
  await refreshStationsDataCache();

  startStationDataCacheScheduler(20 * 60 * 1000);

  startProactiveStationAgent(60 * 1000);
});