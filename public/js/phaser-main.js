// public/js/phaser-main.js

// Import Scene classes
import { BootScene } from './phaser/scenes/BootScene.js';
import { MainMenuScene } from './phaser/scenes/MainMenuScene.js';
import { GameScene } from './phaser/scenes/GameScene.js';
import { UIScene } from './phaser/scenes/UIScene.js';

const phaserConfig = {
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
    scene: [BootScene, MainMenuScene, GameScene, UIScene]
};

// Make game instance globally accessible for main.js to interact with scenes
window.game = new Phaser.Game(phaserConfig);
