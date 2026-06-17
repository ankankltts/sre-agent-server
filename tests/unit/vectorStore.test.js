import {
  jest,
  describe,
  test,
  expect,
  beforeEach,
  afterEach
} from "@jest/globals";

const sampleDocs = [
  {
    id: 1,
    type: "pedestal",
    issue: "down",
    aliases: ["offline", "inactive", "unavailable", "not working"],
    steps: [
      "Check mender logs",
      "Verify EMS communication"
    ]
  },
  {
    id: 2,
    type: "station",
    issue: "down",
    aliases: ["offline", "unavailable", "not working"],
    steps: [
      "Check E-Stop status",
      "Restart EMS"
    ]
  }
];

async function importVectorStoreWithMocks({
  docs = sampleDocs,
  readFileError = null,
  embeddingMock = null
} = {}) {
  jest.resetModules();

  const mockReadFileSync = jest.fn();

  if (readFileError) {
    mockReadFileSync.mockImplementation(() => {
      throw readFileError;
    });
  } else {
    mockReadFileSync.mockReturnValue(JSON.stringify(docs));
  }

  const mockGenerateEmbedding =
    embeddingMock ||
    jest.fn().mockResolvedValue(new Array(10).fill(0.5));

  jest.unstable_mockModule("fs", () => ({
    default: {
      readFileSync: mockReadFileSync
    },
    readFileSync: mockReadFileSync
  }));

  jest.unstable_mockModule("../../Agent/rag/embeddingService.js", () => ({
    generateEmbedding: mockGenerateEmbedding
  }));

  const vectorStore = await import("../../Agent/rag/vectorStore.js");

  return {
    ...vectorStore,
    mockReadFileSync,
    mockGenerateEmbedding
  };
}

describe("vectorStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  test("loadDocuments should load troubleshooting docs and generate embeddings", async () => {
    const {
      loadDocuments,
      mockReadFileSync,
      mockGenerateEmbedding
    } = await importVectorStoreWithMocks();

    const result = await loadDocuments();

    expect(result).toBe(true);
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    expect(mockGenerateEmbedding).toHaveBeenCalledTimes(2);
  });

  test("searchDocs should return matching pedestal doc", async () => {
    const { searchDocs } = await importVectorStoreWithMocks();

    const result = await searchDocs(
      "pedestal down troubleshooting",
      "pedestal",
      "down"
    );

    expect(result).toBeDefined();
    expect(Array.isArray(result.docs)).toBe(true);
    expect(result.docs.length).toBeGreaterThan(0);

    expect(result.docs[0].type).toBe("pedestal");
    expect(result.docs[0].issue).toBe("down");
    expect(result.docs[0].score).toBeGreaterThan(0.5);
  });

  test("searchDocs should match alias issue like unavailable", async () => {
    const { searchDocs } = await importVectorStoreWithMocks();

    const result = await searchDocs(
      "unavailable pedestal troubleshooting",
      "pedestal",
      "unavailable"
    );

    expect(result.docs.length).toBeGreaterThan(0);
    expect(result.docs[0].type).toBe("pedestal");
    expect(result.docs[0].aliases).toContain("unavailable");
  });

  test("loadDocuments should skip document when embedding fails", async () => {
    const embeddingMock = jest.fn(async (text) => {
      if (text.includes("pedestal")) {
        return [];
      }

      return new Array(10).fill(0.5);
    });

    const { searchDocs } = await importVectorStoreWithMocks({
      embeddingMock
    });

    const result = await searchDocs(
      "station down troubleshooting",
      "station",
      "down"
    );

    expect(result.docs.length).toBeGreaterThan(0);
    expect(result.docs.every((doc) => doc.type !== "pedestal")).toBe(true);
  });

  test("searchDocs should return empty docs when file loading fails", async () => {
    const { searchDocs } = await importVectorStoreWithMocks({
      readFileError: new Error("file read failed")
    });

    const result = await searchDocs(
      "pedestal down troubleshooting",
      "pedestal",
      "down"
    );

    expect(result).toEqual({
      docs: []
    });
  });

  test("searchDocs should return empty docs when query embedding fails", async () => {
    const embeddingMock = jest
      .fn()
      .mockResolvedValueOnce(new Array(10).fill(0.5))
      .mockResolvedValueOnce(new Array(10).fill(0.5))
      .mockResolvedValueOnce([]);

    const { searchDocs } = await importVectorStoreWithMocks({
      embeddingMock
    });

    const result = await searchDocs(
      "pedestal down troubleshooting",
      "pedestal",
      "down"
    );

    expect(result).toEqual({
      docs: []
    });
  });

  test("ensureDocsLoaded should load documents only once after successful load", async () => {
    const {
      ensureDocsLoaded,
      mockReadFileSync
    } = await importVectorStoreWithMocks();

    await ensureDocsLoaded();
    await ensureDocsLoaded();

    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
  });

  test("searchDocs should return empty docs when score is below threshold", async () => {
    const embeddingMock = jest
      .fn()
      .mockResolvedValueOnce(new Array(10).fill(0.1))
      .mockResolvedValueOnce(new Array(10).fill(-0.1))
      .mockResolvedValueOnce(new Array(10).fill(0.9));

    const { searchDocs } = await importVectorStoreWithMocks({
      embeddingMock
    });

    const result = await searchDocs(
      "random unrelated query",
      null,
      null
    );

    expect(result).toEqual({
      docs: []
    });
  });
});