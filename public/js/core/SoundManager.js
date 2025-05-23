// public/js/core/SoundManager.js

export class SoundManager {
  constructor() {
    this.bgMusic = document.getElementById("bgMusic");
    if (this.bgMusic) {
      this.bgMusic.volume = 0.5; // Default background music volume
      this.initMusicVolumeSlider();
    }

    this.sfxCache = {};
    this.sfxVolume = 1.0; // Default SFX volume
    this.initSfxVolumeSlider();
    this.preloadSounds();
  }

  initMusicVolumeSlider() {
    const musicSlider = document.getElementById("musicVolumeSlider");
    if (musicSlider) {
      musicSlider.value = this.bgMusic.volume * 100;
      musicSlider.addEventListener("input", () => {
        this.bgMusic.volume = musicSlider.value / 100;
      });
    }
  }

  initSfxVolumeSlider() {
    const sfxSlider = document.getElementById("sfxVolumeSlider");
    if (sfxSlider) {
      // Set initial slider value based on sfxVolume
      sfxSlider.value = this.sfxVolume * 100;
      // Update sfxVolume when slider changes
      sfxSlider.addEventListener("input", () => {
        this.sfxVolume = sfxSlider.value / 100;
      });
      // Also update sfxVolume from initial slider value if different from default
      // This handles cases where the slider might have a persisted value e.g. from localStorage in a fuller implementation
      this.sfxVolume = sfxSlider.value / 100;
    }
  }

  loadSound(name, path, isPreload = false) {
    const audio = new Audio(path);
    audio.preload = 'auto';
    this.sfxCache[name] = audio;

    audio.onerror = () => {
      console.error(`Error loading sound: ${name} from ${path}`);
    };

    if (isPreload) {
      audio.load(); // Explicitly load, though 'auto' often suffices
    }
  }

  playSound(name, volumeScale = 1.0) {
    if (!this.sfxCache[name]) {
      console.error(`Sound not found: ${name}`);
      return;
    }

    try {
      const soundInstance = new Audio(this.sfxCache[name].src);
      // Ensure sfxVolume is a number between 0 and 1
      const effectiveVolume = Math.max(0, Math.min(1, this.sfxVolume));
      soundInstance.volume = effectiveVolume * volumeScale;
      soundInstance.play();

      soundInstance.onerror = () => {
        console.error(`Error playing sound: ${name}`);
      };
    } catch (error) {
      console.error(`Exception during playSound ${name}:`, error);
    }
  }

  preloadSounds() {
    this.loadSound('attack_sword', 'assets/audiosfx/Attack/SWORD_Hit_Sword_Hard_Designed_03_SOUNDMORPH.wav', true);
    this.loadSound('ui_click', 'assets/audiosfx/Medieval Fight Ambient Dynamic Sound/MENU_Choice_SOUNDMORPH.wav', true);
    this.loadSound('unit_die', 'assets/audiosfx/Dieing/DIE_Char_Gen_MALE_SOUNDMORPH.wav', true);
    this.loadSound('attack_melee', 'assets/audiosfx/Attack/Melee/Mellee metalic 1.mp3', true);
    this.loadSound('attack_arrow', 'assets/audiosfx/Attack/Arrow Shot/Arrow Shot 1.mp3', true);
  }
}
