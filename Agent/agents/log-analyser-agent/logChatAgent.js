

export async function logChatAgent({
  sessionId,
  query,
  conversationHistory = [],
  llm,
}) {
  try {
    if (!llm) {
      throw new Error("LLM model is required for logChatAgent.");
    }

    if (!sessionId) {
      return {
        success: false,
        agent: "logChatAgent",
        message: "sessionId is required for log follow-up chat.",
      };
    }

    if (!query || !query.trim()) {
      return {
        success: false,
        agent: "logChatAgent",
        message: "Query is required.",
      };
    }

    /**
     * TODO: RAG UPGRADE
     *
     * Current placeholder:
     * - We do not yet retrieve previous log chunks.
     *
     * Future:
     * - Retrieve log chunks by sessionId.
     * - Send retrieved chunks + query to LLM.
     */

    const prompt = `
You are a log analysis follow-up assistant.

The user is asking a follow-up question about a previous log analysis.

Session ID:
${sessionId}

User question:
${query}

Recent conversation:
${formatHistory(conversationHistory)}

Important:
- If previous log context is not available, clearly say that log context retrieval is not implemented yet.
- Ask the user to upload/analyze the log again if needed.

Return a clear and helpful answer.
`;

    const response = await llm.invoke(prompt);

    return {
      success: true,
      agent: "logChatAgent",
      sessionId,
      message: extractLLMText(response),
      metadata: {
        mode: "log_followup_placeholder",
      },
    };
  } catch (error) {
    console.error("logChatAgent error:", error);

    return {
      success: false,
      agent: "logChatAgent",
      sessionId,
      message: "Failed to process log follow-up chat.",
      error: error.message,
    };
  }
}

function formatHistory(conversationHistory = []) {
  if (!Array.isArray(conversationHistory)) return "";

  return conversationHistory
    .slice(-5)
    .map((item) => {
      const role = item.role || "user";
      const content = item.content || "";
      return `${role}: ${content}`;
    })
    .join("\n");
}

function extractLLMText(response) {
  if (!response) return "";

  if (typeof response === "string") return response;

  if (response.content) return response.content;

  if (response.text) return response.text;

  if (response.message?.content) return response.message.content;

  return JSON.stringify(response);
}