/* ============================================
   ITACHI MODEL - Mobile Optimized
   Slimmer body, accurate Akatsuki cloak,
   visible arms/legs, realistic running
   ============================================ */
class Hero3D {
    constructor(scene) {
        this.scene = scene;
        this.createModel();
        this.reset();
    }

    createModel() {
        this.group = new THREE.Group();

        // Body group for scaling (mobile-friendly size)
        this.body = new THREE.Group();
        this.body.scale.setScalar(0.7);
        this.group.add(this.body);

        // ============================================
        // SHARED MATERIALS (created once for mobile perf)
        // ============================================
        const cloakMat = new THREE.MeshStandardMaterial({
            color: 0x0d0d0d,
            metalness: 0.35,
            roughness: 0.85
        });

        const redMat = new THREE.MeshStandardMaterial({
            color: 0xb8232a,
            metalness: 0.1,
            roughness: 0.8
        });

        const whiteMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.8
        });

        const skinMat = new THREE.MeshStandardMaterial({
            color: 0xf0c9a0,
            metalness: 0.1,
            roughness: 0.9
        });

        const hairMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.2,
            roughness: 0.8
        });

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.9,
            roughness: 0.2
        });

        // ============================================
        // CLOAK (tapered, slimmer, flairs at bottom)
        // ============================================
        const cloakGeo = new THREE.CylinderGeometry(0.42, 0.95, 2.3, 12);
        this.cloak = new THREE.Mesh(cloakGeo, cloakMat);
        this.cloak.position.y = 0.5;
        this.cloak.castShadow = true;
        this.body.add(this.cloak);

        // Red vertical zipper line (front of cloak)
        const zipperGeo = new THREE.BoxGeometry(0.05, 2.2, 0.02);
        const zipper = new THREE.Mesh(zipperGeo, redMat);
        zipper.position.set(0, 0.55, 0.48);
        this.body.add(zipper);

        // ============================================
        // HIGH COLLAR (with red inner lining)
        // ============================================
        const collarGeo = new THREE.CylinderGeometry(0.5, 0.45, 0.6, 12, 1, true);
        const collarMat = new THREE.MeshStandardMaterial({
            color: 0x0d0d0d,
            metalness: 0.3,
            roughness: 0.9,
            side: THREE.DoubleSide
        });
        this.collar = new THREE.Mesh(collarGeo, collarMat);
        this.collar.position.y = 1.7;
        this.body.add(this.collar);

        // Red inner collar lining
        const collarLiningGeo = new THREE.CylinderGeometry(0.48, 0.43, 0.58, 12, 1, true);
        const collarLining = new THREE.Mesh(collarLiningGeo, redMat);
        collarLining.position.y = 1.7;
        this.body.add(collarLining);

        // ============================================
        // AKATSUKI CLOUD PATTERNS
        // ============================================
        // Cloud 1 - chest
        const cloud1 = this.createCloud(redMat, whiteMat);
        cloud1.position.set(0, 1.05, 0.44);
        cloud1.scale.setScalar(0.5);
        this.body.add(cloud1);

        // Cloud 2 - lower left
        const cloud2 = this.createCloud(redMat, whiteMat);
        cloud2.position.set(-0.5, 0.05, 0.75);
        cloud2.scale.setScalar(0.55);
        cloud2.rotation.z = 0.3;
        this.body.add(cloud2);

        // Cloud 3 - lower right
        const cloud3 = this.createCloud(redMat, whiteMat);
        cloud3.position.set(0.5, 0.35, 0.72);
        cloud3.scale.setScalar(0.45);
        cloud3.rotation.z = -0.4;
        this.body.add(cloud3);

        // ============================================
        // HEAD (slimmer, positioned higher)
        // ============================================
        const headGeo = new THREE.SphereGeometry(0.28, 14, 14);
        this.head = new THREE.Mesh(headGeo, skinMat);
        this.head.position.y = 1.95;
        this.head.castShadow = true;
        this.body.add(this.head);

        // Hair cap
        const hairGeo = new THREE.SphereGeometry(0.3, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.65);
        this.hair = new THREE.Mesh(hairGeo, hairMat);
        this.hair.position.y = 1.97;
        this.body.add(this.hair);

        // Back hair (longer strands)
        for (let i = 0; i < 4; i++) {
            const strandGeo = new THREE.BoxGeometry(0.06, 0.4, 0.06);
            const strand = new THREE.Mesh(strandGeo, hairMat);
            strand.position.set(
                (i - 1.5) * 0.1,
                1.78,
                -0.26
            );
            strand.rotation.x = -0.3;
            this.body.add(strand);
        }

        // Front bangs (falling over face)
        for (let i = 0; i < 3; i++) {
            const bangGeo = new THREE.BoxGeometry(0.07, 0.25, 0.05);
            const bang = new THREE.Mesh(bangGeo, hairMat);
            bang.position.set(
                (i - 1) * 0.11,
                1.82,
                0.22
            );
            this.body.add(bang);
        }

        // Headband (metal plate)
        const headbandGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 14);
        const headband = new THREE.Mesh(headbandGeo, metalMat);
        headband.position.y = 1.98;
        headband.position.z = 0.02;
        this.body.add(headband);

        // Scratch mark on headband
        const scratchGeo = new THREE.BoxGeometry(0.02, 0.22, 0.02);
        const scratchMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const scratch = new THREE.Mesh(scratchGeo, scratchMat);
        scratch.position.set(0.08, 1.98, 0.28);
        scratch.rotation.z = 0.3;
        this.body.add(scratch);

        // Red eyes (Sharingan hint)
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x8b0000 });

        const leftEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.032, 8, 8),
            eyeMat
        );
        leftEye.position.set(-0.08, 1.94, 0.26);
        this.body.add(leftEye);

        const rightEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.032, 8, 8),
            eyeMat
        );
        rightEye.position.set(0.08, 1.94, 0.26);
        this.body.add(rightEye);

        // ============================================
        // ARMS (visible, swing with running)
        // ============================================
        // Left arm
        this.leftArmGroup = new THREE.Group();
        this.leftArmGroup.position.set(-0.55, 1.4, 0);
        this.body.add(this.leftArmGroup);

        const leftUpperArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.12, 0.65, 6),
            cloakMat
        );
        leftUpperArm.position.y = -0.32;
        leftUpperArm.castShadow = true;
        this.leftArmGroup.add(leftUpperArm);

        const leftHand = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            skinMat
        );
        leftHand.position.y = -0.7;
        this.leftArmGroup.add(leftHand);

        // Right arm
        this.rightArmGroup = new THREE.Group();
        this.rightArmGroup.position.set(0.55, 1.4, 0);
        this.body.add(this.rightArmGroup);

        const rightUpperArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.12, 0.65, 6),
            cloakMat
        );
        rightUpperArm.position.y = -0.32;
        rightUpperArm.castShadow = true;
        this.rightArmGroup.add(rightUpperArm);

        const rightHand = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            skinMat
        );
        rightHand.position.y = -0.7;
        this.rightArmGroup.add(rightHand);

        // ============================================
        // LEGS (visible below cloak)
        // ============================================
        const pantMat = new THREE.MeshStandardMaterial({
            color: 0xdedede,
            metalness: 0.1,
            roughness: 0.9
        });

        // Left leg
        this.leftLegGroup = new THREE.Group();
        this.leftLegGroup.position.set(-0.2, 0.45, 0);
        this.body.add(this.leftLegGroup);

        const leftThigh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.11, 0.6, 6),
            pantMat
        );
        leftThigh.position.y = -0.3;
        leftThigh.castShadow = true;
        this.leftLegGroup.add(leftThigh);

        // Left sandal (open toe)
        const leftSandal = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.1, 0.32),
            cloakMat
        );
        leftSandal.position.set(0, -0.62, 0.04);
        leftSandal.castShadow = true;
        this.leftLegGroup.add(leftSandal);

        // Right leg
        this.rightLegGroup = new THREE.Group();
        this.rightLegGroup.position.set(0.2, 0.45, 0);
        this.body.add(this.rightLegGroup);

        const rightThigh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.11, 0.6, 6),
            pantMat
        );
        rightThigh.position.y = -0.3;
        rightThigh.castShadow = true;
        this.rightLegGroup.add(rightThigh);

        // Right sandal
        const rightSandal = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.1, 0.32),
            cloakMat
        );
        rightSandal.position.set(0, -0.62, 0.04);
        rightSandal.castShadow = true;
        this.rightLegGroup.add(rightSandal);

        // ============================================
        // POWER AURA
        // ============================================
        const auraGeo = new THREE.SphereGeometry(1.2, 16, 16);
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

    /* ============================================
       AKATSUKI CLOUD (with white outline)
       ============================================ */
    createCloud(redMat, whiteMat) {
        const cloudGroup = new THREE.Group();

        // White outline (larger)
        const outline = new THREE.Mesh(
            new THREE.SphereGeometry(0.32, 8, 8),
            whiteMat
        );
        cloudGroup.add(outline);

        // Red main circle
        const main = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 8, 8),
            redMat
        );
        main.position.z = 0.02;
        cloudGroup.add(main);

        // Cloud bumps (with white outline effect)
        const positions = [
            [0.22, 0.18],
            [-0.22, 0.18],
            [0.18, -0.18],
            [-0.18, -0.18]
        ];

        positions.forEach(pos => {
            // White outline
            const bumpOutline = new THREE.Mesh(
                new THREE.SphereGeometry(0.14, 6, 6),
                whiteMat
            );
            bumpOutline.position.set(pos[0], pos[1], 0);
            cloudGroup.add(bumpOutline);

            // Red inner
            const bump = new THREE.Mesh(
                new THREE.SphereGeometry(0.11, 6, 6),
                redMat
            );
            bump.position.set(pos[0], pos[1], 0.02);
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
            this.body.scale.setScalar(0.7);
            this.body.position.y = 0;
            this.body.rotation.x = 0;
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
                this.body.scale.y = 0.7;
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
        // ============================================
        this.runCycle += 0.15;

        const runAmplitude = 0.85;
        const armAmplitude = 0.55;

        // Legs swing front/back
        this.leftLegGroup.rotation.x = Math.sin(this.runCycle) * runAmplitude;
        this.rightLegGroup.rotation.x = Math.sin(this.runCycle + Math.PI) * runAmplitude;

        // Arms swing opposite to legs
        this.leftArmGroup.rotation.x = Math.sin(this.runCycle + Math.PI) * armAmplitude;
        this.rightArmGroup.rotation.x = Math.sin(this.runCycle) * armAmplitude;

        // Arms sway in/out slightly
        this.leftArmGroup.rotation.z = 0.12 + Math.sin(this.runCycle * 0.5) * 0.05;
        this.rightArmGroup.rotation.z = -0.12 - Math.sin(this.runCycle * 0.5) * 0.05;

        // Subtle body bounce
        this.body.position.y = Math.abs(Math.sin(this.runCycle)) * 0.05;

        // Slight forward lean
        this.body.rotation.x = 0.08;

        // Head bob
        this.head.rotation.z = Math.sin(this.runCycle * 0.5) * 0.03;

        // Cloak sway
        this.cloak.rotation.z = Math.sin(this.runCycle * 0.5) * 0.04;

        // Hair float
        this.hair.position.y = 1.97 + Math.sin(Date.now() * 0.003) * 0.015;

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
