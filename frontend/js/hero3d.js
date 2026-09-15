/* ============================================
   ITACHI MODEL - Smaller, Realistic Run, Arms Visible
   Full replacement file
   ============================================ */
class Hero3D {
    constructor(scene) {
        this.scene = scene;
        this.createModel();
        this.reset();
    }

    createModel() {
        this.group = new THREE.Group();

        // ============================================
        // GROUP CONTAINER - Whole body (for scaling)
        // ============================================
        this.body = new THREE.Group();
        this.body.scale.setScalar(0.72); // Make Itachi smaller
        this.group.add(this.body);

        // ============================================
        // CLOAK (long black robe - Akatsuki)
        // ============================================
        const cloakGeo = new THREE.CylinderGeometry(0.5, 1.0, 2.3, 12);
        const cloakMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            metalness: 0.3,
            roughness: 0.9
        });
        this.cloak = new THREE.Mesh(cloakGeo, cloakMat);
        this.cloak.position.y = 0.5;
        this.cloak.castShadow = true;
        this.body.add(this.cloak);

        // High collar
        const collarGeo = new THREE.CylinderGeometry(0.55, 0.5, 0.55, 12, 1, true);
        const collarMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            metalness: 0.3,
            roughness: 0.9,
            side: THREE.DoubleSide
        });
        this.collar = new THREE.Mesh(collarGeo, collarMat);
        this.collar.position.y = 1.65;
        this.body.add(this.collar);

        // ============================================
        // RED CLOUD PATTERNS
        // ============================================
        const cloudMat = new THREE.MeshStandardMaterial({
            color: 0xb8232a,
            metalness: 0.1,
            roughness: 0.8
        });

        const cloud1 = this.createCloud(cloudMat);
        cloud1.position.set(0, 1.05, 0.51);
        cloud1.scale.setScalar(0.45);
        this.body.add(cloud1);

        const cloud2 = this.createCloud(cloudMat);
        cloud2.position.set(-0.35, 0.15, 0.85);
        cloud2.scale.setScalar(0.5);
        cloud2.rotation.z = 0.3;
        this.body.add(cloud2);

        const cloud3 = this.createCloud(cloudMat);
        cloud3.position.set(0.4, 0.45, 0.8);
        cloud3.scale.setScalar(0.42);
        cloud3.rotation.z = -0.4;
        this.body.add(cloud3);

        // ============================================
        // HEAD
        // ============================================
        const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xf0c9a0,
            metalness: 0.1,
            roughness: 0.9
        });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.position.y = 1.9;
        this.head.castShadow = true;
        this.body.add(this.head);

        // Hair (dark, spiky)
        const hairGeo = new THREE.SphereGeometry(0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const hairMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.2,
            roughness: 0.8
        });
        this.hair = new THREE.Mesh(hairGeo, hairMat);
        this.hair.position.y = 1.92;
        this.body.add(this.hair);

        // Hair spikes (back)
        for (let i = 0; i < 5; i++) {
            const spikeGeo = new THREE.ConeGeometry(0.055, 0.3, 6);
            const spike = new THREE.Mesh(spikeGeo, hairMat);
            spike.position.set(
                (i - 2) * 0.09,
                1.85 + Math.random() * 0.05,
                -0.22
            );
            spike.rotation.x = -0.6 - Math.random() * 0.2;
            this.body.add(spike);
        }

        // Bangs (front hair strands)
        for (let i = 0; i < 3; i++) {
            const bangGeo = new THREE.ConeGeometry(0.04, 0.22, 6);
            const bang = new THREE.Mesh(bangGeo, hairMat);
            bang.position.set(
                (i - 1) * 0.12,
                1.78,
                0.25
            );
            bang.rotation.x = Math.PI;
            this.body.add(bang);
        }

        // Eyes (red)
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x8b0000 });

        const leftEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 8, 8),
            eyeMat
        );
        leftEye.position.set(-0.09, 1.92, 0.28);
        this.body.add(leftEye);

        const rightEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 8, 8),
            eyeMat
        );
        rightEye.position.set(0.09, 1.92, 0.28);
        this.body.add(rightEye);

        // ============================================
        // ARMS (VISIBLE - swing with running)
        // ============================================
        const sleeveMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            metalness: 0.3,
            roughness: 0.9
        });

        // Left arm (upper + lower)
        this.leftArmGroup = new THREE.Group();
        this.leftArmGroup.position.set(-0.6, 1.4, 0);
        this.body.add(this.leftArmGroup);

        const leftUpperArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.13, 0.7, 8),
            sleeveMat
        );
        leftUpperArm.position.y = -0.35;
        leftUpperArm.castShadow = true;
        this.leftArmGroup.add(leftUpperArm);

        // Left hand (skin tone)
        const leftHand = new THREE.Mesh(
            new THREE.SphereGeometry(0.11, 10, 10),
            headMat
        );
        leftHand.position.y = -0.75;
        this.leftArmGroup.add(leftHand);

        // Right arm (upper + lower)
        this.rightArmGroup = new THREE.Group();
        this.rightArmGroup.position.set(0.6, 1.4, 0);
        this.body.add(this.rightArmGroup);

        const rightUpperArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.13, 0.7, 8),
            sleeveMat
        );
        rightUpperArm.position.y = -0.35;
        rightUpperArm.castShadow = true;
        this.rightArmGroup.add(rightUpperArm);

        // Right hand
        const rightHand = new THREE.Mesh(
            new THREE.SphereGeometry(0.11, 10, 10),
            headMat
        );
        rightHand.position.y = -0.75;
        this.rightArmGroup.add(rightHand);

        // ============================================
        // LEGS (VISIBLE - realistic front/back running)
        // ============================================
        const pantMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            metalness: 0.2,
            roughness: 0.9
        });

        const shoeMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.5,
            roughness: 0.5
        });

        // Left leg (thigh + shin + foot)
        this.leftLegGroup = new THREE.Group();
        this.leftLegGroup.position.set(-0.22, 0.5, 0);
        this.body.add(this.leftLegGroup);

        const leftThigh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.12, 0.65, 8),
            pantMat
        );
        leftThigh.position.y = -0.32;
        leftThigh.castShadow = true;
        this.leftLegGroup.add(leftThigh);

        // Left foot/shoe
        const leftFoot = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.14, 0.35),
            shoeMat
        );
        leftFoot.position.set(0, -0.68, 0.05);
        leftFoot.castShadow = true;
        this.leftLegGroup.add(leftFoot);

        // Right leg
        this.rightLegGroup = new THREE.Group();
        this.rightLegGroup.position.set(0.22, 0.5, 0);
        this.body.add(this.rightLegGroup);

        const rightThigh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.12, 0.65, 8),
            pantMat
        );
        rightThigh.position.y = -0.32;
        rightThigh.castShadow = true;
        this.rightLegGroup.add(rightThigh);

        // Right foot/shoe
        const rightFoot = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.14, 0.35),
            shoeMat
        );
        rightFoot.position.set(0, -0.68, 0.05);
        rightFoot.castShadow = true;
        this.rightLegGroup.add(rightFoot);

        // ============================================
        // POWER AURA
        // ============================================
        const auraGeo = new THREE.SphereGeometry(1.3, 32, 32);
        const auraMat = new THREE.MeshBasicMaterial({
            color: 0xF1C40F,
            transparent: true,
            opacity: 0,
            wireframe: true
        });
        this.aura = new THREE.Mesh(auraGeo, auraMat);
        this.aura.position.y = 0.6;
        this.body.add(this.aura);

        this.group.position.set(-6, 0, 0);
        this.scene.add(this.group);
    }

    createCloud(material) {
        const cloudGroup = new THREE.Group();

        const main = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            material
        );
        cloudGroup.add(main);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.32, 0.05, 6, 16),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.1,
                roughness: 0.8
            })
        );
        cloudGroup.add(ring);

        const positions = [
            [0.25, 0.15, 0],
            [-0.25, 0.15, 0],
            [0.2, -0.2, 0],
            [-0.2, -0.2, 0]
        ];

        positions.forEach(pos => {
            const bump = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 8, 8),
                material
            );
            bump.position.set(pos[0], pos[1], pos[2]);
            cloudGroup.add(bump);
        });

        return cloudGroup;
    }

    reset() {
        this.x = -6;
        this.y = 0;
        this.velocityY = 0;
        this.gravity = -0.018;
        this.jumpPower = 0.32;
        this.isJumping = false;
        this.isSliding = false;
        this.isInvincible = false;
        this.hasShield = false;
        this.canDestroyObstacles = false;

        this.powers = [];
        this.activePower = null;
        this.powerTimer = 0;
        this.powerDuration = 300;
        this.runCycle = 0;

        this.distance = 0;
        this.score = 0;
        this.coins = 0;

        if (this.group) {
            this.group.position.set(-6, 0, 0);
            this.group.rotation.set(0, 0, 0);
            this.body.scale.setScalar(0.72);
            this.aura.material.opacity = 0;
        }
    }

    jump() {
        if (!this.isJumping && !this.isSliding) {
            this.velocityY = this.jumpPower;
            this.isJumping = true;
        }
    }

    slide() {
        if (!this.isSliding && !this.isJumping) {
            this.isSliding = true;
            this.body.scale.y = 0.4;
            setTimeout(() => {
                this.isSliding = false;
                this.body.scale.y = 0.72;
            }, 500);
        }
    }

    update(gameSpeed) {
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        if (this.y <= 0) {
            this.y = 0;
            this.velocityY = 0;
            this.isJumping = false;
        }

        this.group.position.y = this.y;
        this.distance += gameSpeed;

        // ============================================
        // REALISTIC RUNNING ANIMATION
        // Legs kick front/back, arms swing opposite
        // ============================================
        this.runCycle += 0.15; // Speed of run animation

        const runAmplitude = 0.8; // How far legs swing
        const armAmplitude = 0.5; // Arms swing less than legs

        // LEGS - realistic front/back kick
        // Front kick = negative rotation (leg forward)
        // Back kick = positive rotation (leg backward)
        this.leftLegGroup.rotation.x = Math.sin(this.runCycle) * runAmplitude;
        this.rightLegGroup.rotation.x = Math.sin(this.runCycle + Math.PI) * runAmplitude;

        // ARMS - opposite to legs (natural running form)
        this.leftArmGroup.rotation.x = Math.sin(this.runCycle + Math.PI) * armAmplitude;
        this.rightArmGroup.rotation.x = Math.sin(this.runCycle) * armAmplitude;

        // Subtle arm sway (in/out)
        this.leftArmGroup.rotation.z = 0.1 + Math.sin(this.runCycle * 0.5) * 0.05;
        this.rightArmGroup.rotation.z = -0.1 - Math.sin(this.runCycle * 0.5) * 0.05;

        // Slight body bounce
        this.body.position.y = Math.abs(Math.sin(this.runCycle)) * 0.05;

        // Slight body lean forward
        this.body.rotation.x = 0.08;

        // Head bob (very subtle)
        this.head.rotation.z = Math.sin(this.runCycle * 0.5) * 0.03;

        // Cloak sway
        this.cloak.rotation.z = Math.sin(this.runCycle * 0.5) * 0.04;

        // Hair float
        this.hair.position.y = 1.92 + Math.sin(Date.now() * 0.003) * 0.015;

        // Power aura
        if (this.activePower) {
            this.powerTimer--;
            if (this.powerTimer <= 0) {
                this.deactivatePower();
            } else {
                this.aura.material.opacity = 0.25 + Math.sin(Date.now() * 0.01) * 0.15;
                this.aura.rotation.y += 0.03;
            }
        }

        this.checkPowerUnlocks();
    }

    checkPowerUnlocks() {
        const milestones = [
            { distance: 500, power: 'super_speed' },
            { distance: 1000, power: 'force_field' },
            { distance: 1500, power: 'fire_dash' },
            { distance: 2000, power: 'ice_time' },
            { distance: 3000, power: 'lightning_storm' },
            { distance: 5000, power: 'hero_mode' }
        ];

        milestones.forEach(m => {
            if (this.distance >= m.distance && !this.powers.includes(m.power)) {
                this.unlockPower(m.power);
            }
        });
    }

    unlockPower(power) {
        this.powers.push(power);
        if (typeof showPowerUnlockNotification === 'function') {
            showPowerUnlockNotification(power);
        }
        if (typeof tracker !== 'undefined' && tracker) {
            tracker.trackPowerUnlock(power, this.distance);
        }
    }

    activatePower(power) {
        if (!this.powers.includes(power) || this.activePower) return false;
        this.activePower = power;
        this.powerTimer = this.powerDuration;
        if (typeof applyPowerEffect === 'function') applyPowerEffect(power);
        if (typeof tracker !== 'undefined' && tracker) tracker.trackPowerUsage(power);
        return true;
    }

    deactivatePower() {
        if (typeof removePowerEffect === 'function') removePowerEffect(this.activePower);
        this.activePower = null;
        this.powerTimer = 0;
        this.aura.material.opacity = 0;
    }
}
