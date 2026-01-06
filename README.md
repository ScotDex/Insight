# Insight-Node (EVE Online Intel Bot)

A modernized Node.js rebuild of the legacy **Insight** bot. This project focuses on high-performance killmail streaming, proximity radar alerts, and utility intel commands for EVE Online players and small groups.

> **Scope Note:** This is a private rebuild optimized for self-hosting and low-latency response.

---

## 🛠 Tech Stack
- **Runtime:** Node.js v20+
- **Library:** [discord.js v14](https://discord.js.org/)
- **HTTP Client:** `undici` (Optimized for high-frequency RedisQ polling)
- **Database:** SQLite (Lightweight file-based storage for feed configurations)
- **API:** zKillboard RedisQ & CCP EVE Swagger Interface (ESI)

---

## 🛰 Core Feature Scope

### 1. Killmail Streaming (The Engine)
- **RedisQ Listener:** A persistent asynchronous loop polling zKillboard for live data.
- **Dynamic Embeds:** High-fidelity Discord embeds featuring ship renders, value indicators (ISK), and location data.
- **Entity Filtering:** Direct tracking for specific Character, Corporation, or Alliance IDs.

### 2. Proximity Radar
- **3D Vector Math:** Calculates Light-Year (LY) distances using EVE Static Data Export (SDE) coordinates.
- **Base System Management:** Define multiple "home" systems to monitor within a specific LY radius.
- **Advanced Filters:** - Ship Class (Supercapitals, Black Ops, Freighters).
  - Minimum ISK Value (Ignore small-scale skirmishes).

### 3. Intelligence Utilities
- **`/scan` (Local Parser):** Analyzes pasted local chat member lists to summarize hostile affiliations and potential ship compositions.
- **`/time`:** Quick-access EVE Server time and world timezone conversion.
- **`/status`:** Real-time health check of the bot's connection to zKill and ESI.

---

## 📐 The Math behind the Radar
Radar distance is calculated using the Pythagorean theorem in a 3D coordinate system. The raw coordinates from the SDE (in meters) are processed as follows:

$$Distance_{LY} = \frac{\sqrt{(x_1-x_2)^2 + (y_1-y_2)^2 + (z_1-z_2)^2}}{9.461 \times 10^{15}}$$

---

## 🚀 Development Roadmap

- [ ] **Phase 1: Pulse** - Setup `discord.js` client and `undici` polling loop.
- [ ] **Phase 2: Data Mapping** - Integrate SDE (Solar Systems & Ships) into a local SQLite database.
- [ ] **Phase 3: The Radar** - Build the distance calculation logic and filtering system.
- [ ] **Phase 4: Interface** - Implement modern Slash Commands and Modal-based configuration.

---

## ⚙️ Local Setup (Private Deployment)
1. **Clone the repository.**
2. **Install dependencies:** `npm install`
3. **Configure environment:** Create a `.env` file with your `DISCORD_TOKEN` and `CLIENT_ID`.
4. **Initialize SDE:** Run the SDE-import script to populate your local database.
5. **Start:** `node index.js`