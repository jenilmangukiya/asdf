# UK Wind Power Forecast & Accuracy Dashboard

> **Live Public Application:** [https://frontend-swi4.vercel.app/](https://frontend-swi4.vercel.app/)

A production-grade analytics platform built for UK electricity utility trading and purchasing desks. Evaluates Day-Ahead wholesale market wind generation forecasts against official metered outturn data from Elexon Insights Solution (BMRS) for **January 2026**.

---

## 1. Business Problem & Context

UK electricity utilities must procure wholesale electricity on the Day-Ahead market to meet forecast customer demand. Because wind energy is weather-dependent and operates at near-zero marginal cost, forecasting errors carry substantial commercial risk:

* **Overforecasting (+ Bias / Surplus):** The desk purchases more wind volume than physical delivery. The unneeded power must be spilled or cashed out in the National Grid Balancing Mechanism, often at depressed or negative system prices.
* **Underforecasting (− Bias / Deficit):** The desk buys insufficient power. The resulting physical shortfall must be settled at the System Buy Price (imbalance cashout), exposing the utility to severe price spikes.

This application provides the purchasing desk with mathematical clarity into forecast performance, market cutoff impacts, and volumetric error distributions.

---

## 2. Key Features

* **Real Elexon BMRS Data Integration:** Direct streaming ingestion of January 2026 national wind outturn (`FUELHH`) and wind forecast submissions (`WINDFOR`).
* **Strict Decision Cutoff Rule:** Evaluates only forecasts published **before** market gate closure (e.g. Day-Ahead 11:00 GMT auction gate closure on D-1). Forecasts published after gate closure are strictly disqualified to prevent hindsight bias.
* **Rigorous Mathematical Accuracy Engine:** Computes MAE, RMSE, MBE, and Normalized MAE over matched delivery periods with honest handling of zero-generation vs missing records.
* **Interactive Enterprise Visualizations:**
  * Chronological time series comparison with Recharts and brush-zoom slider.
  * Directional forecast error bar charts color-coded by surplus (Amber) and deficit (Rose).
  * Five executive KPI metric cards with definitions, outlier penalization indicators, and energy volume totals (GWh).
* **Granular Delivery Period Records Table:** Paginated, sortable record viewer with CSV export and auditability of forecast publication and cutoff timestamps.
* **Dual Matching Modes:**
  * **Hourly Exact Match:** Strict alignment on delivery period start time (744 periods in Jan 2026).
  * **Half-Hourly Coverage:** Maps hourly day-ahead bids across both 30-minute settlement periods (all 1,488 periods in Jan 2026).
* **Caching & Resilience:** Automatic local disk and in-memory cache with non-blocking background synchronization and transparent freshness status.

---

## 3. Architecture & Data Flow

```
                      ┌──────────────────────────────────────┐
                      │    Official Elexon Insights Solution │
                      │             (BMRS API v1)            │
                      └──────────────────┬───────────────────┘
                                         │
                 FUELHH/stream (Actuals) │ WINDFOR/stream (Forecasts)
                                         ▼
                      ┌──────────────────────────────────────┐
                      │           FastAPI Backend            │
                      │  - ElexonClient (Async HTTPX)        │
                      │  - GenerationRepository (Cache)      │
                      │  - ForecastService (Cutoff Filter)   │
                      │  - AccuracyService (MAE, RMSE, MBE)  │
                      └──────────────────┬───────────────────┘
                                         │ JSON API (v1)
                                         ▼
                      ┌──────────────────────────────────────┐
                      │          React 18 Frontend           │
                      │  - Vite + TypeScript                 │
                      │  - Tailwind CSS (Sleek Dark Theme)   │
                      │  - TanStack Query (Server State)     │
                      │  - Recharts (Interactive Analytics)  │
                      └──────────────────────────────────────┘
```

---

## 4. Technology Stack

### Backend
* **Python 3.11+ / 3.14**
* **FastAPI:** High-performance, asynchronous REST API with auto-generated OpenAPI schemas.
* **Uvicorn:** ASGI web server.
* **Pydantic & Pydantic-Settings:** Type-safe request/response validation and environment management.
* **HTTPX:** Async HTTP client with connection pooling, retries, and exponential backoff.
* **Pandas & NumPy:** Optimized time-series alignment, filtering, and statistical calculations.

### Frontend
* **React 18 & TypeScript:** Strict type safety across all components and API interactions.
* **Vite 6:** Rapid ESM tooling and optimized production bundling.
* **Tailwind CSS 3.4:** Executive dark enterprise design system (Navy, Slate, Sky, Emerald, Amber, Rose).
* **TanStack Query (React Query) v5:** Asynchronous server state, caching, loading, and error handling.
* **Recharts:** Responsive, hardware-accelerated time series and error charts.
* **Lucide React:** Modern clean icon set.

---

## 5. Directory & File Structure

```
project-root/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI entry point & lifespan cache warming
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── router.py            # API v1 route aggregator
│   │   │   └── endpoints/
│   │   │       ├── health.py        # /api/v1/health
│   │   │       ├── data_status.py   # /api/v1/data-status & /refresh
│   │   │       ├── forecasts.py     # /api/v1/forecasts/summary
│   │   │       └── accuracy.py      # /api/v1/accuracy/summary, /timeseries, /records
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic Settings & environment config
│   │   │   └── logging.py           # Structured application logging
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic data schemas
│   │   ├── repositories/
│   │   │   └── generation_repository.py # In-memory and disk cache layer
│   │   ├── services/
│   │   │   ├── elexon_client.py     # Async client for Elexon BMRS streams
│   │   │   ├── forecast_service.py  # Day-ahead cutoff and forecast selection
│   │   │   └── accuracy_service.py  # Statistical metrics and alignment engine
│   │   └── utils/
│   │       └── datetime_utils.py    # UTC parsing, settlement periods, cutoffs
│   ├── .cache/                      # Persistent dataset cache (gitignored)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx              # QueryClientProvider root
│   │   │   └── query-client.ts      # TanStack Query configuration
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   ├── ForecastVsActualChart.tsx
│   │   │   │   └── ForecastErrorChart.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── FilterBar.tsx    # Range presets, cutoff dropdown, mode toggle
│   │   │   │   └── MethodologyModal.tsx # Business context & math modal
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx       # Live status pill, refresh button, branding
│   │   │   │   └── Footer.tsx
│   │   │   ├── tables/
│   │   │   │   └── RecordsTable.tsx # Paginated, sortable table with CSV export
│   │   │   └── ui/
│   │   │       ├── Badge.tsx
│   │   │       ├── Button.tsx
│   │   │       ├── MetricCard.tsx
│   │   │       └── Modal.tsx
│   │   ├── features/
│   │   │   ├── accuracy/
│   │   │   │   ├── api/accuracy-api.ts
│   │   │   │   └── hooks/use-accuracy.ts
│   │   │   └── forecasts/
│   │   │       ├── api/forecast-api.ts
│   │   │       └── hooks/use-forecasts.ts
│   │   ├── lib/
│   │   │   ├── api-client.ts        # Typed fetch client
│   │   │   └── utils.ts             # Formatters and CSV export
│   │   ├── pages/
│   │   │   └── DashboardPage.tsx    # Main analytics workspace
│   │   ├── types/
│   │   │   └── index.ts             # Shared TypeScript schemas
│   │   ├── index.css                # Tailwind directives and glassmorphism styles
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── nginx.conf                   # Production Nginx reverse-proxy
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── .gitignore
├── .env.example
└── README.md
```

---

## 6. Elexon BMRS Datasets & Fields

The application consumes data exclusively from the official **Elexon Insights Solution (BMRS) REST API**:

### Actual Generation (`FUELHH/stream`)
* **Endpoint:** `GET https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`
* **Query Parameters:** `settlementDateFrom=2026-01-01&settlementDateTo=2026-01-31&fuelType=WIND`
* **Fields:**
  * `startTime`: Start of the 30-minute delivery period (UTC ISO 8601).
  * `settlementDate`: Calendar date of delivery (`YYYY-MM-DD`).
  * `settlementPeriod`: Half-hour settlement period (1 to 48).
  * `fuelType`: Filtered strictly to `WIND`.
  * `generation`: Actual metered wind generation in Megawatts (MW).
* **Analysis Period Coverage:** Exactly 1,488 records (31 days × 48 settlement periods).

### Forecast Generation (`WINDFOR/stream`)
* **Endpoint:** `GET https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`
* **Query Parameters:** `publishDateTimeFrom=2025-12-30T00:00:00Z&publishDateTimeTo=2026-02-01T00:00:00Z`
* **Fields:**
  * `startTime`: Target delivery period start time (UTC ISO 8601).
  * `publishTime`: Timestamp when the forecast was generated and published to BMRS.
  * `generation`: Forecasted national wind generation in Megawatts (MW).
* **Analysis Period Coverage:** 19,272 submitted forecast records across January 2026.

---

## 7. Forecast Selection Methodology & Market Timeline

### The Day-Ahead Decision Cutoff
In the Great Britain wholesale market, physical day-ahead contracts are cleared on power exchanges (**EPEX SPOT GB** and **Nord Pool GB**):
* **Default Auction Gate Closure:** **11:00 GMT on Day D-1** for power delivered on Day D.
* **Selection Rule:** For any delivery period $T$ falling on Day $D$, the decision cutoff timestamp is:
  $$\text{Cutoff}(T) = \text{Date}(D - 1\text{ day}) \text{ at } 11:00:00\text{ UTC}$$
* **Eligibility Constraint:**
  $$\text{Eligible Forecasts} = \{ f \in \text{WINDFOR} \mid f.\text{startTime} = T \text{ and } f.\text{publishTime} \le \text{Cutoff}(T) \}$$
* **Selected Forecast:**
  $$f^* = \arg\max_{f \in \text{Eligible Forecasts}} (f.\text{publishTime})$$

The dashboard also allows testing alternative market benchmarks:
* **Day-Ahead 12:00 GMT:** Midday benchmark.
* **Day-Ahead 17:00 GMT:** Close of bilateral notification windows.
* **Intraday 4h Ahead:** Short-term adjustment decisions.
* **Balancing Gate Closure 1h Ahead:** National Grid Balancing Mechanism final submission.

---

## 8. Accuracy Metric Definitions

All metrics are computed exclusively over valid matched forecast/actual pairs $(A_t, F_t)$:

### 1. Mean Absolute Error (MAE)
$$\text{MAE} = \frac{1}{N} \sum_{t=1}^{N} |F_t - A_t|$$
* **Unit:** MW
* **Interpretation:** The expected volumetric error magnitude per period. In January 2026 with Day-Ahead 11:00 cutoff, the baseline MAE is **2,107.18 MW**.

### 2. Root Mean Squared Error (RMSE)
$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{t=1}^{N} (F_t - A_t)^2}$$
* **Unit:** MW
* **Interpretation:** Quadratic error metric penalizing extreme outliers. Essential for risk managers assessing peak imbalance exposure (**2,611.24 MW**).

