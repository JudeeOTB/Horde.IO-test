// public/js/phaser/entities/Unit.js
export class PhaserUnit extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, faction, unitType, level = 1, textureKey) {
        super(scene, x, y, textureKey);
        this.scene = scene;
        this.faction = faction;
        this.unitType = unitType;
        this.level = level;
        this.hp = 100; 
        this.maxHp = 100; 
        this.facingDirection = 1;
        this.isShieldActive = false;
        this.isPlayerControlled = false;
        this.isFriendlyAI = false;
        this.aiAttackTimer = 0;

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
            this.hp = 300;
            this.maxHp = 300;
            this.body.setBounce(0.1, 0.1);
        } else if (this.faction === scene.playerFaction && unitType !== "king") { 
            this.isFriendlyAI = true;
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
        } else { // Enemy AI unit
            this.isPlayerControlled = false; 
            this.isFriendlyAI = false;     
            this.detectionRange = 300;
            this.attackRange = 60;
            this.attackDamage = 10;
            this.attackCooldown = 1500;
            this.aiAttackTimer = this.attackCooldown; 
            this.speed = 70;
            this.body.setBounce(0,0);
            this.canShoot = true; 
            this.rangedAttackRangeMin = 70;
            this.rangedAttackRangeMax = 280;
            this.rangedAttackCooldown = 2200;
            this.aiRangedAttackTimer = this.rangedAttackCooldown; 
            this.projectileSpeed = 280; 
            this.projectileDamage = 8;  
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

        // Player-controlled or manual AI flipping
        if (this.isPlayerControlled) {
            if (this.body && this.body.velocity.x !== 0) {
                this.facingDirection = this.body.velocity.x < 0 ? -1 : 1;
            }
            this.flipX = (this.facingDirection === -1);
        }
        // Note: AI unit's flipX is handled within their respective updateAI/updateFriendlyAI methods

        // Health Bar Positioning
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
    
    updateAI(time, delta, targetOrPlayer, groupToTarget) { // Preserved from Turn 72
        if (this.isFriendlyAI) {
            this.updateFriendlyAI(time, delta, targetOrPlayer, groupToTarget); 
            return;
        }
        const player = targetOrPlayer; 
        if (!this.active || !player || !player.active) {
            if (this.body) this.body.setVelocity(0, 0);
            return;
        }
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
        if (player.x < this.x) this.flipX = true; else this.flipX = false;
        if(this.aiAttackTimer < this.attackCooldown) this.aiAttackTimer += delta; 
        if(this.aiRangedAttackTimer < this.rangedAttackCooldown) this.aiRangedAttackTimer += delta; 
        if (this.unstickManeuverTimer > 0) {
            this.unstickManeuverTimer -= delta;
            this.body.setVelocity(this.unstickDirection.x * this.speed, this.unstickDirection.y * this.speed);
            if (this.unstickManeuverTimer <= 0) this.stuckCheckTimer = 0;
            return;
        }
        if (this.canShoot && distanceToPlayer <= this.rangedAttackRangeMax && distanceToPlayer > this.rangedAttackRangeMin && this.aiRangedAttackTimer >= this.rangedAttackCooldown) {
            this.body.setVelocity(0, 0);
            const projectileTexture = 'arrow';
            if (this.scene.textures.exists(projectileTexture) && this.scene.enemyProjectiles) {
                const projectile = this.scene.enemyProjectiles.get(this.x, this.y, projectileTexture);
                if (projectile) {
                    projectile.setActive(true).setVisible(true).setData('owner', this);
                    if(!projectile.body) this.scene.physics.world.enable(projectile);
                    if(projectile.body) projectile.body.enable = true;
                    projectile.launch(Math.cos(angleToPlayer), Math.sin(angleToPlayer), this.projectileSpeed, this.projectileDamage);
                }
            }
            this.aiRangedAttackTimer = 0;
        } else if (distanceToPlayer <= this.attackRange) {
            this.body.setVelocity(0, 0); this.isPotentiallyStuck = false; this.stuckCheckTimer = 0;
            if (this.aiAttackTimer >= this.attackCooldown) { player.takeDamage(this.attackDamage); this.aiAttackTimer = 0; }
        } else if (distanceToPlayer <= this.detectionRange) {
            this.scene.physics.moveToObject(this, player, this.speed);
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
        } else { this.body.setVelocity(0, 0); this.isPotentiallyStuck = false; this.stuckCheckTimer = 0; }
    }

    updateFriendlyAI(time, delta, playerKing, enemiesGroup) { // Preserved from Turn 73
        if (!this.active || !playerKing || !playerKing.active) {
            if(this.body) this.body.setVelocity(0, 0);
            return;
        }
        if (this.aiAttackTimer < this.friendlyAttackCooldown) {
            this.aiAttackTimer += delta;
        }
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
        if (this.currentTarget && this.currentTarget.active) {
            const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.currentTarget.x, this.currentTarget.y);
            if (this.currentTarget.x < this.x) this.flipX = true;
            else this.flipX = false;
            if (distanceToTarget > this.friendlyAttackRange) {
                this.scene.physics.moveToObject(this, this.currentTarget, this.speed);
            } else {
                this.body.setVelocity(0, 0);
                if (this.aiAttackTimer >= this.friendlyAttackCooldown) {
                    console.log(`Friendly unit ${this.unitType} attacks enemy ${this.currentTarget.unitType}!`);
                    this.currentTarget.takeDamage(this.friendlyAttackDamage);
                    this.scene.sound.play('sfx_melee_swing'); 
                    this.aiAttackTimer = 0; 
                }
            }
        } else {
            this.currentTarget = null; 
            const followDistance = 120;
            const tooCloseDistance = 70;
            const distanceToPlayerKing = Phaser.Math.Distance.Between(this.x, this.y, playerKing.x, playerKing.y);
            if (playerKing.x < this.x) this.flipX = true;
            else this.flipX = false;
            if (distanceToPlayerKing > followDistance) {
                this.scene.physics.moveToObject(this, playerKing, this.speed * 0.9);
            } else if (distanceToPlayerKing < tooCloseDistance) {
                this.body.setVelocity(0, 0); 
            } else {
                this.body.setVelocity(0, 0);
            }
        }
    }

    takeDamage(amount) { // Preserved from Turn 75
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
            } else { 
                console.log("An enemy unit died, attempting to spawn soul.");
                if (this.scene && this.scene.souls && this.scene.textures.exists('souls_green')) {
                    const soul = this.scene.souls.get(this.x, this.y, 'souls_green'); 
                    if (soul) {
                        soul.setActive(true).setVisible(true);
                        console.log("Soul object obtained from group at", this.x, this.y);
                    }
                } else {
                    console.warn("Could not spawn soul: souls group or texture 'souls_green' missing in scene.");
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
}
