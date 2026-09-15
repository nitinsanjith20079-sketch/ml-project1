/* ============================================
   3D GAME ENGINE
   ============================================ */
let scene, camera, renderer;
let gameSpeed = 5;
let timeScale = 1.0;
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

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a1a3e, 20, 80);

    camera = new THREE.PerspectiveCamera(60, 1200 / 500, 0.1, 200);
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 1, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(1200, 500);
    renderer.setClearColor(0x1a1a3e);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404080, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backLight = new THREE.PointLight(0x00b8b8, 0.8, 30);
    backLight.position.set(-5, 3, -5);
    scene.add(backLight);

    // Road
    createRoad();

    // Buildings
    createBuildings();

    // Hero
    hero = new Hero3D(scene);

    // Animate
    animate();
}

function createRoad() {
    const roadGeo = new THREE.PlaneGeometry(8, 200);
    const roadMat = new THREE.MeshStandardMaterial({
        color: 0x2d2d2d, metalness: 0.3, roughness: 0.8
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -50);
    road.receiveShadow = true;
    scene.add(road);

    // Road lines
    for (let i = 0; i < 50; i++) {
        const lineGeo = new THREE.PlaneGeometry(0.3, 2);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x00b8b8 });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.01, -i * 4 + 20);
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
            (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random() * 5),
            height / 2,
            -i * 10 - 10
        );
        building.castShadow = true;
        scene.add(building);

        // Windows
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
   GAME LOOP
   ============================================ */
function animate() {
    requestAnimationFrame(animate);
    if (!isPlaying) {
        renderer.render(scene, camera);
        return;
    }

    const effectiveSpeed = gameSpeed * timeScale;

    // Update hero
    hero.update(effectiveSpeed);

    // Update HUD
    document.getElementById('distance').textContent = Math.floor(hero.distance) + 'm';
    document.getElementById('score').textContent = Math.floor(hero.distance / 10);
    document.getElementById('coins').textContent = hero.coins;
    document.getElementById('powers-count').textContent = hero.powers.length;
    updateProgressBar();
    updateActivePowers();

    // Track data
    if (tracker) {
        tracker.updateDistance(hero.distance);
        tracker.updateScore(Math.floor(hero.distance / 10));
        tracker.updateCoins(hero.coins);
    }

    // Spawn obstacles
    if (Math.random() < 0.02) {
        spawnObstacle();
    }

    // Spawn coins
    if (Math.random() < 0.05) {
        spawnCoin();
    }

    // Update obstacles
    updateObstacles(effectiveSpeed);

    // Update coins
    updateCoins(effectiveSpeed);

    // Update particles
    updateParticles();

    // Move road
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
    const geo = new THREE.BoxGeometry(1, 1.5, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8E44AD, metalness: 0.4 });
    const villain = new THREE.Mesh(geo, mat);
    villain.position.set(-6, 0.75, -60);
    villain.castShadow = true;
    scene.add(villain);

    // Eyes
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
    const geo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xF1C40F, metalness: 0.8, roughness: 0.2
    });
    const coin = new THREE.Mesh(geo, mat);
    coin.position.set(-6, 1 + Math.random() * 2, -60);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    scene.add(coin);
    coinObjects.push(coin);
}

function updateObstacles(speed) {
    obstacles = obstacles.filter(o => {
        o.position.z += speed * 0.15;

        // Collision check
        if (Math.abs(o.position.z - hero.group.position.z) < 1 &&
            Math.abs(o.position.x - hero.group.position.x) < 0.8 &&
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
            Math.abs(c.position.y - (hero.group.position.y + 0.7)) < 1) {
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
    document.getElementById('streak-info').textContent = `🔥 Streak: ${tracker.loginStreak}`;

    document.getElementById('start-screen').classList.add('hidden');

    // Reset game
    if (hero) {
        scene.remove(hero.group);
    }
    obstacles.forEach(o => scene.remove(o));
    coinObjects.forEach(c => scene.remove(c));
    particles.forEach(p => scene.remove(p));
    obstacles = [];
    coinObjects = [];
    particles = [];

    hero = new Hero3D(scene);
    gameSpeed = 5;
    timeScale = 1.0;
    autoDefeatVillains = false;
    isPlaying = true;
    isGameOver = false;
}

function endGame() {
    isPlaying = false;
    isGameOver = true;
    if (tracker) tracker.endSession();
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
    document.getElementById('jump-btn').addEventListener('click', () => hero && hero.jump());
    document.getElementById('slide-btn').addEventListener('click', () => hero && hero.slide());
    document.getElementById('power-btn').addEventListener('click', activateBestPower);
    document.getElementById('claim-btn').addEventListener('click', () => {
        document.getElementById('retention-offer').classList.add('hidden');
        showToast('🎁 Reward claimed! Run again tomorrow!');
    });
    document.getElementById('dismiss-btn').addEventListener('click', () => {
        document.getElementById('retention-offer').classList.add('hidden');
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') { e.preventDefault(); if (isPlaying && hero) hero.jump(); }
        if (e.code === 'KeyS') { e.preventDefault(); if (isPlaying && hero) hero.slide(); }
        if (e.code === 'KeyF') { e.preventDefault(); if (isPlaying) activateBestPower(); }
    });
});
