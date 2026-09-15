/* ============================================
   3D GAME ENGINE + CITY BACKGROUND + CITY OBSTACLES
   Full replacement file
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

    // ============================================
    // CITY SKY - Purple/pink night sky gradient
    // ============================================
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

    // ============================================
    // LIGHTING - Night city mood
    // ============================================
    const ambientLight = new THREE.AmbientLight(0x6060b0, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa080ff, 0.8);
    dirLight.position.set(10, 20, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Neon glow from city
    const cityGlow = new THREE.PointLight(0xff00ff, 0.6, 80);
    cityGlow.position.set(-6, 15, -40);
    scene.add(cityGlow);

    // Hero area light
    const heroLight = new THREE.PointLight(0x00b8b8, 1, 30);
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
   DISTANT STARS (in sky)
   ============================================ */
function createSky() {
    // Stars
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

    // Moon
    const moonGeo = new THREE.SphereGeometry(6, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe8d8ff });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(25, 40, -120);
    scene.add(moon);

    // Moon glow
    const glowGeo = new THREE.SphereGeometry(8, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xa080ff, transparent: true, opacity: 0.15
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(moon.position);
    scene.add(glow);
}

/* ============================================
   GROUND (moving sidewalk/grass)
   ============================================ */
function createGround() {
    // Main ground
    const groundGeo = new THREE.PlaneGeometry(200, 300);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x1a1030,
        metalness: 0.1,
        roughness: 0.95
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(-6, -0.05, -100);
    ground.receiveShadow = true;
    scene.add(ground);

    // Sidewalks (left and right)
    const sidewalkMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a5a, metalness: 0.2, roughness: 0.9
    });

    const sidewalkL = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 300),
        sidewalkMat
    );
    sidewalkL.rotation.x = -Math.PI / 2;
    sidewalkL.position.set(-11, 0, -100);
    scene.add(sidewalkL);

    const sidewalkR = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 300),
        sidewalkMat
    );
    sidewalkR.rotation.x = -Math.PI / 2;
    sidewalkR.position.set(-1, 0, -100);
    scene.add(sidewalkR);

    // Sidewalk edge lines (neon)
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
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
   CITY SKYLINE (distant buildings in background)
   ============================================ */
