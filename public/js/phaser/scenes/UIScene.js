// public/js/phaser/scenes/UIScene.js
export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false }); 
        this.gameScene = null;
        this.playerHealthText = null;
        this.soulsText = null; 
        this.safeZoneText = null;
        this.gameOverText = null;
        this.restartButton = null;
    }

    preload() {
        console.log('UIScene: preload');
    }

    create() {
        console.log('UIScene: create');
        this.gameScene = this.scene.get('GameScene'); 

        // Player Health Display
        this.playerHealthText = this.add.text(20, 20, 'HP: ---', { 
            fontSize: '24px', fontFamily: 'Cinzel', fill: '#ffffff', stroke: '#000000', strokeThickness: 4 
        });

        // Souls Collected Display
        this.soulsText = this.add.text(20, 50, 'Souls: 0', { 
            fontSize: '24px', fontFamily: 'Cinzel', fill: '#ffffff', stroke: '#000000', strokeThickness: 4 
        });

        // Safe Zone Status Display
        this.safeZoneText = this.add.text(20, 80, 'Safe Zone: Initializing...', { 
            fontSize: '18px', fontFamily: 'Cinzel', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 
        });

        // Game Over UI Elements
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        this.gameOverText = this.add.text(centerX, centerY - 50, 'GAME OVER', { 
            fontSize: '48px', fontFamily: 'Cinzel', fill: '#ff0000', stroke: '#000000', strokeThickness: 6 
        }).setOrigin(0.5).setVisible(false).setDepth(100);

        this.restartButton = this.add.text(centerX, centerY + 50, 'Restart Game', { 
            fontSize: '32px', fontFamily: 'Cinzel', fill: '#ffffff', backgroundColor: '#555555', 
            padding: { left: 10, right: 10, top: 5, bottom: 5 } 
        }).setOrigin(0.5).setVisible(false).setInteractive().setDepth(100);

        this.restartButton.on('pointerdown', () => {
            console.log('UIScene: Restart button clicked.');
            if (this.gameScene && this.gameScene.scene.isActive()) { // Check if GameScene is active before stopping
                this.gameScene.scene.stop(); 
            }
            this.scene.stop(); // Stop UIScene itself
            this.scene.start('NewMainMenuScene'); 
        });
         this.restartButton.on('pointerover', () => this.restartButton.setStyle({ fill: '#AAAAAA' }));
         this.restartButton.on('pointerout', () => this.restartButton.setStyle({ fill: '#FFFFFF' }));

        // Event Listeners from GameScene
        if (this.gameScene && this.gameScene.events) {
            this.gameScene.events.on('playerHealthChanged', this.updateHealthDisplay, this);
            this.gameScene.events.on('playerSoulsChanged', this.updateSoulsDisplay, this);
            this.gameScene.events.on('safeZoneUpdated', this.updateSafeZoneDisplay, this);
            this.gameScene.events.on('playerDied', this.showGameOverMenu, this); // Subscribe to playerDied
            console.log('UIScene: Subscribed to GameScene events.');

            // Initial display updates
            if (this.gameScene.playerKing) {
                this.updateHealthDisplay(this.gameScene.playerKing.hp);
                this.updateSoulsDisplay(this.gameScene.playerKing.soulsCollected || 0); 
            }
            if (this.gameScene.safeZoneCurrent && this.gameScene.safeZoneState) {
                this.updateSafeZoneDisplay(this.gameScene.safeZoneCurrent, this.gameScene.safeZoneState);
            }
        } else {
            console.warn('UIScene: Could not subscribe to GameScene events immediately.');
            this.time.delayedCall(500, () => {
                if (!this.gameScene) this.gameScene = this.scene.get('GameScene'); 
                if (this.gameScene && this.gameScene.events) {
                    // Ensure not to double-subscribe
                    if (!this.gameScene.events.listenerCount('playerHealthChanged')) {
                        this.gameScene.events.on('playerHealthChanged', this.updateHealthDisplay, this);
                    }
                    if (!this.gameScene.events.listenerCount('playerSoulsChanged')) {
                        this.gameScene.events.on('playerSoulsChanged', this.updateSoulsDisplay, this);
                    }
                    if (!this.gameScene.events.listenerCount('safeZoneUpdated')) {
                        this.gameScene.events.on('safeZoneUpdated', this.updateSafeZoneDisplay, this);
                    }
                    if (!this.gameScene.events.listenerCount('playerDied')) { 
                        this.gameScene.events.on('playerDied', this.showGameOverMenu, this);
                    }
                    console.log('UIScene: Subscribed to GameScene events (delayed).');
                    
                    // Initial display updates (delayed)
                    if (this.gameScene.playerKing) {
                        this.updateHealthDisplay(this.gameScene.playerKing.hp);
                        this.updateSoulsDisplay(this.gameScene.playerKing.soulsCollected || 0);
                    }
                    if (this.gameScene.safeZoneCurrent && this.gameScene.safeZoneState) {
                        this.updateSafeZoneDisplay(this.gameScene.safeZoneCurrent, this.gameScene.safeZoneState);
                    }
                } else {
                    console.warn('UIScene: Still cannot subscribe to GameScene events after delay.');
                }
            });
        }
    }

    updateHealthDisplay(hp) {
        if (this.playerHealthText) this.playerHealthText.setText('HP: ' + hp);
    }

    updateSoulsDisplay(soulsCount) {
        if (this.soulsText) this.soulsText.setText('Souls: ' + soulsCount);
    }

    updateSafeZoneDisplay(safeZoneCurrent, safeZoneState) {
        if (!this.safeZoneText || !this.gameScene || !this.gameScene.CONFIG) { 
            return;
        }
        let statusText = 'Safe Zone: Status Unknown';
        const radius = safeZoneCurrent.radius.toFixed(0);
        const timer = this.gameScene.safeZoneTimer; 

        switch (safeZoneState) {
            case 'delay':
                const delayRemaining = Math.max(0, (this.gameScene.CONFIG.safeZoneDelay - timer) / 1000).toFixed(0);
                statusText = `Safe Zone: Next shrink in ${delayRemaining}s`;
                break;
            case 'shrinking':
                statusText = `Safe Zone: Shrinking! Radius: ${radius}`;
                break;
            case 'pause':
                let pauseDurationConfig = (safeZoneCurrent.radius > this.gameScene.CONFIG.safeZoneMinRadius) 
                                        ? this.gameScene.CONFIG.safeZonePauseDuration 
                                        : this.gameScene.CONFIG.safeZoneMovePauseDuration;
                const pauseRemaining = Math.max(0, (pauseDurationConfig - timer) / 1000).toFixed(0);
                statusText = `Safe Zone: Stable. Next phase in ${pauseRemaining}s`;
                break;
            case 'moving':
                statusText = `Safe Zone: Moving! Radius: ${radius}`;
                break;
        }
        this.safeZoneText.setText(statusText);
    }

    showGameOverMenu() {
        console.log('UIScene: showGameOverMenu called.');
        if (this.gameOverText) this.gameOverText.setVisible(true).setDepth(100); // Ensure depth
        if (this.restartButton) this.restartButton.setVisible(true).setDepth(100); // Ensure depth
    }

    shutdown() {
        console.log('UIScene: shutdown called.');
        if (this.gameScene && this.gameScene.events) {
            this.gameScene.events.off('playerHealthChanged', this.updateHealthDisplay, this);
            this.gameScene.events.off('playerSoulsChanged', this.updateSoulsDisplay, this);
            this.gameScene.events.off('safeZoneUpdated', this.updateSafeZoneDisplay, this);
            this.gameScene.events.off('playerDied', this.showGameOverMenu, this);
            console.log('UIScene: Unsubscribed from GameScene events.');
        }
        if(this.playerHealthText) { this.playerHealthText.destroy(); this.playerHealthText = null; }
        if(this.soulsText) { this.soulsText.destroy(); this.soulsText = null; }
        if(this.safeZoneText) { this.safeZoneText.destroy(); this.safeZoneText = null; }
        if(this.gameOverText) { this.gameOverText.destroy(); this.gameOverText = null; }
        if(this.restartButton) { this.restartButton.destroy(); this.restartButton = null; }
        this.gameScene = null; 
    }
    
    destroy() {
        this.shutdown(); 
        super.destroy(); 
    }
}
