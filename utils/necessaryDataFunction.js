export function necessaryDataFunction(d) {
    const item = d.item || {}
    const station = item.station_data || {}
    const ped = item.pedestal_data || {};
    const bessData = item.bess_data || {};
    const bessStrings = item.bess_string_data || {};




    // ---- Availability-only summary from pedestal_data ----
    const entries = Object.entries(ped);

    let activeCount = 0;
    let notActiveCount = 0;
    const activePedestals = [];
    const notActivePedestals = [];

    for (const [id, p] of entries) {
        const isAvailable = p?.connector_available === true;
        if (isAvailable) {
            activeCount++;
            activePedestals.push(id);
        } else {
            notActiveCount++;
            notActivePedestals.push(id);
        }
    }

 // ---------- BESS summaries ----------
 const b1=bessData.bess1 || {}
 const b2=bessData.bess2 || {}

 const stringKeys=Object.keys(bessStrings)
 const countFor=(prefix)=>stringKeys.filter(k=>k.startsWith(prefix)).length
 const bess1={
       state:b1.state ?? "Offline",
       rcu_state:b1.rcu_state??"offline",
       stringCount:countFor('bess1-'),
       soc:b1.soc??"null"
 } 
 const bess2={
       state:b2.state ?? "Offline",
       rcu_state:b2.rcu_state??"offline",
       stringCount:countFor('bess2-'),
       soc:b2.soc??"null"
 } 


    return {

        stationId: d.stationId,
        lmId: d.lmId,
        address: d.address,

        state:
            station?.state ??
            station?.station_state ??
            item?.state ??
            null,
        bess1,
        bess2,
        availability: {
            total: entries.length,
            activeCount,       // connector_available === true
            notActiveCount,    // connector_available !== true
            activePedestals,
            notActivePedestals,

        },

    }


}