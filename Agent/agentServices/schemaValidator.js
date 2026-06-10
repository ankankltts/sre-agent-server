import Ajv from "ajv";

const ajv = new Ajv();
const schema = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      enum: ["CHECK_STATUS", "GENERAL"]
    },
    tool: {
  type: ["string", "null"],
  enum: [
    "getStationStatus",
    "getAllStationsStatus",
    "getOfflineStations",
    "getOnlineStations",
    "getPedestalStatus",
    null
  ]
},
    arguments: {
      type: "object",
      properties: {
        lmId: { type: "string" },
        filter: {
          type: "string",
          enum: ["ALL", "ACTIVE", "INACTIVE"]
        }
      }
    },
    responseText: { type: ["string", "null"] }
  },
  required: ["intent", "tool", "arguments"]
};

const validate = ajv.compile(schema);



export function validateLLMOutput(parsed) {

  
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const valid = validate(parsed);

  if (!valid) {
    console.error("Schema error:", validate.errors);
    return null;
  }

  return parsed;
}