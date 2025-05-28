// public/js/phaser/entities/Unit.js
export class PhaserUnit extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, faction, unitType, level = 1, textureKey) {
        super(scene, x, y, textureKey);
        this.scene = scene;
        this.faction = faction;
        this.unitType = unitType;
        this.level = level; // Level is initialized
        this.leader = null; // Default leader to null
        this.hp = 100; 
        this.maxHp = 100; 
        this.facingDirection = 1;
        this.isShieldActive = false;
        this.isPlayerControlled = false;
        this.isFriendlyAI = false;
        this.aiAttackTimer = 0;

        // Bobbing and Footsteps
        this.bobbingPhase = Math.random() * Math.PI * 2; // Random start
        this.bobbingOffset = 0;
        this.footstepTimer = 0;
        this.footstepInterval = 350; // ms, adjust as needed
        this.isCurrentlyMoving = false;

        this.healthBarBg = null;
        this.healthBar = null;
        this.healthBarWidth = 40; 
        this.healthBarHeight = 5;

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setCollideWorldBounds(true);
        this.body.setDrag(100, 100);

        if (unitType === "king" && this.faction === scene.playerFaction) { 
            this.isPlayerControlled = true;
            this.leader = this; // King is its own leader
            this.hp = 300;
            this.maxHp = 300;
            this.body.setBounce(0.1, 0.1);
        } else if (this.faction === scene.playerFaction && unitType !== "king") { 
            this.isFriendlyAI = true;
            // this.leader will be set by GameScene when spawning friendly units
            this.isPlayerControlled = false;
            this.speed = 80; 
            this.hp = 75;
            this.maxHp = 75;
            this.body.setBounce(0,0);
            this.friendlyDetectionRange = 200;
            this.friendlyAttackRange = 60; 
            this.friendlyAttackDamage = 12; 
            this.friendlyAttackCooldown = 1000; 
            this.aiAttackTimer = this.friendlyAttackCooldown; 
            this.currentTarget = null;
            this.aiTargetBuilding = null; // For targeting buildings

            // Archer-specific properties for friendly units
            if (this.unitType.includes('archer')) {
                this.canShoot = true;
                this.rangedAttackRangeMin = 70; // Example, can be adjusted
                this.rangedAttackRangeMax = 280; // Example
                this.rangedAttackCooldown = 2000; // Example
                this.aiRangedAttackTimer = this.rangedAttackCooldown;
                this.projectileSpeed = 300; // Example
                this.projectileDamage = 10; // Example
                this.archerKiteDistance = this.rangedAttackRangeMin * 0.7;
                this.archerPreferredEngagementDistance = this.rangedAttackRangeMax * 0.8;
                // Friendly archers use friendlyAttackDamage for projectileDamage for now, or projectileDamage if set
                this.projectileDamage = this.projectileDamage || this.friendlyAttackDamage; 
            }

        } else { // Enemy AI unit
            this.isPlayerControlled = false; 
            this.isFriendlyAI = false;    
            this.aiTargetBuilding = null; // For targeting buildings 
            this.detectionRange = 300; // General detection for non-archers or initial detection
            this.attackRange = 60;     // Melee attack range
            this.attackDamage = 10;    // Melee damage
            this.attackCooldown = 1500;
            this.aiAttackTimer = this.attackCooldown; // For melee attacks
            this.speed = 70;
            this.body.setBounce(0,0);

            if (this.unitType.includes('archer')) {
                this.canShoot = true; 
                this.rangedAttackRangeMin = 70;
                this.rangedAttackRangeMax = 280;
                this.rangedAttackCooldown = 2200;
                this.aiRangedAttackTimer = this.rangedAttackCooldown; 
                this.projectileSpeed = 280; 
                this.projectileDamage = 8;
                this.archerKiteDistance = this.rangedAttackRangeMin * 0.7;
                this.archerPreferredEngagementDistance = this.rangedAttackRangeMax * 0.8;
                 // detectionRange for archers might be their max shooting range.
                this.detectionRange = this.rangedAttackRangeMax;
            } else {
                this.canShoot = false; // Ensure non-archers don't try to shoot by default
            }
            this.stuckCheckTimer = 0; 
            this.isPotentiallyStuck = false;
            this.unstickManeuverTimer = 0; 
            this.unstickDirection = { x: 0, y: 0 }; 
            this.STUCK_THRESHOLD_TIME = 500; 
            this.UNSTICK_MANEUVER_DURATION = 300; 
            this.hp = 50; 
            this.maxHp = 50; 
            this.healthBarBg = this.scene.add.graphics();
            this.healthBar = this.scene.add.graphics();
            if (this.healthBarBg && this.healthBar) {
                this.initHealthBar();
            }
        }
    }

    initHealthBar() { // Preserved from Turn 75
        if (!this.healthBarBg || !this.healthBar) return;
        this.healthBarBg.fillStyle(0x800000, 0.7); 
        this.healthBarBg.fillRect(0, 0, this.healthBarWidth, this.healthBarHeight);
        this.healthBar.fillStyle(0x00ff00, 0.9); 
        this.healthBar.fillRect(0, 0, this.healthBarWidth, this.healthBarHeight);
        this.healthBarBg.setVisible(true);
        this.healthBar.setVisible(true);
    }

    updateHealthBar() { // Preserved from Turn 75
        if (!this.healthBarBg || !this.healthBar) { 
            return;
        }
        if (!this.active) { 
            this.healthBarBg.setVisible(false);
            this.healthBar.setVisible(false);
            return;
        }
        this.healthBarBg.clear();
        this.healthBarBg.fillStyle(0x800000, 0.7);
        this.healthBarBg.fillRect(0, 0, this.healthBarWidth, this.healthBarHeight); 
        this.healthBar.clear();
        const healthPercentage = this.hp / this.maxHp;
        const currentHealthWidth = Math.max(0, this.healthBarWidth * healthPercentage); 
        if (healthPercentage > 0.6) {
            this.healthBar.fillStyle(0x00ff00, 0.9); 
        } else if (healthPercentage > 0.3) {
            this.healthBar.fillStyle(0xffff00, 0.9); 
        } else {
            this.healthBar.fillStyle(0xff0000, 0.9); 
        }
        this.healthBar.fillRect(0, 0, currentHealthWidth, this.healthBarHeight);
        this.healthBarBg.setVisible(true);
        this.healthBar.setVisible(true);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta); 

        // --- Bobbing and Footstep Logic ---
        if (this.active && this.body) { // Only apply if unit is active and has a body
            // Reset previous bobbing offset from this.y
            // This ensures calculations for health bar, etc., use the "true" y before bobbing
            this.y -= this.bobbingOffset;

            const velocity = this.body.velocity;
            this.isCurrentlyMoving = velocity && (Math.abs(velocity.x) > 1 || Math.abs(velocity.y) > 1);

            if (this.isCurrentlyMoving) {
                this.bobbingPhase += delta * 0.005; // Adjust speed of bob
                if (this.bobbingPhase > Math.PI * 2) { // Keep phase within a reasonable range
                    this.bobbingPhase -= Math.PI * 2;
                }
                this.bobbingOffset = Math.sin(this.bobbingPhase) * 1.5; // Adjust amplitude (pixels)

                this.footstepTimer -= delta;
                if (this.footstepTimer <= 0) {
                    if (this.scene && this.scene.sound && this.scene.sound.get('sfx_footstep')) { // Check if sound exists
                         // Play footstep sound only if the unit is somewhat close to the camera for performance/audibility
                        const cam = this.scene.cameras.main;
                        const distanceToCamera = Phaser.Math.Distance.Between(this.x, this.y, cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2);
                        if (distanceToCamera < cam.width) { // Arbitrary distance check based on camera width
                             this.scene.sound.play('sfx_footstep', { volume: 0.05 + (Math.random() * 0.05) }); // Slight volume variation
                        }
                    }
                    this.footstepTimer = this.footstepInterval + Math.random() * 100 - 50; // Slight variation
                }
            } else {
                this.bobbingOffset = 0;
                // No need to reset bobbingPhase here, it can continue from where it left off for smoother transition
            }
            // Apply new bobbing offset to this.y for rendering
            this.y += this.bobbingOffset;
        }
        // --- End Bobbing and Footstep Logic ---


        // Player-controlled or manual AI flipping
        if (this.isPlayerControlled) {
            if (this.body && this.body.velocity.x !== 0) {
                this.facingDirection = this.body.velocity.x < 0 ? -1 : 1;
            }
            this.flipX = (this.facingDirection === -1);
        }
        // Note: AI unit's flipX is handled within their respective updateAI/updateFriendlyAI methods

        // Health Bar Positioning
        // This logic now uses the y position that includes the bobbingOffset. This is generally fine.
        if (this.healthBarBg && this.healthBar) { 
            if (this.active && this.visible) { 
                const xPos = this.x - this.healthBarWidth / 2;
                // Adjust yPos to be above the sprite's visual top edge.
                // this.displayOriginY is the offset from the sprite's center to its visual top.
                // If using default origin (0.5, 0.5), displayHeight / 2 is distance from center to top.
                const yPos = this.y - (this.displayHeight / 2) - this.healthBarHeight - 8; // 8px padding above

                this.healthBarBg.setPosition(xPos, yPos);
                this.healthBar.setPosition(xPos, yPos);

                // Ensure visibility if unit becomes visible again after being invisible
                // and it's not dead (updateHealthBar handles visibility on death via active flag)
                if (this.hp > 0) {
                    this.healthBarBg.setVisible(true);
                    this.healthBar.setVisible(true);
                }
            } else {
                // If unit is not active or not visible, hide health bars
                this.healthBarBg.setVisible(false);
                this.healthBar.setVisible(false);
            }
        }
    }
    
    updateAI(time, delta, targetOrPlayer, groupToTarget) { 
        if (this.isFriendlyAI) {
            this.updateFriendlyAI(time, delta, targetOrPlayer, groupToTarget); 
            return;
        }

        // Handle Archer AI separately
        if (this.unitType.includes('archer')) {
            this.updateEnemyArcherAI(time, delta, targetOrPlayer, groupToTarget);
            return;
        }

        // Standard Enemy Melee AI (Preserved from Turn 72 logic for non-archers)
        const player = targetOrPlayer; 
        if (!this.active || !player || !player.active) {
            if (this.body) this.body.setVelocity(0, 0);
            return;
        }
        
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
        if (player.x < this.x) this.flipX = true; else this.flipX = false;
        
        if(this.aiAttackTimer < this.attackCooldown) this.aiAttackTimer += delta; 
        // Note: aiRangedAttackTimer is managed by archer specific logic if this.canShoot is true

        if (this.unstickManeuverTimer > 0) { // Stuck logic
            this.unstickManeuverTimer -= delta;
            this.body.setVelocity(this.unstickDirection.x * this.speed, this.unstickDirection.y * this.speed);
            if (this.unstickManeuverTimer <= 0) this.stuckCheckTimer = 0;
            return;
        }

        // Melee attack logic:
        if (distanceToPlayer <= this.attackRange) { // Melee range
            this.body.setVelocity(0, 0); this.isPotentiallyStuck = false; this.stuckCheckTimer = 0;
            if (this.aiAttackTimer >= this.attackCooldown) { 
                player.takeDamage(this.attackDamage); 
                this.aiAttackTimer = 0; 
                if (this.scene && typeof this.scene.spawnSlashEffect === 'function') {
                    this.scene.spawnSlashEffect(this, player.x, player.y);
                }
            }
        } else if (distanceToPlayer <= this.detectionRange) { // Chase player
            this.scene.physics.moveToObject(this, player, this.speed);
            // Stuck detection
            if (Math.abs(this.body.velocity.x) < 10 && Math.abs(this.body.velocity.y) < 10) {
                this.stuckCheckTimer += delta;
                if (this.stuckCheckTimer >= this.STUCK_THRESHOLD_TIME) { this.isPotentiallyStuck = true; this.stuckCheckTimer = 0; }
            } else { this.stuckCheckTimer = 0; this.isPotentiallyStuck = false; }
            if (this.isPotentiallyStuck) {
                const turnAngle = Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
                const newAngle = angleToPlayer + turnAngle;
                this.unstickDirection.x = Math.cos(newAngle); this.unstickDirection.y = Math.sin(newAngle);
                this.unstickManeuverTimer = this.UNSTICK_MANEUVER_DURATION;
                this.isPotentiallyStuck = false; this.body.setVelocity(0,0);
            }
        } else { // Player not in detection range, fallback to building attack
            this.isPotentiallyStuck = false; this.stuckCheckTimer = 0;
            // Building targeting logic (preserved)
            if (!this.aiTargetBuilding || !this.aiTargetBuilding.active || this.aiTargetBuilding.hp <= 0) {
                this.aiTargetBuilding = null; // Clear invalid target
                let closestBuilding = null;
                let shortestDistanceToBuilding = this.detectionRange; // Use existing detection range

                this.scene.buildings.getChildren().forEach(building => {
                    if (building.active && building.hp > 0) {
                        const distanceToBuilding = Phaser.Math.Distance.Between(this.x, this.y, building.x, building.y);
                        if (distanceToBuilding < shortestDistanceToBuilding) {
                            shortestDistanceToBuilding = distanceToBuilding;
                            closestBuilding = building;
                        }
                    }
                });
                if (closestBuilding) {
                    this.aiTargetBuilding = closestBuilding;
                }
            }

            if (this.aiTargetBuilding && this.aiTargetBuilding.active && this.aiTargetBuilding.hp > 0) {
                const distanceToBuilding = Phaser.Math.Distance.Between(this.x, this.y, this.aiTargetBuilding.x, this.aiTargetBuilding.y);
                if (this.aiTargetBuilding.x < this.x) this.flipX = true; else this.flipX = false;

                if (distanceToBuilding <= this.attackRange) {
                    this.body.setVelocity(0, 0);
                    if (this.aiAttackTimer >= this.attackCooldown) {
                        this.aiTargetBuilding.takeDamage(this.attackDamage);
                        this.aiAttackTimer = 0;
                        if (this.scene && typeof this.scene.spawnSlashEffect === 'function') {
                            this.scene.spawnSlashEffect(this, this.aiTargetBuilding.x, this.aiTargetBuilding.y);
                        }
                    }
                } else if (distanceToBuilding <= this.detectionRange) { // Move towards if in detection range but not attack range
                    this.scene.physics.moveToObject(this, this.aiTargetBuilding, this.speed);
                } else {
                    // Building is too far, clear target and stop
                    this.aiTargetBuilding = null;
                    this.body.setVelocity(0, 0);
                }
            } else {
                // No player or building target
                this.body.setVelocity(0, 0);
                this.aiTargetBuilding = null; // Ensure it's cleared
            }
            // --- 건물 타겟팅 로직 종료 (적 AI) ---
        }
    }

    updateFriendlyAI(time, delta, playerKing, enemiesGroup) {
        if (!this.active || !playerKing || !playerKing.active) {
            if(this.body) this.body.setVelocity(0, 0);
            return;
        }

        // Handle Archer AI separately
        if (this.unitType.includes('archer')) {
            this.updateFriendlyArcherAI(time, delta, playerKing, enemiesGroup);
            return;
        }

        // Standard Friendly Melee AI (Preserved logic for non-archers)
        if (this.aiAttackTimer < this.friendlyAttackCooldown) {
            this.aiAttackTimer += delta;
        }

        // Target acquisition for melee
        if (!this.currentTarget || !this.currentTarget.active) {
            let closestEnemy = null;
            let shortestDistance = this.friendlyDetectionRange;
            enemiesGroup.getChildren().forEach(enemy => {
                if (enemy.active && enemy.faction !== this.faction) { 
                    const distanceToEnemy = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    if (distanceToEnemy < shortestDistance) {
                        shortestDistance = distanceToEnemy;
                        closestEnemy = enemy;
                    }
                }
            });
            this.currentTarget = closestEnemy;
        }

        if (this.currentTarget && this.currentTarget.active) { // Melee attack
            const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.currentTarget.x, this.currentTarget.y);
            if (this.currentTarget.x < this.x) this.flipX = true; else this.flipX = false;

            if (distanceToTarget > this.friendlyAttackRange) {
                this.scene.physics.moveToObject(this, this.currentTarget, this.speed);
            } else {
                this.body.setVelocity(0, 0);
                if (this.aiAttackTimer >= this.friendlyAttackCooldown) {
                    console.log(`Friendly unit ${this.unitType} MELEE attacks enemy ${this.currentTarget.unitType}!`);
                    this.currentTarget.takeDamage(this.friendlyAttackDamage); // Melee damage
                    this.scene.sound.play('sfx_melee_swing'); 
                    this.aiAttackTimer = 0;
                    if (this.scene && typeof this.scene.spawnSlashEffect === 'function') {
                        this.scene.spawnSlashEffect(this, this.currentTarget.x, this.currentTarget.y);
                    }
                }
            }
        } else { // No enemy target, follow player or attack buildings
            this.currentTarget = null; 
            const followDistance = 120;
            const tooCloseDistance = 70;
            const distanceToPlayerKing = Phaser.Math.Distance.Between(this.x, this.y, playerKing.x, playerKing.y);
            if (playerKing.x < this.x) this.flipX = true; else this.flipX = false;

            // Building targeting logic (preserved)
            if (!this.aiTargetBuilding || !this.aiTargetBuilding.active || this.aiTargetBuilding.hp <= 0) {
                this.aiTargetBuilding = null; // Clear invalid target
                let closestBuilding = null;
                let shortestDistanceToBuilding = this.friendlyDetectionRange; // Use existing detection range

                this.scene.buildings.getChildren().forEach(building => {
                    // For now, friendly AI will attack any building. Later, faction checks can be added.
                    if (building.active && building.hp > 0) {
                        const distanceToBuilding = Phaser.Math.Distance.Between(this.x, this.y, building.x, building.y);
                        if (distanceToBuilding < shortestDistanceToBuilding) {
                            shortestDistanceToBuilding = distanceToBuilding;
                            closestBuilding = building;
                        }
                    }
                });
                if (closestBuilding) {
                    this.aiTargetBuilding = closestBuilding;
                }
            }
            
            if (this.aiTargetBuilding && this.aiTargetBuilding.active && this.aiTargetBuilding.hp > 0) {
                const distanceToBuilding = Phaser.Math.Distance.Between(this.x, this.y, this.aiTargetBuilding.x, this.aiTargetBuilding.y);
                if (this.aiTargetBuilding.x < this.x) this.flipX = true; else this.flipX = false;

                if (distanceToBuilding <= this.friendlyAttackRange) {
                    this.body.setVelocity(0, 0);
                    if (this.aiAttackTimer >= this.friendlyAttackCooldown) {
                        this.aiTargetBuilding.takeDamage(this.friendlyAttackDamage);
                        this.scene.sound.play('sfx_melee_swing'); 
                        this.aiAttackTimer = 0;
                        if (this.scene && typeof this.scene.spawnSlashEffect === 'function') {
                            this.scene.spawnSlashEffect(this, this.aiTargetBuilding.x, this.aiTargetBuilding.y);
                        }
                    }
                } else if (distanceToBuilding <= this.friendlyDetectionRange) { // Move towards if in detection range but not attack range
                    this.scene.physics.moveToObject(this, this.aiTargetBuilding, this.speed);
                } else {
                    // Building is too far, clear target and revert to player-following behavior.
                    this.aiTargetBuilding = null;
                    if (distanceToPlayerKing > followDistance) {
                        this.scene.physics.moveToObject(this, playerKing, this.speed * 0.9);
                    } else { // Includes being too close or just right distance
                        this.body.setVelocity(0, 0);
                    }
                }
            } else { // No enemy unit and no building target, follow player king
                 this.aiTargetBuilding = null; // Ensure it's cleared
                 if (distanceToPlayerKing > followDistance) {
                    this.scene.physics.moveToObject(this, playerKing, this.speed * 0.9);
                } else if (distanceToPlayerKing < tooCloseDistance) {
                    this.body.setVelocity(0, 0); 
                } else {
                    this.body.setVelocity(0, 0);
                }
            }
            // --- 건물 타겟팅 로직 종료 (아군 AI) ---
        }
    }


    // New method for Enemy Archer AI
    updateEnemyArcherAI(time, delta, playerKing, playerUnitsGroup) {
        if (!this.active) {
            if (this.body) this.body.setVelocity(0, 0);
            return;
        }

        if (this.aiRangedAttackTimer < this.rangedAttackCooldown) {
            this.aiRangedAttackTimer += delta;
        }

        let target = null;
        let shortestDistanceToTarget = Infinity;

        // Prioritize Player King
        if (playerKing && playerKing.active) {
            const distToPlayerKing = Phaser.Math.Distance.Between(this.x, this.y, playerKing.x, playerKing.y);
            if (distToPlayerKing <= this.rangedAttackRangeMax) { // Prioritize if in range
                 target = playerKing;
                 shortestDistanceToTarget = distToPlayerKing;
            }
        }
        
        // Then check other player units if king is not primary target or not in range for others
        // This logic might need refinement on how to pick between king and units if both are in range.
        // For now, if King is in rangedAttackRangeMax, he is the target. Otherwise, check other units.
        if (!target) {
            playerUnitsGroup.getChildren().forEach(unit => {
                if (unit.active) {
                    const distance = Phaser.Math.Distance.Between(this.x, this.y, unit.x, unit.y);
                    if (distance < shortestDistanceToTarget && distance <= this.rangedAttackRangeMax * 1.2) { // একটু বেশি রেঞ্জ দিলাম টার্গেট ধরার জন্য
                        shortestDistanceToTarget = distance;
                        target = unit;
                    }
                }
            });
        }


        if (target && target.active) {
            const distanceToTarget = shortestDistanceToTarget; // Already calculated
            const angleToTarget = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
            this.flipX = (target.x < this.x);

            if (distanceToTarget < this.archerKiteDistance) { // Kite
                this.body.velocityFromAngle(angleToTarget + Math.PI, this.speed); // Move away
            } else if (distanceToTarget <= this.rangedAttackRangeMax && distanceToTarget >= this.rangedAttackRangeMin) { // Shoot
                this.body.setVelocity(0, 0);
                if (this.aiRangedAttackTimer >= this.rangedAttackCooldown) {
                    const projectileTexture = 'arrow'; // Assuming 'arrow' texture
                    if (this.scene.textures.exists(projectileTexture) && this.scene.enemyProjectiles) {
                        const projectile = this.scene.enemyProjectiles.get(this.x, this.y, projectileTexture);
                        if (projectile) {
                            projectile.setActive(true).setVisible(true).setData('owner', this);
                            if (!projectile.body) this.scene.physics.world.enable(projectile);
                            if (projectile.body) projectile.body.enable = true;
                            projectile.launch(Math.cos(angleToTarget), Math.sin(angleToTarget), this.projectileSpeed, this.projectileDamage);
                        }
                    }
                    this.aiRangedAttackTimer = 0;
                }
            } else if (distanceToTarget > this.rangedAttackRangeMax) { // Approach target
                 this.scene.physics.moveToObject(this, target, this.speed, this.archerPreferredEngagementDistance);
            } else { // Too close but not kiting, or between min and kite
                this.body.setVelocity(0,0); // Stop and assess, or shoot if in min range but not kiting.
            }
        } else { // No player target in sight/range, fallback to building or default movement
            this.body.setVelocity(0, 0); // Stop if no targets
            // Fallback: Attack buildings (similar to existing non-archer AI)
            if (!this.aiTargetBuilding || !this.aiTargetBuilding.active || this.aiTargetBuilding.hp <= 0) {
                this.aiTargetBuilding = null; 
                let closestBuilding = null;
                let shortestDistanceToBuilding = this.detectionRange; 
                this.scene.buildings.getChildren().forEach(building => {
                    if (building.active && building.hp > 0) {
                        const distanceToBuilding = Phaser.Math.Distance.Between(this.x, this.y, building.x, building.y);
                        if (distanceToBuilding < shortestDistanceToBuilding) {
                            shortestDistanceToBuilding = distanceToBuilding;
                            closestBuilding = building;
                        }
                    }
                });
                if (closestBuilding) this.aiTargetBuilding = closestBuilding;
            }
            if (this.aiTargetBuilding && this.aiTargetBuilding.active && this.aiTargetBuilding.hp > 0) {
                const distanceToBuilding = Phaser.Math.Distance.Between(this.x, this.y, this.aiTargetBuilding.x, this.aiTargetBuilding.y);
                if (this.aiTargetBuilding.x < this.x) this.flipX = true; else this.flipX = false;
                // Enemy Archers will shoot buildings if they can
                if (distanceToBuilding <= this.rangedAttackRangeMax && this.aiRangedAttackTimer >= this.rangedAttackCooldown) {
                     this.body.setVelocity(0, 0);
                     const angleToBuilding = Phaser.Math.Angle.Between(this.x, this.y, this.aiTargetBuilding.x, this.aiTargetBuilding.y);
                     const projectile = this.scene.enemyProjectiles.get(this.x, this.y, 'arrow');
                     if (projectile) {
                        projectile.setActive(true).setVisible(true).setData('owner', this);
                        if(!projectile.body) this.scene.physics.world.enable(projectile);
                        if(projectile.body) projectile.body.enable = true;
                        projectile.launch(Math.cos(angleToBuilding), Math.sin(angleToBuilding), this.projectileSpeed, this.projectileDamage);
                     }
                     this.aiRangedAttackTimer = 0;
                } else if (distanceToBuilding > this.rangedAttackRangeMax) {
                    this.scene.physics.moveToObject(this, this.aiTargetBuilding, this.speed);
                } else { // In range but cooldown not ready
                    this.body.setVelocity(0,0);
                }
            } else {
                this.body.setVelocity(0,0); // Truly idle
            }
        }
    }

    // New method for Friendly Archer AI
    updateFriendlyArcherAI(time, delta, playerKing, enemiesGroup) {
        if (!this.active || !playerKing || !playerKing.active) {
            if (this.body) this.body.setVelocity(0, 0);
            return;
        }

        if (this.aiRangedAttackTimer < this.rangedAttackCooldown) { // Assuming friendly archers use same timer/cooldown vars
            this.aiRangedAttackTimer += delta;
        }
        
        // Target acquisition
        if (!this.currentTarget || !this.currentTarget.active) {
            let closestEnemy = null;
            let shortestDistance = this.rangedAttackRangeMax * 1.2; // Prioritize targets within engageable range
            enemiesGroup.getChildren().forEach(enemy => {
                if (enemy.active && enemy.faction !== this.faction) {
                    const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        closestEnemy = enemy;
                    }
                }
            });
            this.currentTarget = closestEnemy;
        }

        if (this.currentTarget && this.currentTarget.active) {
            const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.currentTarget.x, this.currentTarget.y);
            const angleToTarget = Phaser.Math.Angle.Between(this.x, this.y, this.currentTarget.x, this.currentTarget.y);
            this.flipX = (this.currentTarget.x < this.x);

            if (distanceToTarget < this.archerKiteDistance) { // Kite
                this.body.velocityFromAngle(angleToTarget + Math.PI, this.speed);
            } else if (distanceToTarget <= this.rangedAttackRangeMax && distanceToTarget >= this.rangedAttackRangeMin) { // Shoot
                this.body.setVelocity(0, 0);
                if (this.aiRangedAttackTimer >= this.rangedAttackCooldown) {
                    // Assuming friendly archers use player's projectile group and 'arrow' texture
                    const projectileTexture = 'arrow_friendly'; // Or a faction specific arrow
                    let actualTexture = this.scene.textures.exists(projectileTexture) ? projectileTexture : 'arrow';

                    if (this.scene.projectiles) { // Assuming friendly projectiles go into the main 'projectiles' group
                        const projectile = this.scene.projectiles.get(this.x, this.y, actualTexture);
                        if (projectile) {
                            projectile.setActive(true).setVisible(true).setData('owner', this).setData('faction', this.faction);
                            if (!projectile.body) this.scene.physics.world.enable(projectile);
                            if (projectile.body) projectile.body.enable = true;
                            projectile.launch(Math.cos(angleToTarget), Math.sin(angleToTarget), this.projectileSpeed, this.projectileDamage);
                             this.scene.sound.play('sfx_arrow_shoot');
                        }
                    }
                    this.aiRangedAttackTimer = 0;
                }
            } else if (distanceToTarget > this.rangedAttackRangeMax) { // Approach target
                 this.scene.physics.moveToObject(this, this.currentTarget, this.speed, this.archerPreferredEngagementDistance);
            } else { // Too close but not kiting, or between min and kite
                 this.body.setVelocity(0,0);
            }
        } else { // No enemy target, follow player king at a distance
            this.currentTarget = null;
            const distanceToPlayerKing = Phaser.Math.Distance.Between(this.x, this.y, playerKing.x, playerKing.y);
            if (playerKing.x < this.x) this.flipX = true; else this.flipX = false;

            if (distanceToPlayerKing > this.archerPreferredEngagementDistance + 50) { // Move closer if too far
                this.scene.physics.moveToObject(this, playerKing, this.speed * 0.9, this.archerPreferredEngagementDistance);
            } else if (distanceToPlayerKing < this.archerPreferredEngagementDistance - 50) { // Move away if too close
                const angleToPlayerKing = Phaser.Math.Angle.Between(this.x, this.y, playerKing.x, playerKing.y);
                this.body.velocityFromAngle(angleToPlayerKing + Math.PI, this.speed * 0.7);
            } else {
                this.body.setVelocity(0, 0); // Stay put
            }
        }
    }


    takeDamage(amount) { 
        if (!this.active) return;
        if (this.isShieldActive && (this.isPlayerControlled || this.unitType === 'king')) {
            console.log(`${this.faction} ${this.unitType} shielded the attack!`);
            return; 
        }
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        console.log(`${this.faction} ${this.unitType} took ${amount} damage. HP: ${this.hp}`);
        if (this.healthBar) { 
            this.updateHealthBar();
        }
        if (this.hp > 0) {
            if (this.scene && this.scene.sound) this.scene.sound.play('sfx_take_damage');
        } else { 
            if (this.scene && this.scene.sound) this.scene.sound.play('sfx_unit_death');
            this.setActive(false).setVisible(false);
            if (this.body) this.body.enable = false;
            if (this.healthBarBg) this.healthBarBg.setVisible(false);
            if (this.healthBar) this.healthBar.setVisible(false);
            if (this.isPlayerControlled || this.unitType === 'king') {
                if (this.scene && this.scene.events) this.scene.events.emit('playerDied');
            } else if (this.isFriendlyAI) { 
                 console.log("A friendly AI unit died.");
            } else { // Enemy unit died
                console.log(`Enemy unit ${this.unitType} (Level: ${this.level}) died, attempting to spawn soul.`);

                let soulType = 'green'; // Default soul type
                let soulTextureKey = 'souls_green'; // Default texture

                // Determine soul type and texture based on unit properties
                if (this.unitType === 'king') {
                    soulType = 'purple';
                    soulTextureKey = 'souls_purple';
                } else if (this.unitType === 'vassal') {
                    if (this.level === 1) {
                        soulType = 'green';
                        soulTextureKey = 'souls_green';
                    } else if (this.level === 2) {
                        soulType = 'blue';
                        soulTextureKey = 'souls_blue';
                    } else if (this.level === 3) {
                        soulType = 'purple';
                        soulTextureKey = 'souls_purple';
                    }
                } else { 
                    // Default for other unit types like archers, assuming level 1 for soul type if applicable
                    // If unit.level is defined and fits below, it will be used, otherwise defaults above
                    if (this.level === 1) {
                        soulType = 'green';
                        soulTextureKey = 'souls_green';
                    } else if (this.level === 2) { // For future units that might have levels
                        soulType = 'blue';
                        soulTextureKey = 'souls_blue';
                    } else if (this.level === 3) { // For future units that might have levels
                        soulType = 'purple';
                        soulTextureKey = 'souls_purple';
                    }
                }
                
                // Vassal 50% chance to spawn a soul
                if (this.unitType === 'vassal') {
                    if (Math.random() < 0.5) {
                        // 50% chance failed, no soul for this vassal
                        console.log(`Vassal (Level: ${this.level}) did not spawn a soul (50% chance).`);
                        // Explicitly do nothing here by not proceeding to spawn.
                    } else {
                        // 50% chance passed, proceed to spawn soul
                        if (this.scene && this.scene.souls && this.scene.textures.exists(soulTextureKey)) {
                            const soul = this.scene.souls.get(this.x, this.y, soulTextureKey);
                            if (soul) {
                                soul.setActive(true).setVisible(true);
                                // Future: soul.setSoulType(soulType); if PhaserSoul needs it
                                console.log(`Soul (${soulType}) spawned for vassal (Level: ${this.level}) at`, this.x, this.y);
                            }
                        } else {
                            console.warn(`Could not spawn soul: souls group or texture '${soulTextureKey}' missing in scene.`);
                        }
                    }
                } else {
                    // Not a vassal, spawn soul directly (e.g., for king or other enemy types)
                    if (this.scene && this.scene.souls && this.scene.textures.exists(soulTextureKey)) {
                        const soul = this.scene.souls.get(this.x, this.y, soulTextureKey);
                        if (soul) {
                            soul.setActive(true).setVisible(true);
                            // Future: soul.setSoulType(soulType); if PhaserSoul needs it
                            console.log(`Soul (${soulType}) spawned for ${this.unitType} (Level: ${this.level}) at`, this.x, this.y);
                        }
                    } else {
                        console.warn(`Could not spawn soul: souls group or texture '${soulTextureKey}' missing in scene.`);
                    }
                }
            }
        }
        if (this.isPlayerControlled && this.scene && this.scene.events) { 
             this.scene.events.emit('playerHealthChanged', this.hp);
        }
    }

    destroy(fromScene) { // Preserved from Turn 75
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBar) this.healthBar.destroy();
        this.healthBarBg = null;
        this.healthBar = null;
        super.destroy(fromScene); 
   }

    updateTextureForLevel(newLevel) {
        if (this.unitType !== 'vassal') {
            console.warn(`updateTextureForLevel called on non-vassal unit: ${this.unitType}`);
            // Archer and King textures do not change with these level-ups
            // We might still update level for internal logic, but not texture here.
            this.level = newLevel;
            return;
        }

        this.level = newLevel;
        let newTextureKey = `factions_${this.faction}_level${this.level}`;

        // Validate if texture exists
        if (this.scene.textures.exists(newTextureKey)) {
            this.setTexture(newTextureKey);
            console.log(`${this.faction} ${this.unitType} leveled up to ${this.level}, texture updated to ${newTextureKey}`);
            
            // Optional: Adjust HP/MaxHP based on new level for vassals
            // These values are examples and can be balanced as needed.
            if (this.level === 2) {
                this.maxHp = 100; // Example: Level 1 vassal has 75, level 2 has 100
                this.hp = this.maxHp; // Heal to full on level up
            } else if (this.level === 3) {
                this.maxHp = 150; // Example: Level 3 vassal has 150
                this.hp = this.maxHp;
            }
            if (this.healthBar) { // Update health bar if it exists
                this.updateHealthBar();
            }

        } else {
            console.warn(`Texture key ${newTextureKey} not found for unit ${this.unitType} level ${this.level}. Texture not changed.`);
            // Fallback or default texture logic if needed, or ensure all level textures exist
        }
    }
}
