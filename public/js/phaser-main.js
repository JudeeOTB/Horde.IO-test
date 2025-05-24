const config = {
    type: Phaser.AUTO, // Automatically choose WebGL or Canvas
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'phaser-game', // ID of the div to inject the canvas
    physics: { // Add this physics configuration
        default: 'arcade',
        arcade: {
            // gravity: { y: 0 }, // No global gravity needed for a top-down game usually
            debug: true // Set to true to see physics bodies and vectors
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    console.log("Phaser preload started");

    // Souls
    this.load.image('souls_green', 'assets/sprites/Collectables/Green.png');
    this.load.image('souls_blue', 'assets/sprites/Collectables/Blue.png');
    this.load.image('souls_purple', 'assets/sprites/Collectables/Purple.png');

    // Buildings
    this.load.image('buildings_barn', 'assets/sprites/Buildings/Barn.png');
    this.load.image('buildings_house', 'assets/sprites/Buildings/House.png');
    this.load.image('buildings_tower', 'assets/sprites/Buildings/Tower.png');

    // Factions - Human
    this.load.image('factions_human_king', 'assets/sprites/Units/Mensch/King.png');
    this.load.image('factions_human_level1', 'assets/sprites/Units/Mensch/Level 1.png');
    this.load.image('factions_human_level2', 'assets/sprites/Units/Mensch/level 2.png');
    this.load.image('factions_human_level3', 'assets/sprites/Units/Mensch/level 3.png');

    // Factions - Elf
    this.load.image('factions_elf_king', 'assets/sprites/Units/Elf/King.png');
    this.load.image('factions_elf_level1', 'assets/sprites/Units/Elf/level 1.png');
    this.load.image('factions_elf_level2', 'assets/sprites/Units/Elf/level 2.png');
    this.load.image('factions_elf_level3', 'assets/sprites/Units/Elf/level 3.png');

    // Factions - Orc
    this.load.image('factions_orc_king', 'assets/sprites/Units/Orc/King.png');
    this.load.image('factions_orc_level1', 'assets/sprites/Units/Orc/level 1.png');
    this.load.image('factions_orc_level2', 'assets/sprites/Units/Orc/level 2.png');
    this.load.image('factions_orc_level3', 'assets/sprites/Units/Orc/level 3.png');

    // Weitere Assets
    this.load.image('arrow', 'assets/sprites/ATTACKS/Arrow.png');
    // Corrected key for ground texture, was 'ground', now 'tile_background_01' to match usage.
    // Actual asset path from AssetManager was 'https://opengameart.org/sites/default/files/grass_0.png'
    // For now, let's assume 'tile_background_01' is an alias for the intended ground texture if it was loaded.
    // If 'tile_background_01' was never loaded, this will use the 'ground' texture.
    // For the purpose of this task, I will use the key 'ground' as it was loaded.
    this.load.image('ground_texture_for_tilesprite', 'https://opengameart.org/sites/default/files/grass_0.png');
    this.load.image('slash', 'assets/sprites/ATTACKS/slash.png');
    this.load.image('forest', 'assets/sprites/Trees/angepasst/Forest dark.PNG');

    console.log("Phaser preload finished");
}

// Placeholder for CONFIG values
const CONFIG = {
    worldWidth: 3000,
    worldHeight: 3000,
    gameZoom: 1, // Default zoom
    playerSpeed: 1.35 * 1.88 * 60, // Approx conversion to pixels/sec (original was factor * (deltaTime/16))
    dashCooldown: 5000,
    dashDistance: 200,
    shieldAbilityCooldown: 10000,
    shieldAbilityDuration: 5000,
    // formationUpdateInterval: 10000 // Not used in this step
};

function create() {
    console.log("Phaser game created!");

    // Map/Background Rendering
    if (this.textures.exists('ground_texture_for_tilesprite')) {
        this.backgroundTile = this.add.tileSprite(0, 0, CONFIG.worldWidth, CONFIG.worldHeight, 'ground_texture_for_tilesprite');
        this.backgroundTile.setOrigin(0, 0); // Anchor to top-left
        this.backgroundTile.setDepth(-10); // Ensure it's behind other game objects
        console.log("Background tile sprite created.");
    } else {
        this.cameras.main.setBackgroundColor('#225522');
        console.warn("Ground texture ('ground_texture_for_tilesprite') not found, using solid background color.");
    }
    
    // Time of Day tracking (simplified)
    this.gameTime = 0;


    // Verify loaded assets
    console.log("Souls green loaded:", this.textures.exists('souls_green'));
    console.log("Buildings barn loaded:", this.textures.exists('buildings_barn'));
    console.log("Human king loaded:", this.textures.exists('factions_human_king'));
    console.log("Elf king loaded:", this.textures.exists('factions_elf_king'));
    console.log("Orc king loaded:", this.textures.exists('factions_orc_king'));
    console.log("Arrow loaded:", this.textures.exists('arrow'));
    console.log("Ground loaded:", this.textures.exists('ground'));
    console.log("Slash loaded:", this.textures.exists('slash'));
    console.log("Forest loaded:", this.textures.exists('forest'));

    // Optionally display an image for visual confirmation
    // if (this.textures.exists('factions_human_king')) {
    //     this.add.image(100, 100, 'factions_human_king');
    // }

    // Instantiate PhaserUnit objects
    // Change to Phaser Groups for better management
    this.units = this.add.group();
    this.buildings = this.add.group();
    this.obstacles = this.add.group();
    this.projectiles = this.add.group();
    this.souls = this.add.group();

    console.log("Phaser Groups created for entities.");

    const playerKingKey = 'factions_human_king';
    if (this.textures.exists(playerKingKey)) {
        this.playerKing = new PhaserUnit(this, 400, 300, 'human', 'king', 1, playerKingKey);
        this.units.add(this.playerKing); // Add to the group
        console.log("Player King created at 400,300");

        // Initialize playerKing specific properties (from old Unit.js constructor for king)
        this.playerKing.speed = CONFIG.playerSpeed; // Use speed from CONFIG
        this.playerKing.dashTimer = CONFIG.dashCooldown; // Start ready
        this.playerKing.lastDirection = { x: 0, y: 1 }; // Default direction
        this.playerKing.shieldCooldownTimer = CONFIG.shieldAbilityCooldown; // Start ready
        this.playerKing.shieldTimer = 0;
        this.playerKing.isShieldActive = false;
        // this.playerKing.facingDirection = 1; // Will be set by physics velocity

        // Ensure playerKing body is set before using it for camera
        if (this.playerKing.body) {
            // Camera System
            this.cameras.main.startFollow(this.playerKing, true, 0.08, 0.08); // roundPixels, lerpX, lerpY
            this.cameras.main.setBounds(0, 0, CONFIG.worldWidth, CONFIG.worldHeight);
            this.cameras.main.setZoom(CONFIG.gameZoom); // Apply initial zoom
            console.log("Camera set to follow Player King and bounds set.");
        } else {
            console.error("Player King body not available for camera follow.");
        }

    } else {
        console.error('Texture not found for playerKing:', playerKingKey);
    }

    const humanLevel1Key = 'factions_human_level1';
        this.cameras.main.startFollow(this.playerKing, true, 0.08, 0.08); // roundPixels, lerpX, lerpY
        this.cameras.main.setBounds(0, 0, CONFIG.worldWidth, CONFIG.worldHeight);
        this.cameras.main.setZoom(CONFIG.gameZoom); // Apply initial zoom
        console.log("Camera set to follow Player King and bounds set.");

    } else {
        console.error('Texture not found for playerKing:', playerKingKey);
    }

    const humanLevel1Key = 'factions_human_level1';
    if (this.textures.exists(humanLevel1Key)) {
        const humanVassal = new PhaserUnit(this, 200, 250, 'human', 'level1', 1, humanLevel1Key);
        this.units.add(humanVassal); // Add to group
        console.log("Human Level 1 created at 200,250");
    } else {
        console.error('Texture not found for Human Level 1:', humanLevel1Key);
    }

    const orcLevel1Key = 'factions_orc_level1';
    if (this.textures.exists(orcLevel1Key)) {
        const orcVassal = new PhaserUnit(this, 600, 350, 'orc', 'level1', 1, orcLevel1Key);
        this.units.add(orcVassal); // Add to group
        console.log("Orc Level 1 created at 600,350");
    } else {
        console.error('Texture not found for Orc Level 1:', orcLevel1Key);
    }

    // Building
    const barnBuildingKey = 'buildings_barn';
    if (this.textures.exists(barnBuildingKey)) {
        const barn = new PhaserBuilding(this, 100, 400, 'barn', barnBuildingKey);
        this.buildings.add(barn); // Add to group
        console.log("Barn building created at 100,400");
    } else {
        console.error('Texture not found for Barn Building:', barnBuildingKey);
    }

    // Obstacle
    const forestObstacleKey = 'forest';
    if (this.textures.exists(forestObstacleKey)) {
        const forest = new PhaserObstacle(this, 700, 100, 'forest', forestObstacleKey);
        this.obstacles.add(forest); // Add to group
        console.log("Forest obstacle created at 700,100");
    } else {
        console.error('Texture not found for Forest Obstacle:', forestObstacleKey);
    }

    // Projectile
    const arrowProjectileKey = 'arrow';
    if (this.textures.exists(arrowProjectileKey)) {
        const arrow = new PhaserProjectile(this, 300, 150, 'arrow', arrowProjectileKey);
        this.projectiles.add(arrow); // Add to group
        console.log("Arrow projectile created at 300,150");
    } else {
        console.error('Texture not found for Arrow Projectile:', arrowProjectileKey);
    }

    // Soul
    const greenSoulKey = 'souls_green';
    if (this.textures.exists(greenSoulKey)) {
        const greenSoul = new PhaserSoul(this, 500, 500, 'green', greenSoulKey);
        this.souls.add(greenSoul); // Add to group
        console.log("Green soul created at 500,500");
    } else {
        console.error('Texture not found for Green Soul:', greenSoulKey);
    }

    // Game State Variables
    this.gameOver = false;
    this.playerFaction = 'human'; // Default, can be changed by selection menu later

    // Phaser Keyboard Input
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    console.log("Phaser keyboard inputs initialized.");

    // Mobile Touch Controls - Adapting from InputHandler.js
    this.joystickVector = { x: 0, y: 0 };
    this.dashButtonPressed = false;
    this.shieldButtonPressed = false;

    const joystickContainer = document.getElementById("joystickContainer");
    const joystickKnob = document.getElementById("joystickKnob");
    
    if (joystickContainer && joystickKnob) {
        const joystickMaxRadius = 240; // As per original InputHandler
        const containerRect = () => joystickContainer.getBoundingClientRect();
        
        const resetJoystick = () => {
            this.joystickVector = { x: 0, y: 0 };
            joystickKnob.style.transform = "translate(-50%, -50%)";
        };

        joystickContainer.addEventListener("touchstart", (e) => { 
            e.preventDefault(); 
        }, { passive: false });

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
                distance = joystickMaxRadius;
            }
            joystickKnob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
            this.joystickVector = { x: deltaX / joystickMaxRadius, y: deltaY / joystickMaxRadius };
        }, { passive: false });

        joystickContainer.addEventListener("touchend", (e) => { 
            e.preventDefault(); 
            resetJoystick(); 
        }, { passive: false });
        joystickContainer.addEventListener("touchcancel", (e) => { 
            e.preventDefault(); 
            resetJoystick(); 
        }, { passive: false });
        console.log("Joystick listeners attached.");
    } else {
        console.warn("Joystick HTML elements not found.");
    }

    const addTouchControl = (buttonId, pressFlag, releaseFlag = !pressFlag) => {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.addEventListener("touchstart", e => { 
                e.preventDefault(); 
                if (buttonId === 'btn-dash') this.dashButtonPressed = pressFlag;
                if (buttonId === 'btn-shield') this.shieldButtonPressed = pressFlag;
            }, { passive: false });
            btn.addEventListener("touchend", e => { 
                e.preventDefault(); 
                if (buttonId === 'btn-dash') this.dashButtonPressed = releaseFlag;
                if (buttonId === 'btn-shield') this.shieldButtonPressed = releaseFlag;
            }, { passive: false });
            btn.addEventListener("touchcancel", e => { 
                e.preventDefault(); 
                if (buttonId === 'btn-dash') this.dashButtonPressed = releaseFlag;
                if (buttonId === 'btn-shield') this.shieldButtonPressed = releaseFlag;
            }, { passive: false });
            console.log(`Touch listeners for ${buttonId} attached.`);
        } else {
            console.warn(`Button ${buttonId} not found.`);
        }
    };

    addTouchControl("btn-dash", true, false);
    addTouchControl("btn-shield", true, false);
}

