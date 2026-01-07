require ('dotenv').config();
const axios = require('axios');
const MapperService = require ('./mapper');
const ESIClient = require ('./esi');
const path = require('path');

const esi = new ESIClient("Insight Bot V2");
const mapper = new MapperService();

const HOME_SYSTEM_ID = "30004040"; 
const INTEL_RANGE = 10;
const QUEUE_ID = process.env.ZKILL_QUEUE_ID || "iNSIGHT BOTv2";

async function runRattingSweep() {
    console.log (" Running Ratting Scanner");
    try {
        const res = await axios.get('https://esi.evetech.net/latest/universe/system_kills/');
        const currentData = res.data;
        for (const entry of currentData){
            const sysId = String(entry.system_id)
            const currentKills = entry.npc_kills;
            const previousKills = esi.history.npcKills.get(sysId);
            const delta = currentKills - previousKills;

            esi.history.npcKills.set(sysId, currentKills);
        }
        await esi.saveHistory('./data/npc_history.json');
    } catch (error) {
        console.error("Sweep failed")
        
    }
}
async function run (){
    console.log("Loading Map Data");
    await mapper.loadMap('./data/mapSolarSystemJumps.csv');
    await esi.loadSystemCache('./data/systems.json');
    await esi.loadCache(path.join(__dirname, 'data', 'esi_cache.json'));
    await esi.loadHistory('./data/npc_history.json');
    console.log(`📡 Radar Online: Monitoring ${INTEL_RANGE} jumps from ${HOME_SYSTEM_ID}`);

    runRattingSweep(); 
    setInterval(runRattingSweep, 60 * 60 * 1000);

    while (true) {
        try {
            // Step 1: Listen to the queue
            const redisResponse = await axios.get(`https://zkillredisq.stream/listen.php?queueID=${QUEUE_ID}`, {
                timeout: 15000,
                maxRedirects: 5 // Essential as per the Aug 2025 documentation
            });

            const pkg = redisResponse.data.package;

            // Step 2: If a kill happened, fetch the full details from ESI
            if (pkg && pkg.zkb && pkg.zkb.href) {
                const esiResponse = await axios.get(pkg.zkb.href);
                const killmail = esiResponse.data;

                const systemId = String(killmail.solar_system_id);
                
                // Step 3: Proximity Check
                const jumps = mapper.getJumpDistance(HOME_SYSTEM_ID, systemId);

                if (jumps !== -1 && jumps <= INTEL_RANGE) {
                    const victimShip = await esi.getTypeName(killmail.victim.ship_type_id);
                    console.log(`⚠️ INTEL: ${victimShip} destroyed ${jumps} jumps away in ${systemId}`);
                }
            } else {
                // If pkg is null, it just means no kills happened in the last 10s
            }

        } catch (err) {
            // Handle 429 Rate Limits (RedisQ is strict: max 2 requests per second)
            const isRateLimit = err.response?.status === 429;
            const delay = isRateLimit ? 10000 : 2000;
            
            if (isRateLimit) console.warn("🟡 Rate limited by zKill. Cooling down...");
            else console.error("🔴 Connection Error:", err.message);
            
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

run();
