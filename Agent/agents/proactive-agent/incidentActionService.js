import {
  getActiveIncidents,
  markTicketCreated,
  markEmailDrafted
} from "./proactiveIncidentStore.js";

function generateTicketId() {
  const timestamp = Date.now();
  return `INC-${timestamp}`;
}

function getSeverity(incidents) {
  if (incidents.some((incident) => incident.severity === "critical")) {
    return "Critical";
  }

  if (incidents.some((incident) => incident.severity === "warning")) {
    return "Warning";
  }

  return "Info";
}

function formatIncidentLine(incident) {
  if (incident.type === "station") {
    return `- Station ${incident.lmId}: ${incident.status || incident.issue}`;
  }

  if (incident.type === "pedestal") {
    return `- Pedestal ${incident.pedestalId} at station ${incident.lmId}: inactive or unavailable`;
  }

  return `- ${incident.lmId || "Unknown asset"}: ${incident.issue}`;
}

export function draftIncidentTicketFromActiveIncidents() {
  const incidents = getActiveIncidents();

  if (!incidents.length) {
    return "There are no active proactive incidents available for ticket drafting.";
  }

  const severity = getSeverity(incidents);

  const title =
    incidents.length === 1
      ? `EV station incident: ${incidents[0].lmId} ${incidents[0].issue}`
      : `EV station incidents detected: ${incidents.length} active issues`;

  const affectedAssets = incidents.map(formatIncidentLine).join("\n");

  return `
Ticket Draft:

Title:
${title}

Severity:
${severity}

Description:
Zeba detected the following active EV infrastructure incidents during proactive monitoring.

Affected assets:
${affectedAssets}

Recommended next actions:
1. Review station and pedestal status.
2. Check troubleshooting steps.
3. Validate logs and connectivity.
4. Assign operations team for remediation.

Approval required:
Please confirm if you want me to create this ticket.
`.trim();
}

export function createIncidentTicketFromActiveIncidents() {
  const incidents = getActiveIncidents();

  if (!incidents.length) {
    return "There are no active proactive incidents available for ticket creation.";
  }

  const ticketId = generateTicketId();

  incidents.forEach((incident) => {
    markTicketCreated(incident.incidentKey, ticketId);
  });

  const affectedAssets = incidents.map(formatIncidentLine).join("\n");

  return `
Ticket created successfully.

Ticket ID:
${ticketId}

Linked incidents:
${affectedAssets}

Status:
ticketCreated=true for all currently active incidents.
`.trim();
}

export function draftOperationsEmailFromActiveIncidents() {
  const incidents = getActiveIncidents();

  if (!incidents.length) {
    return "There are no active proactive incidents available for email drafting.";
  }

  incidents.forEach((incident) => {
    markEmailDrafted(incident.incidentKey);
  });

  const severity = getSeverity(incidents);
  const affectedAssets = incidents.map(formatIncidentLine).join("\n");

  return `
Email Draft:

To:
Operations Team

Subject:
${severity} EV station health alert - ${incidents.length} active incident(s)

Body:
Hi Team,

Zeba detected the following active EV infrastructure incidents during proactive monitoring:

${affectedAssets}

Recommended next actions:
1. Review the affected station or pedestal status.
2. Check troubleshooting steps.
3. Validate logs, connectivity, and EMS communication.
4. Confirm remediation ownership.

Please review and take appropriate action.

Regards,
Ankan
`.trim();
}