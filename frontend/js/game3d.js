/* ============================================
   3D GAME ENGINE + DDA
   ============================================ */
let scene, camera, renderer;
let currentLane = 1;
const LANE_POSITIONS = [-8, -6, -4];
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

// Base game variables
let baseSpeed = 2.5;
let gameSpeed = 2.5;
let timeScale = 1.0;
let obstacleSpawnRate = 0.015;
let coinSpawnRate = 0.03;

// DDA variables
let ddaEnabled = true;
let ddaCheckInterval = 2000; // check every 2 seconds
let lastDDACheck = 0;
let currentDifficulty = 'Normal'; // Easy, Normal, Hard
let ddaMode = 'Normal';

let autoDefeatVillains = false;
let isPlaying = false;
let isGameOver = false;
let obstacles = [];
let coinObjects = [];
let particles = [];
let roadOffset = 0;
let tracker = null;
let hero;

/* ============================================
   INIT THREE.JS
   ============================================ */
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a1a3e, 20, 80);

    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 1, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x1a1a3e);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404080, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backLight = new THREE.PointLight(0x00b8b8, 0.8, 30);
    backLight.position.set(-5, 3, -5);
    scene.add(backLight);

    createRoad();
    createBuildings();

    hero = new Hero3D(scene);
    currentLane = 1;
    hero.group.position.x = LANE_POSITIONS[1];

    animate();
}

function createRoad() {
    const roadGeo = new THREE.PlaneGeometry(8, 200);
    const roadMat = new THREE.MeshStandardMaterial({
        color: 0x2d2d2d, metalness: 0.3, roughness: 0.8
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(-6, 0, -50);
    road.receiveShadow = true;
    scene.add(road);

    for (let i = 0; i < 50; i++) {
        const lineGeo = new THREE.PlaneGeometry(0.3, 2);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x00b8b8 });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(-6, 0.01, -i * 4 + 20);
        scene.add(line);
        road.userData.lines = road.userData.lines || [];
        road.userData.lines.push(line);
    }
    scene.userData.road = road;
}

function createBuildings() {
    const buildingColors = [0x2a2a4a, 0x3a3a5a, 0x1a1a3a];
    for (let i = 0; i < 20; i++) {
        const height = 5 + Math.random() * 15;
        const geo = new THREE.BoxGeometry(3, height, 3);
        const mat = new THREE.MeshStandardMaterial({
            color: buildingColors[i % 3], metalness: 0.3, roughness: 0.7
        });
        const building = new THREE.Mesh(geo, mat);
        building.position.set(
            (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 5),
            height / 2,
            -i * 10 - 10
        );
        building.castShadow = true;
        scene.add(building);

        for (let w = 0; w < 5; w++) {
            const winGeo = new THREE.PlaneGeometry(0.4, 0.6);
            const winMat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xf1c40f : 0x3498db
            });
            const win = new THREE.Mesh(winGeo, winMat);
            win.position.set(
                building.position.x + (Math.random() - 0.5) * 2,
                Math.random() * height + 1,
                building.position.z + 1.51
            );
            scene.add(win);
        }
    }
}

/* ============================================
   DDA ENGINE
   ============================================ */
function evaluateDDA() {
    if (!ddaEnabled || !tracker || !hero) return;

    const now = Date.now();
    if (now - lastDDACheck < ddaCheckInterval) return;
    lastDDACheck = now;

    const state = tracker.getDDAState();
    const previousMode = ddaMode;

    // Determine DDA mode
    if (state.consecutiveDeaths >= 3) {
        ddaMode = 'Mercy';      // Player keeps dying → make it very easy
    } else if (state.isStruggling) {
        ddaMode = 'Easy';       // Player struggling → ease up
    } else if (state.isBored) {
        ddaMode = 'Challenge';  // Player bored → spice it up
    } else if (state.isDoingWell && state.distance > 2000) {
        ddaMode = 'Hard';       // Player skilled → challenge them
    } else {
        ddaMode = 'Normal';     // Default
    }

    // Apply DDA settings
    applyDDAMode(ddaMode);

    // Notify player if mode changed
    if (previousMode !== ddaMode && (ddaMode === 'Mercy' || ddaMode === 'Easy')) {
        if (typeof showToast === 'function') {
            showToast(`💙 ${ddaMode} Mode: Taking it easy!`);
        }
    }
    if (previousMode !== ddaMode && (ddaMode === 'Hard' || ddaMode === 'Challenge')) {
        if (typeof showToast === 'function') {
            showToast(`🔥 ${ddaMode} Mode: You're on fire!`);
        }
    }

    updateDDAIndicator(ddaMode);
}

