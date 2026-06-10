
export function getStationStatus({ lmId, stationsData }) {

  if (!lmId) return "Station ID not provided";
  if (!stationsData || stationsData.length === 0) {
    return "No station data available";
  }

  const station = stationsData.find(s => {
    const id = s.lmId || s.id || s.stationId;
    return id && id.toUpperCase() === lmId.toUpperCase();
  });

  if (!station) return `Station ${lmId} not found`;

  const state = (station.state || "unknown").toLowerCase();
  const stationId = station.lmId || station.id || station.stationId;

  let response = `Station ${stationId} status:\n`;

  if (state === "online") response += "ONLINE\n";
  else if (state === "offline") response += "OFFLINE\n";
  else response += `${state}\n`;

  if (station.availability) {
    const { activePedestals = [], notActivePedestals = [] } =
      station.availability;

    response += `\nActive Pedestals: ${activePedestals.length}`;
    response += `\nInactive Pedestals: ${notActivePedestals.length}`;
  }

  return response;
}

export function getAllStationsStatus({ stationsData }) {

  if (!stationsData || stationsData.length === 0) {
    return "No station data available";
  }

  const online = [];
  const offline = [];

  stationsData.forEach(s => {
    const id = s.lmId || s.id || s.stationId;
    const state = (s.state || "").toLowerCase();

    if (!id) return;

    if (state === "online") online.push(id);
    else if (state === "offline") offline.push(id);
  });

  let response = "Station Status Summary:\n\n";

  response += `ONLINE (${online.length}):\n`;
  response += online.length ? online.join(", ") + "\n\n" : "None\n\n";

  response += `OFFLINE (${offline.length}):\n`;
  response += offline.length ? offline.join(", ") : "None";

  return response;
}

export function getOfflineStations({ stationsData }) {

  if (!stationsData || stationsData.length === 0) {
    return "No station data available";
  }

  const offline = stationsData
    .filter(s => (s.state || "").toLowerCase() === "offline")
    .map(s => s.lmId || s.id || s.stationId)
    .filter(Boolean);

  if (offline.length === 0) {
    return "No stations are offline";
  }

  return `Offline Stations (${offline.length}):\n${offline.join(", ")}`;
}
export function getOnlineStations({ stationsData }) {

  if (!stationsData || stationsData.length === 0) {
    return "No station data available";
  }

  const online = stationsData
    .filter(s => (s.state || "").toLowerCase() === "online")
    .map(s => s.lmId || s.id || s.stationId)
    .filter(Boolean);

  if (online.length === 0) {
    return "No stations are online";
  }

  return `Online Stations (${online.length}):\n${online.join(", ")}`;
}


export function getPedestalStatus({ lmId, filter, stationsData }) {

  if (!stationsData || stationsData.length === 0) {
    return "No station data available";
  }

  //  ALL stations
  if (!lmId) {
    let response = "Pedestal Status Summary:\n\n";

    stationsData.forEach(station => {

      const stationId = station.lmId || station.id || station.stationId;

      const { activePedestals = [], notActivePedestals = [] } =
        station.availability || {};

      if (!stationId) return;

      response += `Station ${stationId}:\n\n`;

      //  ALL
      if (!filter || filter === "ALL") {
        response += `Active Pedestals:\n`;
        response += activePedestals.length
          ? activePedestals.join(", ") + "\n"
          : "None\n";

        response += `Inactive Pedestals:\n`;
        response += notActivePedestals.length
          ? notActivePedestals.join(", ") + "\n"
          : "None\n";

        response += "\n";
      }

      // ACTIVE FILTER
      else if (filter === "ACTIVE") {
        response += `Active Pedestals:\n`;
        response += activePedestals.length
          ? activePedestals.join(", ") + "\n\n"
          : "None\n\n";
      }

      // INACTIVE FILTER
      else if (filter === "INACTIVE") {
        response += `Inactive Pedestals:\n`;
        response += notActivePedestals.length
          ? notActivePedestals.join(", ") + "\n\n"
          : "None\n\n";
      }

    });

    return response.trim();
  }

  // SINGLE station
  const station = stationsData.find(
    s => (s.lmId || s.id || s.stationId)?.toUpperCase() === lmId.toUpperCase()
  );

  if (!station) return `Station ${lmId} not found`;

  const { activePedestals = [], notActivePedestals = [] } =
    station.availability || {};

  //  ALL
  if (!filter || filter === "ALL") {
    return `Pedestal Status for ${lmId}:\n\n` +
      `Active Pedestals:\n${activePedestals.length ? activePedestals.join(", ") : "None"}\n` +
      `Inactive Pedestals:\n${notActivePedestals.length ? notActivePedestals.join(", ") : "None"}`;
  }

  // ACTIVE
  if (filter === "ACTIVE") {
    return `Active Pedestals at ${lmId}:\n` +
      (activePedestals.length ? activePedestals.join(", ") : "None");
  }

  //  INACTIVE
  if (filter === "INACTIVE") {
    return `Inactive Pedestals at ${lmId}:\n` +
      (notActivePedestals.length ? notActivePedestals.join(", ") : "None");
  }

  return "Invalid filter";
}