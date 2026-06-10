import { callOllama } from "../agentConfig/llmClient.js";
import { extractJSON } from "../agentServices/jsonExtractor.js";
import { validateLLMOutput } from "../agentServices/schemaValidator.js";

export async function transformQueryWithLLM(query, retry = 1) {

  const prompt = `
Return ONLY JSON:

{
  "intent": <CHECK_STATUS or GENERAL>,
  "tool": <getStationStatus, getAllStationsStatus, getOfflineStations, getOnlineStations, getPedestalStatus, null>,
  "arguments": {},
  "responseText": null
}

CRITICAL:
If query contains:
station, pedestal, pedestals, connector, connectors,
status, online, offline, active, inactive

→ ALWAYS intent = CHECK_STATUS

Rules:
- greeting → GENERAL
- station + number → getStationStatus
- station without number → getAllStationsStatus
- offline → getOfflineStations
- online → getOnlineStations
- pedestal/connector/active/inactive → getPedestalStatus

- extract lmId like "lm10" → "LM10"
- active → filter = ACTIVE
- inactive → filter = INACTIVE

Return ONLY ONE JSON. No explanation.

User Query:
"${query}"
`;

  const raw = await callOllama(prompt);

  console.log("RAW:", raw);

  // ✅ Step 1: Extract JSON
  let parsed = extractJSON(raw);

  // ✅ Step 2: Repair if extraction fails
  if (!parsed) {
    console.warn("Trying JSON repair...");
    parsed = await repairJSON(raw);
  }

  // ✅ Step 3: Retry if still null
  if (!parsed) {
    if (retry > 0) {
      console.warn("Retrying LLM...");
      return transformQueryWithLLM(query, retry - 1);
    }
    return null;
  }

  // ✅ Step 4: Normalize LLM output
  parsed.intent = normalizeIntent(parsed.intent);
  parsed.arguments = normalizeArguments(parsed.arguments);

  // ✅ Step 5: Validate schema
  const validated = validateLLMOutput(parsed);

  if (!validated) {
    if (retry > 0) {
      console.warn("Retrying due to schema error...");
      return transformQueryWithLLM(query, retry - 1);
    }
    return null;
  }

  return validated;
}


// ✅ JSON repair (safe)
 async function repairJSON(raw, retry = 1) {

  const repairPrompt = `
Fix the following into valid JSON.
Return ONLY JSON.

${raw}
`;

  const fixed = await callOllama(repairPrompt);

  const parsed = extractJSON(fixed);

  if (!parsed && retry > 0) {
    return repairJSON(raw, retry - 1);
  }

  return parsed;
}


// ✅ Normalize intent
function normalizeIntent(intent) {

  if (!intent) return intent;

  const upper = intent.toUpperCase();

  if (upper.includes("STATUS")) return "CHECK_STATUS";
  if (upper.includes("GENERAL")) return "GENERAL";

  return intent;
}


// ✅ Normalize arguments
function normalizeArguments(args) {

  const result = { ...(args || {}) };

  // ✅ stationId → lmId
  if (result.stationId && !result.lmId) {
    const num = result.stationId.match(/\d+/)?.[0];
    if (num) {
      result.lmId = `LM${num}`;
    }
    delete result.stationId;
  }

  // ✅ stationNumber → lmId
  if (result.stationNumber && !result.lmId) {
    const num = String(result.stationNumber).match(/\d+/)?.[0];
    if (num) {
      result.lmId = `LM${num}`;
    }
    delete result.stationNumber;
  }

  return result;
}