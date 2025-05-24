// In public/js/phaser/entities/Unit.js
export class PhaserUnit extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, faction, unitType, level = 1, textureKey) {
        super(scene, x, y, textureKey);
        this.faction = faction;
        this.unitType = unitType;
        this.level = level;
        this.hp = 100; // Default HP, can be adjusted based on unitType
        this.facingDirection = 1; // 1 for right, -1 for left
        this.bobbingOffset = 0;
        this.isShieldActive = false; // Example property

        // Determine texture key based on convention (e.g., factions_human_king)
        // This constructor now directly receives textureKey, which is simpler.

        scene.add.existing(this);
        scene.physics.add.existing(this); // Enable physics

        this.body.setCollideWorldBounds(true);
        // Example: Make the physics body a bit smaller if needed
        // For units, usually, we want the body to match the sprite size fairly well.
        // Let's assume the default body (matching sprite size) is fine for now.
        // If specific offsets or sizes are needed, they can be set here:
        // this.body.setSize(this.width * 0.8, this.height * 0.8);
        // this.body.setOffset(this.width * 0.1, this.height * 0.1); // Adjust offset if size changes

        // Adjust properties based on unit type, similar to old Unit class
        if (unitType === "king") {
            this.hp = 300;
            // Specific king properties can be set here
            this.body.setBounce(0.1, 0.1); // Slight bounce for kings
        } else if (unitType === "archer") {
            // Archer specific properties
            this.body.setBounce(0, 0);
        } else { // Vassal
            // Vassal specific properties based on level
            this.body.setBounce(0, 0);
        }
        // Common physics properties
        this.body.setDrag(100, 100); // Example drag
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        // Example: simple bobbing animation - visual only, doesn't affect physics body
        // this.bobbingOffset = Math.sin(time / 200) * 2;
        // this.y = this.body.y + this.bobbingOffset; // This would fight physics, better to have a display container if complex bobbing is needed

        // Flip sprite based on facing direction (or velocity if physics-driven)
        if (this.body && this.body.velocity.x !== 0) {
            this.facingDirection = this.body.velocity.x < 0 ? -1 : 1;
        }
        this.flipX = (this.facingDirection === -1);
    }

    // Example method
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            // Handle death, e.g., this.destroy();
            console.log(`${this.faction} ${this.unitType} died.`);
        }
    }
}
