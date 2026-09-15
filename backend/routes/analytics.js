const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

router.get('/analytics/overview', async (req, res) => {
    try {
        const totalPlayers = await Player.countDocuments();
        const retention1 = await Player.countDocuments({ retention_1: true });
        const retention7 = await Player.countDocuments({ retention_7: true });
        const churned = await Player.countDocuments({ churn: true });

        res.json({
            totalPlayers,
            churnRate: totalPlayers > 0 ? (churned / totalPlayers) * 100 : 0,
            retention1: totalPlayers > 0 ? (retention1 / totalPlayers) * 100 : 0,
            retention7: totalPlayers > 0 ? (retention7 / totalPlayers) * 100 : 0
        });
    } catch (err) {
        res.json({ totalPlayers: 0, churnRate: 0, retention1: 0, retention7: 0 });
    }
});

module.exports = router;
