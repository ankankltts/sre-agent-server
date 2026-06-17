import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

import {
  getStationStatus,
  getAllStationsStatus,
  getOfflineStations,
  getOnlineStations,
  getPedestalStatus
} from "../agents/toolDefinition.js";
import {getTroubleshootingSteps } from "../troubleshooting/getTroubleshootingSteps.js"

export function buildLangChainTools(stationsData) {
  return [
     new DynamicStructuredTool({
  name: "getAllStationsStatus",
  description:
    "Get status summary of all stations. Use for queries like 'status of stations', 'check status of stations', 'all station status', or 'station status summary'. Do not use this for greetings, casual messages, hello, hi, thanks, or general conversation.",
  schema: z.object({}),
  func: async () => {
    return getAllStationsStatus({ stationsData });
  }
}),
    new DynamicStructuredTool({
      name: "getAllStationsStatus",
      description:
        "Get status summary of all stations. Use for queries like 'status of stations', 'check status of stations', 'all station status', or 'station status summary'. Do not use this for pedestal status.",
      schema: z.object({}),
      func: async () => {
        return getAllStationsStatus({ stationsData });
      }
    }),

    new DynamicStructuredTool({
      name: "getOfflineStations",
      description:
        "Get stations that are offline, down, unavailable, not online, or not working. Use for queries like 'which station is down' or 'offline stations'.",
      schema: z.object({}),
      func: async () => {
        return getOfflineStations({ stationsData });
      }
    }),

    new DynamicStructuredTool({
      name: "getOnlineStations",
      description:
        "Get stations that are online or active. Use for queries like 'which stations are online' or 'online stations'.",
      schema: z.object({}),
      func: async () => {
        return getOnlineStations({ stationsData });
      }
    }),

   new DynamicStructuredTool({
  name: "getPedestalStatus",
  description:
    "Get live pedestal or connector status from stationsData. Always use this tool for pedestal status, connector status, active pedestals, inactive pedestals, unavailable pedestals, not available pedestals, or pedestal availability. For 'pedestal status of station12', use lmId LM12 and filter ALL. For 'inactive pedestals of station 6', use lmId LM6 and filter INACTIVE. For 'which pedestals are inactive across all stations', use lmId null and filter INACTIVE. Never answer pedestal status directly without this tool.",
  schema: z.object({
    lmId: z
      .string()
      .optional()
      .nullable()
      .describe("Station ID like LM6 or LM12. Use null for all stations."),
    filter: z
      .enum(["ALL", "ACTIVE", "INACTIVE"])
      .optional()
      .default("ALL")
  }),
  func: async ({ lmId, filter }) => {
    return getPedestalStatus({
      lmId: lmId || null,
      filter: filter || "ALL",
      stationsData
    });
  }
}),
new DynamicStructuredTool({
  name: "getTroubleshootingSteps",
  description:
    "Get troubleshooting steps for station or pedestal issues. Use when user asks troubleshooting, troubleshoot, steps, how to fix, resolution, what to do, or why an issue is happening. For pedestal down, offline, inactive, unavailable, or not working, use type pedestal and issue down. For station down, offline, unavailable, or not working, use type station and issue down.",
  schema: z.object({
    type: z
      .enum(["station", "pedestal"])
      .describe("Component type. Use station or pedestal."),
    issue: z
      .string()
      .describe("Issue such as down, offline, inactive, unavailable, not working. Use down for offline/unavailable/not working cases.")
  }),
  func: async ({ type, issue }) => {
    return getTroubleshootingSteps({
      type,
      issue
    });
  }
}),
  ];
}