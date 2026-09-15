/* ============================================
   ITACHI CHASE - 3D GAME ENGINE (Bug Fixed)
   Full replacement file
   ============================================ */
let scene, camera, renderer;
let currentLane = 1;
const LANE_POSITIONS = [-8, -6, -4];
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

let baseSpeed = 2.5;
let gameSpeed = 2.5;
let timeScale = 1.0;
let obstacleSpawnRate = 0.015;
let coinSpawnRate = 0.03;

let ddaEnabled = true;
let ddaCheckInterval = 2000;
let lastDDACheck = 0;
let currentDifficulty = 'Normal';
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
let groundTiles = [];
let streetLights = [];
let trees = [];

/* ============================================
   INIT THREE.JS
   ============================================ */
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0a2e);
    scene.fog = new THREE.Fog(0x2a1040, 40, 140);

    camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 250);
    camera.position.set(-6, 3, 6);
    camera.lookAt(-6, 1.2, -20);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x1a0a2e);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x6060b0, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa080ff, 0.8);
    dirLight.position.set(10, 20, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const cityGlow = new THREE.PointLight(0xff0040, 0.8, 80);
    cityGlow.position.set(-6, 15, -40);
    scene.add(cityGlow);

    const heroLight = new THREE.PointLight(0xff2020, 1, 30);
    heroLight.position.set(-6, 6, -5);
    scene.add(heroLight);

    createSky();
    createGround();
    createCitySkyline();
    createRoad();
    createStreetLights();
    createTrees();

    hero = new Hero3D(scene);
    currentLane = 1;
    hero.group.position.x = LANE_POSITIONS[1];

    animate();
}

/* ============================================
   SKY
   ============================================ */
function createSky() {
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 300;
    const positions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 300;
        positions[i * 3 + 1] = 20 + Math.random() * 40;
        positions[i * 3 + 2] = -50 - Math.random() * 150;
    }

    starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starsMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.4,
        transparent: true,
        opacity: 0.9
    });

    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    const moonGeo = new THREE.SphereGeometry(7, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xdd2020 });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(25, 40, -120);
    scene.add(moon);

    const glowGeo = new THREE.SphereGeometry(9, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff4040, transparent: true, opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(moon.position);
    scene.add(glow);
}

/* ============================================
   GROUND
   ============================================ */
function createGround() {
    const groundGeo = new THREE.PlaneGeometry(200, 300);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x1a1030, metalness: 0.1, roughness: 0.95
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(-6, -0.05, -100);
    ground.receiveShadow = true;
    scene.add(ground);

    const sidewalkMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a5a, metalness: 0.2, roughness: 0.9
    });

    const sidewalkL = new THREE.Mesh(new THREE.PlaneGeometry(4, 300), sidewalkMat);
    sidewalkL.rotation.x = -Math.PI / 2;
    sidewalkL.position.set(-11, 0, -100);
    scene.add(sidewalkL);

    const sidewalkR = new THREE.Mesh(new THREE.PlaneGeometry(4, 300), sidewalkMat);
    sidewalkR.rotation.x = -Math.PI / 2;
    sidewalkR.position.set(-1, 0, -100);
    scene.add(sidewalkR);

    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xff0040 });
    for (let i = 0; i < 60; i++) {
        const edgeGeo = new THREE.PlaneGeometry(0.1, 2);
        const edgeL = new THREE.Mesh(edgeGeo, edgeMat);
        edgeL.rotation.x = -Math.PI / 2;
        edgeL.position.set(-13, 0.01, -i * 5);
        scene.add(edgeL);
        groundTiles.push(edgeL);

        const edgeR = new THREE.Mesh(edgeGeo, edgeMat);
        edgeR.rotation.x = -Math.PI / 2;
        edgeR.position.set(1, 0.01, -i * 5);
        scene.add(edgeR);
        groundTiles.push(edgeR);
    }
}

/* ============================================
   CITY SKYLINE
   ============================================ */
