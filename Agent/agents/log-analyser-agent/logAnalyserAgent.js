import { buildLogAnalysisPrompt } from "./logPromptBuilder.js";
import {
  getOrCreateSession,
  updateLogContext
} from "../sessionStore.js";

export async function logAnalyserAgent({
  userMessage,
  fileContent,
  fileName = "",
  sessionId,
  conversationHistory = [],
  llm,
}) {
  let finalSessionId = sessionId;

  try {
    if (!llm) {
      throw new Error("LLM model is required for logAnalyserAgent.");
    }

    if (!fileContent || !fileContent.trim()) {
      return {
        success: false,
        agent: "logAnalyserAgent",
        sessionId: finalSessionId,
        message: "Please upload a log file or paste log text so I can analyze it.",
      };
    }

    const session = getOrCreateSession(sessionId);
    finalSessionId = session.sessionId;

    const finalUserMessage =
      userMessage || "Analyze these logs and find the root cause.";

    const cleanedLogs = sanitizeLogs(fileContent);

    /**
     * TODO: RAG UPGRADE
     *
     * Current flow:
     * - For large logs, we only trim head + tail.
     *
     * Future RAG flow:
     * 1. Use finalSessionId.
     * 2. Split cleanedLogs into chunks with line numbers.
     * 3. Create embeddings for each chunk.
     * 4. Store vector index using finalSessionId.
     * 5. Retrieve relevant chunks based on finalUserMessage.
     * 6. Send retrieved chunks to LLM.
     * 7. Store retrieved chunk metadata in session.logContext.
     */

    const limitedLogs = limitLogsForLLM(cleanedLogs);

    const prompt = buildLogAnalysisPrompt({
      userMessage: finalUserMessage,
      logs: limitedLogs,
      fileName,
      conversationHistory,
      isTrimmed: cleanedLogs.length !== limitedLogs.length,
    });

    const response = await llm.invoke(prompt);
    const message = extractLLMText(response);

    updateLogContext(finalSessionId, {
      lastFileName: fileName,
      lastUserQuery: finalUserMessage,
      lastMode: "direct_llm",
      lastAnalysedAt: new Date().toISOString(),
      originalSize: fileContent.length,
      cleanedSize: cleanedLogs.length,
      trimmed: cleanedLogs.length !== limitedLogs.length,
    });

    return {
      success: true,
      agent: "logAnalyserAgent",
      sessionId: finalSessionId,
      message,
      metadata: {
        fileName,
        originalSize: fileContent.length,
        cleanedSize: cleanedLogs.length,
        trimmed: cleanedLogs.length !== limitedLogs.length,

        // TODO: Change this to "rag_llm" after RAG implementation.
        mode: "direct_llm",
      },
    };
  } catch (error) {
    console.error("logAnalyserAgent error:", error);

    return {
      success: false,
      agent: "logAnalyserAgent",
      sessionId: finalSessionId,
      message: "Failed to analyze the logs.",
      error: error.message,
    };
  }
}

function sanitizeLogs(logs) {
  if (!logs) return "";

  return logs
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/password\s*[:=]\s*[^&\s]+/gi, "password=[REDACTED]")
    .replace(/token\s*[:=]\s*[^&\s]+/gi, "token=[REDACTED]")
    .replace(/api[_-]?key\s*[:=]\s*[^&\s]+/gi, "apiKey=[REDACTED]")
    .replace(/authorization\s*[:=]\s*[^&\n]+/gi, "authorization=[REDACTED]");
}

function limitLogsForLLM(logs) {
  const maxChars = 60000;

  if (logs.length <= maxChars) {
    return logs;
  }

  /**
   * TODO: RAG UPGRADE
   *
   * This is temporary large-log handling.
   *
   * Problem:
   * - Head + tail trimming can miss errors in the middle.
   *
   * Later replace this function with:
   * - chunkLogsWithLineNumbers()
   * - createLogVectorIndex()
   * - retrieveLogChunks()
   * - formatRetrievedChunks()
   */

  const head = logs.slice(0, 30000);
  const tail = logs.slice(-30000);

  return `
[START OF LOG FILE]
${head}

[LOG FILE TRIMMED BECAUSE IT IS LARGE]

[END OF LOG FILE]
${tail}
`;
}

function extractLLMText(response) {
  if (!response) return "";

  if (typeof response === "string") {
    return response;
  }

  if (response.content) {
    return response.content;
  }

  if (response.text) {
    return response.text;
  }

  if (response.message?.content) {
    return response.message.content;
  }

  return JSON.stringify(response);
}