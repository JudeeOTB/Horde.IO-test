// In public/js/phaser/entities/Unit.js
export class PhaserUnit extends Phaser.GameObjects.Sprite {
    // ... (constructor, preUpdate) ...
    constructor(scene, x, y, faction, unitType, level = 1, textureKey) {
        super(scene, x, y, textureKey);
        this.faction = faction;
        this.unitType = unitType;
        this.level = level;
        // this.hp = 100; // Default HP, adjusted below
        this.facingDirection = 1; // 1 for right, -1 for left
        this.bobbingOffset = 0;
        this.isShieldActive = false; 

        scene.add.existing(this);
        scene.physics.add.existing(this); 

        this.body.setCollideWorldBounds(true);
        
        if (unitType === "king") {
            this.hp = 300;
            this.body.setBounce(0.1, 0.1); 
        } else { // For non-kings like 'level1', 'archer', etc.
            this.hp = 100; // Default HP for non-kings
            this.body.setBounce(0, 0);
        }
        this.body.setDrag(100, 100); 
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.body && this.body.velocity.x !== 0) {
            this.facingDirection = this.body.velocity.x < 0 ? -1 : 1;
        }
        this.flipX = (this.facingDirection === -1);
    }

    takeDamage(amount) {
        if (!this.active) return; // Don't take damage if already inactive

        // Shield logic for playerKing is handled by checking `this === this.scene.playerKing` before applying damage,
        // or more directly, the GameScene attack logic could check playerKing.isShieldActive before even calling takeDamage on self.
        // If this unit is the player and shield is active, this is a redundant check as GameScene should prevent self-damage through shield.
        // However, if NPCs could have shields, this.isShieldActive would be relevant for them.
        // The provided GameScene attack logic doesn't have player self-harm, so shield check here is for external damage sources.
        if (this.isShieldActive) { // Assuming isShieldActive can be true for any unit
            console.log(`${this.faction} ${this.unitType} shielded an attack! HP: ${this.hp}`);
            // Depending on game design, shield might negate all damage, or reduce it.
            // For now, let's assume it negates all damage.
            return; 
        }

        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;

        console.log(`${this.faction} ${this.unitType} took ${amount} damage. HP: ${this.hp}`);

        if (this.scene && this.scene.events && this === this.scene.playerKing) {
            this.scene.events.emit('playerHealthChanged', this.hp);
        }

        if (this.hp <= 0) {
            console.log(`${this.faction} ${this.unitType} died.`);
            this.setActive(false).setVisible(false); 
            
            if (this === this.scene.playerKing) {
                console.log("Player has died. Emitting playerDied event.");
                this.scene.events.emit('playerDied');
            } else {
                // If an enemy died
                console.log("An enemy unit died.");
                if (this.body) this.body.enable = false; // Disable physics body
                // Optionally, remove from groups or destroy after a delay
                // this.scene.time.delayedCall(1000, () => this.destroy(), [], this);
            }
        }
    }
}
