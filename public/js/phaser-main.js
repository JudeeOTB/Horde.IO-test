// public/js/phaser-main.js
// Import scenes (this assumes phaser-main.js becomes a module, or scenes are global)
// For now, script tags in index.html will make BootScene, MainMenuScene, GameScene global.

// Keep the CONFIG constant if it's to be global, or ensure GameScene has its own.
// const CONFIG = { ... }; // GameScene now has its own CONFIG

const phaserConfig = { // Renamed from 'config' to avoid conflict if CONFIG is global
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'phaser-game',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true 
        }
    },
    // Define scenes in the order they should be processed for keys,
    // but BootScene will be the starting one.
    scene: [BootScene, MainMenuScene, GameScene, UIScene] 
    // The 'scene' property in the config can be an array of scene classes/configs.
    // Phaser will add them to the SceneManager. The first one in the array
    // (if not specified otherwise by `active` or `visible` flags in scene config)
    // or the one started manually (like BootScene via `scene.start('BootScene')` if needed)
    // will be the one to kick things off.
    // By default, the first scene in the array is started. So BootScene will start.
};

// Entity classes are loaded via script tags before this file, making them global.
// e.g. PhaserUnit, PhaserBuilding etc. are available.

window.game = new Phaser.Game(phaserConfig); // Make game instance globally accessible

// The old preload, create, update functions from phaser-main.js are now removed
// as they are moved into GameScene.js (and asset loading to MainMenuScene.js).
