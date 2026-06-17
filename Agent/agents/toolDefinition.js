const EMPTY_STATION_VALUES = new Set([
  "NULL",
  "NONE",
  "UNDEFINED",
  "ALL",
  "N/A",
  "NA",
  ""
]);

function normalizeLmId(value) {
  if (!value) return null;

  const raw = String(value).trim().toUpperCase();

  if (EMPTY_STATION_VALUES.has(raw)) {
    return null;
  }

  if (/^LM\d+$/.test(raw)) {
    return raw;
  }

  const num = raw.match(/\d+/)?.[0];

  if (num) {
    return `LM${num}`;
  }

  return null;
}

function getStationId(station) {
  return station?.lmId || station?.id || station?.stationId || null;
}

function getStationState(station) {
  return (station?.state || "unknown").toLowerCase();
}

function getAvailability(station) {
  return station?.availability || {};
}

export function getStationStatus({ lmId, stationsData }) {
  const normalizedLmId = normalizeLmId(lmId);

  if (!normalizedLmId) {
    return "Station ID not provided";
  }

  if (!Array.isArray(stationsData) || stationsData.length === 0) {
    return "No station data available";
  }

  const station = stationsData.find((s) => {
    const id = getStationId(s);
    return id && id.toUpperCase() === normalizedLmId;
  });

  if (!station) {
    return `Station ${normalizedLmId} not found`;
  }

  const state = getStationState(station);
  const stationId = getStationId(station);

  let response = `Station ${stationId} status:\n`;

  if (state === "online") {
    response += "ONLINE\n";
  } else if (state === "offline") {
    response += "OFFLINE\n";
  } else {
    response += `${state.toUpperCase()}\n`;
  }

  const { activePedestals = [], notActivePedestals = [] } =
    getAvailability(station);

  response += `\nActive Pedestals: ${activePedestals.length}`;
  response += `\nInactive Pedestals: ${notActivePedestals.length}`;

  return response;
}

export function getAllStationsStatus({ stationsData }) {
  if (!Array.isArray(stationsData) || stationsData.length === 0) {
    return "No station data available";
  }

  const online = [];
  const offline = [];
  const unknown = [];

  stationsData.forEach((station) => {
    const id = getStationId(station);
    const state = getStationState(station);

    if (!id) return;

    if (state === "online") {
      online.push(id);
    } else if (state === "offline") {
      offline.push(id);
    } else {
      unknown.push(id);
    }
  });

  let response = "Station Status Summary:\n\n";

  response += `ONLINE (${online.length}):\n`;
  response += online.length ? `${online.join(", ")}\n\n` : "None\n\n";

  response += `OFFLINE (${offline.length}):\n`;
  response += offline.length ? `${offline.join(", ")}\n\n` : "None\n\n";

  if (unknown.length > 0) {
    response += `UNKNOWN (${unknown.length}):\n`;
    response += unknown.join(", ");
  }

  return response.trim();
}

export function getOfflineStations({ stationsData }) {
  if (!Array.isArray(stationsData) || stationsData.length === 0) {
    return "No station data available";
  }

  const offline = stationsData
    .filter((station) => getStationState(station) === "offline")
    .map((station) => getStationId(station))
    .filter(Boolean);

  if (offline.length === 0) {
    return "No stations are offline";
  }

  return `Offline Stations (${offline.length}):\n${offline.join(", ")}`;
}

export function getOnlineStations({ stationsData }) {
  if (!Array.isArray(stationsData) || stationsData.length === 0) {
    return "No station data available";
  }

  const online = stationsData
    .filter((station) => getStationState(station) === "online")
    .map((station) => getStationId(station))
    .filter(Boolean);

  if (online.length === 0) {
    return "No stations are online";
  }

  return `Online Stations (${online.length}):\n${online.join(", ")}`;
}

export function getPedestalStatus({ lmId, filter = "ALL", stationsData }) {
  const normalizedLmId = normalizeLmId(lmId);

  if (!Array.isArray(stationsData) || stationsData.length === 0) {
    return "No station data available";
  }

  const normalizedFilter = String(filter || "ALL").toUpperCase();

  const safeFilter = ["ALL", "ACTIVE", "INACTIVE"].includes(normalizedFilter)
    ? normalizedFilter
    : "ALL";

  if (!normalizedLmId) {
    let response = "Pedestal Status Summary:\n\n";

    stationsData.forEach((station) => {
      const stationId = getStationId(station);

      if (!stationId) return;

      const { activePedestals = [], notActivePedestals = [] } =
        getAvailability(station);

      response += `Station ${stationId}:\n\n`;

      if (safeFilter === "ALL") {
        response += "Active Pedestals:\n";
        response += activePedestals.length
          ? `${activePedestals.join(", ")}\n`
          : "None\n";

        response += "Inactive Pedestals:\n";
        response += notActivePedestals.length
          ? `${notActivePedestals.join(", ")}\n`
          : "None\n";

        response += "\n";
      }

      if (safeFilter === "ACTIVE") {
        response += "Active Pedestals:\n";
        response += activePedestals.length
          ? `${activePedestals.join(", ")}\n\n`
          : "None\n\n";
      }

      if (safeFilter === "INACTIVE") {
        response += "Inactive Pedestals:\n";
        response += notActivePedestals.length
          ? `${notActivePedestals.join(", ")}\n\n`
          : "None\n\n";
      }
    });

    return response.trim();
  }

  const station = stationsData.find((s) => {
    const id = getStationId(s);
    return id && id.toUpperCase() === normalizedLmId;
  });

  if (!station) {
    return `Station ${normalizedLmId} not found`;
  }

  const { activePedestals = [], notActivePedestals = [] } =
    getAvailability(station);

  if (safeFilter === "ALL") {
    return `Pedestal Status for ${normalizedLmId}:\n\n` +
      `Active Pedestals:\n${activePedestals.length ? activePedestals.join(", ") : "None"}\n` +
      `Inactive Pedestals:\n${notActivePedestals.length ? notActivePedestals.join(", ") : "None"}`;
  }

  if (safeFilter === "ACTIVE") {
    return `Active Pedestals at ${normalizedLmId}:\n` +
      (activePedestals.length ? activePedestals.join(", ") : "None");
  }

  if (safeFilter === "INACTIVE") {
    return `Inactive Pedestals at ${normalizedLmId}:\n` +
      (notActivePedestals.length ? notActivePedestals.join(", ") : "None");
  }

  return "Invalid filter";
}