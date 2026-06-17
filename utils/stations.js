
export function buildStationLookup(stationMapData) {
  const byId = new Map();
  for (const row of stationMapData || []) {
    if (!row) continue;
    const { station_id, LmId, address } = row;
    if (station_id != null) {
      byId.set(station_id, { LmId: LmId ?? '', address: address ?? '' });
    }
  }
  return byId;
}


function classifyLmId(lm) {
  const s = String(lm ?? '').trim().toUpperCase();

 
  let m = s.match(/^LM(\d+)$/);
  if (m) return { kind: 0, num: parseInt(m[1], 10), text: '' };

  
  m = s.match(/^NEVI[-_\s]?(\d+)$/);
  if (m) return { kind: 1, num: parseInt(m[1], 10), text: '' };

  if (!s) return { kind: 3, num: Number.POSITIVE_INFINITY, text: '' }; // unknown/empty

  return { kind: 2, num: Number.POSITIVE_INFINITY, text: s }; // other labels
}

function sortDecoratedByLmId(decorated) {
  decorated.sort((a, b) => {
    
    if (a.sortKey.kind !== b.sortKey.kind) return a.sortKey.kind - b.sortKey.kind;

    
    if ((a.sortKey.kind === 0 || a.sortKey.kind === 1) && a.sortKey.num !== b.sortKey.num) {
      return a.sortKey.num - b.sortKey.num;
    }

    
    if (a.sortKey.kind === 2 && b.sortKey.kind === 2) {
      const cmp = a.sortKey.text.localeCompare(b.sortKey.text, undefined, { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
    }

 
    return a.idx - b.idx;
  });
  return decorated;
}


export function sortAndProjectByLmId(apiData, stationMapData, projectFn) {
  if (!Array.isArray(apiData)) return [];
  const map = buildStationLookup(stationMapData);

   
   
  const decorated = apiData.map((item, idx) => {
    const stationId =
      item?.station_data?.station_id ??
      item?.station_id ?? // fallback if API shape differs
      null;

    const mapped = stationId != null ? map.get(stationId) : undefined;
    const lmId = mapped?.LmId ?? '';
    const address = mapped?.address ?? '';

    return {
      idx,
      item,
      stationId,
      lmId,
      address,
      sortKey: classifyLmId(lmId),
    };
  });

  // Sort in-place
  sortDecoratedByLmId(decorated);

 
const defaultProject = (d) => ({
    stationId: d.stationId,
    lmId: d.lmId,
    address: d.address,
    name:
      d.item?.station_data?.name ??
      d.item?.station_data?.station_name ??
      null,
    status: d.item?.status ?? null,
  });

  const project = typeof projectFn === 'function' ? projectFn : defaultProject;

  return decorated.map(project);
}
