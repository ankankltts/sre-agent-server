import fs from "fs/promises";

import {
  logAnalyserAgent,
  logChatAgent
} from "../agents/log-analyser-agent/index.js";

import { logModel } from "../agentConfig/models.js";

export async function logAnalyserController(req, res) {
  let uploadedFilePath = null;

  try {
    const {
      query,
      userMessage,
      fileContent,
      fileName,
      sessionId,
      conversationHistory = [],
    } = req.body;

    const finalUserMessage =
      userMessage || query || "Analyze these logs and find the root cause.";

    let finalFileContent = fileContent || "";
    let finalFileName = fileName || "";

    /**
     * CASE 1:
     * File uploaded through multer/FormData.
     */
    if (req.file) {
      uploadedFilePath = req.file.path;
      finalFileContent = await fs.readFile(req.file.path, "utf-8");
      finalFileName = req.file.originalname;
    }

    /**
     * CASE 2:
     * Initial log analysis.
     * Works for:
     * - uploaded file
     * - pasted logs from frontend
     */
    if (finalFileContent && finalFileContent.trim()) {
      const result = await logAnalyserAgent({
        userMessage: finalUserMessage,
        fileContent: finalFileContent,
        fileName: finalFileName,
        sessionId,
        conversationHistory,
        llm: logModel,
      });

      return res.json(result);
    }

    /**
     * CASE 3:
     * Follow-up log chat.
     * No fileContent/file, but sessionId + query exists.
     */
    if (sessionId && finalUserMessage && finalUserMessage.trim()) {
      const result = await logChatAgent({
        sessionId,
        query: finalUserMessage,
        conversationHistory,
        llm: logModel,
      });

      return res.json(result);
    }

    return res.status(400).json({
      success: false,
      agent: "logAnalyserAgent",
      message: "Either uploaded file/fileContent or sessionId with query is required.",
    });
  } catch (error) {
    console.error("logAnalyserController error:", error);

    return res.status(500).json({
      success: false,
      agent: "logAnalyserAgent",
      message: "Failed to analyze logs.",
      error: error.message,
    });
  } finally {
    if (uploadedFilePath) {
      fs.unlink(uploadedFilePath).catch(() => {});
    }
  }
}