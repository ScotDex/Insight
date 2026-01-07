require('dotenv').config();
const axios = require('axios');
const path = require('path');
const ESIClient = require('./esi');
const MapperService = require('./mapper');

const esi = new ESIClient("Contact: @YourName");

const isWormholeSystem = (systemId) => {
    return systemId >= 31000001 && systemId <= 32000000;
};

;(async () => {
    console.log("Starting Insight Bot v2");
    await esi.loadSystemCache('./data/systems.json');
    await esi.loadCache(path.join(__dirname, 'data', 'esi_cache.json'));

    await mapper.refreshChain(esi.getSystemDetails.bind(esi));
    console.log("🌌 Universe Map & Chain Loaded.");

    // 3. Background Sync (Every 1 minute)
    setInterval(() => {
        mapper.refreshChain(esi.getSystemDetails.bind(esi));
    }, 1 * 60 * 1000);

    listeningStream();
})();

const QUEUE_ID = process.env.ZKILL_QUEUE_ID || 'InsightBotv2';
const REDISQ_URL = `https://zkillredisq.stream/listen.php?queueID=${QUEUE_ID}`;


let scanCount = 0;
async function listeningStream() {
    const WHALE_THRESHOLD = 20000000000;
    console.log(`📡 Listening to zKillboard Queue: ${QUEUE_ID}`);
    
    while (true) {
        try {
            const response = await axios.get(REDISQ_URL, { timeout: 15000 });
            const data = response.data;

            if (data && data.package) {
                stats.scanCount++;
                const zkb = data.package.zkb;
                const rawValue = Number(zkb.totalValue) || 0;

                console.log(`📥 Package received. Fetching killmail details from ESI...`);
                const esiResponse = await axios.get(zkb.href);
                const killmail = esiResponse.data; 
                
                scanCount++;
                

                const isWhale = rawValue >= WHALE_THRESHOLD;

                if (isWhale || (isWormholeSystem(killmail.solar_system_id) && killmail.solar_system_id !== THERA_ID && mapper.isSystemRelevant(killmail.solar_system_id))) {
                    console.log(`🎯 TARGET MATCH: Kill ${data.package.killID} in system ${killmail.solar_system_id}`);
                    await handlePrivateIntel(killmail, zkb);
                } else {
                    if (scanCount % 500 === 0) {
                        console.log(`🛡️  Gatekeeper: ${scanCount} total kills scanned. Discarding kill in system ${killmail.solar_system_id}...`);
                    }
                }
            } else {
                console.log("⏳ RedisQ: No new kills (10s poll). Polling again...");
            }
        } catch (err) {
            const delay = err.response?.status === 429 ? 2000 : 5000;
            console.error(`❌ Error: ${err.message}`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
}
