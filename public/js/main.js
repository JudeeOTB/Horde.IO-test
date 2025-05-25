// public/js/main.js
// import { Game } from "./core/Game.js"; // Original line, can remain commented

const HtmlMenuManager = {
    hideAllMenus: function() {
        document.getElementById('titleScreen').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('lobbyScreen').style.display = 'none';
        document.getElementById('optionsMenu').style.display = 'none';
        document.getElementById('selectionMenu').style.display = 'none';
        document.getElementById('gameOverMenu').style.display = 'none';
    },
    showMainMenu: function() {
        this.hideAllMenus();
        document.getElementById('mainMenu').style.display = 'block'; // Or 'flex'
        console.log("HTML Main Menu displayed");
    },
    hideMainMenu: function() {
        document.getElementById('mainMenu').style.display = 'none';
        console.log("HTML Main Menu hidden");
    },
    showOptionsMenu: function() {
        this.hideAllMenus();
        document.getElementById('optionsMenu').style.display = 'block'; // Or 'flex'
        console.log("HTML Options Menu displayed");
    },
    hideOptionsMenu: function() {
        document.getElementById('optionsMenu').style.display = 'none';
        this.showMainMenu(); 
        console.log("HTML Options Menu hidden, Main Menu shown");
    },
    showSelectionMenu: function() {
        this.hideAllMenus();
        document.getElementById('selectionMenu').style.display = 'block'; // Or 'flex'
        console.log("HTML Selection Menu displayed");
    },
    hideSelectionMenu: function() {
        document.getElementById('selectionMenu').style.display = 'none';
        console.log("HTML Selection Menu hidden");
    },
    showGameOverMenu: function() {
        this.hideAllMenus(); 
        document.getElementById('gameOverMenu').style.display = 'block'; // Or 'flex'
        // document.getElementById('gameOverMessage').textContent = "You Died!"; // Example if dynamic message needed
        console.log("HTML Game Over Menu displayed");
    },
    hideGameOverMenu: function() {
        document.getElementById('gameOverMenu').style.display = 'none';
        console.log("HTML Game Over Menu hidden");
    },
};
window.HtmlMenuManager = HtmlMenuManager;

// GameSettings object to store choices like faction
const GameSettings = {
    selectedFaction: 'human' // Default faction
};
window.GameSettings = GameSettings; // Make it global for easy access

// SoundManager (as before)
const SoundManager = {
    setMusicVolume: function(volume) { 
        if (window.game && window.game.sound && window.game.sound.volume !== undefined) {
            window.game.sound.volume = volume; 
        }
        localStorage.setItem('musicVolume', volume.toString());
    },
    setSfxVolume: function(volume) { 
        if (window.game && window.game.sound && window.game.sound.volume !== undefined) {
            window.game.sound.volume = volume;
        }
        localStorage.setItem('sfxVolume', volume.toString());
    },
    loadSettings: function() {
        const musicVol = localStorage.getItem('musicVolume');
        const sfxVol = localStorage.getItem('sfxVolume');
        
        let appliedMusicVol = 1.0;
        if (musicVol !== null) {
            appliedMusicVol = parseFloat(musicVol);
        }
        if(document.getElementById('musicVolumeSlider')) {
             document.getElementById('musicVolumeSlider').value = appliedMusicVol * 100;
        }

        let appliedSfxVol = 1.0; 
        if (sfxVol !== null) {
            appliedSfxVol = parseFloat(sfxVol);
        }
         if(document.getElementById('sfxVolumeSlider')) {
            document.getElementById('sfxVolumeSlider').value = appliedSfxVol * 100;
        }

        if (musicVol !== null) { 
            this.setMusicVolume(parseFloat(musicVol));
        } else if (sfxVol !== null) { 
             this.setSfxVolume(parseFloat(sfxVol));
        }
    }
};
window.SoundManager = SoundManager;


