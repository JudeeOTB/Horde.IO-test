// public/js/phaser/scenes/MainMenuScene.js
export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    preload() {
        console.log('MainMenuScene: preload');
        // Image Assets (as before)
        this.load.image('souls_green', 'assets/sprites/Collectables/Green.png');
        this.load.image('souls_blue', 'assets/sprites/Collectables/Blue.png');
        this.load.image('souls_purple', 'assets/sprites/Collectables/Purple.png');
        this.load.image('buildings_barn', 'assets/sprites/Buildings/Barn.png');
        this.load.image('buildings_house', 'assets/sprites/Buildings/House.png');
        this.load.image('buildings_tower', 'assets/sprites/Buildings/Tower.png');
        this.load.image('factions_human_king', 'assets/sprites/Units/Mensch/King.png');
        this.load.image('factions_human_level1', 'assets/sprites/Units/Mensch/Level 1.png');
        this.load.image('factions_human_level2', 'assets/sprites/Units/Mensch/level 2.png');
        this.load.image('factions_human_level3', 'assets/sprites/Units/Mensch/level 3.png');
        this.load.image('factions_elf_king', 'assets/sprites/Units/Elf/King.png');
        this.load.image('factions_elf_level1', 'assets/sprites/Units/Elf/level 1.png');
        this.load.image('factions_elf_level2', 'assets/sprites/Units/Elf/level 2.png');
        this.load.image('factions_elf_level3', 'assets/sprites/Units/Elf/level 3.png');
        this.load.image('factions_orc_king', 'assets/sprites/Units/Orc/King.png');
        this.load.image('factions_orc_level1', 'assets/sprites/Units/Orc/level 1.png');
        this.load.image('factions_orc_level2', 'assets/sprites/Units/Orc/level 2.png');
        this.load.image('factions_orc_level3', 'assets/sprites/Units/Orc/level 3.png');
        this.load.image('arrow', 'assets/sprites/ATTACKS/Arrow.png');
        this.load.image('ground_texture_for_tilesprite', 'assets/textures/grass.png');
        this.load.image('slash', 'assets/sprites/ATTACKS/slash.png');
        this.load.image('forest', 'assets/sprites/Trees/angepasst/Forest dark.PNG');

        // Sound Effects
        this.load.audio('sfx_melee_swing', 'assets/audiosfx/melee_swing.wav');
        this.load.audio('sfx_arrow_shoot', 'assets/audiosfx/arrow_shoot.wav');
        this.load.audio('sfx_projectile_hit', 'assets/audiosfx/projectile_hit.wav');
        this.load.audio('sfx_take_damage', 'assets/audiosfx/take_damage.wav');
        this.load.audio('sfx_unit_death', 'assets/audiosfx/unit_death.wav');
        this.load.audio('sfx_dash', 'assets/audiosfx/dash.wav');
        this.load.audio('sfx_shield_up', 'assets/audiosfx/shield_up.wav');
        this.load.audio('sfx_spawn_unit', 'assets/audiosfx/spawn_unit.wav');
        this.load.audio('sfx_upgrade_success', 'assets/audiosfx/upgrade_success.wav'); // New SFX
        this.load.audio('sfx_cannot_afford', 'assets/audiosfx/cannot_afford.wav');   // New SFX

        console.log("MainMenuScene: Attempting to load sound effects. Ensure files exist at 'assets/audiosfx/'.");
        console.log("SFX expected: melee_swing.wav, arrow_shoot.wav, projectile_hit.wav, take_damage.wav, unit_death.wav, dash.wav, shield_up.wav, spawn_unit.wav, upgrade_success.wav, cannot_afford.wav");
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
        
        this.startGame = (faction = 'human') => { 
            console.log(`MainMenuScene: startGame called with faction: ${faction}`);
            if (window.HtmlMenuManager) {
                window.HtmlMenuManager.hideAllMenus(); 
            }
            
            const joystickContainer = document.getElementById('joystickContainer');
            if (joystickContainer) joystickContainer.style.display = 'block'; 

            const actionButtons = document.getElementById('actionButtons');
            if (actionButtons) actionButtons.style.display = 'block'; 
            
            const gameUI = document.getElementById('gameUI');
            if (gameUI) gameUI.style.display = 'block';

            this.scene.start('GameScene', { selectedFaction: faction }); 
        };
    }
}
