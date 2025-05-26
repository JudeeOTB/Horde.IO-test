// public/js/phaser/entities/Obstacle.js
export class PhaserObstacle extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, obstacleType, textureKey) {
        super(scene, x, y, textureKey);
        this.obstacleType = obstacleType;

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true for static body

        // Optional: Set specific size if texture is too large/small or not representative
        // this.body.setSize(this.width * 0.8, this.height * 0.6); // Example: smaller hitbox
        // this.body.setOffset(this.width * 0.1, this.height * 0.2);
        
        // Ensure it's immovable (static bodies are already, but this reinforces)
        if (this.body) { // Check if body exists before trying to set properties
            this.body.setImmovable(true); 
        }
    }
}