document.addEventListener("DOMContentLoaded", () => {
    HtmlMenuManager.hideAllMenus(); // Ensure all menus are hidden at start, including game over
    SoundManager.loadSettings();

    const singlePlayerButton = document.getElementById('btn-singleplayer');
    if (singlePlayerButton) {
        singlePlayerButton.addEventListener('click', () => {
            console.log("HTML Singleplayer button clicked - showing Faction Selection");
            HtmlMenuManager.showSelectionMenu(); 
        });
    }

    // Faction Selection Button Listeners
    const factionButtons = document.querySelectorAll('#selectionMenu button[data-faction]');
    factionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const chosenFaction = button.dataset.faction;
            GameSettings.selectedFaction = chosenFaction;
            console.log("Faction selected:", chosenFaction);
            
            HtmlMenuManager.hideSelectionMenu();
            
            const mainMenuScene = window.game.scene.getScene('MainMenuScene');
            if (mainMenuScene && typeof mainMenuScene.startGame === 'function') {
                mainMenuScene.startGame(chosenFaction); // Pass faction to startGame
            } else {
                console.error("Could not find MainMenuScene or startGame method on it.");
            }
        });
    });
    
    const optionsButton = document.getElementById('btn-options');
    if (optionsButton) {
        optionsButton.addEventListener('click', () => {
            HtmlMenuManager.showOptionsMenu();
        });
    }
    const backButtonFromOptions = document.getElementById('btn-back');
    if (backButtonFromOptions) {
        backButtonFromOptions.addEventListener('click', () => {
            HtmlMenuManager.hideOptionsMenu(); 
        });
    }
    const musicSlider = document.getElementById('musicVolumeSlider');
    if (musicSlider) {
        musicSlider.addEventListener('input', (event) => {
            SoundManager.setMusicVolume(parseFloat(event.target.value) / 100);
        });
    }
    const sfxSlider = document.getElementById('sfxVolumeSlider');
    if (sfxSlider) {
        sfxSlider.addEventListener('input', (event) => {
            SoundManager.setSfxVolume(parseFloat(event.target.value) / 100);
        });
    }

    // Game Over Menu Button Listeners
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            console.log("HTML Restart button clicked");
            HtmlMenuManager.hideGameOverMenu();

            // Show game UI elements again
            const joystickContainer = document.getElementById('joystickContainer');
            if (joystickContainer) joystickContainer.style.display = 'block'; // Or 'flex'
            
            const actionButtons = document.getElementById('actionButtons');
            if (actionButtons) actionButtons.style.display = 'block'; // Or 'flex'
            
            const gameUI = document.getElementById('gameUI');
            if (gameUI) gameUI.style.display = 'block';

            if (window.game && window.game.scene) {
                // Ensure scenes are properly stopped before restarting to avoid issues
                if (window.game.scene.isActive('UIScene')) {
                     window.game.scene.stop('UIScene');
                }
                if (window.game.scene.isActive('GameScene')) {
                    window.game.scene.stop('GameScene');
                }
                // Restart GameScene with the last selected faction
                window.game.scene.start('GameScene', { selectedFaction: window.GameSettings.selectedFaction });
            }
        });
    }

    const mainMenuButtonFromGameOver = document.getElementById('mainMenuButton');
    if (mainMenuButtonFromGameOver) {
        mainMenuButtonFromGameOver.addEventListener('click', () => {
            console.log("HTML Main Menu button from Game Over clicked");
            HtmlMenuManager.hideGameOverMenu();
            
            if (window.game && window.game.scene) {
                 if (window.game.scene.isActive('GameScene')) {
                    window.game.scene.stop('GameScene');
                }
                if (window.game.scene.isActive('UIScene')) {
                     window.game.scene.stop('UIScene');
                }
            }
            
            if (window.game && window.game.scene) {
                // MainMenuScene's create method should call HtmlMenuManager.showMainMenu()
                window.game.scene.start('MainMenuScene'); 
            }
        });
    }

    const initialGameUIDisplay = 'none';
    const joystickContainer = document.getElementById('joystickContainer');
    if(joystickContainer) joystickContainer.style.display = initialGameUIDisplay;
    
    const actionButtons = document.getElementById('actionButtons');
    if(actionButtons) actionButtons.style.display = initialGameUIDisplay;

    const gameUI = document.getElementById('gameUI');
    if(gameUI) gameUI.style.display = initialGameUIDisplay;
});
