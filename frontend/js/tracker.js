/* ============================================
   PLAYER TRACKER + DDA SUPPORT
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

        // DDA: Consecutive deaths tracking
        this.consecutiveDeaths = parseInt(localStorage.getItem('heroDeaths') || '0');
        this.lastDeathDistance = parseFloat(localStorage.getItem('heroLastDistance') || '0');
        this.bestDistance = parseFloat(localStorage.getItem('heroBest') || '0');

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

    /* ============================================
       DDA: Track player performance for difficulty
       ============================================ */
    getDDAState() {
        // Calculate how the player is doing
        const sessionDuration = (Date.now() - this.sessionStart) / 1000;
        const churnRisk = this.calculateChurnRisk();

        return {
            distance: this.distance,
            duration: sessionDuration,
            consecutiveDeaths: this.consecutiveDeaths,
            lastDeathDistance: this.lastDeathDistance,
            bestDistance: this.bestDistance,
            churnRisk: churnRisk,
            isStruggling: this.consecutiveDeaths >= 2 || churnRisk > 0.7,
            isDoingWell: this.distance > 1000 && churnRisk < 0.3,
            isBored: sessionDuration > 180 && this.distance > 1500
        };
    }

    calculateChurnRisk() {
        // Local churn risk (mirrors ML API logic)
        let risk = 0;
        const sessionDuration = (Date.now() - this.sessionStart) / 1000;

        if (this.totalRounds <= 2) risk += 0.4;
        if (sessionDuration < 120) risk += 0.2;
        if (this.distance < 500) risk += 0.2;
        if (this.loginStreak === 1) risk += 0.2;

        return Math.min(risk, 1.0);
    }

    /* ============================================
       DDA: Record death for adaptive difficulty
       ============================================ */
    recordDeath(distance) {
        // If player died very quickly, increment streak
        if (distance < 300) {
            this.consecutiveDeaths++;
        } else {
            // Good run → reset death counter
            this.consecutiveDeaths = 0;
        }
        localStorage.setItem('heroDeaths', this.consecutiveDeaths);
        localStorage.setItem('heroLastDistance', distance);

        // Update best distance
        if (distance > this.bestDistance) {
            this.bestDistance = distance;
            localStorage.setItem('heroBest', distance);
        }
    }

    resetDeathStreak() {
        this.consecutiveDeaths = 0;
        localStorage.setItem('heroDeaths', 0);
    }

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
            retention_7: this.retention_7,
            consecutiveDeaths: this.consecutiveDeaths
        };
        console.log('📊 Session Data:', session);
        if (typeof sendSessionToBackend === 'function') {
            sendSessionToBackend(session);
        }
        return session;
    }
}
