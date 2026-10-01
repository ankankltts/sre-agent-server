import { ChatOllama } from "@langchain/ollama";

export const logModel  = new ChatOllama({
  model: "qwen2.5:3b",
  temperature: 0.2,
});

export const evReasoningModel = new ChatOllama({
  model: "qwen2.5:latest",
  temperature: 0.1,
});

export const writingModel = new ChatOllama({
  model: "llama3.1:latest",
  temperature: 0.4,
});