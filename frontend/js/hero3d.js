/* ============================================
   3D HERO CHARACTER
   ============================================ */
class Hero3D {
    constructor(scene) {
        this.scene = scene;
        this.createModel();
        this.reset();
    }

    createModel() {
        this.group = new THREE.Group();

        // Body (cape + torso)
        const bodyGeo = new THREE.BoxGeometry(1, 1.2, 0.6);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xE74C3C, metalness: 0.3, roughness: 0.6
        });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.position.y = 0.6;
        this.body.castShadow = true;
        this.group.add(this.body);

        // Head
        const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xF39C12, metalness: 0.2, roughness: 0.7
        });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.position.y = 1.5;
        this.head.castShadow = true;
        this.group.add(this.head);

        // Mask
        const maskGeo = new THREE.BoxGeometry(0.5, 0.15, 0.4);
        const maskMat = new THREE.MeshStandardMaterial({ color: 0x2C3E50 });
        this.mask = new THREE.Mesh(maskGeo, maskMat);
        this.mask.position.set(0, 1.55, 0.15);
        this.group.add(this.mask);

        // Cape
        const capeGeo = new THREE.PlaneGeometry(0.9, 1.3);
        const capeMat = new THREE.MeshStandardMaterial({
            color: 0xC0392B, side: THREE.DoubleSide, metalness: 0.2, roughness: 0.8
        });
        this.cape = new THREE.Mesh(capeGeo, capeMat);
        this.cape.position.set(0, 0.7, -0.4);
        this.cape.rotation.x = 0.2;
        this.group.add(this.cape);

        // Arms
        const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xE74C3C });

        this.leftArm = new THREE.Mesh(armGeo, armMat);
        this.leftArm.position.set(-0.65, 0.7, 0);
        this.group.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeo, armMat);
        this.rightArm.position.set(0.65, 0.7, 0);
        this.group.add(this.rightArm);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.25, 0.7, 0.25);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x2C3E50 });

        this.leftLeg = new THREE.Mesh(legGeo, legMat);
        this.leftLeg.position.set(-0.2, -0.35, 0);
        this.group.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeo, legMat);
        this.rightLeg.position.set(0.2, -0.35, 0);
        this.group.add(this.rightLeg);

        // Power aura (initially invisible)
        const auraGeo = new THREE.SphereGeometry(1.2, 32, 32);
        const auraMat = new THREE.MeshBasicMaterial({
            color: 0xF1C40F, transparent: true, opacity: 0, wireframe: true
        });
        this.aura = new THREE.Mesh(auraGeo, auraMat);
        this.aura.position.y = 0.7;
        this.group.add(this.aura);

        this.group.position.set(-6, 0, 0);
        this.scene.add(this.group);
    }

    reset() {
        this.x = -6;
        this.y = 0;
        this.velocityY = 0;
        this.gravity = -0.025;
        this.jumpPower = 0.4;
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
        // Apply gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Ground collision
        if (this.y <= 0) {
            this.y = 0;
            this.velocityY = 0;
            this.isJumping = false;
        }

        // Update position
        this.group.position.y = this.y;

        // Update distance
        this.distance += gameSpeed;

        // Running animation
        const runCycle = this.distance * 0.1;
        this.leftLeg.rotation.x = Math.sin(runCycle) * 0.5;
        this.rightLeg.rotation.x = Math.sin(runCycle + Math.PI) * 0.5;
        this.leftArm.rotation.x = Math.sin(runCycle + Math.PI) * 0.4;
        this.rightArm.rotation.x = Math.sin(runCycle) * 0.4;

        // Cape flap
        this.cape.rotation.x = 0.2 + Math.sin(runCycle * 2) * 0.15;

        // Update power timer
        if (this.activePower) {
            this.powerTimer--;
            if (this.powerTimer <= 0) {
                this.deactivatePower();
            } else {
                this.aura.material.opacity = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
                this.aura.rotation.y += 0.05;
            }
        }

        // Check power unlocks
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
