// public/js/phaser/scenes/BootScene.js
export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        console.log('BootScene: preload');
        // Load minimal assets if any (e.g., loading bar, simple logo for main menu)
        this.load.image('title_screen_bg', 'assets/images/TitleScreen.png');
        this.load.audio('theme_music', 'assets/music/Theme Music.mp3'); // Load theme music
    }

    create() {
        console.log('BootScene: create');
        
        // Start playing music if not already playing globally controlled music
        if (this.sound && this.sound.get && !this.sound.get('theme_music')) {
            try {
                 // Add the sound with a key
                 const music = this.sound.add('theme_music', { loop: true, volume: 0.5 }); // Initial volume 0.5
                 music.play();
                 console.log('BootScene: Theme music started.');
                 // Apply loaded volume settings after music has been added and started
                 if (window.SoundManager) {
                    // Small delay to ensure music object is fully processed before volume adjustment
                    this.time.delayedCall(100, () => {
                        window.SoundManager.loadSettings(); 
                        console.log('BootScene: SoundManager.loadSettings() called after music start.');
                    });
                 }
            } catch (e) {
                console.error("Error playing theme music in BootScene:", e);
            }
        } else if (this.sound && this.sound.get && this.sound.get('theme_music') && !this.sound.get('theme_music').isPlaying) {
            // If music track exists but is not playing, play it.
            this.sound.get('theme_music').play();
            console.log('BootScene: Theme music resumed.');
            // Also re-apply settings if resuming
            if (window.SoundManager) {
                this.time.delayedCall(100, () => {
                    window.SoundManager.loadSettings();
                    console.log('BootScene: SoundManager.loadSettings() called after music resume.');
                });
            }
        } else if (this.sound && this.sound.get && this.sound.get('theme_music') && this.sound.get('theme_music').isPlaying){
            console.log('BootScene: Theme music is already playing.');
            // Still apply settings, as this might be a reload/restart of scenes
             if (window.SoundManager) {
                this.time.delayedCall(100, () => {
                    window.SoundManager.loadSettings();
                     console.log('BootScene: SoundManager.loadSettings() called, music was already playing.');
                });
            }
        }


        this.scene.start('MainMenuScene');
    }
}
