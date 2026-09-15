/* ============================================
   AKATSUKI-STYLE HERO MODEL
   Dark cloaked ninja with red cloud pattern
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
        // CLOAK (long black robe)
        // ============================================
        const cloakGeo = new THREE.CylinderGeometry(0.55, 1.1, 2.4, 12);
        const cloakMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            metalness: 0.3,
            roughness: 0.9
        });
        this.cloak = new THREE.Mesh(cloakGeo, cloakMat);
        this.cloak.position.y = 0.5;
        this.cloak.castShadow = true;
        this.group.add(this.cloak);

        // High collar
        const collarGeo = new THREE.CylinderGeometry(0.6, 0.55, 0.6, 12, 1, true);
        const collarMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            metalness: 0.3,
            roughness: 0.9,
            side: THREE.DoubleSide
        });
        this.collar = new THREE.Mesh(collarGeo, collarMat);
        this.collar.position.y = 1.7;
        this.group.add(this.collar);

        // ============================================
        // RED CLOUD PATTERNS (Akatsuki symbol - simplified)
        // ============================================
        const cloudMat = new THREE.MeshStandardMaterial({
            color: 0xb8232a,
            metalness: 0.1,
            roughness: 0.8
        });

        // Cloud 1 - chest area
        const cloud1 = this.createCloud(cloudMat);
        cloud1.position.set(0, 1.1, 0.56);
        cloud1.scale.setScalar(0.5);
        this.group.add(cloud1);

        // Cloud 2 - lower robe
        const cloud2 = this.createCloud(cloudMat);
        cloud2.position.set(-0.4, 0.1, 0.9);
        cloud2.scale.setScalar(0.55);
        cloud2.rotation.z = 0.3;
        this.group.add(cloud2);

        // Cloud 3 - right side
        const cloud3 = this.createCloud(cloudMat);
        cloud3.position.set(0.45, 0.4, 0.85);
        cloud3.scale.setScalar(0.45);
        cloud3.rotation.z = -0.4;
        this.group.add(cloud3);

        // ============================================
        // HEAD
        // ============================================
        const headGeo = new THREE.SphereGeometry(0.32, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xf0c9a0,
            metalness: 0.1,
            roughness: 0.9
        });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.position.y = 1.95;
        this.head.castShadow = true;
        this.group.add(this.head);

        // Hair (dark, spiky)
        const hairGeo = new THREE.SphereGeometry(0.34, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const hairMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.2,
            roughness: 0.8
        });
        this.hair = new THREE.Mesh(hairGeo, hairMat);
        this.hair.position.y = 1.97;
        this.group.add(this.hair);

        // Hair spikes (back)
        for (let i = 0; i < 5; i++) {
            const spikeGeo = new THREE.ConeGeometry(0.06, 0.35, 6);
            const spike = new THREE.Mesh(spikeGeo, hairMat);
            spike.position.set(
                (i - 2) * 0.1,
                1.9 + Math.random() * 0.05,
                -0.25
            );
            spike.rotation.x = -0.6 - Math.random() * 0.2;
            this.group.add(spike);
        }

        // ============================================
        // EYES (visible under hair)
        // ============================================
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x8b0000 });

        const leftEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 8, 8),
            eyeMat
        );
        leftEye.position.set(-0.1, 1.96, 0.3);
        this.group.add(leftEye);

        const rightEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 8, 8),
            eyeMat
        );
        rightEye.position.set(0.1, 1.96, 0.3);
        this.group.add(rightEye);

        // ============================================
        // ARMS (hidden under cloak, small dark sleeves)
        // ============================================
        const sleeveGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.9, 8);
        const sleeveMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            metalness: 0.3,
            roughness: 0.9
        });

        this.leftArm = new THREE.Mesh(sleeveGeo, sleeveMat);
        this.leftArm.position.set(-0.7, 1.1, 0);
        this.leftArm.rotation.z = 0.3;
        this.group.add(this.leftArm);

        this.rightArm = new THREE.Mesh(sleeveGeo, sleeveMat);
        this.rightArm.position.set(0.7, 1.1, 0);
        this.rightArm.rotation.z = -0.3;
        this.group.add(this.rightArm);

        // ============================================
        // LEGS / FEET (visible below cloak)
        // ============================================
        const footGeo = new THREE.BoxGeometry(0.2, 0.2, 0.35);
        const footMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            metalness: 0.2,
            roughness: 0.9
        });

        this.leftLeg = new THREE.Mesh(footGeo, footMat);
        this.leftLeg.position.set(-0.25, -0.75, 0);
        this.group.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(footGeo, footMat);
        this.rightLeg.position.set(0.25, -0.75, 0);
        this.group.add(this.rightLeg);

        // ============================================
        // POWER AURA (invisible by default)
        // ============================================
        const auraGeo = new THREE.SphereGeometry(1.4, 32, 32);
        const auraMat = new THREE.MeshBasicMaterial({
            color: 0xF1C40F,
            transparent: true,
            opacity: 0,
            wireframe: true
        });
        this.aura = new THREE.Mesh(auraGeo, auraMat);
        this.aura.position.y = 0.5;
        this.group.add(this.aura);

        this.group.position.set(-6, 0, 0);
        this.scene.add(this.group);
    }

    /* ============================================
       HELPER: Create an Akatsuki-style cloud shape
       ============================================ */
    createCloud(material) {
        const cloudGroup = new THREE.Group();

        // Main circle
        const main = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            material
        );
        cloudGroup.add(main);

        // Red border ring
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.32, 0.05, 6, 16),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.1,
                roughness: 0.8
            })
        );
        cloudGroup.add(ring);

        // Small bumps (cloud-like)
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

        this.distance = 0;
        this.score = 0;
        this.coins = 0;

        if (this.group) {
            this.group.position.set(-6, 0, 0);
            this.group.rotation.set(0, 0, 0);
            this.group.scale.set(1, 1, 1);
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
            this.group.scale.y = 0.5;
            setTimeout(() => {
                this.isSliding = false;
                this.group.scale.y = 1;
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

        // Slower run animation
        const runCycle = this.distance * 0.06;

        // Legs (small foot movement)
        this.leftLeg.position.z = Math.sin(runCycle) * 0.15;
        this.rightLeg.position.z = Math.sin(runCycle + Math.PI) * 0.15;

        // Subtle arm sway
        this.leftArm.rotation.x = Math.sin(runCycle + Math.PI) * 0.15;
        this.rightArm.rotation.x = Math.sin(runCycle) * 0.15;

        // Cloak sway
        this.cloak.rotation.z = Math.sin(runCycle * 0.5) * 0.03;

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