function createCitySkyline() {
    // Distant skyline (far background)
    const distantColors = [0x1a0a2e, 0x2a1040, 0x3a1550];

    for (let i = 0; i < 40; i++) {
        const height = 15 + Math.random() * 40;
        const width = 3 + Math.random() * 4;
        const geo = new THREE.BoxGeometry(width, height, width);
        const mat = new THREE.MeshBasicMaterial({
            color: distantColors[i % 3]
        });
        const building = new THREE.Mesh(geo, mat);
        building.position.set(
            (Math.random() - 0.5) * 200,
            height / 2,
            -180 - Math.random() * 40
        );
        scene.add(building);

        // Lit windows
        const winCount = Math.floor(height / 3);
        for (let w = 0; w < winCount; w++) {
            if (Math.random() > 0.5) continue;
            const winGeo = new THREE.PlaneGeometry(0.5, 0.5);
            const winMat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xffaa00 : 0xff00ff
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

    // Near buildings (left and right of road)
    const nearColors = [0x2a1040, 0x3a1550, 0x1a0a2e];

    for (let i = 0; i < 30; i++) {
        const height = 8 + Math.random() * 25;
        const geo = new THREE.BoxGeometry(5, height, 5);
        const mat = new THREE.MeshStandardMaterial({
            color: nearColors[i % 3],
            metalness: 0.4,
            roughness: 0.7
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

        // Windows
        const rows = Math.floor(height / 2.5);
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < 3; col++) {
                if (Math.random() > 0.6) continue;
                const winGeo = new THREE.PlaneGeometry(0.6, 0.6);
                const winMat = new THREE.MeshBasicMaterial({
                    color: Math.random() > 0.5 ? 0xffcc00 : 0x00ccff
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
   ROAD (asphalt with lane markings)
   ============================================ */
function createRoad() {
    const roadGeo = new THREE.PlaneGeometry(12, 300);
    const roadMat = new THREE.MeshStandardMaterial({
        color: 0x252535, metalness: 0.4, roughness: 0.85
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(-6, 0.01, -100);
    road.receiveShadow = true;
    scene.add(road);

    // Lane dividers (dashed white)
    for (let lane = 0; lane < 3; lane++) {
        for (let i = 0; i < 60; i++) {
            const lineGeo = new THREE.PlaneGeometry(0.15, 2);
            const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(LANE_POSITIONS[lane] - 1, 0.02, -i * 4 + 20);
            scene.add(line);
            if (!road.userData.lines) road.userData.lines = [];
            road.userData.lines.push(line);
        }
    }

    // Yellow edge lines
    for (let i = 0; i < 60; i++) {
        const edgeGeo = new THREE.PlaneGeometry(0.2, 2);
        const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

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
   STREET LIGHTS (on sidewalks)
   ============================================ */
function createStreetLights() {
    for (let i = 0; i < 20; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const xPos = -6 + side * 13;

        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 6, 8);
        const poleMat = new THREE.MeshStandardMaterial({
            color: 0x555555, metalness: 0.7, roughness: 0.4
        });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(xPos, 3, -i * 15 - 5);
        pole.castShadow = true;
        scene.add(pole);

        // Light head
        const headGeo = new THREE.SphereGeometry(0.3, 12, 12);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xffdd66 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(xPos, 6, -i * 15 - 5);
        scene.add(head);

        // Glow sphere
        const glowGeo = new THREE.SphereGeometry(0.8, 12, 12);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffaa33, transparent: true, opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.copy(head.position);
        scene.add(glow);

        streetLights.push({ pole, head, glow, baseZ: -i * 15 - 5 });
    }
}

/* ============================================
   TREES (on sidewalks)
   ============================================ */
function createTrees() {
    for (let i = 0; i < 20; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const xPos = -6 + side * 15;
        const zPos = -i * 15 - 10;

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: 0x4a2a1a, metalness: 0.1, roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(xPos, 1, zPos);
        trunk.castShadow = true;
        scene.add(trunk);

        // Leaves (3 spheres)
        const leafMat = new THREE.MeshStandardMaterial({
            color: 0x2a6a3a, metalness: 0.1, roughness: 0.9
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
            border: 2px solid #00b8b8;
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

    // Camera follows hero smoothly
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

    // Move street lights
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

    // Move trees
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

    // Move road markings
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
   OBSTACLES - City themed (not boxes)
   ============================================ */
function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    if (lane === currentLane && Math.random() < 0.5) return;

    const type = Math.floor(Math.random() * 5);
    let obstacle;

    switch (type) {
        case 0:
            obstacle = createTrashCan();
            break;
        case 1:
            obstacle = createBarrier();
            break;
        case 2:
            obstacle = createTrafficCone();
            break;
        case 3:
            obstacle = createFireHydrant();
            break;
        case 4:
            obstacle = createCar();
            break;
        default:
            obstacle = createBarrier();
    }

    obstacle.position.x = LANE_POSITIONS[lane];
    obstacle.position.z = -80;
    obstacle.userData.lane = lane;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

/* ============================================
   TRASH CAN (metal bin)
   ============================================ */
function createTrashCan() {
    const group = new THREE.Group();

    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.35, 1.2, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a, metalness: 0.7, roughness: 0.4
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);

    // Lid
    const lidGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 12);
    const lidMat = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a, metalness: 0.8, roughness: 0.3
    });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 1.25;
    group.add(lid);

    // Ridges
    for (let i = 0; i < 3; i++) {
        const ridgeGeo = new THREE.TorusGeometry(0.42, 0.03, 6, 12);
        const ridgeMat = new THREE.MeshStandardMaterial({
            color: 0x666666, metalness: 0.9, roughness: 0.2
        });
        const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
        ridge.rotation.x = Math.PI / 2;
        ridge.position.y = 0.3 + i * 0.3;
        group.add(ridge);
    }

    group.position.y = 0;
    return group;
}

/* ============================================
   CONSTRUCTION BARRIER
   ============================================ */
function createBarrier() {
    const group = new THREE.Group();

    // Yellow/black striped bar
    const barGeo = new THREE.BoxGeometry(1.8, 0.3, 0.2);
    const barMat = new THREE.MeshStandardMaterial({
        color: 0xffcc00, metalness: 0.3, roughness: 0.6
    });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.y = 0.9;
    bar.castShadow = true;
    group.add(bar);

    // Black stripes
    for (let i = 0; i < 3; i++) {
        const stripeGeo = new THREE.BoxGeometry(0.3, 0.31, 0.21);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(-0.6 + i * 0.6, 0.9, 0);
        group.add(stripe);
    }

    // Legs
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

/* ============================================
   TRAFFIC CONE
   ============================================ */
function createTrafficCone() {
    const group = new THREE.Group();

    // Orange cone
    const coneGeo = new THREE.ConeGeometry(0.35, 1, 12);
    const coneMat = new THREE.MeshStandardMaterial({
        color: 0xff5500, metalness: 0.2, roughness: 0.7
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 0.5;
    cone.castShadow = true;
    group.add(cone);

    // White stripe
    const stripeGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.15, 12);
    const stripeMat = new THREE.MeshStandardMaterial({
        color: 0xffffff, metalness: 0.3, roughness: 0.6
    });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 0.5;
    group.add(stripe);

    // Base
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

/* ============================================
   FIRE HYDRANT
   ============================================ */
function createFireHydrant() {
    const group = new THREE.Group();

    const redMat = new THREE.MeshStandardMaterial({
        color: 0xcc0000, metalness: 0.6, roughness: 0.4
    });

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.9, 12);
    const body = new THREE.Mesh(bodyGeo, redMat);
    body.position.y = 0.45;
    body.castShadow = true;
    group.add(body);

    // Top dome
    const domeGeo = new THREE.SphereGeometry(0.28, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, redMat);
    dome.position.y = 0.9;
    group.add(dome);

    // Side nozzles
    const nozzleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
    const nozzleL = new THREE.Mesh(nozzleGeo, redMat);
    nozzleL.rotation.z = Math.PI / 2;
    nozzleL.position.set(-0.28, 0.6, 0);
    group.add(nozzleL);

    const nozzleR = new THREE.Mesh(nozzleGeo, redMat);
    nozzleR.rotation.z = Math.PI / 2;
    nozzleR.position.set(0.28, 0.6, 0);
    group.add(nozzleR);

    // Top cap
    const capGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 8);
    const cap = new THREE.Mesh(capGeo, redMat);
    cap.position.y = 1.05;
    group.add(cap);

    return group;
}

/* ============================================
   CAR (small sedan)
   ============================================ */
function createCar() {
    const group = new THREE.Group();

    const colors = [0xcc2222, 0x2266cc, 0xccaa22, 0x22aa44];
    const carColor = colors[Math.floor(Math.random() * colors.length)];

    const carMat = new THREE.MeshStandardMaterial({
        color: carColor, metalness: 0.7, roughness: 0.3
    });

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.6, 2.8);
    const body = new THREE.Mesh(bodyGeo, carMat);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.5, 1.4);
    const cabinMat = new THREE.MeshStandardMaterial({
        color: 0x222222, metalness: 0.9, roughness: 0.1
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.05, -0.1);
    cabin.castShadow = true;
    group.add(cabin);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 12);
    const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x111111, metalness: 0.5, roughness: 0.7
    });

    const wheelPositions = [
        [-0.85, 0.25, 1], [0.85, 0.25, 1],
        [-0.85, 0.25, -1], [0.85, 0.25, -1]
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos[0], pos[1], pos[2]);
        group.add(wheel);
    });

    // Headlights
    const lightGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });

    const lightL = new THREE.Mesh(lightGeo, lightMat);
    lightL.position.set(-0.5, 0.5, 1.41);
    group.add(lightL);

    const lightR = new THREE.Mesh(lightGeo, lightMat);
    lightR.position.set(0.5, 0.5, 1.41);
    group.add(lightR);

    return group;
}

function spawnCoin() {
    const lane = Math.floor(Math.random() * 3);
    const geo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xF1C40F, metalness: 0.8, roughness: 0.2,
        emissive: 0xF1C40F, emissiveIntensity: 0.3
    });
    const coin = new THREE.Mesh(geo, mat);
    coin.position.set(LANE_POSITIONS[lane], 1 + Math.random() * 2, -80);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    scene.add(coin);
    coinObjects.push(coin);
}

function updateObstacles(speed) {
    obstacles = obstacles.filter(o => {
        o.position.z += speed * 0.15;

        if (Math.abs(o.position.z - hero.group.position.z) < 1.2 &&
            Math.abs(o.position.x - hero.group.position.x) < 1.2 &&
            hero.y < 1.5) {
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

        if (o.position.z > 15) {
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
        if (c.position.z > 15) {
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

    camera.position.x = LANE_POSITIONS[1];
    camera.lookAt(LANE_POSITIONS[1], 1.2, -20);

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
