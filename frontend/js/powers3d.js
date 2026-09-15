const POWERS = {
    super_speed: {
        name: 'Super Speed', icon: '⚡', color: 0xF1C40F, duration: 300,
        effect: () => { gameSpeed *= 1.6; hero.isInvincible = true; },
        removeEffect: () => { gameSpeed /= 1.6; hero.isInvincible = false; }
    },
    force_field: {
        name: 'Force Field', icon: '🛡️', color: 0x3498DB, duration: 300,
        effect: () => { hero.hasShield = true; },
        removeEffect: () => { hero.hasShield = false; }
    },
    fire_dash: {
        name: 'Fire Dash', icon: '🔥', color: 0xE67E22, duration: 300,
        effect: () => { hero.canDestroyObstacles = true; },
        removeEffect: () => { hero.canDestroyObstacles = false; }
    },
    ice_time: {
        name: 'Ice Time', icon: '❄️', color: 0x85C1E9, duration: 300,
        effect: () => { timeScale = 0.6; },
        removeEffect: () => { timeScale = 1.0; }
    },
    lightning_storm: {
        name: 'Lightning Storm', icon: '⚡', color: 0x9B59B6, duration: 300,
        effect: () => { autoDefeatVillains = true; },
        removeEffect: () => { autoDefeatVillains = false; }
    },
    hero_mode: {
        name: 'HERO MODE', icon: '🌟', color: 0xFFD700, duration: 600,
        effect: () => {
            Object.keys(POWERS).forEach(k => {
                if (k !== 'hero_mode') POWERS[k].effect();
            });
        },
        removeEffect: () => {
            Object.keys(POWERS).forEach(k => {
                if (k !== 'hero_mode') POWERS[k].removeEffect();
            });
        }
    }
};

function applyPowerEffect(power) {
    const config = POWERS[power];
    if (config) {
        config.effect();
        if (hero.aura) {
            hero.aura.material.color.setHex(config.color);
            hero.aura.material.opacity = 0.5;
        }
    }
}

function removePowerEffect(power) {
    const config = POWERS[power];
    if (config) config.removeEffect();
    if (hero.aura) hero.aura.material.opacity = 0;
}
