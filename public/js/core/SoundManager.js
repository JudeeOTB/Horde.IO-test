export class SoundManager {
    constructor() {
      this.bgMusic = document.getElementById("bgMusic");
      this.bgMusic.play().catch(error => {
        console.log("Autoplay blockiert. Musik startet nach der ersten Interaktion.", error);
      });
    }
    
    playBackground() {
      this.bgMusic.play().catch(err => console.log(err));
    }
  }
  