const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    userId: { type: String, unique: true, required: true },
    version: String,
    firstLogin: Date,
    lastLogin: Date,
    loginDays: [String],
    loginStreak: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    totalCoins: { type: Number, default: 0 },
    bestDistance: { type: Number, default: 0 },
    powersUnlocked: [String],
    powersUsed: [String],
    retention_1: { type: Boolean, default: false },
    retention_7: { type: Boolean, default: false },
    churn: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
