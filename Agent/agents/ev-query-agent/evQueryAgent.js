import {
  HumanMessage,
  SystemMessage
} from "@langchain/core/messages";

import { buildLangChainTools } from "./index.js";
import { systemPrompt } from "../../prompts/systemPrompt.js";
import { evReasoningModel } from "../../agentConfig/models.js";

import {
  getOrCreateSession,
  updateEvContext
} from "../sessionStore.js";

const llm = evReasoningModel;

function log(type, data = {}) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    type,
    ...data
  }));
}

function toText(value) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item?.text) {
          return item.text;
        }

        return JSON.stringify(item);
      })
      .join(" ");
  }

  if (value == null) {
    return "";
  }

  return String(value);
}

function buildContextMessage(evContext = {}) {
  const lines = [];

  if (evContext.lastStationId) {
    lines.push(`Last station ID: ${evContext.lastStationId}`);
  }

  if (evContext.lastPedestalId) {
    lines.push(`Last pedestal ID: ${evContext.lastPedestalId}`);
  }

  if (evContext.lastEntityType) {
    lines.push(`Last entity type: ${evContext.lastEntityType}`);
  }

  if (evContext.lastFilter) {
    lines.push(`Last pedestal filter: ${evContext.lastFilter}`);
  }

  if (evContext.lastIssue) {
    lines.push(`Last issue: ${evContext.lastIssue}`);
  }

  if (evContext.lastScope) {
    lines.push(`Last scope: ${evContext.lastScope}`);
  }

  if (evContext.lastToolName) {
    lines.push(`Last selected capability: ${evContext.lastToolName}`);
  }

  if (evContext.lastToolArgs) {
    lines.push(
      `Last selected capability arguments: ${JSON.stringify(evContext.lastToolArgs)}`
    );
  }

  if (evContext.lastUserQuery) {
    lines.push(`Last user query: ${evContext.lastUserQuery}`);
  }

  if (lines.length === 0) {
    return "";
  }

  return `
CONTROLLED EV CONVERSATION CONTEXT:
${lines.join("\n")}

Use this context only to resolve short EV/station/pedestal follow-up queries.
`;
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function normalizeScopeFromLmId(lmId) {
  if (lmId) {
    return "single_station";
  }

  return "all_stations";
}

function buildUpdatedEvContext(currentContext, toolName, toolArgs, query) {
  const safeToolArgs = toolArgs || {};

  const nextContext = {
    ...currentContext,
    lastToolName: toolName,
    lastToolArgs: safeToolArgs,
    lastUserQuery: query
  };

  if (hasOwn(safeToolArgs, "lmId")) {
    nextContext.lastStationId = safeToolArgs.lmId || null;
    nextContext.lastScope = normalizeScopeFromLmId(safeToolArgs.lmId);
  }

  if (hasOwn(safeToolArgs, "stationId")) {
    nextContext.lastStationId = safeToolArgs.stationId || null;
    nextContext.lastScope = normalizeScopeFromLmId(safeToolArgs.stationId);
  }

  if (hasOwn(safeToolArgs, "pedestalId")) {
    nextContext.lastPedestalId = safeToolArgs.pedestalId || null;
    nextContext.lastEntityType = "pedestal";
  }

  if (hasOwn(safeToolArgs, "filter")) {
    nextContext.lastFilter = safeToolArgs.filter || null;
  }

  if (hasOwn(safeToolArgs, "type")) {
    nextContext.lastEntityType = safeToolArgs.type || null;
  }

  if (hasOwn(safeToolArgs, "issue")) {
    nextContext.lastIssue = safeToolArgs.issue || null;
  }

  const lowerQuery = query.toLowerCase();

  if (
    lowerQuery.includes("all station") ||
    lowerQuery.includes("all stations") ||
    lowerQuery.includes("overall")
  ) {
    nextContext.lastScope = "all_stations";
  }

  if (
    lowerQuery.includes("pedestal") ||
    lowerQuery.includes("connector")
  ) {
    nextContext.lastEntityType = "pedestal";
  }

  if (lowerQuery.includes("station")) {
    nextContext.lastEntityType = "station";
  }

  const oldHistory = Array.isArray(currentContext.toolHistory)
    ? currentContext.toolHistory
    : [];

  nextContext.toolHistory = [
    ...oldHistory,
    {
      toolName,
      toolArgs: safeToolArgs,
      query,
      ts: new Date().toISOString()
    }
  ].slice(-5);

  return nextContext;
}

export async function processEvQuery({
  query,
  stationsData,
  sessionId
}) {
  const totalStart = Date.now();

  try {
    log("LANGCHAIN_QUERY", {
      query,
      sessionId
    });

    if (!query || !query.trim()) {
      return {
        success: false,
        message: "Query is required"
      };
    }

    const session = getOrCreateSession(sessionId);
    const finalSessionId = session.sessionId;

    const toolsStart = Date.now();
    const tools = buildLangChainTools(stationsData);
    console.log("TIME buildLangChainTools:", Date.now() - toolsStart, "ms");

    const bindStart = Date.now();
    const llmWithTools = llm.bindTools(tools);
    console.log("TIME bindTools:", Date.now() - bindStart, "ms");

    const contextMessage = buildContextMessage(session.evContext);

    const messages = [
      new SystemMessage(systemPrompt)
    ];

    if (contextMessage) {
      messages.push(new SystemMessage(contextMessage));
    }

    messages.push(new HumanMessage(query));

    const llmStart = Date.now();
    const response = await llmWithTools.invoke(messages);

    console.log("TIME LangChain LLM invoke:", Date.now() - llmStart, "ms");

    log("LANGCHAIN_LLM_RESPONSE", {
      sessionId: finalSessionId,
      content: response.content,
      tool_calls: response.tool_calls || [],
      invalid_tool_calls: response.invalid_tool_calls || []
    });

    const toolCalls = response.tool_calls || [];

    if (toolCalls.length === 0) {
      const message =
        toText(response.content).trim() ||
        "I could not prepare a response for this request.";

      updateEvContext(finalSessionId, (currentContext) => ({
        ...currentContext,
        lastUserQuery: query
      }));

      console.log("TIME total:", Date.now() - totalStart, "ms");

      return {
        success: true,
        sessionId: finalSessionId,
        agent: "evAgent",
        message
      };
    }

    const firstToolCall = toolCalls[0];

    const toolName = firstToolCall.name;
    const toolArgs = firstToolCall.args || {};

    log("LANGCHAIN_TOOL_CALL", {
      sessionId: finalSessionId,
      toolName,
      toolArgs
    });

    const selectedTool = tools.find((tool) => tool.name === toolName);

    if (!selectedTool) {
      console.log("TIME total:", Date.now() - totalStart, "ms");

      return {
        success: false,
        sessionId: finalSessionId,
        agent: "evAgent",
        message: "Unable to process this request right now."
      };
    }

    const updatedSession = updateEvContext(finalSessionId, (currentContext) => {
      return buildUpdatedEvContext(
        currentContext,
        toolName,
        toolArgs,
        query
      );
    });

    console.log("EV_SESSION_CONTEXT:", updatedSession.evContext);

    const toolStart = Date.now();
    const result = await selectedTool.invoke(toolArgs);

    console.log("TIME tool invoke:", Date.now() - toolStart, "ms");

    log("LANGCHAIN_RESULT", {
      sessionId: finalSessionId,
      result
    });

    console.log("TIME total:", Date.now() - totalStart, "ms");

    return {
      success: true,
      sessionId: finalSessionId,
      agent: "evAgent",
      message: result
    };

  } catch (err) {
    log("LANGCHAIN_ERROR", {
      error: err.message
    });

    console.log("TIME total before error:", Date.now() - totalStart, "ms");

    return {
      success: false,
      agent: "evAgent",
      message: err.message || "Internal error"
    };
  }
}