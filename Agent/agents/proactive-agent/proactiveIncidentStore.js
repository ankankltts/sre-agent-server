const activeIncidents = new Map();

const SUMMARY_INTERVAL_MS = 6 * 60 * 60 * 1000;
const SUMMARY_WINDOW_MS = 12 * 60 * 60 * 1000;
const MAX_SUMMARY_PER_WINDOW = 2;

let summaryHistory = [];

export function buildIncidentKey(issue) {
  return [
    issue.type,
    issue.lmId,
    issue.pedestalId || "",
    issue.issue
  ].join(":");
}

export function syncIncidents(currentIssues = []) {
  const now = new Date().toISOString();
  const currentKeys = new Set();

  const newIncidents = [];
  const resolvedIncidents = [];

  for (const issue of currentIssues) {
    const key = buildIncidentKey(issue);

    currentKeys.add(key);

    if (!activeIncidents.has(key)) {
      const incident = {
        ...issue,
        incidentKey: key,

        active: true,
        firstSeenAt: now,
        lastSeenAt: now,
        resolvedAt: null,

        zebaNotified: false,
        zebaNotifiedAt: null,

        ticketCreated: false,
        ticketCreatedAt: null,
        ticketId: null,

        emailDrafted: false,
        emailDraftedAt: null,

        emailSent: false,
        emailSentAt: null
      };

      activeIncidents.set(key, incident);
      newIncidents.push(incident);
    } else {
      const existing = activeIncidents.get(key);

      existing.lastSeenAt = now;
      existing.active = true;
      existing.resolvedAt = null;

      activeIncidents.set(key, existing);
    }
  }

  for (const [key, incident] of activeIncidents.entries()) {
    if (!currentKeys.has(key) && incident.active) {
      incident.active = false;
      incident.resolvedAt = now;

      activeIncidents.set(key, incident);
      resolvedIncidents.push(incident);
    }
  }

  return {
    newIncidents,
    activeIncidents: getActiveIncidents(),
    resolvedIncidents
  };
}

export function markZebaNotified(incidents = []) {
  const now = new Date().toISOString();

  for (const incident of incidents) {
    const existing = activeIncidents.get(incident.incidentKey);

    if (!existing) continue;

    existing.zebaNotified = true;
    existing.zebaNotifiedAt = now;

    activeIncidents.set(incident.incidentKey, existing);
  }
}

export function markTicketCreated(incidentKey, ticketId) {
  const incident = activeIncidents.get(incidentKey);

  if (!incident) return false;

  incident.ticketCreated = true;
  incident.ticketCreatedAt = new Date().toISOString();
  incident.ticketId = ticketId || incident.ticketId;

  activeIncidents.set(incidentKey, incident);

  return true;
}

export function markEmailDrafted(incidentKey) {
  const incident = activeIncidents.get(incidentKey);

  if (!incident) return false;

  incident.emailDrafted = true;
  incident.emailDraftedAt = new Date().toISOString();

  activeIncidents.set(incidentKey, incident);

  return true;
}

export function markEmailSent(incidentKey) {
  const incident = activeIncidents.get(incidentKey);

  if (!incident) return false;

  incident.emailSent = true;
  incident.emailSentAt = new Date().toISOString();

  activeIncidents.set(incidentKey, incident);

  return true;
}

export function getActiveIncidents() {
  return Array.from(activeIncidents.values()).filter(
    (incident) => incident.active
  );
}

export function getAllIncidents() {
  return Array.from(activeIncidents.values());
}

export function shouldSendSummary() {
  const now = Date.now();

  summaryHistory = summaryHistory.filter(
    (ts) => now - ts < SUMMARY_WINDOW_MS
  );

  if (summaryHistory.length >= MAX_SUMMARY_PER_WINDOW) {
    return false;
  }

  const lastSummaryAt = summaryHistory[summaryHistory.length - 1];

  if (!lastSummaryAt) {
    return false;
  }

  return now - lastSummaryAt >= SUMMARY_INTERVAL_MS;
}

export function canSendFirstSummaryAfterStartup() {
  return summaryHistory.length === 0;
}

export function recordSummarySent() {
  summaryHistory.push(Date.now());
}

export function getIncidentStoreStatus() {
  return {
    activeIncidentCount: getActiveIncidents().length,
    totalTrackedIncidentCount: activeIncidents.size,
    summarySentCountInWindow: summaryHistory.length,
    summaryHistory
  };
}