const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

router.get('/player/:userId', async (req, res) => {
    try {
        const player = await Player.findOne({ userId: req.params.userId });
        res.json(player || {});
    } catch (err) {
        res.json({});
    }
});

module.exports = router;
