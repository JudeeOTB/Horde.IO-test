// public/js/phaser/scenes/GameScene.js

// Import Entity classes
import { PhaserUnit } from '../entities/Unit.js';
import { PhaserObstacle } from '../entities/Obstacle.js'; 
import { PhaserProjectile } from '../entities/Projectile.js';
import { PhaserSoul } from '../entities/Soul.js'; 

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.playerFaction = 'human'; 
        this.playerKing = null;
        this.units = null;
        this.enemies = null; 
        this.buildings = null;
        this.obstacles = null; 
        this.projectiles = null; 
        this.enemyProjectiles = null; 
        this.souls = null; 
        this.backgroundTile = null;
        this.gameTime = 0;
        this.gameOver = false; 

        this.keyW = null; this.keyA = null; this.keyS = null; this.keyD = null;
        this.keyE = null; this.keyR = null; this.keySpace = null; this.keyQ = null;
        this.keyX = null;      // Key for spawning units
        this.keyUpgradeDamage = null; // Key for upgrading damage
        this.keyUpgradeHp = null;     // Key for upgrading HP


        this.attackButtonPressed = false; this.rangedAttackButtonPressed = false;
        this.joystickVector = { x: 0, y: 0 };
        this.dashButtonPressed = false; this.shieldButtonPressed = false;
        
        this.playerUnits = null; // Group for player's spawned units
    }

    init(data) {
        console.log('GameScene init, data received:', data);
        this.playerFaction = (data && data.selectedFaction) ? data.selectedFaction : (window.GameSettings ? window.GameSettings.selectedFaction : 'human');
        console.log('GameScene: Player faction set to', this.playerFaction);
    }
    
    CONFIG = {
        worldWidth: 3000, worldHeight: 3000, gameZoom: 1,
        playerSpeed: 1.35 * 1.88 * 60,
        dashCooldown: 5000, dashDistance: 200, dashDuration: 250,
        shieldAbilityCooldown: 10000, shieldAbilityDuration: 5000,
        playerMeleeRange: 70, playerMeleeDamage: 25, playerAttackCooldown: 500,
        playerRangedAttackCooldown: 700, playerProjectileDamage: 15, playerProjectileSpeed: 350,
        spawnUnitSoulCost: 10, 
        // Upgrades
        upgradePlayerDamageCost: 50,
        upgradePlayerDamageAmount: 5,
        upgradePlayerMaxHpCost: 50,
        upgradePlayerMaxHpAmount: 25,
    };

    preload() { 
        console.log('GameScene: preload');
        console.log("GameScene Preload: Arrow texture exists:", this.textures.exists('arrow'));
        console.log("GameScene Preload: Forest texture exists:", this.textures.exists('forest'));
        console.log("GameScene Preload: Souls_green texture exists:", this.textures.exists('souls_green'));
    }

    create() {
        console.log('GameScene: create. Player Faction:', this.playerFaction);
        this.gameTime = 0; this.gameOver = false; 

        // Groups
        this.units = this.add.group();
        this.enemies = this.add.group();
        this.buildings = this.add.group(); 
        this.obstacles = this.add.group({ classType: PhaserObstacle });
        this.projectiles = this.add.group({ classType: PhaserProjectile, runChildUpdate: true });
        this.enemyProjectiles = this.add.group({ classType: PhaserProjectile, runChildUpdate: true });
        this.playerUnits = this.add.group(); 
        console.log("GameScene: Player units group created.");
        
        this.souls = this.add.group({ 
            classType: PhaserSoul,
            runChildUpdate: false, 
            createCallback: function (soul) {
                if (!soul.body && soul.scene.physics) { 
                    soul.scene.physics.add.existing(soul);
                }
                if (soul.body) {
                    soul.initializePhysics(); 
                } else { 
                    soul.scene.time.delayedCall(10, () => {
                        if (!soul.body && soul.scene.physics) soul.scene.physics.add.existing(soul); 
                        if (soul.body) soul.initializePhysics();
                        else console.error("Soul body still not ready after delay in group createCallback.");
                    });
                }
            }
        });
        console.log("GameScene: Souls group created.");

        // Background
        if (this.textures.exists('ground_texture_for_tilesprite')) {
            this.backgroundTile = this.add.tileSprite(0, 0, this.CONFIG.worldWidth, this.CONFIG.worldHeight, 'ground_texture_for_tilesprite').setOrigin(0, 0).setDepth(-10);
        } else { this.cameras.main.setBackgroundColor('#225522'); }

        // Obstacles
        const forestTextureKey = 'forest';
        if (this.textures.exists(forestTextureKey)) {
            [{ x: 300, y: 200 }, { x: 350, y: 220 }, { x: 800, y: 600 }, { x: 850, y: 580 }, { x: 750, y: 620 },
             { x: 400, y: 800 }, { x: 450, y: 820 }, { x: 1200, y: 300 }, { x: 1250, y: 320 }, { x: 1150, y: 330 }
            ].forEach(pos => this.obstacles.add(new PhaserObstacle(this, pos.x, pos.y, 'forest', forestTextureKey), true));
        } else { console.warn("GameScene: Texture 'forest' not found for obstacles."); }

        // Player King
        let playerKingTextureKey = `factions_${this.playerFaction}_king`;
        if (!this.textures.exists(playerKingTextureKey)) {
            this.playerFaction = 'human'; playerKingTextureKey = 'factions_human_king';
        }
        if (this.textures.exists(playerKingTextureKey)) {
            this.playerKing = new PhaserUnit(this, 400, 300, this.playerFaction, 'king', 1, playerKingTextureKey);
            this.units.add(this.playerKing);
            this.playerKing.speed = this.CONFIG.playerSpeed;
            this.playerKing.dashTimer = this.CONFIG.dashCooldown;
            this.playerKing.lastDirection = { x: 0, y: 1 };
            this.playerKing.shieldCooldownTimer = this.CONFIG.shieldAbilityCooldown;
            this.playerKing.shieldTimer = 0; this.playerKing.isShieldActive = false;
            this.playerKing.isDashing = false; this.playerKing.currentDashTime = 0;
            this.playerKing.playerAttackTimer = this.CONFIG.playerAttackCooldown;
            this.playerKing.playerRangedAttackTimer = this.CONFIG.playerRangedAttackCooldown;
            this.playerKing.soulsCollected = 0; 
            // Initialize player's melee and ranged damage based on CONFIG (will be updated by upgrades)
            this.playerKing.meleeDamage = this.CONFIG.playerMeleeDamage;
            this.playerKing.rangedDamage = this.CONFIG.playerProjectileDamage;


            if (this.playerKing.body) {
                this.cameras.main.startFollow(this.playerKing, true, 0.08, 0.08).setBounds(0, 0, this.CONFIG.worldWidth, this.CONFIG.worldHeight).setZoom(this.CONFIG.gameZoom);
            } else { 
                 this.time.delayedCall(100, () => { 
                    if (this.playerKing && this.playerKing.body) this.cameras.main.startFollow(this.playerKing, true, 0.08, 0.08).setBounds(0, 0, this.CONFIG.worldWidth, this.CONFIG.worldHeight).setZoom(this.CONFIG.gameZoom);
                    else console.error("GameScene: Player King body STILL not available.");
                });
            }
        } else { console.error('GameScene: Critical - Default texture for playerKing not found.'); return; }

        // Spawn Enemy NPCs
        const enemyFaction = this.playerFaction === 'human' ? 'orc' : 'human';
        const enemyTextureKey = `factions_${enemyFaction}_level1`;
        if (this.textures.exists(enemyTextureKey)) {
            [{x: 600, y: 300}, {x: 700, y: 400}].forEach(pos => {
                const enemy = new PhaserUnit(this, pos.x, pos.y, enemyFaction, 'level1', 1, enemyTextureKey);
                this.units.add(enemy); this.enemies.add(enemy);
            });
        } else { console.warn(`GameScene: Texture for enemy ${enemyTextureKey} not found.`); }

        // Collision setup
        this.physics.add.collider(this.units, this.obstacles);
        this.physics.add.collider(this.projectiles, this.obstacles, this.handleProjectileObstacleCollision, null, this);
        this.physics.add.overlap(this.projectiles, this.enemies, this.handleProjectileEnemyCollision, null, this);
        this.physics.add.overlap(this.playerKing, this.enemyProjectiles, this.handlePlayerHitByProjectile, null, this);
        this.physics.add.overlap(this.playerKing, this.souls, this.handlePlayerSoulCollision, null, this); 

        // Inputs
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X); 
        this.keyUpgradeDamage = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE); // Key '1'
        this.keyUpgradeHp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);     // Key '2'
        console.log("GameScene: Input keys initialized (Movement, Actions, Spawn, Upgrades).");


        // Touch Controls (simplified setup)
        const joystickContainer = document.getElementById("joystickContainer");
        const joystickKnob = document.getElementById("joystickKnob");
        if (joystickContainer && joystickKnob) { /* ... existing joystick setup ... */ }
        const addTouchControl = (buttonId, pressFlagSetter) => {
            const btn = document.getElementById(buttonId);
            if (btn) btn.addEventListener("touchstart", e => { e.preventDefault(); pressFlagSetter(true); }, { passive: false });
            else console.warn(`GameScene: Button ${buttonId} not found.`);
        };
        addTouchControl("btn-dash", (val) => this.dashButtonPressed = val);
        addTouchControl("btn-shield", (val) => this.shieldButtonPressed = val);
        addTouchControl("btn-attack", (val) => this.attackButtonPressed = val);
        addTouchControl("btn-ranged-attack", (val) => this.rangedAttackButtonPressed = val);

        // Launch UIScene & Events
        this.scene.launch('UIScene');
        if (this.playerKing) { 
            this.events.emit('playerHealthChanged', this.playerKing.hp); 
            this.events.emit('playerSoulsChanged', this.playerKing.soulsCollected); 
        }
        this.events.on('playerDied', this.handlePlayerDeath, this);
    }

    handleProjectileEnemyCollision(projectile, enemy) { 
        if (!projectile.active || !enemy.active) return; 
        this.sound.play('sfx_projectile_hit');
        enemy.takeDamage(projectile.damage); 
        projectile.setActive(false).setVisible(false);
        projectile.body.enable = false; 
        this.time.delayedCall(100, () => projectile.destroy()); 
    }

    handleProjectileObstacleCollision(projectile, obstacle) {
        if (!projectile.active) return; 
        this.sound.play('sfx_projectile_hit');
        projectile.setActive(false).setVisible(false);
        projectile.body.enable = false;
        this.time.delayedCall(100, () => projectile.destroy()); 
    }
    
    handlePlayerHitByProjectile(player, projectile) {
        if (!projectile.active || !player.active) return;
        this.sound.play('sfx_projectile_hit');
        player.takeDamage(projectile.damage); 
        projectile.setActive(false).setVisible(false);
        projectile.body.enable = false;
        this.time.delayedCall(100, () => projectile.destroy());
    }

    handlePlayerSoulCollision(player, soul) {
        if (!soul.active || !player.active) return;
        console.log("Player collected a soul.");
        player.soulsCollected = (player.soulsCollected || 0) + 1;
        console.log("Total souls collected:", player.soulsCollected);
        this.events.emit('playerSoulsChanged', player.soulsCollected); 
        soul.setActive(false).setVisible(false);
        if (soul.body) soul.body.enable = false;
        this.time.delayedCall(100, () => soul.destroy()); 
    }

    handlePlayerDeath() { 
        this.gameOver = true; 
        if (window.HtmlMenuManager) { window.HtmlMenuManager.showGameOverMenu(); }
        const joystickContainer = document.getElementById('joystickContainer');
        if (joystickContainer) joystickContainer.style.display = 'none';
        const actionButtons = document.getElementById('actionButtons');
        if (actionButtons) actionButtons.style.display = 'none';
        const gameUI = document.getElementById('gameUI');
        if (gameUI) gameUI.style.display = 'none';
        this.scene.pause(); 
        if (this.scene.manager.keys['UIScene']) { this.scene.pause('UIScene'); }
    }

    shutdown() { this.events.off('playerDied', this.handlePlayerDeath, this); }
    destroy() { this.shutdown(); super.destroy(); }

    update(time, delta) { 
        if (this.gameOver || !this.playerKing || !this.playerKing.active) {
            this.enemies.getChildren().forEach(e => { if (e.active && e.body) e.body.setVelocity(0,0); });
            this.playerUnits.getChildren().forEach(unit => { if (unit.active && unit.body) unit.body.setVelocity(0,0); }); 
            return;
        }
        this.gameTime += delta;
        this.playerKing.playerAttackTimer += delta; 
        this.playerKing.playerRangedAttackTimer += delta; 
        if (this.playerKing.dashTimer < this.CONFIG.dashCooldown) this.playerKing.dashTimer += delta;
        if (!this.playerKing.isShieldActive && this.playerKing.shieldCooldownTimer < this.CONFIG.shieldAbilityCooldown) this.playerKing.shieldCooldownTimer += delta;
        
        let velocityX = 0; let velocityY = 0;
        if (this.keyW.isDown) velocityY = -1; if (this.keyS.isDown) velocityY = 1;
        if (this.keyA.isDown) velocityX = -1; if (this.keyD.isDown) velocityX = 1;
        if (Math.abs(this.joystickVector.x) > 0.1 || Math.abs(this.joystickVector.y) > 0.1) {
            velocityX = this.joystickVector.x; velocityY = this.joystickVector.y;
        }
        if (!this.playerKing.isDashing) {
            if (velocityX !== 0 || velocityY !== 0) {
                const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
                this.playerKing.body.setVelocity(velocityX / magnitude * this.CONFIG.playerSpeed, velocityY / magnitude * this.CONFIG.playerSpeed);
                this.playerKing.lastDirection = { x: velocityX / magnitude, y: velocityY / magnitude };
            } else { this.playerKing.body.setVelocity(0, 0); }
        }
        
        if ((Phaser.Input.Keyboard.JustDown(this.keySpace) || this.dashButtonPressed) && 
            this.playerKing.dashTimer >= this.CONFIG.dashCooldown && !this.playerKing.isDashing) {
            const dashVelocity = this.CONFIG.dashDistance / (this.CONFIG.dashDuration / 1000); 
            if (this.playerKing.lastDirection.x !== 0 || this.playerKing.lastDirection.y !== 0) {
                this.playerKing.body.setVelocity(this.playerKing.lastDirection.x * dashVelocity, this.playerKing.lastDirection.y * dashVelocity);
                this.sound.play('sfx_dash'); 
                this.playerKing.isDashing = true; this.playerKing.dashTimer = 0; 
                this.playerKing.currentDashTime = 0; 
                if(this.dashButtonPressed) this.dashButtonPressed = false; 
            }
        }
        if (this.playerKing.isDashing) {
            this.playerKing.currentDashTime += delta;
            if (this.playerKing.currentDashTime >= this.CONFIG.dashDuration) {
                this.playerKing.isDashing = false; this.playerKing.currentDashTime = 0;
            }
        }
        if (this.playerKing.isShieldActive) {
            this.playerKing.shieldTimer -= delta;
            if (this.playerKing.shieldTimer <= 0) this.playerKing.isShieldActive = false;
        }
        if ((Phaser.Input.Keyboard.JustDown(this.keyQ) || this.shieldButtonPressed) && 
            !this.playerKing.isShieldActive && this.playerKing.shieldCooldownTimer >= this.CONFIG.shieldAbilityCooldown) {
            this.sound.play('sfx_shield_up'); 
            this.playerKing.isShieldActive = true; this.playerKing.shieldTimer = this.CONFIG.shieldAbilityDuration;
            this.playerKing.shieldCooldownTimer = 0;
            if(this.shieldButtonPressed) this.shieldButtonPressed = false;
        }
        if ((Phaser.Input.Keyboard.JustDown(this.keyE) || this.attackButtonPressed) && this.playerKing.playerAttackTimer >= this.CONFIG.playerAttackCooldown) {
            this.sound.play('sfx_melee_swing'); 
            this.playerKing.playerAttackTimer = 0; 
            const attackWidth = this.CONFIG.playerMeleeRange; const attackHeight = this.playerKing.height * 0.8; 
            let attackX = this.playerKing.x;
            if (this.playerKing.facingDirection === -1) { attackX -= (this.playerKing.width / 2) + (attackWidth / 2) -10; } 
            else { attackX += (this.playerKing.width / 2) + (attackWidth / 2) -10; }
            const attackZone = new Phaser.Geom.Rectangle(attackX - attackWidth / 2, this.playerKing.y - attackHeight / 2, attackWidth, attackHeight);
            this.enemies.getChildren().forEach(enemy => {
                if (enemy.active) { 
                    if (Phaser.Geom.Intersects.RectangleToRectangle(attackZone, enemy.getBounds())) {
                        enemy.takeDamage(this.playerKing.meleeDamage); // Use playerKing's meleeDamage
                        enemy.setTint(0xff0000); 
                        this.time.delayedCall(100, () => { if (enemy.active) enemy.clearTint(); });
                    }
                }
            });
            if (this.attackButtonPressed) this.attackButtonPressed = false; 
        }
        if ((Phaser.Input.Keyboard.JustDown(this.keyR) || this.rangedAttackButtonPressed) && this.playerKing.playerRangedAttackTimer >= this.CONFIG.playerRangedAttackCooldown) {
            this.sound.play('sfx_arrow_shoot'); 
            this.playerKing.playerRangedAttackTimer = 0; 
            const projectileTexture = 'arrow'; 
            if (this.textures.exists(projectileTexture)) {
                const spawnX = this.playerKing.x + this.playerKing.lastDirection.x * (this.playerKing.width / 2 + 5);
                const spawnY = this.playerKing.y + this.playerKing.lastDirection.y * (this.playerKing.height / 2 + 5);
                const projectile = this.projectiles.get(spawnX, spawnY, projectileTexture);
                if (projectile) { 
                    projectile.setActive(true).setVisible(true);
                    if (projectile.body) { projectile.body.enable = true; projectile.body.reset(spawnX, spawnY); } 
                    else { this.physics.add.existing(projectile); }
                    projectile.launch(this.playerKing.lastDirection.x, this.playerKing.lastDirection.y, this.CONFIG.playerProjectileSpeed, this.playerKing.rangedDamage); // Use playerKing's rangedDamage
                }
            } else { console.warn("GameScene: Projectile texture 'arrow' not found for player ranged attack."); }
            if (this.rangedAttackButtonPressed) this.rangedAttackButtonPressed = false; 
        }
        
        // Player Unit Spawning Logic
        if (Phaser.Input.Keyboard.JustDown(this.keyX)) {
            if (this.playerKing.soulsCollected >= this.CONFIG.spawnUnitSoulCost) {
                this.playerKing.soulsCollected -= this.CONFIG.spawnUnitSoulCost;
                this.events.emit('playerSoulsChanged', this.playerKing.soulsCollected);
                const offsetX = -50 * (this.playerKing.flipX ? -1 : 1); 
                const spawnX = this.playerKing.x + offsetX;
                const spawnY = this.playerKing.y + 20;
                const unitTextureKey = `factions_${this.playerFaction}_level1`;
                if (this.textures.exists(unitTextureKey)) {
                    const newUnit = new PhaserUnit(this, spawnX, spawnY, this.playerFaction, 'level1', 1, unitTextureKey);
                    this.units.add(newUnit);      
                    this.playerUnits.add(newUnit); 
                    this.sound.play('sfx_spawn_unit'); 
                } else {
                    console.warn(`GameScene: Texture key ${unitTextureKey} not found for spawning unit.`);
                    this.playerKing.soulsCollected += this.CONFIG.spawnUnitSoulCost; 
                    this.events.emit('playerSoulsChanged', this.playerKing.soulsCollected);
                }
            } else {
                console.log("GameScene: Not enough souls to spawn unit.");
            }
        }

        // AI Updates
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active && typeof enemy.updateAI === 'function') {
                enemy.updateAI(time, delta, this.playerKing, this.playerUnits); 
            }
        });

        this.playerUnits.getChildren().forEach(friendlyUnit => {
            if (friendlyUnit.active && typeof friendlyUnit.updateAI === 'function') { 
                friendlyUnit.updateAI(time, delta, this.playerKing, this.enemies); 
            }
        });

        // --- Player King Upgrades ---
        // Upgrade Melee Damage (Key 1)
        if (Phaser.Input.Keyboard.JustDown(this.keyUpgradeDamage)) {
            if (this.playerKing.soulsCollected >= this.CONFIG.upgradePlayerDamageCost) {
                this.playerKing.soulsCollected -= this.CONFIG.upgradePlayerDamageCost;
                this.events.emit('playerSoulsChanged', this.playerKing.soulsCollected);

                // Note: playerKing.meleeDamage was initialized from CONFIG.playerMeleeDamage
                // We should update the playerKing's instance property.
                this.playerKing.meleeDamage += this.CONFIG.upgradePlayerDamageAmount; 
                
                this.sound.play('sfx_upgrade_success');
                console.log(`Player King Melee Damage upgraded to: ${this.playerKing.meleeDamage}. Souls: ${this.playerKing.soulsCollected}`);
                // Optionally, briefly show a text message on screen via UIScene
                // this.events.emit('showTemporaryMessage', `Damage Upgraded! (${this.playerKing.meleeDamage})`);
            } else {
                this.sound.play('sfx_cannot_afford');
                console.log("Not enough souls to upgrade damage.");
                // this.events.emit('showTemporaryMessage', 'Not Enough Souls!');
            }
        }

        // Upgrade Max HP (Key 2)
        if (Phaser.Input.Keyboard.JustDown(this.keyUpgradeHp)) {
            if (this.playerKing.soulsCollected >= this.CONFIG.upgradePlayerMaxHpCost) {
                this.playerKing.soulsCollected -= this.CONFIG.upgradePlayerMaxHpCost;
                this.events.emit('playerSoulsChanged', this.playerKing.soulsCollected);

                this.playerKing.maxHp += this.CONFIG.upgradePlayerMaxHpAmount;
                this.playerKing.hp += this.CONFIG.upgradePlayerMaxHpAmount; // Heal/increase current HP
                // Ensure HP doesn't exceed new maxHp 
                if (this.playerKing.hp > this.playerKing.maxHp) {
                    this.playerKing.hp = this.playerKing.maxHp;
                }
                this.events.emit('playerHealthChanged', this.playerKing.hp); // Update HUD

                this.sound.play('sfx_upgrade_success');
                console.log(`Player King Max HP upgraded to: ${this.playerKing.maxHp}. Current HP: ${this.playerKing.hp}. Souls: ${this.playerKing.soulsCollected}`);
                // this.events.emit('showTemporaryMessage', `Max HP Upgraded! (${this.playerKing.maxHp})`);
            } else {
                this.sound.play('sfx_cannot_afford');
                console.log("Not enough souls to upgrade Max HP.");
                // this.events.emit('showTemporaryMessage', 'Not Enough Souls!');
            }
        }
    }
}
