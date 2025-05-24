// In public/js/phaser/entities/Building.js
export class PhaserBuilding extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, buildingType, textureKey) {
        super(scene, x, y, textureKey);
        this.buildingType = buildingType;
        this.hp = 100; // Default HP

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true for static body

        // Example: Set scale or other properties based on buildingType if needed
        // For instance, if different building types have different default sizes
        // not inherent in their sprite textures.
        // For now, we assume the texture itself has the correct visual size.
        // this.setScale(1); // Default scale
    }

    // Example method
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            // Handle destruction, e.g., this.destroy();
            console.log(`Building ${this.buildingType} destroyed.`);
        }
    }
}