function createCitySkyline() {
    const distantColors = [0x1a0a2e, 0x2a1040, 0x3a1550];

    for (let i = 0; i < 40; i++) {
        const height = 15 + Math.random() * 40;
        const width = 3 + Math.random() * 4;
        const geo = new THREE.BoxGeometry(width, height, width);
        const mat = new THREE.MeshBasicMaterial({ color: distantColors[i % 3] });
        const building = new THREE.Mesh(geo, mat);
        building.position.set(
            (Math.random() - 0.5) * 200,
            height / 2,
            -180 - Math.random() * 40
        );
        scene.add(building);

        const winCount = Math.floor(height / 3);
        for (let w = 0; w < winCount; w++) {
            if (Math.random() > 0.5) continue;
            const winGeo = new THREE.PlaneGeometry(0.5, 0.5);
            const winMat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xff2020 : 0xff0060
            });
            const win = new THREE.Mesh(winGeo, winMat);
            win.position.set(
                building.position.x + (Math.random() - 0.5) * width * 0.7,
                2 + w * 3,
                building.position.z + width / 2 + 0.01
            );
            scene.add(win);
        }
    }

    const nearColors = [0x2a1040, 0x3a1550, 0x1a0a2e];

    for (let i = 0; i < 30; i++) {
        const height = 8 + Math.random() * 25;
        const geo = new THREE.BoxGeometry(5, height, 5);
        const mat = new THREE.MeshStandardMaterial({
            color: nearColors[i % 3], metalness: 0.4, roughness: 0.7
        });
        const building = new THREE.Mesh(geo, mat);
        const side = i % 2 === 0 ? 1 : -1;
        building.position.set(
            -6 + side * (17 + Math.random() * 4),
            height / 2,
            -i * 12 - 10
        );
        building.castShadow = true;
        scene.add(building);

        const rows = Math.floor(height / 2.5);
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < 3; col++) {
                if (Math.random() > 0.6) continue;
                const winGeo = new THREE.PlaneGeometry(0.6, 0.6);
                const winMat = new THREE.MeshBasicMaterial({
                    color: Math.random() > 0.5 ? 0xff2020 : 0xff0060
                });
                const win = new THREE.Mesh(winGeo, winMat);
                win.position.set(
                    building.position.x + (col - 1) * 1.2,
                    1.5 + row * 2.5,
                    building.position.z + side * 2.51
                );
                if (side === 1) win.rotation.y = Math.PI;
                scene.add(win);
            }
        }
    }
}

/* ============================================
   ROAD
   ============================================ */
