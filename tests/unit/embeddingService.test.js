import { jest, describe, test, expect, beforeEach } from "@jest/globals";

let pipelineMock;

jest.unstable_mockModule("@xenova/transformers", () => ({
  pipeline: (...args) => pipelineMock(...args)
}));

async function loadEmbeddingService() {
  jest.resetModules();

  return await import("../../Agent/rag/embeddingService.js");
}

describe("embeddingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pipelineMock = jest.fn();
  });

  test("generateEmbedding should return empty array for invalid text", async () => {
    const { generateEmbedding } = await loadEmbeddingService();

    await expect(generateEmbedding("")).resolves.toEqual([]);
    await expect(generateEmbedding(null)).resolves.toEqual([]);
    await expect(generateEmbedding(undefined)).resolves.toEqual([]);
    await expect(generateEmbedding(123)).resolves.toEqual([]);

    expect(pipelineMock).not.toHaveBeenCalled();
  });

  test("getEmbedder should create pipeline only once", async () => {
    const modelMock = jest.fn();

    pipelineMock.mockResolvedValue(modelMock);

    const { getEmbedder } = await loadEmbeddingService();

    const embedder1 = await getEmbedder();
    const embedder2 = await getEmbedder();

    expect(pipelineMock).toHaveBeenCalledTimes(1);

    expect(pipelineMock).toHaveBeenCalledWith(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );

    expect(embedder1).toBe(modelMock);
    expect(embedder2).toBe(modelMock);
  });

  test("generateEmbedding should generate vector from model output", async () => {
    const modelMock = jest.fn().mockResolvedValue({
      data: new Float32Array([0.1, 0.2, 0.3])
    });

    pipelineMock.mockResolvedValue(modelMock);

    const { generateEmbedding } = await loadEmbeddingService();

    const result = await generateEmbedding("pedestal down troubleshooting");

    expect(pipelineMock).toHaveBeenCalledTimes(1);

    expect(modelMock).toHaveBeenCalledWith(
      "pedestal down troubleshooting",
      {
        pooling: "mean",
        normalize: true
      }
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toBeCloseTo(0.1);
    expect(result[1]).toBeCloseTo(0.2);
    expect(result[2]).toBeCloseTo(0.3);
  });

  test("generateEmbedding should reuse cached embedder", async () => {
    const modelMock = jest.fn().mockResolvedValue({
      data: new Float32Array([0.5, 0.6])
    });

    pipelineMock.mockResolvedValue(modelMock);

    const { generateEmbedding } = await loadEmbeddingService();

    const result1 = await generateEmbedding("station down");
    const result2 = await generateEmbedding("pedestal down");

    expect(pipelineMock).toHaveBeenCalledTimes(1);
    expect(modelMock).toHaveBeenCalledTimes(2);

    expect(result1).toHaveLength(2);
    expect(result1[0]).toBeCloseTo(0.5);
    expect(result1[1]).toBeCloseTo(0.6);

    expect(result2).toHaveLength(2);
    expect(result2[0]).toBeCloseTo(0.5);
    expect(result2[1]).toBeCloseTo(0.6);
  });

  test("generateEmbedding should return empty array when model output has no data", async () => {
    const modelMock = jest.fn().mockResolvedValue({});

    pipelineMock.mockResolvedValue(modelMock);

    const { generateEmbedding } = await loadEmbeddingService();

    const result = await generateEmbedding("pedestal down");

    expect(result).toEqual([]);
  });
});
