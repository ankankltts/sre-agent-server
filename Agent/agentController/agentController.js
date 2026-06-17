import { getStationsData } from "../../services/getStationsData.js";
import { processLangChainQuery } from "../langchain/langchainAgentService.js";

export async function langchainAgentController(req, res) {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        message: "Query is required"
      });
    }

    const stationsData = await getStationsData();

    const result = await processLangChainQuery({
      query,
      stationsData
    });

    return res.json(result);

  } catch (err) {
    console.error("LangChain agent controller error:", err);

    return res.status(500).json({
      message: err.message || "Internal error"
    });
  }
}