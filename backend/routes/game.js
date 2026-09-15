const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const Session = require('../models/Session');

// Track game session
router.post('/track', async (req, res) => {
    try {
        const data = req.body;

        // Save session
        const session = new Session(data);
        await session.save().catch(() => {});

        // Update player
        let player = await Player.findOne({ userId: data.userId });
        if (!player) {
            player = new Player({
                userId: data.userId,
                version: data.version,
                firstLogin: new Date(),
                loginDays: [new Date().toISOString().split('T')[0]]
            });
        }

        player.totalSessions += 1;
        player.totalDistance += data.distance || 0;
        player.totalScore += data.score || 0;
        player.totalCoins += data.coins || 0;
        player.bestDistance = Math.max(player.bestDistance, data.distance || 0);
        player.lastLogin = new Date();
        player.loginStreak = data.loginStreak || 1;
        player.retention_1 = data.retention_1 || false;
        player.retention_7 = data.retention_7 || false;

        (data.powersUnlocked || []).forEach(p => {
            if (!player.powersUnlocked.includes(p.power)) {
                player.powersUnlocked.push(p.power);
            }
        });
        (data.powersUsed || []).forEach(p => {
            if (!player.powersUsed.includes(p.power)) {
                player.powersUsed.push(p.power);
            }
        });

        await player.save().catch(() => {});

        // Get churn prediction from ML API
        let churn_risk = null;
        try {
            const mlResponse = await fetch(
                (process.env.ML_API_URL || 'http://localhost:5000/api') + '/predict',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }
            );
            churn_risk = await mlResponse.json();
        } catch (e) {
            // Local fallback
            let risk = 0;
            if (player.totalSessions <= 2) risk += 0.4;
            if ((data.duration || 0) < 120) risk += 0.2;
            if ((data.distance || 0) < 500) risk += 0.2;

            churn_risk = {
                churn_probability: risk,
                risk_level: risk > 0.7 ? 'High' : risk > 0.4 ? 'Medium' : 'Low',
                recommended_action: risk > 0.7 ? 'Send retention offer' : 'Continue'
            };
        }

        res.json({ success: true, churn_risk });
    } catch (err) {
        console.error('Track error:', err);
        res.json({ success: true, churn_risk: null });
    }
});

module.exports = router;
