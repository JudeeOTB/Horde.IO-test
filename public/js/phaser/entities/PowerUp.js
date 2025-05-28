// public/js/phaser/entities/PowerUp.js
export class PhaserPowerUp extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, textureKey, effectType, duration) {
        super(scene, x, y, textureKey);
        this.scene = scene;
        this.effectType = effectType;
        this.duration = duration;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        if (this.body) {
            this.body.setCircle(this.width / 2); // Assuming square sprite, adjust if not
            this.body.isSensor = true; // Make it a sensor so it triggers overlap but no collision
            this.body.setAllowGravity(false); // Power-ups shouldn't fall
            this.body.setImmovable(true); // Prevent being pushed by other physics bodies
        } else {
            console.error("PhaserPowerUp: Body not created!");
        }
        
        this.setActive(false).setVisible(false); // Initially inactive until spawned by group.get

        // Simple bobbing tween for visual effect
        this.bobTween = scene.tweens.add({
            targets: this,
            y: y - 5, // Bob up by 5 pixels
            duration: 700,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            paused: true // Start paused, will be resumed when power-up becomes active
        });
    }

    // Called when the power-up is obtained from the group and made active
    activate(x, y, textureKey, effectType, duration) {
        this.effectType = effectType;
        this.duration = duration;
        this.setTexture(textureKey); // Set texture if it changed (e.g. using generic class in group)
        this.setPosition(x, y);
        this.setActive(true).setVisible(true);

        if (this.body) {
            this.body.enable = true;
            this.body.reset(x,y); // Ensure physics body is active and at the right spot
        }
        if (this.bobTween) {
            this.bobTween.updateTo('y', y - 5, true); // Update tween's target y
            if (this.bobTween.isPaused()) {
                 this.bobTween.resume();
            }
        }
        console.log(`PowerUp ${this.effectType} activated at (${x}, ${y}) with duration ${this.duration}`);
    }

    // Optional: Override preDestroy to stop tweens or clean up
    preDestroy() {
        if (this.bobTween) {
            this.bobTween.stop();
            this.bobTween.remove(); // Remove from tween manager
            this.bobTween = null;
        }
        super.preDestroy();
    }
}
