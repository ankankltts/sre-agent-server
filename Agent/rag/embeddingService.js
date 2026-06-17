import { pipeline } from "@xenova/transformers";

let embedder = null;

export async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }

  return embedder;
}

export async function generateEmbedding(text) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const model = await getEmbedder();

  const output = await model(text, {
    pooling: "mean",
    normalize: true
  });

  if (!output || !output.data) {
    return [];
  }

  return Array.from(output.data);
}