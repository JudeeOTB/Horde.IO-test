// public/js/core/AssetManager.js
export const AssetManager = {
    assets: {
      souls: {
        green: new Image(),
        blue: new Image(),
        purple: new Image()
      },
      buildings: {
        barn: new Image(),
        house: new Image(),
        tower: new Image()
      },
      factions: {
        human: { king: new Image(), level1: new Image(), level2: new Image(), level3: new Image() },
        elf:   { king: new Image(), level1: new Image(), level2: new Image(), level3: new Image() },
        orc:   { king: new Image(), level1: new Image(), level2: new Image(), level3: new Image() }
      },
      arrow: new Image(),
      ground: new Image(),
      slash: new Image()  // <-- Neuer Eintrag für den Slash-Sprite
    },
    loadAssets() {
      // Souls
      this.assets.souls.green.src = "https://storage.googleapis.com/rosebud_assets_storage/ec0e205d-2fbe-4cb8-bd1f-73ad665131f8.png";
      this.assets.souls.blue.src  = "https://storage.googleapis.com/rosebud_assets_storage/5f1defb7-2972-4c99-8b6a-071c442cf0b4.png";
      this.assets.souls.purple.src = "https://storage.googleapis.com/rosebud_assets_storage/80a407b8-855f-49f4-94de-2dd56ad293b3.png";
      // Buildings
      this.assets.buildings.barn.src  = "https://storage.googleapis.com/rosebud_assets_storage/9c5fd728-e11b-444c-9238-aee468cc781c.png";
      this.assets.buildings.house.src = "https://storage.googleapis.com/rosebud_assets_storage/653d84b9-29c0-462c-ab42-3b494ace1941.png";
      this.assets.buildings.tower.src = "https://storage.googleapis.com/rosebud_assets_storage/048c58de-8137-4f79-9fc2-b772d5426157.png";
      // Factions
      this.assets.factions.human.king.src   = "https://storage.googleapis.com/rosebud_assets_storage/76bda470-edbd-4b01-ba5d-9b79bf65aeec.png";
      this.assets.factions.human.level1.src = "https://storage.googleapis.com/rosebud_assets_storage/ce7a91c4-2649-4466-b1c5-37b06815906b.png";
      this.assets.factions.human.level2.src = "https://storage.googleapis.com/rosebud_assets_storage/4c92972b-3e5e-41e1-b553-76f1e5b97a36.png";
      this.assets.factions.human.level3.src = "https://storage.googleapis.com/rosebud_assets_storage/3ab29cf1-5c0f-4ede-93fe-01637a398c20.png";
      
      this.assets.factions.elf.king.src   = "https://storage.googleapis.com/rosebud_assets_storage/38d2e057-0bd3-41c8-8aeb-c4f572d62f29.png";
      this.assets.factions.elf.level1.src = "https://storage.googleapis.com/rosebud_assets_storage/924b7ab7-fd0d-4127-ae16-7a0ca125d283.png";
      this.assets.factions.elf.level2.src = "https://storage.googleapis.com/rosebud_assets_storage/7c352330-b7be-4fbe-8b04-fcf192b62c90.png";
      this.assets.factions.elf.level3.src = "https://storage.googleapis.com/rosebud_assets_storage/13ee596d-17e9-4a4b-ac31-4328710057a2.png";
      
      this.assets.factions.orc.king.src   = "https://storage.googleapis.com/rosebud_assets_storage/7f8762ad-0a8a-4049-89f9-6f4304cccad6.png";
      this.assets.factions.orc.level1.src = "https://storage.googleapis.com/rosebud_assets_storage/34f08453-78dc-4b96-b56d-68e5dd1a8845.png";
      this.assets.factions.orc.level2.src = "https://storage.googleapis.com/rosebud_assets_storage/3f5ee027-07cc-47d1-855c-c7ea851d1823.png";
      this.assets.factions.orc.level3.src = "https://storage.googleapis.com/rosebud_assets_storage/bd973a95-62af-43e4-82fe-4a8bb5fe63a4.png";
      
      // Weitere Assets
      this.assets.arrow.src = "https://play.rosebud.ai/assets/arrow.png?XHtC";
      this.assets.ground.src = "https://opengameart.org/sites/default/files/grass_0.png";
      // Slash-Sprite laden
      this.assets.slash.src = "https://play.rosebud.ai/assets/slash.png?w6b4";
    }
  };
  