// public/js/phaser/scenes/GameScene.js

// Import Entity classes
import { PhaserUnit } from '../entities/Unit.js';
// import { PhaserBuilding } from '../entities/Building.js'; // Not currently used in create()
// import { PhaserObstacle } from '../entities/Obstacle.js'; // Not currently used in create()
import { PhaserProjectile } from '../entities/Projectile.js';
// import { PhaserSoul } from '../entities/Soul.js';       // Not currently used in create()

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
        this.souls = null;
        this.backgroundTile = null;
        this.gameTime = 0;
        this.gameOver = false; 

        this.keyW = null;
        this.keyA = null;
        this.keyS = null;
        this.keyD = null;
        this.keyE = null; 
        this.keyR = null; 
        this.keySpace = null;
        this.keyQ = null;

        this.attackButtonPressed = false;
        this.rangedAttackButtonPressed = false;
        this.joystickVector = { x: 0, y: 0 };
        this.dashButtonPressed = false;
        this.shieldButtonPressed = false;
    }

    init(data) {
        console.log('GameScene init, data received:', data);
        if (data && data.selectedFaction) {
            this.playerFaction = data.selectedFaction;
        } else {
            this.playerFaction = window.GameSettings ? window.GameSettings.selectedFaction : 'human';
        }
        console.log('GameScene: Player faction set to', this.playerFaction);
    }
    
    CONFIG = {
        worldWidth: 3000,
        worldHeight: 3000,
        gameZoom: 1,
        playerSpeed: 1.35 * 1.88 * 60,
        dashCooldown: 5000, // ms
        dashDistance: 200, // pixels
        dashDuration: 250, // ms - how long the dash velocity is applied
        shieldAbilityCooldown: 10000,
        shieldAbilityDuration: 5000,
        playerMeleeRange: 70, 
        playerMeleeDamage: 25,
        playerAttackCooldown: 500, // General attack cooldown, can be specific
        playerRangedAttackCooldown: 700, // milliseconds
        playerProjectileDamage: 15,
        playerProjectileSpeed: 350, // pixels per second
    };

    preload() { 
        console.log('GameScene: preload');
        console.log("GameScene Preload: Arrow texture exists:", this.textures.exists('arrow'));
    }

    create() {
        console.log('GameScene: create. Player Faction:', this.playerFaction);
        this.gameTime = 0;
        this.gameOver = false; 

        // Groups
        this.units = this.add.group();
        this.enemies = this.add.group();
        this.buildings = this.add.group(); 
        this.obstacles = this.add.group(); 
        this.projectiles = this.add.group({ classType: PhaserProjectile, runChildUpdate: true });
        this.souls = this.add.group();       

        // Background
        if (this.textures.exists('ground_texture_for_tilesprite')) {
            this.backgroundTile = this.add.tileSprite(0, 0, this.CONFIG.worldWidth, this.CONFIG.worldHeight, 'ground_texture_for_tilesprite');
            this.backgroundTile.setOrigin(0, 0).setDepth(-10);
        } else {
            this.cameras.main.setBackgroundColor('#225522');
        }

        // Player King
        let playerKingTextureKey = `factions_${this.playerFaction}_king`;
        if (!this.textures.exists(playerKingTextureKey)) {
            console.warn(`Texture for ${playerKingTextureKey} not found. Defaulting to human king.`);
            this.playerFaction = 'human';
            playerKingTextureKey = 'factions_human_king';
        }
        if (this.textures.exists(playerKingTextureKey)) {
            this.playerKing = new PhaserUnit(this, 400, 300, this.playerFaction, 'king', 1, playerKingTextureKey);
            this.units.add(this.playerKing);
            this.playerKing.speed = this.CONFIG.playerSpeed;
            this.playerKing.dashTimer = this.CONFIG.dashCooldown;
            this.playerKing.lastDirection = { x: 0, y: 1 };
            this.playerKing.shieldCooldownTimer = this.CONFIG.shieldAbilityCooldown;
            this.playerKing.shieldTimer = 0;
            this.playerKing.isShieldActive = false;
            this.playerKing.isDashing = false;
            this.playerKing.currentDashTime = 0;
            this.playerKing.playerAttackTimer = this.CONFIG.playerAttackCooldown;
            this.playerKing.playerRangedAttackTimer = this.CONFIG.playerRangedAttackCooldown;

            if (this.playerKing.body) {
                this.cameras.main.startFollow(this.playerKing, true, 0.08, 0.08);
                this.cameras.main.setBounds(0, 0, this.CONFIG.worldWidth, this.CONFIG.worldHeight);
                this.cameras.main.setZoom(this.CONFIG.gameZoom);
            } else { 
                 this.time.delayedCall(100, () => { 
                    if (this.playerKing && this.playerKing.body) {
                        this.cameras.main.startFollow(this.playerKing, true, 0.08, 0.08);
                        this.cameras.main.setBounds(0, 0, this.CONFIG.worldWidth, this.CONFIG.worldHeight);
                        this.cameras.main.setZoom(this.CONFIG.gameZoom);
                    } else {
                        console.error("GameScene: Player King body STILL not available. Camera not set.");
                    }
                });
            }
        } else {
            console.error('GameScene: Critical - Default texture for playerKing not found:', playerKingTextureKey);
            return;
        }

        // Spawn Enemy NPCs
        const enemyFaction = this.playerFaction === 'human' ? 'orc' : 'human';
        const enemyTextureKey = `factions_${enemyFaction}_level1`;
        if (this.textures.exists(enemyTextureKey)) {
            const enemy1 = new PhaserUnit(this, 600, 300, enemyFaction, 'level1', 1, enemyTextureKey);
            this.units.add(enemy1); this.enemies.add(enemy1); // HP is set in PhaserUnit constructor
            const enemy2 = new PhaserUnit(this, 700, 400, enemyFaction, 'level1', 1, enemyTextureKey);
            this.units.add(enemy2); this.enemies.add(enemy2); // HP is set in PhaserUnit constructor
        } else { console.warn(`GameScene: Texture for enemy ${enemyTextureKey} not found.`); }

        // Inputs
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

        // Touch Controls
        const joystickContainer = document.getElementById("joystickContainer");
        const joystickKnob = document.getElementById("joystickKnob");
        if (joystickContainer && joystickKnob) {
             const joystickMaxRadius = 240;
            const containerRect = () => joystickContainer.getBoundingClientRect();
            const resetJoystick = () => {
                this.joystickVector = { x: 0, y: 0 };
                joystickKnob.style.transform = "translate(-50%, -50%)";
            };
            joystickContainer.addEventListener("touchstart", (e) => { e.preventDefault(); }, { passive: false });
            joystickContainer.addEventListener("touchmove", (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = containerRect();
                const posX = touch.clientX - rect.left;
                const posY = touch.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                let deltaX = posX - centerX;
                let deltaY = posY - centerY;
                let distance = Math.hypot(deltaX, deltaY);
                if (distance > joystickMaxRadius) {
                    deltaX = (deltaX / distance) * joystickMaxRadius;
                    deltaY = (deltaY / distance) * joystickMaxRadius;
                }
                joystickKnob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
                this.joystickVector = { x: deltaX / joystickMaxRadius, y: deltaY / joystickMaxRadius };
            }, { passive: false });
            const endTouch = (e) => { e.preventDefault(); resetJoystick(); };
            joystickContainer.addEventListener("touchend", endTouch, { passive: false });
            joystickContainer.addEventListener("touchcancel", endTouch, { passive: false });
        }
        
        const addTouchControl = (buttonId, pressFlagSetter) => {
            const btn = document.getElementById(buttonId);
            if (btn) {
                btn.addEventListener("touchstart", e => { 
                    e.preventDefault(); 
                    pressFlagSetter(true); 
                }, { passive: false });
                console.log(`GameScene: Touch listeners for ${buttonId} attached.`);
            } else {
                console.warn(`GameScene: Button ${buttonId} not found.`);
            }
        };
        addTouchControl("btn-dash", (val) => this.dashButtonPressed = val);
        addTouchControl("btn-shield", (val) => this.shieldButtonPressed = val);
        addTouchControl("btn-attack", (val) => this.attackButtonPressed = val);
        addTouchControl("btn-ranged-attack", (val) => this.rangedAttackButtonPressed = val);

        // Collision Handlers
        this.physics.add.overlap(this.projectiles, this.enemies, this.handleProjectileEnemyCollision, null, this);

        // Launch UIScene & Events
        this.scene.launch('UIScene');
        if (this.playerKing) { this.events.emit('playerHealthChanged', this.playerKing.hp); }
        this.events.on('playerDied', this.handlePlayerDeath, this);
    }

    handleProjectileEnemyCollision(projectile, enemy) { 
        if (!projectile.active || !enemy.active) return; 
        enemy.takeDamage(this.CONFIG.playerProjectileDamage);
        projectile.setActive(false).setVisible(false);
        projectile.body.enable = false; 
        this.time.delayedCall(100, () => projectile.destroy()); 
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
    shutdown() { 
        this.events.off('playerDied', this.handlePlayerDeath, this); 
    }
    
    destroy() {
        this.shutdown();
        super.destroy();
    }

    update(time, delta) { 
        if (this.gameOver) {
            this.enemies.getChildren().forEach(enemy => {
                if (enemy.active && enemy.body) enemy.body.setVelocity(0,0);
            });
            return;
        }
        if (!this.playerKing || !this.playerKing.active) {
            this.enemies.getChildren().forEach(enemy => {
                if (enemy.active && enemy.body) enemy.body.setVelocity(0,0);
            });
            return;
        }
        this.gameTime += delta;
        // Player Attack Cooldowns
        this.playerKing.playerAttackTimer += delta; 
        this.playerKing.playerRangedAttackTimer += delta; 
        // Player Movement
        const speed = this.playerKing.speed;
        let velocityX = 0; let velocityY = 0;
        if (this.keyW.isDown) velocityY = -1;
        if (this.keyS.isDown) velocityY = 1;
        if (this.keyA.isDown) velocityX = -1;
        if (this.keyD.isDown) velocityX = 1;
        if (Math.abs(this.joystickVector.x) > 0.1 || Math.abs(this.joystickVector.y) > 0.1) {
            velocityX = this.joystickVector.x; velocityY = this.joystickVector.y;
        }
        if (!this.playerKing.isDashing) {
            if (velocityX !== 0 || velocityY !== 0) {
                const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
                this.playerKing.body.setVelocity(velocityX / magnitude * speed, velocityY / magnitude * speed);
                this.playerKing.lastDirection = { x: velocityX / magnitude, y: velocityY / magnitude };
            } else { this.playerKing.body.setVelocity(0, 0); }
        }
        // Dash Logic
        this.playerKing.dashTimer += delta; 
        if ((Phaser.Input.Keyboard.JustDown(this.keySpace) || this.dashButtonPressed) && 
            this.playerKing.dashTimer >= this.CONFIG.dashCooldown && !this.playerKing.isDashing) {
            const dashVelocity = this.CONFIG.dashDistance / (this.CONFIG.dashDuration / 1000); 
            if (this.playerKing.lastDirection.x !== 0 || this.playerKing.lastDirection.y !== 0) {
                this.playerKing.body.setVelocity(this.playerKing.lastDirection.x * dashVelocity, this.playerKing.lastDirection.y * dashVelocity);
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
        // Shield Logic
        if (this.playerKing.isShieldActive) {
            this.playerKing.shieldTimer -= delta;
            if (this.playerKing.shieldTimer <= 0) this.playerKing.isShieldActive = false;
        } else { this.playerKing.shieldCooldownTimer += delta; }
        if ((Phaser.Input.Keyboard.JustDown(this.keyQ) || this.shieldButtonPressed) && 
            !this.playerKing.isShieldActive && this.playerKing.shieldCooldownTimer >= this.CONFIG.shieldAbilityCooldown) {
            this.playerKing.isShieldActive = true; this.playerKing.shieldTimer = this.CONFIG.shieldAbilityDuration;
            this.playerKing.shieldCooldownTimer = 0;
            if(this.shieldButtonPressed) this.shieldButtonPressed = false;
        }
        // Melee Attack Logic
        if ((Phaser.Input.Keyboard.JustDown(this.keyE) || this.attackButtonPressed) && this.playerKing.playerAttackTimer >= this.CONFIG.playerAttackCooldown) {
            this.playerKing.playerAttackTimer = 0; 
            const attackWidth = this.CONFIG.playerMeleeRange; const attackHeight = this.playerKing.height * 0.8; 
            let attackX = this.playerKing.x;
            if (this.playerKing.facingDirection === -1) { attackX -= (this.playerKing.width / 2) + (attackWidth / 2) -10; } 
            else { attackX += (this.playerKing.width / 2) + (attackWidth / 2) -10; }
            const attackZone = new Phaser.Geom.Rectangle(attackX - attackWidth / 2, this.playerKing.y - attackHeight / 2, attackWidth, attackHeight);
            this.enemies.getChildren().forEach(enemy => {
                if (enemy.active) { 
                    const enemyBounds = enemy.getBounds();
                    if (Phaser.Geom.Intersects.RectangleToRectangle(attackZone, enemyBounds)) {
                        enemy.takeDamage(this.CONFIG.playerMeleeDamage);
                        enemy.setTint(0xff0000); 
                        this.time.delayedCall(100, () => { if (enemy.active) enemy.clearTint(); });
                    }
                }
            });
            if (this.attackButtonPressed) this.attackButtonPressed = false; 
        }
        // Ranged Attack Logic
        if ((Phaser.Input.Keyboard.JustDown(this.keyR) || this.rangedAttackButtonPressed) && this.playerKing.playerRangedAttackTimer >= this.CONFIG.playerRangedAttackCooldown) {
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
                    projectile.launch(this.playerKing.lastDirection.x, this.playerKing.lastDirection.y, this.CONFIG.playerProjectileSpeed);
                }
            } else { console.warn("GameScene: Projectile texture 'arrow' not found for ranged attack."); }
            if (this.rangedAttackButtonPressed) this.rangedAttackButtonPressed = false; 
        }
        // Enemy AI Updates
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active && typeof enemy.updateAI === 'function') {
                enemy.updateAI(time, delta, this.playerKing);
            }
        });
    }
}
