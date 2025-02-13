// public/js/core/SoundManager.js
export class SoundManager {
  constructor() {
    this.bgMusic = document.getElementById("bgMusic");
    if (this.bgMusic) {
      this.bgMusic.loop = true;
      this.bgMusic.volume = 1.0;
      this.bgMusic.play().catch(error => {
        console.log("Autoplay blockiert. Musik startet nach der ersten Interaktion.", error);
      });
    }
    // Standardlautstärke für Soundeffekte
    this.sfxVolume = 1.0;
  }

  /**
   * Startet bzw. spielt die Hintergrundmusik ab.
   */
  playBackground() {
    if (this.bgMusic) {
      this.bgMusic.play().catch(err => console.log(err));
    }
  }

  /**
   * Setzt die Lautstärke der Hintergrundmusik.
   * @param {number} volume - Wert zwischen 0.0 und 1.0
   */
  setMusicVolume(volume) {
    if (this.bgMusic) {
      this.bgMusic.volume = volume;
    }
  }

  /**
   * Setzt die Lautstärke der Soundeffekte.
   * @param {number} volume - Wert zwischen 0.0 und 1.0
   */
  setSFXVolume(volume) {
    this.sfxVolume = volume;
  }

  /**
   * Spielt einen Soundeffekt ab.
   * Erwartet wird ein Audio-Element im DOM mit der entsprechenden ID.
   * @param {string} sfxElementId - ID des Audio-Elements für den SFX
   */
  playSFX(sfxElementId) {
    const sfxElement = document.getElementById(sfxElementId);
    if (sfxElement) {
      sfxElement.volume = this.sfxVolume;
      sfxElement.currentTime = 0;
      sfxElement.play().catch(err => console.log(err));
    }
  }
}
