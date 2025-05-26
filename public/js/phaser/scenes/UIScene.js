// public/js/phaser/scenes/UIScene.js
export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false }); 
        this.gameScene = null;
        this.playerHealthText = null;
        this.soulsText = null; // New text element for souls
    }

    preload() {
        console.log('UIScene: preload');
    }

    create() {
        console.log('UIScene: create');
        this.gameScene = this.scene.get('GameScene'); 

        // Player Health Display (as before)
        this.playerHealthText = this.add.text(20, 20, 'HP: ---', { 
            fontSize: '24px', fontFamily: 'Cinzel', fill: '#ffffff', stroke: '#000000', strokeThickness: 4 
        });

        // Souls Collected Display
        this.soulsText = this.add.text(20, 50, 'Souls: 0', { // Position below health text
            fontSize: '24px', fontFamily: 'Cinzel', fill: '#ffffff', stroke: '#000000', strokeThickness: 4 
        });

        // Event Listeners from GameScene
        if (this.gameScene && this.gameScene.events) {
            // Health
            this.gameScene.events.on('playerHealthChanged', this.updateHealthDisplay, this);
            // Souls
            this.gameScene.events.on('playerSoulsChanged', this.updateSoulsDisplay, this); // Event name from GameScene
            console.log('UIScene: Subscribed to playerHealthChanged and playerSoulsChanged events.');

            // Initial display based on current GameScene state (if playerKing exists)
            if (this.gameScene.playerKing) {
                this.updateHealthDisplay(this.gameScene.playerKing.hp);
                // Assuming soulsCollected is on playerKing as per previous subtask report for GameScene
                this.updateSoulsDisplay(this.gameScene.playerKing.soulsCollected || 0); 
            }
        } else {
            console.warn('UIScene: Could not subscribe to GameScene events immediately.');
            // Fallback delayed subscription (as was done for health)
            this.time.delayedCall(500, () => {
                // Re-get gameScene in case it wasn't fully ready during initial create
                if (!this.gameScene) this.gameScene = this.scene.get('GameScene'); 

                if (this.gameScene && this.gameScene.events) {
                    if (!this.gameScene.events.listenerCount('playerHealthChanged')) { // Check to avoid double subscription
                        this.gameScene.events.on('playerHealthChanged', this.updateHealthDisplay, this);
                        console.log('UIScene: Subscribed to playerHealthChanged (delayed).');
                    }
                    if (!this.gameScene.events.listenerCount('playerSoulsChanged')) { // Check to avoid double subscription
                        this.gameScene.events.on('playerSoulsChanged', this.updateSoulsDisplay, this);
                        console.log('UIScene: Subscribed to playerSoulsChanged (delayed).');
                    }
                    // Attempt to update displays again with current data if playerKing exists
                    if (this.gameScene.playerKing) {
                        this.updateHealthDisplay(this.gameScene.playerKing.hp);
                        this.updateSoulsDisplay(this.gameScene.playerKing.soulsCollected || 0);
                    }
                } else {
                    console.warn('UIScene: Still cannot subscribe to GameScene events after delay.');
                }
            });
        }
    }

    updateHealthDisplay(hp) {
        if (this.playerHealthText) {
            this.playerHealthText.setText('HP: ' + hp);
        }
    }

    updateSoulsDisplay(soulsCount) {
        if (this.soulsText) {
            this.soulsText.setText('Souls: ' + soulsCount);
            console.log('UIScene: Souls display updated to', soulsCount);
        }
    }

    shutdown() {
        console.log('UIScene: shutdown called.');
        if (this.gameScene && this.gameScene.events) {
            this.gameScene.events.off('playerHealthChanged', this.updateHealthDisplay, this);
            this.gameScene.events.off('playerSoulsChanged', this.updateSoulsDisplay, this); // Unsubscribe
            console.log('UIScene: Unsubscribed from GameScene events.');
        }
        // Nullify references to Phaser objects to help garbage collection
        if(this.playerHealthText) {
            this.playerHealthText.destroy(); // Explicitly destroy text objects
            this.playerHealthText = null;
        }
        if(this.soulsText) {
            this.soulsText.destroy(); // Explicitly destroy text objects
            this.soulsText = null;
        }
        this.gameScene = null; // Nullify scene reference
        // super.shutdown(); // Call parent shutdown method if extending a class that requires it. Phaser.Scene does.
    }
    
    // Phaser scenes automatically call shutdown on destroy, but if we want to ensure it's called:
    destroy() {
        this.shutdown(); // Ensure our custom shutdown logic is called
        super.destroy(); // Call the parent class's destroy method
    }
}
