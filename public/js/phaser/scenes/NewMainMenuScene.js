// public/js/phaser/scenes/NewMainMenuScene.js
export class NewMainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'NewMainMenuScene' });
    }

    preload() {
        // Load assets specifically for this menu scene if not already loaded globally.
        // For now, we assume essential fonts are loaded or use Phaser's default.
        // Example: this.load.image('menu_background', 'assets/images/ui/menu_background.png');
        // Example: this.load.bitmapFont('arcadefont', 'assets/fonts/arcade.png', 'assets/fonts/arcade.xml');
        console.log('NewMainMenuScene: preload');
    }

    create() {
        console.log('NewMainMenuScene: create');
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Title Text
        this.add.text(centerX, centerY - 100, 'My Awesome Game', {
            fontFamily: '"Press Start 2P", Arial', // Use Press Start 2P if loaded, otherwise Arial
            fontSize: '32px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Start Game Button
        const startButton = this.add.text(centerX, centerY, 'Start Game', {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: '24px',
            color: '#00ff00', // Green
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        startButton.on('pointerdown', () => {
            console.log('NewMainMenuScene: Start Game button clicked. Transitioning to CharacterSelectionScene.');
            this.scene.start('CharacterSelectionScene');
        });

        startButton.on('pointerover', () => {
            startButton.setStyle({ fill: '#ccffcc' }); // Lighter green on hover
        });

        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#00ff00' }); // Back to original green
        });


        // Options Button (Placeholder)
        const optionsButton = this.add.text(centerX, centerY + 70, 'Options', {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: '24px',
            color: '#ffff00', // Yellow
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        optionsButton.on('pointerdown', () => {
            console.log('NewMainMenuScene: Options button clicked (not implemented).');
            // Example: this.scene.start('OptionsScene');
        });
        optionsButton.on('pointerover', () => { optionsButton.setStyle({ fill: '#ffffcc'}); });
        optionsButton.on('pointerout', () => { optionsButton.setStyle({ fill: '#ffff00'}); });


        // Credits Button (Placeholder)
        const creditsButton = this.add.text(centerX, centerY + 140, 'Credits', {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: '24px',
            color: '#00ffff', // Cyan
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        creditsButton.on('pointerdown', () => {
            console.log('NewMainMenuScene: Credits button clicked (not implemented).');
            // Example: this.scene.start('CreditsScene');
        });
        creditsButton.on('pointerover', () => { creditsButton.setStyle({ fill: '#ccffff'}); });
        creditsButton.on('pointerout', () => { creditsButton.setStyle({ fill: '#00ffff'}); });

    }
}
