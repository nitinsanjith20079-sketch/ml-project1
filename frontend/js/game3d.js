/* ============================================
   3D GAME ENGINE - Mobile + Slower Speed
   ============================================ */
let scene, camera, renderer;
let currentLane = 1;
const LANE_POSITIONS = [-8, -6, -4];
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

// SLOWER game speed (was 5, now 2.5)
let gameSpeed = 2.5;
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

    if (Math.random() < 0.015) spawnObstacle();
    if (Math.random() < 0.03) spawnCoin();

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
        c.rotation.z