function update(time, delta) {
    // Game loop
    this.gameTime = (this.gameTime || 0) + delta; // Simple game time tracking

    // Time of Day Brightness
    if (this.backgroundTile) {
        let timeOfDay = (this.gameTime / 60000) % 1; // Cycle every 60 seconds for testing
        let brightnessValue = 0.5 + 0.5 * Math.abs(Math.sin(timeOfDay * Math.PI));
        
        const baseColor = 0xffffff; // White
        let r = ((baseColor >> 16) & 0xFF) * brightnessValue;
        let g = ((baseColor >> 8) & 0xFF) * brightnessValue;
        let b = (baseColor & 0xFF) * brightnessValue;
        let tintValue = (Phaser.Math.Clamp(r, 0, 255) << 16) + (Phaser.Math.Clamp(g, 0, 255) << 8) + Phaser.Math.Clamp(b, 0, 255);
        
        this.backgroundTile.setTint(tintValue);
    }

    // Keyboard input logging
    if (this.keyW && this.keyW.isDown) console.log("W key is down");
    if (this.keyA && this.keyA.isDown) console.log("A key is down");
    if (this.keyS && this.keyS.isDown) console.log("S key is down");
    if (this.keyD && this.keyD.isDown) console.log("D key is down");
    if (this.keySpace && Phaser.Input.Keyboard.JustDown(this.keySpace)) console.log("Space key just pressed");
    if (this.keyQ && Phaser.Input.Keyboard.JustDown(this.keyQ)) console.log("Q key just pressed");

    // Touch input logging
    if (this.joystickVector && (this.joystickVector.x !== 0 || this.joystickVector.y !== 0)) {
        console.log("Joystick: ", this.joystickVector);
    }
    if (this.dashButtonPressed) console.log("Dash button pressed (touch)");
    if (this.shieldButtonPressed) console.log("Shield button pressed (touch)");


    // Example: update units if they have an update method
    // Phaser groups handle calling preUpdate on their children if they are active.
    // So, explicit iteration for preUpdate is not strictly necessary here if entities
    // are added to groups and have a preUpdate method.
    // However, custom update logic, especially for the playerKing based on input,
    // will be handled here.

    if (this.playerKing && this.playerKing.body) { // Ensure body exists
        const speed = this.playerKing.speed;
        let velocityX = 0;
        let velocityY = 0;

        // Keyboard movement
        if (this.keyW.isDown) velocityY = -1;
        if (this.keyS.isDown) velocityY = 1;
        if (this.keyA.isDown) velocityX = -1;
        if (this.keyD.isDown) velocityX = 1;
        
        // Joystick movement (overrides keyboard if active)
        if (Math.abs(this.joystickVector.x) > 0.1 || Math.abs(this.joystickVector.y) > 0.1) {
            velocityX = this.joystickVector.x;
            velocityY = this.joystickVector.y;
        }

        // Normalize and set velocity
        const- (this.playerKing.lastDirection.x !== 0 || this.playerKing.lastDirection.y !== 0) {
                this.playerKing.body.setVelocity(this.playerKing.lastDirection.x * dashVelocity, this.playerKing.lastDirection.y * dashVelocity);
                this.playerKing.isDashing = true;
                this.playerKing.dashTimer = 0; // Reset cooldown timer
                this.playerKing.currentDashTime = 0; // Start dash duration timer
                console.log("Player dashed!");
                this.dashButtonPressed = false; // Reset touch button state
            }
        }

        if (this.playerKing.isDashing) {
            this.playerKing.currentDashTime += delta;
            if (this.playerKing.currentDashTime >= dashDuration) {
                this.playerKing.isDashing = false;
                this.playerKing.currentDashTime = 0;
                // Velocity will be reset to normal movement or zero by the main movement logic
            }
        }

        // Shield Logic (remains mostly the same, affects a property on playerKing)
        if (this.playerKing.isShieldActive) {
            this.playerKing.shieldTimer -= delta;
            if (this.playerKing.shieldTimer <= 0) {
                this.playerKing.isShieldActive = false;
                console.log("Shield deactivated (duration)");
            }
        } else {
            this.playerKing.shieldCooldownTimer += delta;
        }

        if ((Phaser.Input.Keyboard.JustDown(this.keyQ) || this.shieldButtonPressed) && !this.playerKing.isShieldActive && this.playerKing.shieldCooldownTimer >= CONFIG.shieldAbilityCooldown) {
            this.playerKing.isShieldActive = true;
            this.playerKing.shieldTimer = CONFIG.shieldAbilityDuration;
            this.playerKing.shieldCooldownTimer = 0;
            console.log("Shield activated!");
            this.shieldButtonPressed = false; // Reset touch button state
        }
    }

    // Projectile updates (example, if they need scene-level logic)
    if (this.projectiles) {
        this.projectiles.getChildren().forEach(projectile => {
            if (projectile.active && typeof projectile.update === 'function') { // Assuming a custom update for non-physics movement
                 projectile.update(time, delta);
            }
        });
    }
}

// Make Phaser entities globally available for now if not using modules for phaser-main.js
// This is already handled by the script tag order in index.html.
// If phaser-main.js were a module, we'd use imports like:
// import { PhaserUnit } from './phaser/entities/Unit.js';
// import { PhaserBuilding } from './phaser/entities/Building.js';
// import { PhaserObstacle } from './phaser/entities/Obstacle.js';
// import { PhaserProjectile } from './phaser/entities/Projectile.js';
// import { PhaserSoul } from './phaser/entities/Soul.js';