### 3. Mean Bias Error (MBE)
$$\text{MBE} = \frac{1}{N} \sum_{t=1}^{N} (F_t - A_t)$$
* **Unit:** MW
* **Interpretation:**
  * **$\text{MBE} > 0$:** Overforecasting bias (forecasts systematically exceed actual wind outturn).
  * **$\text{MBE} < 0$:** Underforecasting bias (forecasts systematically underpredict outturn).
  * For January 2026, $\text{MBE} = +\mathbf{1,839.92\text{ MW}}$, indicating that Day-Ahead models generally expected higher wind availability than realized.

### 4. Normalized MAE (NMAE %)
$$\text{NMAE} = \frac{\text{MAE}}{\bar{A}} \times 100\%$$
* In January 2026, mean actual wind generation was **11,581.11 MW**, resulting in an NMAE of **18.19%**.

---

## 9. Local Setup & Execution Instructions

### Prerequisites
* **Python 3.11+**
* **Node.js 18+ & npm 9+**
* Or **Docker & Docker Compose**

### Option A: Local Native Execution

#### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example .env

# Start FastAPI development server (runs on port 8000)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend will automatically start, initialize the background cache, and expose Swagger docs at [http://localhost:8000/docs](http://localhost:8000/docs).

#### 2. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Create .env from template
cp .env.example .env

