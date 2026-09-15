/* ============================================
   PLAYER TRACKER
   ============================================ */
class HeroTracker {
    constructor(userId) {
        this.userId = userId;
        this.sessionStart = Date.now();
        this.distance = 0;
        this.score = 0;
        this.coins = 0;
        this.powersUnlocked = [];
        this.powersUsed = [];
        this.villainsDefeated = 0;
        this.version = Math.random() < 0.5 ? 'gate_30' : 'gate_40';
        this.retention_1 = false;
        this.retention_7 = false;
        this.loginStreak = parseInt(localStorage.getItem('heroStreak') || '0');
        this.lastLogin = localStorage.getItem('heroLastLogin');
        this.totalRounds = parseInt(localStorage.getItem('heroRounds') || '0');
        this.checkStreak();
    }

    checkStreak() {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (this.lastLogin === yesterday) {
            this.loginStreak++;
            this.retention_1 = true;
            if (this.loginStreak >= 7) this.retention_7 = true;
        } else if (this.lastLogin !== today) {
            this.loginStreak = 1;
        }
        localStorage.setItem('heroStreak', this.loginStreak);
        localStorage.setItem('heroLastLogin', today);
    }

    updateDistance(d) { this.distance = d; }
    updateScore(s) { this.score = s; }
    updateCoins(c) { this.coins = c; }
    trackPowerUnlock(p, d) { this.powersUnlocked.push({ power: p, distance: d, time: Date.now() }); }
    trackPowerUsage(p) { this.powersUsed.push({ power: p, time: Date.now() }); }
    trackVillainDefeat() { this.villainsDefeated++; }

    endSession() {
        this.totalRounds++;
        localStorage.setItem('heroRounds', this.totalRounds);
        const session = {
            userId: this.userId,
            start: this.sessionStart,
            end: Date.now(),
            duration: (Date.now() - this.sessionStart) / 1000,
            distance: this.distance,
            score: this.score,
            coins: this.coins,
            powersUnlocked: this.powersUnlocked,
            powersUsed: this.powersUsed,
            villainsDefeated: this.villainsDefeated,
            version: this.version,
            totalRounds: this.totalRounds,
            loginStreak: this.loginStreak,
            retention_1: this.retention_1,
            retention_7: this.retention_7
        };
        console.log('📊 Session Data:', session);
        if (typeof sendSessionToBackend === 'function') {
            sendSessionToBackend(session);
        }
        return session;
    }
}
