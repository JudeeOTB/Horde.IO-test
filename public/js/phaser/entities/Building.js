// public/js/phaser/entities/Building.js
import * as Phaser from 'phaser';

export class PhaserBuilding extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, buildingType) {
        const textureKey = `buildings_${buildingType}`; // e.g., 'buildings_barn'
        super(scene, x, y, textureKey);
        this.scene = scene;
        this.buildingType = buildingType;
        
        // TODO: Get HP from a config based on buildingType if needed
        this.hp = 100; 
        this.maxHp = 100;

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true for static body
        
        if (this.body) {
            this.body.setImmovable(true);
        } else {
            scene.time.delayedCall(10, () => {
                if (this.body) {
                    this.body.setImmovable(true);
                } else {
                    console.warn(`PhaserBuilding: Body not available for ${this.buildingType} at (${this.x}, ${this.y}) even after delay.`);
                }
            });
        }

        this.healthBarBg = null;
        this.healthBar = null;
        // Set health bar dimensions. Using this.width assumes texture is loaded.
        this.healthBarWidth = this.width > 0 ? this.width * 0.8 : 60; 
        this.healthBarHeight = 8; 
        this.healthBarYOffset = (this.displayHeight / 2) + this.healthBarHeight + 5; // Calculate once for positioning

        this.initHealthBar();
        this.updateHealthBar(); // Initial draw
    }

    initHealthBar() {
        this.healthBarBg = this.scene.add.graphics();
        this.healthBar = this.scene.add.graphics();
        // Set depth to be above this building sprite.
        // Assuming building depth is default 0 or set elsewhere.
        this.healthBarBg.setDepth(this.depth + 1); 
        this.healthBar.setDepth(this.depth + 2);   

        this.healthBarBg.setVisible(false); // Initially hide
        this.healthBar.setVisible(false);
    }

    updateHealthBar() {
        if (!this.active || !this.scene) { 
            if(this.healthBarBg) this.healthBarBg.setVisible(false);
            if(this.healthBar) this.healthBar.setVisible(false);
            return;
        }

        this.healthBarBg.clear();
        this.healthBar.clear();

        if (this.hp <= 0) { // Hide if no HP
            this.healthBarBg.setVisible(false);
            this.healthBar.setVisible(false);
            return;
        }
        
        // Ensure visibility if it should be shown
        if (!this.healthBarBg.visible) this.healthBarBg.setVisible(true);
        if (!this.healthBar.visible) this.healthBar.setVisible(true);


        const xPos = this.x - this.healthBarWidth / 2;
        const yPos = this.y - this.healthBarYOffset;

        this.healthBarBg.fillStyle(0x000000, 0.5); // Black background, 50% alpha
        this.healthBarBg.fillRect(xPos, yPos, this.healthBarWidth, this.healthBarHeight);

        const healthPercentage = this.hp / this.maxHp;
        let barColor = 0x00ff00; // Green
        if (healthPercentage < 0.3) {
            barColor = 0xff0000; // Red
        } else if (healthPercentage < 0.6) {
            barColor = 0xffff00; // Yellow
        }

        this.healthBar.fillStyle(barColor, 1);
        this.healthBar.fillRect(xPos, yPos, this.healthBarWidth * healthPercentage, this.healthBarHeight);
    }
    
    preUpdate(time, delta) {
        // Phaser.GameObjects.Sprite.prototype.preUpdate.call(this, time, delta); // If extending a class with its own preUpdate

        if (!this.scene || !this.active) { // Check if scene exists and sprite is active
            if (this.healthBarBg && this.healthBarBg.visible) this.healthBarBg.setVisible(false);
            if (this.healthBar && this.healthBar.visible) this.healthBar.setVisible(false);
            return;
        }
        
        // For static buildings, health bar position only needs update if building itself moved (unlikely)
        // or if HP changed through means other than takeDamage (also unlikely for simple setup).
        // Main role here is to ensure visibility matches building state.
        if (this.visible && this.hp > 0) {
            if (this.healthBarBg && !this.healthBarBg.visible) this.healthBarBg.setVisible(true);
            if (this.healthBar && !this.healthBar.visible) this.healthBar.setVisible(true);
            // If there's any chance the building's displayHeight or y position could change dynamically
            // (e.g., animations, scaling), recalculate healthBarYOffset or call updateHealthBar here.
            // For now, assuming they are static once created.
            // this.updateHealthBar(); // Uncomment if position needs constant updates
        } else {
            if (this.healthBarBg && this.healthBarBg.visible) this.healthBarBg.setVisible(false);
            if (this.healthBar && this.healthBar.visible) this.healthBar.setVisible(false);
        }
    }

    takeDamage(amount) {
        if (!this.active || this.hp <= 0) return;

        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;

        this.updateHealthBar();
        
        this.setTint(0xff0000); // Visual feedback: tint red
        this.scene.time.delayedCall(100, () => {
            if (this.active) this.clearTint(); // Clear tint if still active
        });

        // Placeholder for sound:
        // if (this.scene.sound.get('sfx_building_damage')) {
        //    this.scene.sound.play('sfx_building_damage');
        // }

        if (this.hp <= 0) {
            this.handleDestruction();
        }
    }

    handleDestruction() {
        console.log(`${this.buildingType} at (${this.x.toFixed(0)}, ${this.y.toFixed(0)}) destroyed.`);
        // Placeholder for sound:
        // if (this.scene.sound.get('sfx_building_destroyed')) {
        //    this.scene.sound.play('sfx_building_destroyed');
        // }

        this.setActive(false).setVisible(false);
        if (this.body) {
            this.body.enable = false; 
        }
        
        // Ensure health bars are hidden upon destruction
        if(this.healthBarBg) this.healthBarBg.setVisible(false);
        if(this.healthBar) this.healthBar.setVisible(false);
        
        this.scene.events.emit('buildingDestroyed', this, this.buildingType, { x: this.x, y: this.y });
        
        // Optional: Delay full destruction if needed for animations or other effects
        // this.scene.time.delayedCall(500, () => this.destroy());
    }
    
    destroy(fromScene) {
        if (this.healthBarBg) {
            this.healthBarBg.destroy();
            this.healthBarBg = null;
        }
        if (this.healthBar) {
            this.healthBar.destroy();
            this.healthBar = null;
        }
        
        super.destroy(fromScene);
    }
}