# Start Vite development server (runs on port 5173)
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Option B: Docker Compose Execution

To build and run both services with a single command from the project root:

```bash
# Build and run containers in foreground
docker-compose up --build

# Or run in detached background mode:
docker-compose up --build -d
```

* **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
* **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check:** `curl http://localhost:8000/api/v1/health`

To stop:
```bash
docker-compose down
```

---

## 10. API Endpoints

The backend exposes clean, versioned REST endpoints documented via OpenAPI:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status and current UTC time |
| `GET` | `/api/v1/data-status` | Elexon connection status, cached records count, freshness |
| `POST` | `/api/v1/data-status/refresh` | Trigger manual re-fetch of January 2026 data |
| `GET` | `/api/v1/accuracy/summary` | Query MAE, RMSE, MBE, energy totals for a date range & cutoff |
| `GET` | `/api/v1/accuracy/timeseries` | Aligned chronological series of actuals, forecasts & errors |
| `GET` | `/api/v1/accuracy/records` | Paginated, sortable delivery period records with publish times |
| `GET` | `/api/v1/forecasts/summary` | Coverage and publish timestamp bounds |

Interactive documentation is live at `/docs` (Swagger UI) and `/redoc` (ReDoc).

---

## 11. Public Deployment Guide

The application is structured for zero-friction deployment to Vercel (Frontend) and Heroku or Render (Backend).