function applyDDAMode(mode) {
    switch (mode) {
        case 'Mercy':
            gameSpeed = Math.max(1.5, baseSpeed * 0.6);
            obstacleSpawnRate = 0.008;
            coinSpawnRate = 0.06;   // More coins to reward
            currentDifficulty = 'Very Easy';
            break;

        case 'Easy':
            gameSpeed = Math.max(1.8, baseSpeed * 0.75);
            obstacleSpawnRate = 0.011;
            coinSpawnRate = 0.045;
            currentDifficulty = 'Easy';
            break;

        case 'Normal':
            gameSpeed = baseSpeed;
            obstacleSpawnRate = 0.015;
            coinSpawnRate = 0.03;
            currentDifficulty = 'Normal';
            break;

        case 'Challenge':
            gameSpeed = Math.min(4.0, baseSpeed * 1.15);
            obstacleSpawnRate = 0.02;
            coinSpawnRate = 0.025;
            currentDifficulty = 'Challenge';
            break;

        case 'Hard':
            gameSpeed = Math.min(5.0, baseSpeed * 1.3);
            obstacleSpawnRate = 0.025;
            coinSpawnRate = 0.02;
            currentDifficulty = 'Hard';
            break;
    }
}

function updateDDAIndicator(mode) {
    let el = document.getElementById('dda-indicator');
    if (!el) {
        el = document.createElement('div');
        el.id = 'dda-indicator';
        el.style.cssText = `
            position: absolute;
            top: 110px;
            left: 10px;
            padding: 5px 12px;
            background: rgba(13,43,78,0.85);
            border: 2px solid #00b8b8;
            border-radius: 20px;
            color: #eaf4fb;
            font-size: 11px;
            font-weight: bold;
            z-index: 10;
            backdrop-filter: blur(10px);
        `;
        document.getElementById('game-container').appendChild(el);
    }

    const modeColors = {
        'Mercy': '#2ecc71',
        'Easy': '#3498db',
        'Normal': '#00b8b8',
        'Challenge': '#f39c12',
        'Hard': '#e74c3c'
    };

    const modeIcons = {
        'Mercy': '💙',
        'Easy': '🟢',
        'Normal': '⚪',
        'Challenge': '🟡',
        'Hard': '🔴'
    };

    el.style.borderColor = modeColors[mode];
    el.textContent = `${modeIcons[mode]} ${mode} Mode`;
}

/* ============================================
   LANE SWITCHING
   ============================================ */
function moveLeft() {
    if (!hero || !isPlaying) return;
    if (currentLane > 0) {
        currentLane--;
        animateHeroToLane();
    }
}

function moveRight() {
    if (!hero || !isPlaying) return;
    if (currentLane < 2) {
        currentLane++;
        animateHeroToLane();
    }
}

function animateHeroToLane() {
    if (!hero) return;
    const targetX = LANE_POSITIONS[currentLane];
    const startX = hero.group.position.x;
    const duration = 200;
    const startTime = Date.now();

    function step() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        hero.group.position.x = startX + (targetX - startX) * eased;
        if (progress < 1) requestAnimationFrame(step);
    }
    step();
}

/* ============================================
   GAME LOOP
   ============================================ */
function animate() {
    requestAnimationFrame(animate);
    if (!isPlaying) {
        renderer.render(scene, camera);
        return;
    }

    const effectiveSpeed = gameSpeed * timeScale;

    hero.update(effectiveSpeed);

    document.getElementById('distance').textContent = Math.floor(hero.distance) + 'm';
    document.getElementById('score').textContent = Math.floor(hero.distance / 10);
    document.getElementById('coins').textContent = hero.coins;
    document.getElementById('powers-count').textContent = hero.powers.length;
    updateProgressBar();
    updateActivePowers();

    if (tracker) {
        tracker.updateDistance(hero.distance);
        tracker.updateScore(Math.floor(hero.distance / 10));
        tracker.updateCoins(hero.coins);
    }

    // DDA EVALUATION
    evaluateDDA();

    // Adaptive spawn rates
    if (Math.random() < obstacleSpawnRate) spawnObstacle();
    if (Math.random() < coinSpawnRate) spawnCoin();

    updateObstacles(effectiveSpeed);
    updateCoins(effectiveSpeed);
    updateParticles();

    roadOffset = (roadOffset + effectiveSpeed * 0.1) % 4;
    const road = scene.userData.road;
    if (road && road.userData.lines) {
        road.userData.lines.forEach((line, i) => {
            line.position.z = -i * 4 + 20 + (roadOffset * 10) % 4;
            if (line.position.z > 20) line.position.z -= 200;
        });
    }

    renderer.render(scene, camera);
}

