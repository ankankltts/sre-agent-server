import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import { callOllama } from "../../Agent/agentConfig/llmClient.js";


global.fetch = jest.fn();

describe("callOllama", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return valid response from Ollama", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: "Hello from LLM"
      })
    });

    const result = await callOllama("which station is down");

    expect(result).toBe("Hello from LLM");
  });

  test("should throw error when API fails", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Error"
    });

    await expect(callOllama("test"))
      .rejects
      .toThrow("Ollama HTTP 500");
  });

  test("should throw error when response is invalid", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    await expect(callOllama("test"))
      .rejects
      .toThrow("Ollama returned empty or invalid response");
  });



});