import fs from "fs";
import { generateEmbedding } from "./embeddingService.js";

let documents = [];
let isLoaded = false;
let loadingPromise = null;

export async function loadDocuments() {
  try {
    const raw = fs.readFileSync(
      new URL("../troubleshooting/troubleshootingDocs.json", import.meta.url)
    );

    const data = JSON.parse(raw);
    console.log("data::::",data);
    

    // console.log(`Loaded ${data.length} troubleshooting documents`);

    documents = [];

    for (const doc of data) {
      const searchableText = [
        doc.type,
        doc.issue,
        ...(doc.aliases || []),
        ...(doc.steps || [])
      ].join(" ");

      const embedding = await generateEmbedding(searchableText);

      if (!embedding || embedding.length === 0) {
        console.warn(`Skipping document ${doc.id}: embedding failed`);
        continue;
      }

      documents.push({
        ...doc,
        embedding
      });
    }

    console.log("Troubleshooting documents loaded successfully");

    return documents.length > 0;
  } catch (error) {
    console.error("Error loading troubleshooting documents:", error);
    return false;
  }
}

export async function ensureDocsLoaded() {
  if (isLoaded) return;

  if (!loadingPromise) {
    loadingPromise = loadDocuments();
  }

  const loaded = await loadingPromise;

  if (loaded) {
    isLoaded = true;
  } else {
    loadingPromise = null;
  }
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchDocs(query, detectedType, detectedIssue) {
  await ensureDocsLoaded();

  if (documents.length === 0) {
    console.warn("No troubleshooting documents loaded");

    return {
      docs: []
    };
  }

  const queryEmbedding = await generateEmbedding(query);

  if (!queryEmbedding || queryEmbedding.length === 0) {
    console.warn("Failed to generate query embedding");

    return {
      docs: []
    };
  }

  const normalizedType = detectedType?.toLowerCase();
  const normalizedIssue = detectedIssue?.toLowerCase();

  const scoredDocs = documents.map((doc) => {
    let score = cosineSimilarity(queryEmbedding, doc.embedding);

    const docType = doc.type?.toLowerCase();
    const docIssue = doc.issue?.toLowerCase();

    if (normalizedType && docType === normalizedType) {
      score += 0.2;
    }

    if (normalizedIssue && docIssue === normalizedIssue) {
      score += 0.2;
    }

    if (
      normalizedIssue &&
      doc.aliases?.some(
        (alias) => alias.toLowerCase() === normalizedIssue
      )
    ) {
      score += 0.2;
    }

    return {
      ...doc,
      score
    };
  });

  const threshold = 0.5;

  const topDocs = scoredDocs
    .filter((doc) => doc.score > threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  console.log(
    "Top RAG results:",
    topDocs.map((doc) => ({
      id: doc.id,
      type: doc.type,
      issue: doc.issue,
      score: doc.score
    }))
  );

  return {
    docs: topDocs
  };
}