require('dotenv').config();
const axios = require('axios');
const path = require('path');
const ESIClient = require('./esi');
const MapperService = require('./mapper');
const { kill } = require('process');

const esi = new ESIClient("Contact: @YourName");
const mapper = new MapperService();

const isWormholeSystem = (systemId) => {
    return systemId >= 31000001 && systemId <= 32000000;
};

;(async () => {
    console.log("Starting Insight Bot v2");
    await esi.loadSystemCache('./data/systems.json');
    await esi.loadCache(path.join(__dirname, 'data', 'esi_cache.json'));
    console.log("🌌 Universe Map & Chain Loaded.");
    listeningStream();
})();

const QUEUE_ID = process.env.ZKILL_QUEUE_ID || 'InsightBotv2';
const REDISQ_URL = `https://zkillredisq.stream/listen.php?queueID=${QUEUE_ID}`;

const HOME_SYSTEM_ID = 30000142;
const ALERT_RANGE = 5;

async function listeningStream() {
    console.log(`📡 Radar Scanning: ${QUEUE_ID} | Home: ${HOME_SYSTEM_ID}`);
    let scanCount = 0; // Ensure this is initialized

    while (true) {
        try {
            const response = await axios.get(REDISQ_URL, { timeout: 15000 });
            const payload = response.data.package; // Access the 'package' from zKill

            if (payload) {
                // zKill RedisQ gives us the killmail directly in the package
                const killmail = payload; 
                const systemId = killmail.solar_system_id;

                // FIX: Pass the actual systemId of the kill, not the ALERT_RANGE
                const jumps = mapper.getJumpDistance(HOME_SYSTEM_ID, systemId);

                if (jumps !== -1 && jumps <= ALERT_RANGE) {
                    console.log(`⚠️ INTEL: Activity ${jumps} jumps away in ${systemId}`);
                    
                    const victimShip = await esi.getTypeName(killmail.victim.ship_type_id);
                    // This function will handle your Discord/Logging output
                    await handlePrivateIntel(killmail, jumps, victimShip);
                }

                scanCount++;
                if (scanCount % 1000 === 0) {
                    console.log(`🛡️ Radar Status: ${scanCount} kills scanned...`);
                }
            }
        } catch (err) {
            const delay = err.response?.status === 429 ? 10000 : 2000;
            console.error(`Error in stream: ${err.message}`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
}
