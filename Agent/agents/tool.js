export const tools = [
  {
    name: "getStationStatus",
    description: "Get status of a specific station",
    parameters: {
      type: "object",
      properties: {
        lmId: { type: "string" }
      },
      required: ["lmId"]
    }
  },
  {
    name: "getAllStationsStatus",
    description: "Get status of all stations",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "getOfflineStations",
    description: "Get offline stations",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "getOnlineStations",
    description: "Get online stations",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "getPedestalStatus",
    description: "Get pedestal status",
    parameters: {
      type: "object",
      properties: {
        lmId: { type: "string" },
        filter: {
          type: "string",
          enum: ["ALL", "ACTIVE", "INACTIVE"]
        }
      }
    }
  }
];