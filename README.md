# Numbergoup

Numbergoup is a small, self-hosted stock-market game. It runs a fictional market continuously on the server, so prices keep moving whether or not anyone has the page open. Start with $10,000 in virtual cash, choose a stock, and build your portfolio.

> This is a simulation for entertainment, not investment advice or a source of real market prices.

## Run with Docker Compose

Install Docker and Docker Compose, then run:

```sh
docker compose up -d --build
```

Open [http://localhost:8080](http://localhost:8080). The backend stores a compact market snapshot in the `numbergoup-data` volume and keeps the simulation running independently of browser sessions. To stop the game, run `docker compose down`; the volume (and your game) remains. To reset it, run `docker compose down -v`.

File logging is disabled by default. The backend always prints concise status and error messages to its terminal. To save those messages to the data volume, set `LOG_TO_FILE=true` on the `api` service in `docker-compose.yml` and recreate the service.

## Run locally

Requires Node.js 20.19+ (or 22.12+) and npm.

```sh
npm install
npm run build
npm test
```

In two terminals, start the API and UI:

```sh
npm run start:server
npm run dev:client
```

The API listens on port 3000 and the Vite UI on port 5173. The UI proxies API requests to the backend. Set `PORT`, `DATA_DIR`, `LOG_TO_FILE`, `SIMULATION_INTERVAL_MS`, or `SIMULATION_SPEED` to customize the server. The default data directory is `./data`. The simulation runs at 10× speed by default; set `SIMULATION_SPEED` to `1` for real-time pacing (values above 100 are capped).

## Project layout

- `server/src/` — typed market engine, persistence, logging, configuration, and HTTP API.
- `server/test/` — market and trade behavior tests.
- `client/src/` — React dashboard and styles.
- `docker-compose.yml` — API and frontend services with persistent state.

Prices follow a continuous stochastic simulation with market-wide movement and stock-specific volatility. This is intentionally a lightweight game model rather than a forecast or a replica of real exchange data.
