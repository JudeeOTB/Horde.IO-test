// public/js/phaser/scenes/MainMenuScene.js
export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    preload() {
        // ... (asset loading remains the same)
        console.log('MainMenuScene: preload');
        // All assets previously in phaser-main.js preload will go here
        // Souls
        this.load.image('souls_green', 'assets/sprites/Collectables/Green.png');
        this.load.image('souls_blue', 'assets/sprites/Collectables/Blue.png');
        this.load.image('souls_purple', 'assets/sprites/Collectables/Purple.png');

        // Buildings
        this.load.image('buildings_barn', 'assets/sprites/Buildings/Barn.png');
        this.load.image('buildings_house', 'assets/sprites/Buildings/House.png');
        this.load.image('buildings_tower', 'assets/sprites/Buildings/Tower.png');

        // Factions - Human
        this.load.image('factions_human_king', 'assets/sprites/Units/Mensch/King.png');
        this.load.image('factions_human_level1', 'assets/sprites/Units/Mensch/Level 1.png');
        this.load.image('factions_human_level2', 'assets/sprites/Units/Mensch/level 2.png');
        this.load.image('factions_human_level3', 'assets/sprites/Units/Mensch/level 3.png');

        // Factions - Elf (assuming paths are similar)
        this.load.image('factions_elf_king', 'assets/sprites/Units/Elf/King.png');
        this.load.image('factions_elf_level1', 'assets/sprites/Units/Elf/level 1.png');
        this.load.image('factions_elf_level2', 'assets/sprites/Units/Elf/level 2.png');
        this.load.image('factions_elf_level3', 'assets/sprites/Units/Elf/level 3.png');

        // Factions - Orc (assuming paths are similar)
        this.load.image('factions_orc_king', 'assets/sprites/Units/Orc/King.png');
        this.load.image('factions_orc_level1', 'assets/sprites/Units/Orc/level 1.png');
        this.load.image('factions_orc_level2', 'assets/sprites/Units/Orc/level 2.png');
        this.load.image('factions_orc_level3', 'assets/sprites/Units/Orc/level 3.png');

        // Weitere Assets
        this.load.image('arrow', 'assets/sprites/ATTACKS/Arrow.png');
        this.load.image('ground_texture_for_tilesprite', 'https://opengameart.org/sites/default/files/grass_0.png');
        this.load.image('slash', 'assets/sprites/ATTACKS/slash.png');
        this.load.image('forest', 'assets/sprites/Trees/angepasst/Forest dark.PNG');
    }

    create() {
        console.log('MainMenuScene: create');
        
        if (window.HtmlMenuManager) {
            window.HtmlMenuManager.showMainMenu();
        }

        if (this.textures.exists('title_screen_bg')) {
            this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'title_screen_bg').setAlpha(0.5); 
        } else {
            console.warn("Title screen BG ('title_screen_bg') not found in MainMenuScene create. Was it loaded in BootScene?");
        }
        
        this.startGame = (faction = 'human') => { // Default faction if none passed
            console.log(`MainMenuScene: startGame called with faction: ${faction}`);
            if (window.HtmlMenuManager) {
                // This was called from main.js after selection, so main menu might already be hidden if selection was shown.
                // Ensure all HTML menus are hidden before game starts.
                window.HtmlMenuManager.hideAllMenus(); // Hide all menus, including selection
            }
            
            // Show game-specific UI elements
            const joystickContainer = document.getElementById('joystickContainer');
            if (joystickContainer) joystickContainer.style.display = 'block'; // Or 'flex'

            const actionButtons = document.getElementById('actionButtons');
            if (actionButtons) actionButtons.style.display = 'block'; // Or 'flex'
            
            const gameUI = document.getElementById('gameUI');
            if (gameUI) gameUI.style.display = 'block';

            // Pass the chosen faction to GameScene
            this.scene.start('GameScene', { selectedFaction: faction }); 
        };
    }
}
