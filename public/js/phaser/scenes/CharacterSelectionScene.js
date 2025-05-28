// public/js/phaser/scenes/CharacterSelectionScene.js
export class CharacterSelectionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectionScene' });
        this.selectedFaction = null;
    }

    preload() {
        console.log('CharacterSelectionScene: preload');
        // Assets for this scene (e.g., faction icons) would be loaded here if not globally available.
        // For now, we'll use text buttons.
    }

    create() {
        console.log('CharacterSelectionScene: create');
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Title Text
        this.add.text(centerX, centerY - 150, 'Select Your Faction', {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: '28px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Faction Selection Buttons
        const factions = ['Human', 'Elf', 'Orc'];
        const buttonYStart = centerY - 50;
        const buttonSpacing = 70;

        factions.forEach((factionName, index) => {
            const button = this.add.text(centerX, buttonYStart + (index * buttonSpacing), factionName, {
                fontFamily: '"Press Start 2P", Arial',
                fontSize: '24px',
                color: '#ffffff', // Default white
                backgroundColor: '#444444', // Darker background for buttons
                padding: { x: 20, y: 10 },
                align: 'center'
            }).setOrigin(0.5).setInteractive();

            // Specific colors for factions
            if (factionName === 'Human') button.setStyle({ color: '#ADD8E6' }); // Light Blue
            if (factionName === 'Elf') button.setStyle({ color: '#90EE90' });   // Light Green
            if (factionName === 'Orc') button.setStyle({ color: '#FFB347' });   // Light Orange/Brownish

            button.on('pointerdown', () => {
                this.selectedFaction = factionName.toLowerCase(); // Store as lowercase, e.g., 'human'
                console.log(`CharacterSelectionScene: ${factionName} selected. Starting GameScene.`);
                this.scene.start('GameScene', { selectedFaction: this.selectedFaction });
            });

            button.on('pointerover', () => {
                button.setStyle({ backgroundColor: '#666666' }); // Darken background on hover
            });

            button.on('pointerout', () => {
                button.setStyle({ backgroundColor: '#444444' }); // Reset background
            });
        });

        // Back Button
        const backButton = this.add.text(centerX, buttonYStart + (factions.length * buttonSpacing) + 20, 'Back', {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: '20px',
            color: '#ffdddd', // Light red
            backgroundColor: '#333333',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive();

        backButton.on('pointerdown', () => {
            console.log('CharacterSelectionScene: Back button clicked.');
            this.scene.start('NewMainMenuScene');
        });
        backButton.on('pointerover', () => { backButton.setStyle({ fill: '#ffaaaa'}); });
        backButton.on('pointerout', () => { backButton.setStyle({ fill: '#ffdddd'}); });
    }
}
