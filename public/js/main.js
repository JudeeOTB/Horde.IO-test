// public/js/main.js
// import { Game } from "./core/Game.js"; // Original line, can remain commented

const HtmlMenuManager = {
    hideAllMenus: function() {
        const menuIds = ['titleScreen', 'mainMenu', 'lobbyScreen', 'optionsMenu', 'selectionMenu', 'gameOverMenu'];
        menuIds.forEach(id => {
            const menu = document.getElementById(id);
            if (menu) {
                menu.style.display = 'none';
                // If menu uses opacity for transitions, reset it when hiding
                if (id === 'mainMenu') { // mainMenu has opacity: 0 in CSS
                    menu.style.opacity = '0';
                }
            }
        });
    },
    showMainMenu: function() {
        this.hideAllMenus();
        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) {
            mainMenu.style.display = 'flex'; // Match CSS
            mainMenu.style.opacity = '1';    // Make it visible
            console.log("HTML Main Menu displayed (flex, opacity 1)");
        }
    },
    hideMainMenu: function() { // Not strictly needed if hideAllMenus is used before showing another
        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) {
            mainMenu.style.opacity = '0'; // Allow fade out
            // Hide after transition or let hideAllMenus handle display:none
            // For simplicity, hideAllMenus will set display:none.
            // If a fade-out animation is desired before display:none, this needs more complex handling.
            mainMenu.style.display = 'none'; 
            console.log("HTML Main Menu hidden");
        }
    },
    showOptionsMenu: function() {
        this.hideAllMenus();
        const optionsMenu = document.getElementById('optionsMenu');
        if (optionsMenu) {
            optionsMenu.style.display = 'flex'; // Match CSS
            optionsMenu.style.opacity = '1';    // Ensure visible (even if not initially opacity 0)
            console.log("HTML Options Menu displayed");
        }
    },
    hideOptionsMenu: function() {
        const optionsMenu = document.getElementById('optionsMenu');
        if (optionsMenu) {
            optionsMenu.style.display = 'none';
            // optionsMenu.style.opacity = '0'; // If it had transition
        }
        // Typically, hiding options should take you back to the main menu
        this.showMainMenu(); 
        console.log("HTML Options Menu hidden, Main Menu shown");
    },
    showSelectionMenu: function() {
        this.hideAllMenus();
        const selectionMenu = document.getElementById('selectionMenu');
        if (selectionMenu) {
            selectionMenu.style.display = 'flex'; // Match CSS
            selectionMenu.style.opacity = '1';    // Ensure visible
            console.log("HTML Selection Menu displayed");
        }
    },
    hideSelectionMenu: function() {
        const selectionMenu = document.getElementById('selectionMenu');
        if (selectionMenu) {
            selectionMenu.style.display = 'none';
            // selectionMenu.style.opacity = '0'; // If it had transition
        }
        console.log("HTML Selection Menu hidden");
    },
    showGameOverMenu: function() {
        this.hideAllMenus(); 
        const gameOverMenu = document.getElementById('gameOverMenu');
        if (gameOverMenu) {
            gameOverMenu.style.display = 'flex'; // Match CSS
            gameOverMenu.style.opacity = '1';    // Ensure visible
            console.log("HTML Game Over Menu displayed");
        }
    },
    hideGameOverMenu: function() {
        const gameOverMenu = document.getElementById('gameOverMenu');
        if (gameOverMenu) {
            gameOverMenu.style.display = 'none';
            // gameOverMenu.style.opacity = '0'; // If it had transition
        }
        console.log("HTML Game Over Menu hidden");
    }
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
