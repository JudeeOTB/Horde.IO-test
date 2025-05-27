// public/js/phaser/entities/Soul.js
export class PhaserSoul extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, soulType = 'green', textureKey = 'souls_green') { // Added soulType for potential future use
        super(scene, x, y, textureKey);
        this.soulType = soulType; 
        this.scene = scene;

        // Note: scene.add.existing(this) and scene.physics.add.existing(this)
        // are typically handled by the group's `createCallback` or when `group.get()`
        // adds a new object to the scene that has physics enabled for the group.
        // We will ensure physics is enabled and setup in initializePhysics.
    }

    // Call this method after the soul is created AND its physics body is ready.
    // This will be invoked by the group's createCallback in GameScene.
    initializePhysics() {
        if (!this.body) {
            // If physics wasn't automatically added by the group, add it now.
            // This can happen if the group itself wasn't configured with physics.
            this.scene.physics.add.existing(this);
            if (!this.body) { // Still no body? Something is wrong.
                 console.error("Soul: Cannot initialize physics, body not found even after explicit add.");
                 return;
            }
            console.log("Soul: Physics body manually added in initializePhysics.");
        }
        
        this.body.setCircle(this.width / 2 * 0.8); // Make hitbox circular, slightly smaller than sprite
        this.body.isSensor = true; // For overlap detection, doesn't cause physical collision
        this.body.setCollideWorldBounds(false); // Souls might float off if not collected
        this.body.setAllowGravity(false); // Prevent falling if gravity is ever enabled globally

        // Initial visual effect (e.g., slight upward pop and bobbing)
        this.body.setVelocityY(-30); // Pop up slightly
        this.body.setAngularVelocity(Math.random() * 60 - 30); // Gentle spin

        // Add a tween for bobbing effect
        this.scene.tweens.add({
            targets: this,
            y: this.y - 5, // Bob up by 5 pixels
            duration: 1200, // Slower bob
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Fade in
        this.setAlpha(0);
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 500,
            ease: 'Linear'
        });

        console.log("Soul: initializePhysics completed. Body is sensor:", this.body.isSensor);
    }

    // Optional: preUpdate for custom logic like lifespan
    // preUpdate(time, delta) {
    //     super.preUpdate(time, delta);
    //     // Example: lifespan
    //     // this.lifespan = (this.lifespan || 0) + delta;
    //     // if (this.lifespan > 5000) { // 5 seconds
    //     //     this.setActive(false).setVisible(false);
    //     //     // Pool/destroy logic could go here
    //     // }
    // }
}