function createRoad() {
    const roadGeo = new THREE.PlaneGeometry(12, 300);
    const roadMat = new THREE.MeshStandardMaterial({
        color: 0x1a1525, metalness: 0.4, roughness: 0.85
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(-6, 0.01, -100);
    road.receiveShadow = true;
    scene.add(road);

    for (let lane = 0; lane < 3; lane++) {
        for (let i = 0; i < 60; i++) {
            const lineGeo = new THREE.PlaneGeometry(0.15, 2);
            const lineMat = new THREE.MeshBasicMaterial({ color: 0xff2020 });
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(LANE_POSITIONS[lane] - 1, 0.02, -i * 4 + 20);
            scene.add(line);
            if (!road.userData.lines) road.userData.lines = [];
            road.userData.lines.push(line);
        }
    }

    for (let i = 0; i < 60; i++) {
        const edgeGeo = new THREE.PlaneGeometry(0.2, 2);
        const edgeMat = new THREE.MeshBasicMaterial({ color: 0xff6000 });

        const edgeL = new THREE.Mesh(edgeGeo, edgeMat);
        edgeL.rotation.x = -Math.PI / 2;
        edgeL.position.set(-12, 0.02, -i * 4 + 20);
        scene.add(edgeL);

        const edgeR = new THREE.Mesh(edgeGeo, edgeMat);
        edgeR.rotation.x = -Math.PI / 2;
        edgeR.position.set(0, 0.02, -i * 4 + 20);
        scene.add(edgeR);

        if (!road.userData.lines) road.userData.lines = [];
        road.userData.lines.push(edgeL, edgeR);
    }

    scene.userData.road = road;
}

/* ============================================
   STREET LIGHTS
   ============================================ */
function createStreetLights() {
    for (let i = 0; i < 20; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const xPos = -6 + side * 13;

        const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 6, 8);
        const poleMat = new THREE.MeshStandardMaterial({
            color: 0x333333, metalness: 0.7, roughness: 0.4
        });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(xPos, 3, -i * 15 - 5);
        pole.castShadow = true;
        scene.add(pole);

        const headGeo = new THREE.SphereGeometry(0.3, 12, 12);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xff3030 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(xPos, 6, -i * 15 - 5);
        scene.add(head);

        const glowGeo = new THREE.SphereGeometry(0.8, 12, 12);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff2020, transparent: true, opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.copy(head.position);
        scene.add(glow);

        streetLights.push({ pole, head, glow, baseZ: -i * 15 - 5 });
    }
}

/* ============================================
   TREES
   ============================================ */
function createTrees() {
    for (let i = 0; i < 20; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const xPos = -6 + side * 15;
        const zPos = -i * 15 - 10;

        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: 0x3a1a0a, metalness: 0.1, roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(xPos, 1, zPos);
        trunk.castShadow = true;
        scene.add(trunk);

        const leafMat = new THREE.MeshStandardMaterial({
            color: 0x1a3a1a, metalness: 0.1, roughness: 0.9
        });

        const leaf1 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), leafMat);
        leaf1.position.set(xPos, 3, zPos);
        leaf1.castShadow = true;
        scene.add(leaf1);

        const leaf2 = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 12), leafMat);
        leaf2.position.set(xPos + 0.7, 2.8, zPos);
        scene.add(leaf2);

        const leaf3 = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 12), leafMat);
        leaf3.position.set(xPos - 0.7, 2.8, zPos);
        scene.add(leaf3);

        trees.push({ trunk, leaf1, leaf2, leaf3, baseZ: zPos });
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

    if (state.consecutiveDeaths >= 3) {
        ddaMode = 'Mercy';
    } else if (state.isStruggling) {
        ddaMode = 'Easy';
    } else if (state.isBored) {
        ddaMode = 'Challenge';
    } else if (state.isDoingWell && state.distance > 2000) {
        ddaMode = 'Hard';
    } else {
        ddaMode = 'Normal';
    }

    applyDDAMode(ddaMode);

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
            coinSpawnRate = 0.06;
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
            top: 115px;
            left: 10px;
            padding: 5px 12px;
            background: rgba(13,43,78,0.85);
            border: 2px solid #ff2020;
            border-radius: 20px;
            color: #eaf4fb;
            font-size: 11px;
            font-weight: bold;
            z-index: 10;
            backdrop-filter: blur(10px);
            animation: pulse 2s infinite;
        `;
        document.getElementById('game-container').appendChild(el);
    }

    const modeColors = {
        'Mercy': '#2ecc71',
        'Easy': '#3498db',
        'Normal': '#ff2020',
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
   BUG FIX: CLEAN SCENE COMPLETELY
   Removes all obstacles, coins, particles
   ============================================ */
function cleanupGameObjects() {
    // Remove and dispose all obstacles
    obstacles.forEach(o => {
        scene.remove(o);
        o.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    });

    // Remove and dispose all coins
    coinObjects.forEach(c => {
        scene.remove(c);
        c.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    });

    // Remove and dispose all particles
    particles.forEach(p => {
        scene.remove(p);
        if (p.geometry) p.geometry.dispose();
        if (p.material) p.material.dispose();
    });

    // Clear arrays
    obstacles = [];
    coinObjects = [];
    particles = [];

    // Remove old hero
    if (hero && hero.group) {
        scene.remove(hero.group);
        hero.group.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
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

    hero.update(effectiveSpeed);

    const targetCamX = hero.group.position.x;
    camera.position.x += (targetCamX - camera.position.x) * 0.08;
    camera.lookAt(hero.group.position.x, 1.2, -20);

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

    evaluateDDA();

    if (Math.random() < obstacleSpawnRate) spawnObstacle();
    if (Math.random() < coinSpawnRate) spawnCoin();

    updateObstacles(effectiveSpeed);
    updateCoins(effectiveSpeed);
    updateParticles();

    streetLights.forEach(light => {
        light.pole.position.z += effectiveSpeed * 0.15;
        light.head.position.z += effectiveSpeed * 0.15;
        light.glow.position.z += effectiveSpeed * 0.15;
        if (light.pole.position.z > 20) {
            light.pole.position.z = -250;
            light.head.position.z = -250;
            light.glow.position.z = -250;
        }
    });

    trees.forEach(tree => {
        tree.trunk.position.z += effectiveSpeed * 0.15;
        tree.leaf1.position.z += effectiveSpeed * 0.15;
        tree.leaf2.position.z += effectiveSpeed * 0.15;
        tree.leaf3.position.z += effectiveSpeed * 0.15;
        if (tree.trunk.position.z > 20) {
            tree.trunk.position.z = -250;
            tree.leaf1.position.z = -250;
            tree.leaf2.position.z = -250;
            tree.leaf3.position.z = -250;
        }
    });

    roadOffset = (roadOffset + effectiveSpeed * 0.1) % 4;
    const road = scene.userData.road;
    if (road && road.userData.lines) {
        road.userData.lines.forEach((line, i) => {
            line.position.z = -i * 4 + 20 + (roadOffset * 10) % 4;
            if (line.position.z > 20) line.position.z -= 240;
        });
    }

    renderer.render(scene, camera);
}

/* ============================================
   OBSTACLES - City themed
   ============================================ */
function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    if (lane === currentLane && Math.random() < 0.5) return;

    const type = Math.floor(Math.random() * 5);
    let obstacle;

    switch (type) {
        case 0: obstacle = createTrashCan(); break;
        case 1: obstacle = createBarrier(); break;
        case 2: obstacle = createTrafficCone(); break;
        case 3: obstacle = createFireHydrant(); break;
        case 4: obstacle = createCar(); break;
        default: obstacle = createBarrier();
    }

    obstacle.position.x = LANE_POSITIONS[lane];
    obstacle.position.z = -80;
    obstacle.userData.lane = lane;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function createTrashCan() {
    const group = new THREE.Group();

    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.35, 1.2, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a, metalness: 0.7, roughness: 0.4
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);

    const lidGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 12);
    const lidMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a, metalness: 0.8, roughness: 0.3
    });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 1.25;
    group.add(lid);

    for (let i = 0; i < 3; i++) {
        const ridgeGeo = new THREE.TorusGeometry(0.42, 0.03, 6, 12);
        const ridgeMat = new THREE.MeshStandardMaterial({
            color: 0x555555, metalness: 0.9, roughness: 0.2
        });
        const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
        ridge.rotation.x = Math.PI / 2;
        ridge.position.y = 0.3 + i * 0.3;
        group.add(ridge);
    }

    return group;
}

function createBarrier() {
    const group = new THREE.Group();

    const barGeo = new THREE.BoxGeometry(1.8, 0.3, 0.2);
    const barMat = new THREE.MeshStandardMaterial({
        color: 0xffcc00, metalness: 0.3, roughness: 0.6
    });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.y = 0.9;
    bar.castShadow = true;
    group.add(bar);

    for (let i = 0; i < 3; i++) {
        const stripeGeo = new THREE.BoxGeometry(0.3, 0.31, 0.21);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(-0.6 + i * 0.6, 0.9, 0);
        group.add(stripe);
    }

    const legGeo = new THREE.BoxGeometry(0.15, 1, 0.15);
    const legMat = new THREE.MeshStandardMaterial({
        color: 0xffcc00, metalness: 0.3, roughness: 0.6
    });

    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.8, 0.5, 0);
    legL.castShadow = true;
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.8, 0.5, 0);
    legR.castShadow = true;
    group.add(legR);

    return group;
}

function createTrafficCone() {
    const group = new THREE.Group();

    const coneGeo = new THREE.ConeGeometry(0.35, 1, 12);
    const coneMat = new THREE.MeshStandardMaterial({
        color: 0xff5500, metalness: 0.2, roughness: 0.7
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 0.5;
    cone.castShadow = true;
    group.add(cone);

    const stripeGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.15, 12);
    const stripeMat = new THREE.MeshStandardMaterial({
        color: 0xffffff, metalness: 0.3, roughness: 0.6
    });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 0.5;
    group.add(stripe);

    const baseGeo = new THREE.BoxGeometry(0.8, 0.1, 0.8);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0xff5500, metalness: 0.2, roughness: 0.7
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.05;
    base.castShadow = true;
    group.add(base);

    return group;
}

function createFireHydrant() {
    const group = new THREE.Group();

    const redMat = new THREE.MeshStandardMaterial({
        color: 0xcc0000, metalness: 0.6, roughness: 0.4
    });

    const bodyGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.9, 12);
    const body = new THREE.Mesh(bodyGeo, redMat);
    body.position.y = 0.45;
    body.castShadow = true;
    group.add(body);

    const domeGeo = new THREE.SphereGeometry(0.28, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, redMat);
    dome.position.y = 0.9;
    group.add(dome);

    const nozzleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
    const nozzleL = new THREE.Mesh(nozzleGeo, redMat);
    nozzleL.rotation.z = Math.PI / 2;
    nozzleL.position.set(-0.28, 0.6, 0);
    group.add(nozzleL);

    const nozzleR = new THREE.Mesh(nozzleGeo, redMat);
    nozzleR.rotation.z = Math.PI / 2;
    nozzleR.position.set(0.28, 0.6, 0);
    group.add(nozzleR);

    const capGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 8);
    const cap = new THREE.Mesh(capGeo, redMat);
    cap.position.y = 1.05;
    group.add(cap);

    return group;
}

function createCar() {
    const group = new THREE.Group();

    const colors = [0xcc2222, 0x2266cc, 0xccaa22, 0x22aa44];
    const carColor = colors[Math.floor(Math.random() * colors.length)];

    const carMat = new THREE.MeshStandardMaterial({
        color: carColor, metalness: 0.7, roughness: 0.3
    });

    const bodyGeo = new THREE.BoxGeometry(1.6, 0.6, 2.8);
    const body = new THREE.Mesh(bodyGeo, carMat);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    const cabinGeo = new THREE.BoxGeometry(1.4, 0.5, 1.4);
    const cabinMat = new THREE.MeshStandardMaterial({
        color: 0x111111, metalness: 0.9, roughness: 0.1
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0,
