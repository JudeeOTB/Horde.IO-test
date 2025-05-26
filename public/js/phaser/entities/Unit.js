// public/js/phaser/entities/Unit.js
export class PhaserUnit extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, faction, unitType, level = 1, textureKey) {
        super(scene, x, y, textureKey);
        this.scene = scene; // Store scene reference
        this.faction = faction;
        this.unitType = unitType;
        this.level = level;
        this.hp = (unitType === "king") ? 300 : 100;
        this.facingDirection = 1;
        this.bobbingOffset = 0;
        this.isShieldActive = false; // Player specific usually

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setCollideWorldBounds(true);
        this.body.setDrag(100,100); // Some default drag

        // AI-specific properties for non-player units
        if (this.unitType !== "king") { // Or more specific check like !this.isPlayerControlled
            this.isPlayerControlled = false; // Add a flag
            this.detectionRange = 300;
            this.attackRange = 60; // Similar to player melee
            this.attackDamage = 10;
            this.attackCooldown = 1500; // ms
            this.aiAttackTimer = this.attackCooldown; // Start ready to attack
            this.speed = 70; // NPC speed
            this.body.setBounce(0,0);
        } else {
            this.isPlayerControlled = true;
            this.body.setBounce(0.1,0.1); // Player king bounce
            // Player specific timers are managed in GameScene for now
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.isPlayerControlled) { // Player-controlled flipping
            if (this.body && this.body.velocity.x !== 0) {
                this.facingDirection = this.body.velocity.x < 0 ? -1 : 1;
            }
            this.flipX = (this.facingDirection === -1);
        }
        // For AI, flipX will be handled in updateAI based on player direction
    }
    
    updateAI(time, delta, player) {
        if (!this.active || !player || !player.active) {
            if (this.body) this.body.setVelocity(0, 0); // Stop if inactive or no player
            return;
        }

        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // Update facing direction for AI unit
        if (player.x < this.x) {
            this.flipX = true; // Player is to the left
        } else {
            this.flipX = false; // Player is to the right
        }
        
        this.aiAttackTimer += delta;

        if (distanceToPlayer <= this.attackRange) {
            // In attack range
            this.body.setVelocity(0, 0); // Stop moving
            if (this.aiAttackTimer >= this.attackCooldown) {
                console.log(`${this.faction} ${this.unitType} attacks player!`);
                player.takeDamage(this.attackDamage); // Player takes damage
                this.aiAttackTimer = 0; // Reset cooldown
                // Add attack animation/effect here later
            }
        } else if (distanceToPlayer <= this.detectionRange) {
            // In detection range, but not attack range - chase player
            this.scene.physics.moveToObject(this, player, this.speed);
        } else {
            // Outside detection range
            this.body.setVelocity(0, 0); // Stop moving
        }
    }

    takeDamage(amount) {
        if (!this.active) return; 

        if (this.isShieldActive) { 
            console.log(`${this.faction} ${this.unitType} shielded an attack! HP: ${this.hp}`);
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
                console.log("An enemy unit died.");
                if (this.body) this.body.enable = false; 
            }
        }
    }
}
