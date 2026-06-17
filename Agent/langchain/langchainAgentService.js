import { ChatOllama } from "@langchain/ollama";
import {
  HumanMessage,
  SystemMessage
} from "@langchain/core/messages";

import { buildLangChainTools } from "./langchainTools.js";
import { systemPrompt } from "../prompts/systemPrompt.js";

const llm = new ChatOllama({
  model: "qwen2.5:latest",
  temperature: 0
});

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

export async function processLangChainQuery({ query, stationsData }) {
  const totalStart = Date.now();

  try {
    log("LANGCHAIN_QUERY", { query });

    if (!query || !query.trim()) {
      return {
        message: "Query is required"
      };
    }

    const toolsStart = Date.now();
    const tools = buildLangChainTools(stationsData);
    console.log("TIME buildLangChainTools:", Date.now() - toolsStart, "ms");

    const bindStart = Date.now();
    const llmWithTools = llm.bindTools(tools);
    console.log("TIME bindTools:", Date.now() - bindStart, "ms");

    const llmStart = Date.now();

    const response = await llmWithTools.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(query)
    ]);

    console.log("TIME LangChain LLM invoke:", Date.now() - llmStart, "ms");

    log("LANGCHAIN_LLM_RESPONSE", {
      content: response.content,
      tool_calls: response.tool_calls || [],
      invalid_tool_calls: response.invalid_tool_calls || []
    });

    const toolCalls = response.tool_calls || [];

    if (toolCalls.length === 0) {
      const message =
        toText(response.content).trim() ||
        "I could not prepare a response for this request.";

      console.log("TIME total:", Date.now() - totalStart, "ms");

      return {
        message
      };
    }

    const firstToolCall = toolCalls[0];

    const toolName = firstToolCall.name;
    const toolArgs = firstToolCall.args || {};

    log("LANGCHAIN_TOOL_CALL", {
      toolName,
      toolArgs
    });

    const selectedTool = tools.find((tool) => tool.name === toolName);

    if (!selectedTool) {
      console.log("TIME total:", Date.now() - totalStart, "ms");

      return {
        message: "Unable to process this request right now."
      };
    }

    const toolStart = Date.now();

    const result = await selectedTool.invoke(toolArgs);

    console.log("TIME tool invoke:", Date.now() - toolStart, "ms");

    log("LANGCHAIN_RESULT", {
      result
    });

    console.log("TIME total:", Date.now() - totalStart, "ms");

    return {
      message: result
    };

  } catch (err) {
    log("LANGCHAIN_ERROR", {
      error: err.message
    });

    console.log("TIME total before error:", Date.now() - totalStart, "ms");

    return {
      message: err.message || "Internal error"
    };
  }
}