import { getCachedStationsData } from "../../../services/stationDataCache.js";



import {
  syncIncidents,
  markZebaNotified,
  shouldSendSummary,
  canSendFirstSummaryAfterStartup,
  recordSummarySent,
  getIncidentStoreStatus,
  analyzeStationHealth,
  emitProactiveUpdate ,
} from "./index.js";

let proactiveAgentStarted = false;
let firstRunCompleted = false;

function getHighestSeverity(issues) {
  if (issues.some((issue) => issue.severity === "critical")) {
    return "critical";
  }

  if (issues.some((issue) => issue.severity === "warning")) {
    return "warning";
  }

  return "info";
}

function buildImmediateMessage(newIncidents) {
  const stationIssues = newIncidents.filter(
    (incident) => incident.type === "station"
  );

  const pedestalIssues = newIncidents.filter(
    (incident) => incident.type === "pedestal"  
  );

  const lines = [];

  lines.push("Hey Ankan, I noticed new station health updates.");

  if (stationIssues.length > 0) {
    lines.push("");
    lines.push("New station incidents:");

    stationIssues.forEach((incident) => {
      lines.push(
        `- Station ${incident.lmId} appears to be ${incident.status || incident.issue}.`
      );
    });
  }

  if (pedestalIssues.length > 0) {
    lines.push("");
    lines.push("New pedestal incidents:");

    pedestalIssues.forEach((incident) => {
      lines.push(
        `- ${incident.pedestalId} at station ${incident.lmId} appears unavailable.`
      );
    });
  }

  lines.push("");
  lines.push("Suggested actions:");
  lines.push("1. Show troubleshooting steps");
  lines.push("2. Create an incident ticket");
  lines.push("3. Draft an email to the operations team");

  lines.push("");
  lines.push("Would you like me to proceed with any of these actions?");

  return lines.join("\n");
}

function buildSummaryMessage(activeIncidents) {
  const stationIssues = activeIncidents.filter(
    (incident) => incident.type === "station"
  );

  const pedestalIssues = activeIncidents.filter(
    (incident) => incident.type === "pedestal"
  );

  const lines = [];

  lines.push("Hey Ankan, here is the current station health summary for active incidents.");

  if (stationIssues.length > 0) {
    lines.push("");
    lines.push("Active station incidents:");

    stationIssues.forEach((incident) => {
      lines.push(
        `- Station ${incident.lmId} is still ${incident.status || incident.issue}. First seen at ${incident.firstSeenAt}.`
      );
    });
  }

  if (pedestalIssues.length > 0) {
    lines.push("");
    lines.push("Active pedestal incidents:");

    pedestalIssues.forEach((incident) => {
      lines.push(
        `-${incident.pedestalId} at station ${incident.lmId} is still  unavailable. First seen at ${incident.firstSeenAt}.`
      );
    });
  }

  lines.push("");
  lines.push("Ticket and email status:");

  activeIncidents.forEach((incident) => {
    const asset =
      incident.type === "station"
        ? `Station ${incident.lmId}`
        : `${incident.pedestalId} at ${incident.lmId}`;

    lines.push(
      `- ${asset}: ticketCreated=${incident.ticketCreated}, emailSent=${incident.emailSent}`
    );
  });

  lines.push("");
  lines.push("Would you like troubleshooting steps, ticket draft, or email draft for these active incidents?");

  return lines.join("\n");
}

export function startProactiveStationAgent(intervalMs = 60 * 1000) {
  if (proactiveAgentStarted) {
    return;
  }

  proactiveAgentStarted = true;

  console.log(`Proactive station agent started. Interval: ${intervalMs}ms`);

  const run = () => {
    try {
      const stationsData = getCachedStationsData();

      console.log("Proactive agent checking station health...");
      console.log("Cached stations count:", stationsData.length);

      if (!Array.isArray(stationsData) || stationsData.length === 0) {
        console.warn("Proactive agent: no cached station data available");
        return;
      }

      const currentIssues = analyzeStationHealth(stationsData);

      const {
        newIncidents,
        activeIncidents,
        resolvedIncidents
      } = syncIncidents(currentIssues);

      console.log("New proactive incidents:", newIncidents.length);
      console.log("Active proactive incidents:", activeIncidents.length);
      console.log("Resolved proactive incidents:", resolvedIncidents.length);
      console.log("Incident store status:", getIncidentStoreStatus());

      if (newIncidents.length > 0) {
        const message = buildImmediateMessage(newIncidents);

        emitProactiveUpdate({
          type: "station_health_update",
          alertType: "new_incident",
          severity: getHighestSeverity(newIncidents),
          issueCount: newIncidents.length,
          incidents: newIncidents,
          message
        });

        markZebaNotified(newIncidents);
      }

      if (
        firstRunCompleted &&
        activeIncidents.length > 0 &&
        shouldSendSummary()
      ) {
        const summaryMessage = buildSummaryMessage(activeIncidents);

        emitProactiveUpdate({
          type: "station_health_update",
          alertType: "six_hour_summary",
          severity: getHighestSeverity(activeIncidents),
          issueCount: activeIncidents.length,
          incidents: activeIncidents,
          message: summaryMessage
        });

        recordSummarySent();
      }

      if (!firstRunCompleted) {
        firstRunCompleted = true;

        if (activeIncidents.length > 0 && canSendFirstSummaryAfterStartup()) {
          recordSummarySent();
        }
      }

    } catch (error) {
      console.error("Proactive station agent error:", error.message);
    }
  };

  run();

  setInterval(run, intervalMs);
}