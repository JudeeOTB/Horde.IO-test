// public/js/phaser/entities/Projectile.js
export class PhaserProjectile extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, textureKey = 'arrow') { // Default textureKey
        super(scene, x, y, textureKey);
        // scene.add.existing(this); // Handled by group.get()
        // scene.physics.add.existing(this); // Handled by group.get()
        
        this.projectileType = textureKey;
        this.damage = 10; // Default, can be overridden by config
        this.speed = 300; // Default speed
        
        // Note: The physics body is expected to be enabled by the Group when 'get' is called
        // and the object is added to the scene. If creating manually, scene.physics.add.existing(this) is needed.
    }

    launch(directionX, directionY, speed) {
        if (!this.body) {
            // This might happen if the projectile was obtained from a group
            // but not yet added to the physics system by the group, or if created manually
            // without scene.physics.add.existing(this)
            this.scene.physics.world.enable(this); // Ensure body exists
            console.warn("PhaserProjectile: Body was not enabled, explicitly enabled it.");
        }
        
        this.speed = speed; // Store speed if needed for other logic

        this.scene.physics.velocityFromAngle(
            Phaser.Math.RadToDeg(Math.atan2(directionY, directionX)), // Angle in degrees
            speed,
            this.body.velocity // Set velocity components
        );

        this.rotation = Math.atan2(directionY, directionX); // Rotate sprite to match direction
        
        // It's generally better to set these once, perhaps when the group adds the physics body.
        // If the projectile is reused, these might not need to be set every launch unless they change.
        this.body.setCollideWorldBounds(true); 
        this.body.onWorldBounds = true; 

        // Make sure we only add one listener, or manage listeners if launch can be called multiple times on same instance
        // A common pattern for pooled objects is to set up listeners once.
        // If using group.get() and recycling, this listener might be added multiple times if not careful.
        // However, for a fresh projectile or one fully reset, this is okay.
        // A simple flag could prevent re-adding: if (!this.worldBoundsListener) { ... this.worldBoundsListener = true; }
        
        // Remove any existing worldbounds listeners to prevent duplicates if launch is called on a reused projectile
        if (this.body.world.listeners('worldbounds')) {
             this.body.world.off('worldbounds', this.handleWorldBoundsCollision, this); // Use a named handler
        }
        this.worldBoundsHandler = this.handleWorldBoundsCollision.bind(this); // Bind context
        this.body.world.on('worldbounds', this.worldBoundsHandler, this);

        console.log(`Projectile launched: speed ${speed}, angle ${this.rotation}`);
    }

    handleWorldBoundsCollision(body, up, down, left, right) {
        if (body === this.body) { // Check if it's this projectile's body
            console.log('Projectile hit world bounds, deactivating.');
            this.setActive(false).setVisible(false);
            this.body.enable = false; // Important to disable body
            
            // Optionally destroy after a delay, useful if you want to see it stop at bounds first
            // Or if the group manages destruction/pooling, this might not be needed here.
            this.scene.time.delayedCall(100, () => {
                if (this.scene) { // Check if scene still exists (e.g. if game is shutting down)
                     this.destroy();
                }
            });
            
            // Clean up the specific listener to avoid it being called again for this instance
            // if the body somehow remains in the physics world temporarily
            this.body.world.off('worldbounds', this.worldBoundsHandler, this);
        }
    }
    
    // preUpdate is useful for custom logic not handled by physics, e.g., lifespan
    // preUpdate(time, delta) {
    //     super.preUpdate(time, delta);
    // }
}
