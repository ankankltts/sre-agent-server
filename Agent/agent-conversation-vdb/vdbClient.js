import openai from "../agentConfig/llmClient.js";

// vectorDB help in upto conversation
const vectorStore = [];

export const embedText = async (text) => {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return res.data[0].embedding;
};

export const addVector = async ({ text, metadata }) => {
  const embedding = await embedText(text);

  vectorStore.push({
    text,
    embedding,
    metadata,      // intent, date, topic, etc.
    timestamp: Date.now()
  });
};

export const getAllVectors = () => vectorStore;