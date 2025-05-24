// In public/js/phaser/entities/Soul.js
export class PhaserSoul extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, soulType, textureKey) {
        super(scene, x, y, textureKey);
        this.soulType = soulType; // "green", "blue", or "purple"

        scene.add.existing(this);
        scene.physics.add.existing(this); // Enable physics

        this.body.setCollideWorldBounds(true); // Optional: if souls should be contained
        // Souls might be sensors so they trigger collection but don't physically collide
        // this.body.isSensor = true; 
        // Or they might have very light physics interaction
        this.body.setBounce(0.5, 0.5);
        this.body.setDrag(50, 50);
    }
}
