// public/js/phaser/scenes/UIScene.js
export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false }); // Set active: false initially
        this.gameScene = null;
        this.playerHealthText = null;
    }

    preload() {
        // No assets needed for this basic HUD yet
        console.log('UIScene: preload');
    }

    create() {
        console.log('UIScene: create');
        this.gameScene = this.scene.get('GameScene'); // Get a reference to GameScene

        // Basic text for player health
        this.playerHealthText = this.add.text(20, 20, 'HP: ---', { 
            fontSize: '24px', 
            fontFamily: 'Cinzel', 
            fill: '#ffffff', 
            stroke: '#000000',
            strokeThickness: 4 
        });

        // Listen for health change events from GameScene
        if (this.gameScene && this.gameScene.events) {
            this.gameScene.events.on('playerHealthChanged', this.updateHealthDisplay, this);
            console.log('UIScene: Subscribed to playerHealthChanged event from GameScene.');
        } else {
            console.warn('UIScene: Could not subscribe to playerHealthChanged event. GameScene or its events might not be ready.');
            // Attempt to subscribe later if GameScene wasn't ready
            this.time.delayedCall(500, () => {
                // Check if gameScene is now available and events object exists
                if (this.scene.manager.keys['GameScene'] && this.scene.manager.keys['GameScene'].events) {
                    this.gameScene = this.scene.get('GameScene'); // Re-assign if it wasn't ready initially
                    if (!this.gameScene.events.listenerCount('playerHealthChanged')) {
                         this.gameScene.events.on('playerHealthChanged', this.updateHealthDisplay, this);
                         console.log('UIScene: Subscribed to playerHealthChanged event (delayed).');
                         // Initialize health display in case the event was missed
                         if (this.gameScene.playerKing) {
                            this.updateHealthDisplay(this.gameScene.playerKing.hp);
                         }
                    } else if(this.gameScene.events.listenerCount('playerHealthChanged') > 0) {
                        // Already subscribed or re-subscribed
                         if (this.gameScene.playerKing) {
                            this.updateHealthDisplay(this.gameScene.playerKing.hp);
                         }
                    }
                } else {
                    console.warn('UIScene: Still cannot subscribe to playerHealthChanged event after delay.');
                }
            });
        }
        // Initial health display if playerKing already exists in GameScene
        // This might run before GameScene.create() fully initializes playerKing if UIScene create is faster
        // The delayedCall above is a more robust way to handle initial state if GameScene takes time.
        if (this.gameScene && this.gameScene.playerKing) {
            this.updateHealthDisplay(this.gameScene.playerKing.hp);
        }
    }

    updateHealthDisplay(hp) {
        if (this.playerHealthText) {
            this.playerHealthText.setText('HP: ' + hp);
            console.log('UIScene: Health display updated to', hp);
        }
    }

    // Make sure to clean up the event listener when the scene is shut down
    shutdown() {
        if (this.gameScene && this.gameScene.events) {
            this.gameScene.events.off('playerHealthChanged', this.updateHealthDisplay, this);
            console.log('UIScene: Unsubscribed from playerHealthChanged event.');
        }
        super.shutdown(); // Call parent shutdown method
    }
    
    destroy() {
        // Ensure shutdown logic is called if scene is destroyed directly
        this.shutdown();
        super.destroy();
    }
}
