import { Entity } from "./Entity.js";

export class Obstacle extends Entity {
  constructor(x, y, width, height, type) {
    super(x, y, width, height);
    this.type = type;
  }
  
  draw(ctx, cameraX, cameraY) {
    ctx.fillStyle = this.type === "forest" ? "#0a4f0a" : "#3366ff";
    ctx.fillRect(this.x - cameraX, this.y - cameraY, this.width, this.height);
  }
  
  drawMinimap(ctx) {
    ctx.fillStyle = this.type === "forest" ? "#0a4f0a" : "#3366ff";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}
