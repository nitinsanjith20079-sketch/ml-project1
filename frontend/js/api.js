/* ============================================
   BACKEND API CALLS
   ============================================ */
const API_URL = 'http://localhost:3000/api';
const ML_URL = 'http://localhost:5000/api';

async function sendSessionToBackend(session) {
    try {
        const res = await fetch(`${API_URL}/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(session)
        });
        const result = await res.json();
        if (result.churn_risk) handleChurnRisk(result.churn_risk);
    } catch (e) {
        console.log('⚠️ Backend offline. Using local prediction.');
        const risk = localChurnPrediction(session);
        handleChurnRisk(risk);
    }
}

async function getPlayerStats(userId) {
    try {
        const res = await fetch(`${API_URL}/player/${userId}`);
        return await res.json();
    } catch (e) {
        return null;
    }
}

async function getAnalyticsOverview() {
    try {
        const res = await fetch(`${API_URL}/analytics/overview`);
        return await res.json();
    } catch (e) {
        return null;
    }
}

function localChurnPrediction(session) {
    let riskScore = 0;
    if (session.totalRounds <= 2) riskScore += 0.4;
    if (session.duration < 120) riskScore += 0.2;
    if (session.distance < 500) riskScore += 0.2;
    if (session.loginStreak === 1) riskScore += 0