function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    if (lane === currentLane && Math.random() < 0.5) return;

    const geo = new THREE.BoxGeometry(1, 1.5, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8E44AD, metalness: 0.4 });
    const villain = new THREE.Mesh(geo, mat);
    villain.position.set(LANE_POSITIONS[lane], 0.75, -60);
    villain.castShadow = true;
    villain.userData.lane = lane;
    scene.add(villain);

    const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
    eye1.position.set(-0.25, 0.3, 0.5);
    villain.add(eye1);
    const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
    eye2.position.set(0.25, 0.3, 0.5);
    villain.add(eye2);

    obstacles.push(villain);
}

function spawnCoin() {
    const lane = Math.floor(Math.random() * 3);
    const geo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xF1C40F, metalness: 0.8, roughness: 0.2
    });
    const coin = new THREE.Mesh(geo, mat);
    coin.position.set(LANE_POSITIONS[lane], 1 + Math.random() * 2, -60);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    scene.add(coin);
    coinObjects.push(coin);
}

function updateObstacles(speed) {
    obstacles = obstacles.filter(o => {
        o.position.z += speed * 0.15;

        if (Math.abs(o.position.z - hero.group.position.z) < 1 &&
            Math.abs(o.position.x - hero.group.position.x) < 1.2 &&
            hero.y < 1) {
            if (hero.isInvincible || hero.hasShield || hero.canDestroyObstacles || autoDefeatVillains) {
                createParticles(o.position.x, o.position.y, o.position.z, 0xE67E22);
                scene.remove(o);
                if (tracker) tracker.trackVillainDefeat();
                return false;
            } else {
                endGame();
                return false;
            }
        }

        if (o.position.z > 10) {
            scene.remove(o);
            return false;
        }
        return true;
    });
}

function updateCoins(speed) {
    coinObjects = coinObjects.filter(c => {
        c.position.z += speed * 0.15;
        c.rotation.z += 0.1;

        if (Math.abs(c.position.z - hero.group.position.z) < 1 &&
            Math.abs(c.position.x - hero.group.position.x) < 1.2 &&
            Math.abs(c.position.y - (hero.group.position.y + 0.7)) < 1.2) {
            createParticles(c.position.x, c.position.y, c.position.z, 0xF1C40F);
            scene.remove(c);
            hero.coins++;
            return false;
        }
        if (c.position.z > 10) {
            scene.remove(c);
            return false;
        }
        return true;
    });
}

function createParticles(x, y, z, color) {
    for (let i = 0; i < 10; i++) {
        const geo = new THREE.SphereGeometry(0.1, 6, 6);
        const mat = new THREE.MeshBasicMaterial({ color: color });
        const p = new THREE.Mesh(geo, mat);
        p.position.set(x, y, z);
        p.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            Math.random() * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        p.userData.life = 30;
        scene.add(p);
        particles.push(p);
    }
}

function updateParticles() {
    particles = particles.filter(p => {
        p.position.add(p.userData.velocity);
        p.userData.life--;
        p.scale.setScalar(p.userData.life / 30);
        if (p.userData.life <= 0) {
            scene.remove(p);
            return false;
        }
        return true;
    });
}

/* ============================================
   GAME CONTROLS
   ============================================ */
function startGame() {
    const name = document.getElementById('player-name').value.trim() || 'Guest';
    document.getElementById('player-id').textContent = `Hero: ${name}`;
    tracker = new HeroTracker(name);
    document.getElementById('streak-info').textContent = `🔥 ${tracker.loginStreak}`;

    document.getElementById('start-screen').classList.add('hidden');

    if (hero) scene.remove(hero.group);
    obstacles.forEach(o => scene.remove(o));
    coinObjects.forEach(c => scene.remove(c));
    particles.forEach(p => scene.remove(p));
    obstacles = [];
    coinObjects = [];
    particles = [];

    hero = new Hero3D(scene);
    currentLane = 1;
    hero.group.position.x = LANE_POSITIONS[1];

    // Reset DDA
    baseSpeed = 2.5;
    gameSpeed = 2.5;
    obstacleSpawnRate = 0.015;
    coinSpawnRate = 0.03;
    timeScale = 1.0;
    autoDefeatVillains = false;
    ddaMode = 'Normal';
    lastDDACheck = Date.now();
    updateDDAIndicator(ddaMode);

    isPlaying = true;
    isGameOver = false;
}

