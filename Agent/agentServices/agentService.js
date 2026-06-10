import { transformQueryWithLLM } from "../agents/transformQueryWithLLM.js";
import { toolRegistry } from "../agents/toolRegistry.js";


function log(type, data) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    type,
    ...data
  }));
}


function validateToolCall(tool, args) {

  const safeArgs = args || {};

  if (typeof safeArgs.lmId === "string" && safeArgs.lmId.trim() === "") {
    delete safeArgs.lmId;
  }

  if (tool === "getStationStatus" && !safeArgs.lmId) {
    return {
      tool: "getAllStationsStatus",
      args: {}
    };
  }

  if (tool === "getPedestalStatus") {
    return {
      tool,
      args: {
        lmId: safeArgs.lmId || null,
        filter: safeArgs.filter || "ALL"
      }
    };
  }

  return { tool, args: safeArgs };
}


export const processAgentQuery = async ({ query, stationsData }) => {

  try {
    log("QUERY", { query });

    const parsed = await transformQueryWithLLM(query);

    if (!parsed) {
      log("LLM_FAIL", { query });
      return { message: "Failed to understand query" };
    }

    const { intent, tool, arguments: args, responseText } = parsed;

    if (intent === "GENERAL") {
      return {
        message: responseText || "How can I assist you?"
      };
    }

    let { tool: finalTool, args: finalArgs } =
      validateToolCall(tool, args);

    log("TOOL_CALL", { finalTool, finalArgs });

    const toolFn = toolRegistry[finalTool];

    if (!toolFn) {
      return { message: "Unknown tool" };
    }

    const result = toolFn({
      ...finalArgs,
      stationsData
    });

    log("RESULT", { result });

    return { message: result };

  } catch (err) {
    log("ERROR", { error: err.message });

    return {
      message: "Internal error"
    };
  }
};