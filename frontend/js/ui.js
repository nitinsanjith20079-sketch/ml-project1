/* ============================================
   UI FUNCTIONS
   ============================================ */
function showPowerUnlockNotification(power) {
    const config = POWERS[power];
    if (!config) return;
    document.getElementById('unlock-icon').textContent = config.icon;
    document.getElementById('unlock-name').textContent = config.name;
    document.getElementById('unlock-desc').textContent = `Press F to activate`;
    const notif = document.getElementById('power-unlock');
    notif.classList.remove('hidden');
    setTimeout(() => notif.classList.add('hidden'), 2500);
}

function showRetentionOffer(message) {
    document.getElementById('offer-message').textContent = 
        message || 'Come back tomorrow for a free power unlock!';
    document.getElementById('retention-offer').classList.remove('hidden');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

function updateProgressBar() {
    const milestones = [500, 1000, 1500, 2000, 3000, 5000];
    const next = milestones.find(m => m > hero.distance) || 5000;
    const prev = milestones.filter(m => m <= hero.distance).pop() || 0;
    const progress = ((hero.distance - prev) / (next - prev)) * 100;
    document.getElementById('power-progress-fill').style.width = Math.min(progress, 100) + '%';
    document.getElementById('power-progress-text').textContent = 
        `${Math.max(0, Math.floor(next - hero.distance))}m to next power`;
}

function updateActivePowers() {
    const container = document.getElementById('active-powers');
    container.innerHTML = '';
    if (hero.activePower) {
        const config = POWERS[hero.activePower];
        const div = document.createElement('div');
        div.className = 'active-power';
        div.innerHTML = `
            <span class="power-icon">${config.icon}</span>
            <span class="power-timer">${Math.ceil(hero.powerTimer / 60)}s</span>
        `;
        container.appendChild(div);
    }
}
