# Itachi Chase — Game Analytics and Churn Prediction

Itachi Chase is a browser-based endless-runner game with an analytics and machine-learning backend. Players run through a 3D environment, collect orbs, unlock powers, and try to achieve their highest score. The application records gameplay sessions, stores player statistics in MongoDB, estimates churn risk, and provides retention recommendations through a Flask prediction API.

## Live Demo

The project is deployed on Vercel:

**[Play Itachi Chase Online](https://ml-project1-git-main-httpsgithubcomnitinsanjith20079-sketchniti.vercel.app/)**

> If the live URL displays a Vercel login page, the deployment is currently private or requires authentication. Make the Vercel deployment public before sharing it with players.

## Project Overview

The repository contains three cooperating components:

1. **Frontend game and dashboard** — Static HTML, CSS, and JavaScript files. The game uses Three.js for its 3D presentation and supports desktop and mobile controls.
2. **Node.js backend** — An Express API that records sessions, updates player profiles, serves player statistics, and returns aggregate analytics.
3. **Flask ML API** — A Python service that predicts churn probability with an XGBoost model when trained model artifacts are available. It falls back to a transparent rule-based score when those artifacts are unavailable.

```text
                         +----------------------+
                         |  Browser frontend    |
                         |  Game + dashboard    |
                         +----------+-----------+
                                    |
                         POST /api/track
                                    |
                                    v
                         +----------------------+
                         | Express backend     |
                         | Port 3000            |
                         +----------+-----------+
                                    |
                   +----------------+----------------+
                   |                                 |
                   v                                 v
          +----------------+               +----------------+
          | MongoDB        |               | Flask ML API   |
          | Player/session |               | Port 5000      |
          | data           |               | Churn scoring  |
          +----------------+               +----------------+
```

## Features

### Gameplay

- Three-lane endless-runner gameplay.
- Keyboard controls for desktop users.
- Swipe and touch-button controls for mobile users.
- Jump, slide, lane-change, and power actions.
- Distance, score, orb, and power tracking.
- Power unlock notifications and active-power tracking.
- Restart flow after a run ends.

### Player tracking

- Per-player identification using a browser-generated or supplied user ID.
- Local storage for streaks, rounds, deaths, best distance, and recent login data.
- One-day and seven-day retention flags.
- Login-streak tracking.
- Consecutive-death tracking for adaptive difficulty support.
- Session duration, distance, score, coins, powers, and villain defeats.

### Analytics and retention

- Player and session persistence through MongoDB.
- Churn-risk classification into Low, Medium, and High levels.
- Recommended retention actions based on predicted risk.
- Dashboard metrics for total players, churn rate, one-day retention, and seven-day retention.
- Chart.js visualizations for risk distribution and power-unlock rates.

### ML service

- XGBoost model integration through `joblib` artifacts.
- Feature preparation for game rounds, retention, version, engagement, and player type.
- Rule-based fallback when a trained model is not present.
- Health endpoint that reports whether the trained model was loaded.

## Technology Stack

| Component | Technology |
|---|---|
| Game UI | HTML, CSS, JavaScript, Three.js |
| Analytics charts | Chart.js |
| Backend API | Node.js, Express, Mongoose, CORS, dotenv |
| Database | MongoDB |
| ML API | Python, Flask, Flask-CORS |
| ML dependencies | XGBoost, scikit-learn, NumPy, pandas, joblib |
| Static deployment | Vercel |

## Repository Structure

```text
.
├── backend/
│   ├── models/
│   │   ├── Player.js             # Player profile schema
│   │   └── Session.js            # Game-session schema
│   ├── routes/
│   │   ├── analytics.js          # Aggregate analytics endpoint
│   │   ├── game.js               # Session tracking endpoint
│   │   └── player.js             # Player lookup endpoint
│   ├── package.json
│   └── server.js                 # Express application entry point
├── frontend/
│   ├── css/
│   │   ├── dashboard.css
│   │   └── style.css
│   ├── js/
│   │   ├── api.js                # Backend and prediction API calls
│   │   ├── dashboard.js
│   │   ├── game3d.js
│   │   ├── hero3d.js
│   │   ├── powers3d.js
│   │   ├── tracker.js            # Session and player tracking
│   │   └── ui.js
│   ├── dashboard.html
│   └── index.html                # Main game page
├── ml-api/
│   ├── app.py                    # Flask application
│   ├── predictor.py              # Standalone model helper
│   ├── requirements.txt
│   └── models/                   # Optional model artifacts, not included
└── vercel.json                   # Static frontend deployment configuration
```

## Requirements

Install the following software before running the project locally:

- **Node.js 18 or later** with npm.
- **Python 3.10 or later** with pip.
- **MongoDB**, either a local server or a hosted MongoDB deployment.
- A modern browser with JavaScript enabled.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/nitinsanjith20079-sketch/ml-project1.git
cd ml-project1
```

### 2. Configure the backend

Install the Node.js dependencies:

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```dotenv
MONGODB_URI=mongodb://localhost:27017/herorunner
PORT=3000
ML_API_URL=http://localhost:5000/api
```

For MongoDB Atlas or another hosted MongoDB provider, replace `MONGODB_URI` with the provider's connection string.

> Never commit database credentials, API keys, or production connection strings. Keep `.env` local and add it to `.gitignore`.

### 3. Configure the ML API

From the repository root, create a Python virtual environment:

```bash
cd ../ml-api
python -m venv .venv
```

Activate the environment.

#### macOS/Linux

```bash
source .venv/bin/activate
```

#### Windows PowerShell

```powershell
.venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

The ML API can run without model files. To enable trained-model predictions, place the following files in `ml-api/models/`:

```text
ml-api/models/xgboost.pkl
ml-api/models/scaler.pkl
```

Both files must be compatible with the feature order expected by `app.py`.

## Running Locally

Run each component in a separate terminal.

### Terminal 1: Start MongoDB

Start your local MongoDB service using the method appropriate for your operating system. The default database connection is:

```text
mongodb://localhost:27017/herorunner
```

If MongoDB is unavailable, the backend can still start, but player and session data will not be persistently stored.

### Terminal 2: Start the Flask ML API

```bash
cd ml-api
source .venv/bin/activate       # macOS/Linux only
python app.py
```

The service runs at:

```text
http://localhost:5000
```

The Flask development server is configured with debug mode enabled in `app.py`. Use a production WSGI server such as Gunicorn when deploying outside local development.

### Terminal 3: Start the Node.js backend

```bash
cd backend
npm start
```

The Express API runs at:

```text
http://localhost:3000
```

For development with automatic restarts, install and use the `dev` script if `nodemon` is available:

```bash
npm run dev
```

### Terminal 4: Serve the frontend

Use a local HTTP server rather than opening `index.html` directly. From the repository root:

```bash
cd frontend
python -m http.server 8080
```

Open the game at:

```text
http://localhost:8080
```

Open the analytics dashboard at:

```text
http://localhost:8080/dashboard.html
```

The frontend currently expects the backend at `http://localhost:3000/api` and the ML service at `http://localhost:5000/api`. Those URLs are defined in `frontend/js/api.js`.

## How to Play

### Desktop controls

| Action | Control |
|---|---|
| Jump | Space or the Jump button |
| Slide | `S` or the Slide button |
| Activate power | `F` or the Power button |
| Change lane | Left and right controls, when supported by the current game UI |

### Mobile controls

- Swipe up to jump.
- Swipe down to slide.
- Swipe left or right to change lanes.
- Use the on-screen buttons for movement and powers.

Enter a ninja name on the start screen, select **Start Chase**, collect orbs, avoid obstacles, and unlock powers by increasing the travel distance.

## API Documentation

All backend routes are mounted below `/api`.

### `POST /api/track`

Records a completed game session. The backend saves the session, updates the associated player, and requests a churn prediction from the ML API.

Example request:

```json
{
  "userId": "ninja-001",
  "start": 1710000000000,
  "end": 1710000095000,
  "duration": 95,
  "distance": 420,
  "score": 1800,
  "coins": 23,
  "powersUnlocked": [],
  "powersUsed": [],
  "villainsDefeated": 0,
  "version": "gate_30",
  "totalRounds": 2,
  "loginStreak": 1,
  "retention_1": false,
  "retention_7": false,
  "consecutiveDeaths": 1
}
```

Example response:

```json
{
  "success": true,
  "churn_risk": {
    "churn_probability": 0.8,
    "risk_level": "High",
    "recommended_action": "Send retention offer immediately"
  }
}
```

### `GET /api/player/:userId`

Returns a stored player document by user ID.

```bash
curl http://localhost:3000/api/player/ninja-001
```

If the player does not exist or the database query fails, the current implementation returns an empty object.

### `GET /api/analytics/overview`

Returns aggregate player and retention metrics used by the dashboard.

```bash
curl http://localhost:3000/api/analytics/overview
```

Example response:

```json
{
  "totalPlayers": 10,
  "churnRate": 20,
  "retention1": 60,
  "retention7": 30
}
```

### `POST /api/predict`

Accepts player and session features and returns a churn probability, risk level, and recommended action.

```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "totalRounds": 2,
    "duration": 95,
    "distance": 420,
    "loginStreak": 1,
    "retention_1": false,
    "retention_7": false,
    "version": "gate_30"
  }'
```

Example response:

```json
{
  "churn_probability": 0.8,
  "risk_level": "High",
  "recommended_action": "Send retention offer immediately"
}
```

### `GET /api/health`

Checks whether the ML API is running and whether a trained model was loaded.

```bash
curl http://localhost:5000/api/health
```

Example response when the model is unavailable:

```json
{
  "status": "ok",
  "model_loaded": false
}
```

## Churn Prediction

The Flask API prepares model features from the incoming gameplay data. The feature set includes:

- Total game rounds and a logarithmic rounds value.
- One-day and seven-day retention flags.
- A combined retention score.
- Encoded game version.
- Encoded engagement category.
- Encoded player type.

When `xgboost.pkl` and `scaler.pkl` are available, the API scales the prepared features and calls the model's `predict_proba` method.

When the model files are unavailable, the fallback implementation adds risk points as follows:

| Condition | Added risk |
|---|---:|
| Total rounds are 2 or fewer | 0.4 |
| Session duration is under 120 seconds | 0.2 |
| Distance is under 500 meters | 0.2 |
| Login streak equals 1 | 0.2 |

The final fallback score is classified as follows:

- **High:** score greater than `0.7`.
- **Medium:** score greater than `0.4` and up to `0.7`.
- **Low:** score of `0.4` or lower.

The browser also contains a local prediction fallback so that gameplay can continue when the backend is offline.

## Deployment

### Frontend on Vercel

The included `vercel.json` configures Vercel to serve the `frontend/` directory as a static site.

The frontend does not automatically deploy the Node.js backend, MongoDB database, or Flask ML API. Deploy those services separately, or place them behind a shared application gateway.

Before deploying the frontend, update the API URLs in `frontend/js/api.js`:

```javascript
const API_URL = 'https://your-backend.example.com/api';
const ML_URL = 'https://your-ml-api.example.com/api';
```

The browser primarily sends completed sessions to the backend. The backend then calls the ML API through the `ML_API_URL` environment variable.

### Backend environment variables

Set these variables in the backend hosting environment:

```dotenv
MONGODB_URI=<your MongoDB connection string>
PORT=3000
ML_API_URL=https://your-ml-api.example.com/api
```

### ML API deployment

Install the packages listed in `ml-api/requirements.txt`, copy the model artifacts into `ml-api/models/`, and run the application with a production WSGI server. For example:

```bash
gunicorn --bind 0.0.0.0:5000 app:app
```

The exact command depends on the hosting provider. Configure the provider to expose the service over HTTPS and allow requests from the deployed frontend origin.

### CORS

Both the Express backend and Flask ML API currently enable CORS broadly for development. For production, restrict allowed origins to the domains that should access the APIs.

## Troubleshooting

### The game loads but data is not saved

Confirm that the Node backend is running on port `3000`, MongoDB is reachable, and the browser can reach the backend URL configured in `frontend/js/api.js`.

### Churn predictions are always rule-based

Call `GET /api/health` on the Flask service. If `model_loaded` is `false`, verify that both `models/xgboost.pkl` and `models/scaler.pkl` exist and can be loaded by the installed Python package versions.

### The dashboard shows zeros

The dashboard depends on `GET /api/analytics/overview`. Confirm that the backend is running, MongoDB contains player documents, and the frontend API URL points to the correct backend deployment.

### Browser requests fail with CORS errors

Configure the backend and ML service to allow the frontend's origin. Also verify that the deployed URLs use HTTPS when the frontend is served over HTTPS; browsers generally block insecure HTTP requests from a secure page.

### Opening the HTML file directly does not work

Serve the `frontend/` directory with a local HTTP server. Direct `file://` loading can cause module, resource, or browser security issues.

## Development Notes

- The backend catches several database and ML-service failures and returns fallback responses so that gameplay can continue.
- Player progression and streak state are stored in browser `localStorage` as well as selected values being sent to the backend.
- The repository does not include trained model artifacts. Add them separately and keep large or sensitive artifacts out of source control unless intentionally managed with an appropriate artifact system.
- The frontend API endpoints are currently hard-coded. A production implementation should use environment-specific configuration.
- The current Vercel configuration is for the static frontend only.
- Add automated tests for the frontend, backend routes, database models, and ML feature preparation before using the project in production.

## Security Recommendations

Before production use:

1. Remove or rotate any credentials that may have been committed accidentally.
2. Add `.env` to `.gitignore` and store secrets in the hosting provider's secret manager.
3. Restrict CORS to trusted frontend origins.
4. Validate and sanitize request bodies before saving them to MongoDB.
5. Add authentication and authorization for player and analytics endpoints.
6. Add rate limiting to public API routes.
7. Run the Flask service without debug mode.
8. Use HTTPS for the frontend, backend, and ML API.
9. Avoid exposing internal error details to public clients.
10. Add monitoring for prediction failures, database failures, and abnormal traffic.

## License

No license file is currently included in this repository. Add a `LICENSE` file before redistributing the project or accepting external contributions.

## References

[1]: https://github.com/nitinsanjith20079-sketch/ml-project1 "ml-project1 source repository"
