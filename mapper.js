const fs = require('fs');
const csv = require('csv-parser');

class MapperService {
    constructor() {
        this.adjList = {};
    }

    /**
     * Reads the mapSolarSystemJumps CSV and builds the graph
     */
    async loadMap(filePath) {
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    // Extracting based on your column names
                    const from = row.fromSolarSystemID;
                    const to = row.toSolarSystemID;

                    if (!this.adjList[from]) this.adjList[from] = [];
                    this.adjList[from].push(to);
                })
                .on('end', () => {
                    console.log(`🗺️ Map Loaded: ${Object.keys(this.adjList).length} systems connected.`);
                    resolve();
                })
                .on('error', reject);
        });
    }

    /**
     * Replicated Insight logic: Find jumps between two points
     */
    getJumpDistance(startNode, endNode) {
        // Ensure both IDs are strings to match the Map keys
        const start = String(startNode);
        const end = String(endNode);

        if (start === end) return 0;
        if (!this.adjList[start]) return -1;

        let queue = [[start, 0]];
        let visited = new Set([start]);

        while (queue.length > 0) {
            let [current, dist] = queue.shift();
            
            for (let neighbor of (this.adjList[current] || [])) {
                if (neighbor === end) return dist + 1;
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([neighbor, dist + 1]);
                }
            }
        }
        return -1;
    }
}

module.exports = MapperService