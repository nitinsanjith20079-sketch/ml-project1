const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: String,
    start: Date,
    end: Date,
    duration: Number,
    distance: Number,
    score: Number,
    coins: Number,
    powersUnlocked: Array,
    powersUsed: Array,
    villainsDefeated: Number,
    version: String,
    totalRounds: Number,
    loginStreak: Number,
    retention_1: Boolean,
    retention_7: Boolean
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