### A. Deploy Backend to Heroku / Render

1. **Procfile (Heroku):**
   ```text
   web: uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
   ```
2. **Environment Variables on Hosting Provider:**
   * `PORT`: (Injected by provider)
   * `ENVIRONMENT`: `production`
   * `CORS_ORIGINS`: `https://your-frontend-domain.vercel.app`
   * `ELEXON_BASE_URL`: `https://data.elexon.co.uk/bmrs/api/v1`
   * `DEFAULT_CUTOFF_RULE`: `day_ahead_1100`

### B. Deploy Frontend to Vercel

1. Import the repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Configure Environment Variable:
   * `VITE_API_BASE_URL`: `https://your-backend-service.herokuapp.com` (or Render URL)
5. Deploy.

### Live Deployed Application
* **Frontend (Vercel):** [https://frontend-swi4.vercel.app/](https://frontend-swi4.vercel.app/)
* **Backend (Render):** Deployed using root `Dockerfile` connected to this repository.

---

## 12. Known Limitations & Data Quality Notes

1. **Native WINDFOR Hourly Resolution:** The official Elexon `WINDFOR` dataset publishes national wind forecasts at 60-minute resolution (`:00` timestamps), whereas actual metered generation (`FUELHH`) is recorded at 30-minute settlement period resolution (`:00` and `:30`).
   * In **Exact Mode**, only the 744 hourly periods are matched, preserving raw fidelity without interpolation.
   * In **Half-Hourly Mode**, the hourly forecast MW is extended to both half-hour settlement periods (1,488 periods), reflecting standard UK Day-Ahead hourly block bidding.
2. **Timezone Uniformity:** January 2026 operates entirely in Greenwich Mean Time (GMT, UTC+0). Daylight saving (BST) begins in late March and does not affect the analysis period.
3. **Missing Value Integrity:** Zero generation is treated as a valid physical measurement and never conflated with missing or unrecorded data.

---

## 13. AI Tooling Disclosure

In accordance with Section 11 of the assignment specification:
* **AI Tool Used:** **Google Antigravity** powered by **Gemini 3.8 Flash (High)**.
* **Usage:** Assisted in architectural scaffolding, data pipeline validation against live Elexon BMRS API endpoints, mathematical accuracy algorithms, Recharts component design, and TypeScript interface declarations.
