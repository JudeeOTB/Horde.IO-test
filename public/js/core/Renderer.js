// public/js/core/Renderer.js
import { CONFIG } from "./config.js";

export class Renderer {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
  }
  
  draw() {
    const ctx = this.ctx;
    const game = this.game;
    ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
    
    if (game.isMobile) {
      ctx.save();
      ctx.scale(game.gameZoom, game.gameZoom);
      game.viewWidth = game.canvas.width / game.gameZoom;
      game.viewHeight = game.canvas.height / game.gameZoom;
      
      if (game.playerKing) {
        game.cameraX = game.playerKing.x - game.viewWidth / 2;
        game.cameraY = game.playerKing.y - game.viewHeight / 2;
        game.cameraX = Math.max(0, Math.min(CONFIG.worldWidth - game.viewWidth, game.cameraX));
        game.cameraY = Math.max(0, Math.min(CONFIG.worldHeight - game.viewHeight, game.cameraY));
      } else {
        game.cameraX = 0;
        game.cameraY = 0;
      }
      
      this.drawGround();
      game.obstacles.forEach(o => o.draw(ctx, game.cameraX, game.cameraY));
      // Gebäude werden mit dem assets-Parameter gezeichnet
      game.buildings.forEach(b => b.draw(ctx, game.cameraX, game.cameraY, game.assets));
      // Hier wird nun game.assets an die Souls übergeben
      game.souls.forEach(s => s.draw(ctx, game.cameraX, game.cameraY, game.assets));
      game.powerUps.forEach(p => p.draw(ctx, game.cameraX, game.cameraY));
      game.projectiles.forEach(proj => 
        proj.draw(ctx, game.cameraX, game.cameraY, game.assets.arrow)
      );
      game.units.forEach(u => 
        u.draw(ctx, game.cameraX, game.cameraY, game.slashImage, game.assets)
      );
      this.drawSafeZone();
      ctx.restore();
      this.drawMinimap();
    } else {
      game.viewWidth = game.canvas.width;
      game.viewHeight = game.canvas.height;
      
      if (game.playerKing) {
        game.cameraX = game.playerKing.x - game.canvas.width / 2;
        game.cameraY = game.playerKing.y - game.canvas.height / 2;
        game.cameraX = Math.max(0, Math.min(CONFIG.worldWidth - game.canvas.width, game.cameraX));
        game.cameraY = Math.max(0, Math.min(CONFIG.worldHeight - game.canvas.height, game.cameraY));
      } else {
        game.cameraX = 0;
        game.cameraY = 0;
      }
      
      this.drawGround();
      game.obstacles.forEach(o => o.draw(ctx, game.cameraX, game.cameraY));
      // Auch hier assets an Gebäude übergeben
      game.buildings.forEach(b => b.draw(ctx, game.cameraX, game.cameraY, game.assets));
      // Souls erhalten den assets-Parameter
      game.souls.forEach(s => s.draw(ctx, game.cameraX, game.cameraY, game.assets));
      game.powerUps.forEach(p => p.draw(ctx, game.cameraX, game.cameraY));
      game.projectiles.forEach(proj => 
        proj.draw(ctx, game.cameraX, game.cameraY, game.assets.arrow)
      );
      game.units.forEach(u => 
        u.draw(ctx, game.cameraX, game.cameraY, game.slashImage, game.assets)
      );
      this.drawSafeZone();
      this.drawMinimap();
    }
    
    this.drawHUD();
    
    if (game.isMultiplayerMode && game.socket) {
      for (let id in game.remotePlayers) {
        let rp = game.remotePlayers[id];
        ctx.drawImage(
          game.assets.factions[rp.faction].king, 
          rp.x - game.cameraX, 
          rp.y - game.cameraY, 
          40 * 1.3, 
          40 * 1.3
        );
      }
    }
  }
  
  drawGround() {
    const ctx = this.ctx;
    const game = this.game;
    let brightness = 0.5 + 0.5 * Math.abs(Math.sin(game.timeOfDay * Math.PI));
    let vw = game.isMobile ? game.viewWidth : game.canvas.width;
    let vh = game.isMobile ? game.viewHeight : game.canvas.height;
    
    // Verwende das Bodenbild aus dem AssetManager
    if (game.assets.ground && game.assets.ground.complete) {
      let pattern = ctx.createPattern(game.assets.ground, "repeat");
      if (pattern && pattern.setTransform) {
        pattern.setTransform(new DOMMatrix().translate(-game.cameraX, -game.cameraY));
      }
      ctx.globalAlpha = brightness;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, vw, vh);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "#225522";
      ctx.fillRect(0, 0, vw, vh);
    }
  }
  
  drawSafeZone() {
    const ctx = this.ctx;
    const game = this.game;
    
    if (game.safeZoneState !== "delay") {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(
        game.safeZoneCurrent.centerX - game.cameraX, 
        game.safeZoneCurrent.centerY - game.cameraY, 
        game.safeZoneCurrent.radius, 
        0, Math.PI * 2
      );
      ctx.stroke();
      
      if (
        game.safeZoneCurrent.radius !== game.safeZoneTarget.radius ||
        game.safeZoneCurrent.centerX !== game.safeZoneTarget.centerX ||
        game.safeZoneCurrent.centerY !== game.safeZoneTarget.centerY
      ) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(
          game.safeZoneTarget.centerX - game.cameraX, 
          game.safeZoneTarget.centerY - game.cameraY, 
          game.safeZoneTarget.radius, 
          0, Math.PI * 2
        );
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }
  
  drawMinimap() {
    const ctx = this.ctx;
    const game = this.game;
    let minimapWidth = 200, minimapHeight = 200, margin = 10;
    let minimapX = game.canvas.width - minimapWidth - margin;
    let minimapY = margin;
    let scale = minimapWidth / CONFIG.worldWidth;
    
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = "#225522";
    ctx.fillRect(minimapX, minimapY, minimapWidth, minimapHeight);
    ctx.save();
    ctx.translate(minimapX, minimapY);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.rect(0, 0, CONFIG.worldWidth, CONFIG.worldHeight);
    ctx.clip();
    
    game.obstacles.forEach(o => o.drawMinimap(ctx));
    game.buildings.forEach(b => {
      ctx.fillStyle = "grey";
      let markerW = b.width * 1.75, markerH = b.height * 1.75;
      ctx.fillRect(b.x - markerW / 2, b.y - markerH / 2, markerW, markerH);
    });
    game.units.forEach(u => {
      ctx.fillStyle = (u.team === game.playerKing?.team) ? "green" : "red";
      let markerW = u.width * 1.75, markerH = u.height * 1.75;
      ctx.fillRect(u.x - markerW / 2, u.y - markerH / 2, markerW, markerH);
    });
    game.souls.forEach(s => {
      ctx.fillStyle = s.soulType === "green" ? "lime" : (s.soulType === "blue" ? "cyan" : "magenta");
      ctx.fillRect(s.x, s.y, s.width, s.height);
    });
    game.powerUps.forEach(p => {
      ctx.fillStyle = p.effectType === "speed" ? "yellow" : "orange";
      ctx.fillRect(p.x, p.y, p.width, p.height);
    });
    
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2 / scale;
    ctx.beginPath();
    ctx.arc(
      game.safeZoneCurrent.centerX, 
      game.safeZoneCurrent.centerY, 
      game.safeZoneCurrent.radius, 
      0, Math.PI * 2
    );
    ctx.stroke();
    
    if (
      game.safeZoneCurrent.radius !== game.safeZoneTarget.radius ||
      game.safeZoneCurrent.centerX !== game.safeZoneTarget.centerX ||
      game.safeZoneCurrent.centerY !== game.safeZoneTarget.centerY
    ) {
      ctx.setLineDash([5 / scale, 5 / scale]);
      ctx.beginPath();
      ctx.arc(
        game.safeZoneTarget.centerX, 
        game.safeZoneTarget.centerY, 
        game.safeZoneTarget.radius, 
        0, Math.PI * 2
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2 / scale;
    ctx.strokeRect(game.cameraX, game.cameraY, game.viewWidth, game.viewHeight);
    ctx.restore();
    
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(minimapX, minimapY, minimapWidth, minimapHeight);
    ctx.restore();
  }
  
  drawHUD() {
    const ctx = this.ctx;
    const game = this.game;
    if (!game.playerKing) return;
    
    ctx.save();
    if (game.isMobile) { ctx.scale(game.hudScale, game.hudScale); }
    
    let kingsAlive = game.units.filter(u => u.unitType === "king").length;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(10, 10, 160, 40);
    ctx.font = "24px 'Cinzel', serif";
    ctx.fillStyle = "white";
    ctx.fillText("Könige: " + kingsAlive, 20, 40);
    
    let dashRatio = Math.min(game.playerKing.dashTimer / CONFIG.dashCooldown, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(10, 60, 160, 20);
    ctx.fillStyle = "yellow";
    ctx.fillRect(10, 60, 160 * dashRatio, 20);
    ctx.strokeStyle = "white";
    ctx.strokeRect(10, 60, 160, 20);
    
    ctx.font = "16px 'Cinzel', serif";
    ctx.fillStyle = "white";
    ctx.fillText("Dash", 75, 75);
    
    let shieldRatio = Math.min(game.playerKing.shieldCooldownTimer / CONFIG.shieldAbilityCooldown, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(10, 90, 160, 20);
    ctx.fillStyle = "blue";
    ctx.fillRect(10, 90, 160 * shieldRatio, 20);
    ctx.strokeStyle = "white";
    ctx.strokeRect(10, 90, 160, 20);
    
    ctx.font = "16px 'Cinzel', serif";
    ctx.fillStyle = "white";
    ctx.fillText("Shield", 75, 105);
    
    let vassals = game.units.filter(u => u.unitType === "vassal" && u.team === game.playerKing.team);
    let v1 = vassals.filter(u => u.level === 1).length;
    let v2 = vassals.filter(u => u.level === 2).length;
    let v3 = vassals.filter(u => u.level === 3).length;
    let archers = game.units.filter(u => u.unitType === "archer" && u.team === game.playerKing.team);
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(10, 120, 220, 160);
    ctx.font = "16px 'Cinzel', serif";
    ctx.fillStyle = "white";
    ctx.fillText("Vassalen:", 20, 140);
    ctx.drawImage(game.assets.factions[game.playerFaction].level1, 20, 150, 24, 24);
    ctx.fillText("Level 1: " + v1, 50, 168);
    ctx.drawImage(game.assets.factions[game.playerFaction].level2, 20, 180, 24, 24);
    ctx.fillText("Level 2: " + v2, 50, 198);
    ctx.drawImage(game.assets.factions[game.playerFaction].level3, 20, 210, 24, 24);
    ctx.fillText("Level 3: " + v3, 50, 228);
    ctx.fillText("Bogenschützen: " + archers.length, 20, 258);
    
    ctx.font = "16px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    let fpsY = game.isMobile ? game.canvas.height / game.hudScale - 10 : game.canvas.height - 10;
    ctx.fillText("FPS: " + game.fps, 10, fpsY);
    
    let totalSeconds = Math.floor(game.gameTime / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    let timerText = ("0" + minutes).slice(-2) + ":" + ("0" + seconds).slice(-2);
    let timerY = game.isMobile ? 30 / game.hudScale : 30;
    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(timerText, game.isMobile ? game.canvas.width / (2 * game.hudScale) : game.canvas.width / 2, timerY);
    ctx.textAlign = "left";
    ctx.restore();
  }
}
