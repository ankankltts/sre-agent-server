function getStationId(station) {
  return station?.lmId || station?.id || station?.stationId || null;
}

function getStationState(station) {
  return String(
    station?.state ||
    station?.status ||
    station?.availabilityStatus ||
    "unknown"
  )
    .trim()
    .toLowerCase();
}

function getAvailability(station) {
  return station?.availability || {};
}

function isDownState(state) {
  const normalizedState = String(state || "")
    .trim()
    .toLowerCase();

  const downStates = new Set([
    "offline",
    "down",
    "failed",
    "inactive"
  ]);

  return downStates.has(normalizedState);
}

function normalizeArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getInactivePedestals(station) {
  const availability = getAvailability(station);

  return [
    ...new Set(
      Object.entries(availability)
        .filter(([key]) =>
          /(notActive|inactive|unavailable|offline|down|notAvailable)/i.test(key)
        )
        .flatMap(([, value]) => normalizeArray(value))
        .filter(Boolean)
    )
  ];
}

export function analyzeStationHealth(stationsData = []) {
  const issues = [];

  if (!Array.isArray(stationsData)) {
    return issues;
  }

  for (const station of stationsData) {
    const lmId = getStationId(station);
    const state = getStationState(station);

    if (!lmId) continue;

    if (isDownState(state)) {
      issues.push({
        type: "station",
        issue: "down",
        lmId,
        severity: "critical",
        message: `Station ${lmId} appears to be ${state}.`
      });
    }

    const inactivePedestals = getInactivePedestals(station);

    for (const pedestalId of inactivePedestals) {
      issues.push({
        type: "pedestal",
        issue: "down",
        lmId,
        pedestalId,
        severity: "warning",
        message: `${pedestalId} at station ${lmId} appears  unavailable.`
      });
    }
  }

  return issues;
}