function endGame() {
    isPlaying = false;
    isGameOver = true;

    // DDA: Record death for difficulty adjustment
    if (tracker) {
        tracker.recordDeath(hero.distance);
        tracker.endSession();
    }

    document.getElementById('final-distance').textContent = Math.floor(hero.distance) + 'm';
    document.getElementById('final-score').textContent = Math.floor(hero.distance / 10);
    document.getElementById('final-coins').textContent = hero.coins;
    document.getElementById('final-powers').textContent = hero.powers.length;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

function restartGame() {
    document.getElementById('game-over-screen').classList.add('hidden');
    startGame();
}

function activateBestPower() {
    if (!hero || hero.activePower || hero.powers.length === 0) return;
    const priority = ['hero_mode', 'lightning_storm', 'ice_time', 'fire_dash', 'force_field', 'super_speed'];
    for (const p of priority) {
        if (hero.powers.includes(p)) {
            hero.activatePower(p);
            showToast(`${POWERS[p].icon} ${POWERS[p].name} activated!`);
            break;
        }
    }
}

/* ============================================
   EVENT LISTENERS
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();

    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);

    document.getElementById('jump-btn').addEventListener('touchstart', (e) => {
        e.preventDefault(); if (hero) hero.jump();
    });
    document.getElementById('slide-btn').addEventListener('touchstart', (e) => {
        e.preventDefault(); if (hero) hero.slide();
    });
    document.getElementById('btn-left').addEventListener('touchstart', (e) => {
        e.preventDefault(); moveLeft();
    });
    document.getElementById('btn-right').addEventListener('touchstart', (e) => {
        e.preventDefault(); moveRight();
    });
    document.getElementById('power-btn').addEventListener('touchstart', (e) => {
        e.preventDefault(); activateBestPower();
    });

    document.getElementById('jump-btn').addEventListener('click', () => hero && hero.jump());
    document.getElementById('slide-btn').addEventListener('click', () => hero && hero.slide());
    document.getElementById('btn-left').addEventListener('click', moveLeft);
    document.getElementById('btn-right').addEventListener('click', moveRight);
    document.getElementById('power-btn').addEventListener('click', activateBestPower);

    const jd = document.getElementById('jump-btn-desk');
    const sd = document.getElementById('slide-btn-desk');
    const pd = document.getElementById('power-btn-desk');
    if (jd) jd.addEventListener('click', () => hero && hero.jump());
    if (sd) sd.addEventListener('click', () => hero && hero.slide());
    if (pd) pd.addEventListener('click', activateBestPower);

    document.getElementById('claim-btn').addEventListener('click', () => {
        document.getElementById('retention-offer').classList.add('hidden');
        showToast('🎁 Reward claimed! Run again tomorrow!');
    });
    document.getElementById('dismiss-btn').addEventListener('click', () => {
        document.getElementById('retention-offer').classList.add('hidden');
    });

    const gameContainer = document.getElementById('game-container');

    gameContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        touchStartTime = Date.now();
    }, { passive: true });

    gameContainer.addEventListener('touchend', (e) => {
        if (!isPlaying || !hero) return;
        const deltaX = e.changedTouches[0].screenX - touchStartX;
        const deltaY = e.changedTouches[0].screenY - touchStartY;
        const deltaTime = Date.now() - touchStartTime;

        if (deltaTime > 600) return;
        const minSwipe = 40;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) < minSwipe) return;
            if (deltaX > 0) moveRight();
            else moveLeft();
        } else {
            if (Math.abs(deltaY) < minSwipe) return;
            if (deltaY < 0) hero.jump();
            else hero.slide();
        }
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') { e.preventDefault(); if (isPlaying && hero) hero.jump(); }
        if (e.code === 'KeyS') { e.preventDefault(); if (isPlaying && hero) hero.slide(); }
        if (e.code === 'KeyF') { e.preventDefault(); if (isPlaying) activateBestPower(); }
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); if (isPlaying) moveLeft(); }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); if (isPlaying) moveRight(); }
    });

    window.addEventListener('resize', () => {
        if (!renderer || !camera) return;
        const container = document.getElementById('canvas-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
});
