import express from "express";

import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" })); // allow all origins

const PORT = process.env.PORT || 5000;



import apiRouter from './routes/apiRouter.js'
import agentRoutes from './Agent/agentRoutes/agentRoutes.js'

import {ensureDocsLoaded } from "./Agent/rag/vectorStore.js"



app.use('/api',apiRouter)
app.use('/api/agent',agentRoutes);


app.listen(PORT, async () => {
  console.log("server is running on port ", PORT);
   await ensureDocsLoaded()
   console.log("RAG warmup completed");

});
