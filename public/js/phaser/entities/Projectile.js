// public/js/phaser/entities/Projectile.js
export class PhaserProjectile extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, textureKey = 'arrow') { // Default textureKey
        super(scene, x, y, textureKey);
        // scene.add.existing(this); // Handled by group.get()
        // scene.physics.add.existing(this); // Handled by group.get()
        
        this.projectileType = textureKey;
        this.speed = 300; // Default speed, can be overridden by launch
        this.damage = 10; // Default damage, will be overridden by launch
        
        // Note: The physics body is expected to be enabled by the Group when 'get' is called
        // and the object is added to the scene. If creating manually, scene.physics.add.existing(this) is needed.
    }

    launch(directionX, directionY, speed, damageValue = 10) { // Added damageValue
        this.damage = damageValue; // Store the damage
        this.speed = speed; // Store speed if needed for other logic

        if (!this.body) {
            // This might happen if the projectile was obtained from a group
            // but not yet added to the physics system by the group, or if created manually
            // without scene.physics.add.existing(this)
            this.scene.physics.world.enable(this); // Ensure body exists
            console.warn("PhaserProjectile: Body was not enabled, explicitly enabled it.");
        }
        
        this.scene.physics.velocityFromAngle(
            Phaser.Math.RadToDeg(Math.atan2(directionY, directionX)), // Angle in degrees
            this.speed, // Use stored speed
            this.body.velocity // Set velocity components
        );

        this.rotation = Math.atan2(directionY, directionX); // Rotate sprite to match direction
        
        this.body.setCollideWorldBounds(true); 
        this.body.onWorldBounds = true; 

        // Remove any existing worldbounds listeners to prevent duplicates if launch is called on a reused projectile
        // Use a bound handler to ensure 'this' context and allow for correct removal
        if (this.worldBoundsHandler) {
            this.body.world.off('worldbounds', this.worldBoundsHandler, this);
        }
        this.worldBoundsHandler = this.handleWorldBoundsCollision.bind(this); // Bind context for the first time or rebind
        this.body.world.on('worldbounds', this.worldBoundsHandler, this);

        console.log(`Projectile launched: speed ${this.speed}, damage ${this.damage}, angle ${this.rotation}`);
    }

    handleWorldBoundsCollision(body, up, down, left, right) { // Parameters are provided by Phaser
        if (body === this.body) { // Check if it's this projectile's body
            console.log('Projectile hit world bounds, deactivating.');
            this.setActive(false).setVisible(false);
            this.body.enable = false; // Important to disable body
            
            // Optionally destroy after a delay
            this.scene.time.delayedCall(100, () => {
                if (this && this.scene) { // Check if projectile and scene still exist
                     this.destroy();
                }
            });
            
            // Clean up the specific listener
            if (this.worldBoundsHandler) {
                this.body.world.off('worldbounds', this.worldBoundsHandler, this);
                delete this.worldBoundsHandler; // Remove the stored handler property
            }
        }
    }
}
