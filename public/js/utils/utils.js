// public/js/utils/utils.js
import { Building } from "../entities/Building.js";
import { Obstacle } from "../entities/Obstacle.js";
import { Soul } from "../entities/Soul.js";
import { Unit } from "../entities/Unit.js";
import { Projectile } from "../entities/Projectile.js";
import { CONFIG } from "../core/config.js";
import { Forest } from "../entities/Forest.js"; // Neuer Import

export { CONFIG };

// Vassal spawnen (gibt den neuen Vassal zurück)
export function spawnVassal(leader) {
  let x = leader.x + (Math.random() - 0.5) * 50;
  let y = leader.y + (Math.random() - 0.5) * 50;
  let unitType = (Math.random() < 0.2) ? "archer" : "vassal";
  const vassal = new Unit(x, y, leader.faction, unitType, 1, leader);
  return vassal;
}

// Angepasste Hindernis-Erzeugung: Bei "forest" wird eine Forest-Instanz erstellt.
export function generateObstacles(game) {
  game.obstacles = [];
  const numObstacles = 20;
  for (let i = 0; i < numObstacles; i++) {
    let rand = Math.random();
    let type = (rand < 0.7) ? "forest" : "water";
    let w = 200 + Math.random() * 600;
    let h = 200 + Math.random() * 600;
    let x = Math.random() * (CONFIG.worldWidth - w);
    let y = Math.random() * (CONFIG.worldHeight - h);
    
    if (type === "forest") {
      // Nutze die neue Forest-Klasse für Wälder
      game.obstacles.push(new Forest(x, y, w, h));
    } else {
      // Andernfalls wird ein normales Obstacle erstellt.
      game.obstacles.push(new Obstacle(x, y, w, h, type));
    }
  }
}

export function isAreaClear(x, y, width, height, obstacles) {
  for (let obs of obstacles) {
    if (!(x + width < obs.x || x > obs.x + obs.width || y + height < obs.y || y > obs.y + obs.height)) {
      return false;
    }
  }
  return true;
}

export function generateBuildingClusters(game) {
  game.buildings = [];
  const numClusters = 80;
  for (let i = 0; i < numClusters; i++) {
    let centerX = Math.random() * (CONFIG.worldWidth - 800) + 400;
    let centerY = Math.random() * (CONFIG.worldHeight - 800) + 400;
    if (!isAreaClear(centerX - 50, centerY - 50, 100, 100, game.obstacles)) continue;
    let numBuildings = Math.floor(Math.random() * 11) + 10;
    let clusterBuildings = [];
    for (let j = 0; j < numBuildings; j++) {
      let valid = false, attempt = 0, x, y;
      while (!valid && attempt < 10) {
        let angle = Math.random() * Math.PI * 2;
        let radius = Math.random() * 150;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
        valid = true;
        for (let b of clusterBuildings) {
          if (x < b.x + b.width + 20 && x + 60 > b.x - 20 &&
              y < b.y + b.height + 20 && y + 60 > b.y - 20) {
            valid = false;
            break;
          }
        }
        if (!isAreaClear(x, y, 60, 60, game.obstacles)) valid = false;
        attempt++;
      }
      if (valid) {
        let r = Math.random();
        let type = (r < 0.5) ? "barn" : (r < 0.8 ? "house" : "tower");
        let newBuilding = new Building(x, y, type);
        clusterBuildings.push(newBuilding);
        game.buildings.push(newBuilding);
      }
    }
  }
}

export function resolveUnitCollisions(game) {
  let survivors = [];
  for (let unit of game.units) {
    if (unit.hp <= 0) { spawnSoulFromUnit(unit, game); }
    else survivors.push(unit);
  }
  game.units = survivors;
}

export function resolveUnitUnitCollisions(game) {
  for (let i = 0; i < game.units.length; i++) {
    for (let j = i + 1; j < game.units.length; j++) {
      let a = game.units[i], b = game.units[j];
      if (a.leader === b.leader) continue;
      if (a.intersects(b)) {
        let dx = (b.x + b.width/2) - (a.x + a.width/2);
        let dy = (b.y + b.height/2) - (a.y + a.height/2);
        let dist = Math.hypot(dx, dy);
        if (dist === 0) { dx = 1; dy = 0; dist = 1; }
        let overlap = (a.width/2 + b.width/2) - dist;
        if (overlap > 0) {
          let pushX = (dx/dist) * overlap/2;
          let pushY = (dy/dist) * overlap/2;
          a.x -= pushX; a.y -= pushY;
          b.x += pushX; b.y += pushY;
        }
      }
    }
  }
}

export function resolveUnitBuildingCollisions(game) {
  game.units.forEach(unit => {
    if (unit.unitType === "archer") return;
    game.buildings.forEach(building => {
      if (unit.intersects(building)) {
        let dx = (unit.x + unit.width/2) - (building.x + building.width/2);
        let dy = (unit.y + unit.height/2) - (building.y + building.height/2);
        let dist = Math.hypot(dx, dy);
        if (dist === 0) { dx = 1; dy = 0; dist = 1; }
        let overlap = (unit.width/2 + building.width/2) - dist;
        if (overlap > 0) {
          unit.x += (dx/dist) * overlap;
          unit.y += (dy/dist) * overlap;
        }
      }
    });
  });
}

export function resolveUnitObstacleCollisions(game) {
  game.units.forEach(unit => {
    game.obstacles.forEach(obs => {
      if (unit.intersects(obs)) {
        let dx = (unit.x + unit.width/2) - (obs.x + obs.width/2);
        let dy = (unit.y + unit.height/2) - (obs.y + obs.height/2);
        let dist = Math.hypot(dx, dy);
        if (dist === 0) { dx = 1; dy = 0; dist = 1; }
        let overlap = (unit.width/2 + Math.min(obs.width, obs.height)/2) - dist;
        if (overlap > 0) {
          unit.x += (dx/dist) * overlap;
          unit.y += (dy/dist) * overlap;
        }
      }
    });
  });
}

export function applySeparationForce(game, deltaTime) {
  const desiredSeparation = 30;
  const separationStrength = 0.05;
  for (let i = 0; i < game.units.length; i++) {
    let forceX = 0, forceY = 0;
    let count = 0;
    for (let j = 0; j < game.units.length; j++) {
      if (i === j) continue;
      let dx = game.units[i].x - game.units[j].x;
      let dy = game.units[i].y - game.units[j].y;
      let d = Math.hypot(dx, dy);
      if (d > 0 && d < desiredSeparation) {
        forceX += dx / d * (desiredSeparation - d);
        forceY += dy / d * (desiredSeparation - d);
        count++;
      }
    }
    if (count > 0) {
      forceX /= count;
      forceY /= count;
      game.units[i].x += forceX * separationStrength;
      game.units[i].y += forceY * separationStrength;
    }
  }
}

export function recalcFormationOffset(unit, units, leader) {
  const minDistanceFromKing = 100;
  const minDistanceBetween = 60;
  let alliedUnits = units.filter(u => u.leader === leader && u.unitType !== "king");
  let formationRadius = 100 + alliedUnits.length * 5;
  let minRadius = Math.max(30, minDistanceFromKing);
  let candidate;
  let attempts = 0;
  do {
    let currentAngle = Math.atan2(unit.y - leader.y, unit.x - leader.x);
    let minAngle = currentAngle - Math.PI / 4;
    let maxAngle = currentAngle + Math.PI / 4;
    let newAngle = minAngle + Math.random() * (maxAngle - minAngle);
    let newRadius = minRadius + Math.random() * (formationRadius - minRadius);
    candidate = { x: newRadius * Math.cos(newAngle), y: newRadius * Math.sin(newAngle) };
    let valid = true;
    for (let u of alliedUnits) {
      if (u !== unit && u.formationOffset) {
        let diffX = candidate.x - u.formationOffset.x;
        let diffY = candidate.y - u.formationOffset.y;
        if (Math.hypot(diffX, diffY) < minDistanceBetween) {
          valid = false;
          break;
        }
      }
    }
    if (valid) return candidate;
    attempts++;
  } while (attempts < 10);
  return candidate;
}

export function determineVassalTarget(unit, game) {
  if (!game.playerKing || !unit.leader) return null;
  let leaderCenterX = unit.leader.x + unit.leader.width / 2;
  let leaderCenterY = unit.leader.y + unit.leader.height / 2;
  let leaderDist = Math.hypot(leaderCenterX - game.safeZoneCurrent.centerX, leaderCenterY - game.safeZoneCurrent.centerY);
  let kingInside = leaderDist <= game.safeZoneCurrent.radius;
  let dxKing = (unit.leader.x + unit.leader.width/2) - (unit.x + unit.width/2);
  let dyKing = (unit.leader.y + unit.leader.height/2) - (unit.y + unit.height/2);
  if (Math.hypot(dxKing, dyKing) > 750) {
    return { x: unit.leader.x, y: unit.leader.y, type: "follow", target: unit.leader };
  }
  let kingCenter = { x: unit.leader.x + unit.leader.width/2, y: unit.leader.y + unit.leader.height/2 };
  const protectThreshold = 300;
  let enemyNearKing = null, enemyDist = Infinity;
  for (let other of game.units) {
    if (other.team !== unit.leader.team && !other.dead) {
      let otherCenterX = other.x + other.width/2;
      let otherCenterY = other.y + other.height/2;
      if (kingInside && Math.hypot(otherCenterX - game.safeZoneCurrent.centerX, otherCenterY - game.safeZoneCurrent.centerY) > game.safeZoneCurrent.radius)
        continue;
      let dx = otherCenterX - kingCenter.x;
      let dy = otherCenterY - kingCenter.y;
      let d = Math.hypot(dx, dy);
      if (d < protectThreshold && d < enemyDist) { enemyNearKing = other; enemyDist = d; }
    }
  }
  if (enemyNearKing) return { x: enemyNearKing.x, y: enemyNearKing.y, type: "attack", target: enemyNearKing };
  const detectionRange = 300;
  let bestEnemy = null, bestEnemyDist = Infinity;
  for (let other of game.units) {
    if (other.team !== unit.team && !other.dead) {
      let otherCenterX = other.x + other.width/2;
      let otherCenterY = other.y + other.height/2;
      if (kingInside && Math.hypot(otherCenterX - game.safeZoneCurrent.centerX, otherCenterY - game.safeZoneCurrent.centerY) > game.safeZoneCurrent.radius)
        continue;
      let dx = other.x - unit.x, dy = other.y - unit.y;
      let d = Math.hypot(dx, dy);
      if (d < detectionRange && d < bestEnemyDist) { bestEnemy = other; bestEnemyDist = d; }
    }
  }
  if (bestEnemy) return { x: bestEnemy.x, y: bestEnemy.y, type: "attack", target: bestEnemy };
  let bestOrb = null, bestOrbDist = Infinity;
  for (let soul of game.souls) {
    if (kingInside && Math.hypot(soul.x - game.safeZoneCurrent.centerX, soul.y - game.safeZoneCurrent.centerY) > game.safeZoneCurrent.radius)
      continue;
    let dx = soul.x - unit.x, dy = soul.y - unit.y;
    let d = Math.hypot(dx, dy);
    if (d < detectionRange && d < bestOrbDist) {
      if (soul.soulType === "green") { bestOrb = soul; bestOrbDist = d; }
      else if (soul.soulType === "blue" && unit.unitType === "vassal" && unit.level === 1) { bestOrb = soul; bestOrbDist = d; }
      else if (soul.soulType === "purple" && unit.unitType === "vassal" && unit.level === 2) { bestOrb = soul; bestOrbDist = d; }
    }
  }
  if (bestOrb) return { x: bestOrb.x, y: bestOrb.y, type: "orb", target: bestOrb };
  let bestBuilding = null, bestBuildingDist = Infinity;
  for (let b of game.buildings) {
    if (kingInside && Math.hypot(b.x + b.width/2 - game.safeZoneCurrent.centerX, b.y + b.height/2 - game.safeZoneCurrent.centerY) > game.safeZoneCurrent.radius)
        continue;
    let dx = b.x - unit.x, dy = b.y - unit.y;
    let d = Math.hypot(dx, dy);
    if (d < detectionRange && d < bestBuildingDist) { bestBuilding = b; bestBuildingDist = d; }
  }
  if (bestBuilding) return { x: bestBuilding.x, y: bestBuilding.y, type: "attack", target: bestBuilding };
  if (!unit.formationOffset) {
    unit.formationOffset = recalcFormationOffset(unit, game.units, unit.leader);
  }
  return {
    x: unit.leader.x + unit.formationOffset.x,
    y: unit.leader.y + unit.formationOffset.y,
    type: "follow",
    target: unit.leader
  };
}

export function showGameOverMenu(message) {
  const menu = document.getElementById("gameOverMenu");
  const msgElem = document.getElementById("gameOverMessage");
  msgElem.innerText = message;
  menu.style.display = "flex";
}

export function applySafeZoneDamage(game, deltaTime) {
  for (let unit of game.units) {
    let dx = (unit.x + unit.width / 2) - game.safeZoneCurrent.centerX;
    let dy = (unit.y + unit.height / 2) - game.safeZoneCurrent.centerY;
    let dist = Math.hypot(dx, dy);
    if (dist > game.safeZoneCurrent.radius) {
      let damage = 0.05 * deltaTime;
      if (unit.isShieldActive) damage *= 0.5;
      unit.hp -= damage;
    }
  }
  game.units = game.units.filter(u => { if (u.hp <= 0) { spawnSoulFromUnit(u, game); return false; } else return true; });
}

export function spawnSoulFromUnit(unit, game) {
  if (unit.unitType === "vassal") {
    if (Math.random() < 0.5) return;
  }
  let soulType;
  if (unit.unitType === "king") soulType = "purple";
  else if (unit.level === 1) soulType = "green";
  else if (unit.level === 2) soulType = "blue";
  else if (unit.level === 3) soulType = "purple";
  game.souls.push(new Soul(unit.x, unit.y, soulType));
}

export function handlePowerUps(game, deltaTime) {
  for (let i = game.powerUps.length - 1; i >= 0; i--) {
    let powerUp = game.powerUps[i];
    if (game.playerKing && game.playerKing.intersects(powerUp)) {
      if (powerUp.effectType === "speed") {
        game.playerKing.speed *= 1.5;
        setTimeout(() => { game.playerKing.speed /= 1.5; }, powerUp.duration);
      } else if (powerUp.effectType === "shield") {
        if (game.playerKing.isShieldActive) {
          game.playerKing.shieldTimer += powerUp.duration;
        } else {
          game.playerKing.isShieldActive = true;
          game.playerKing.shieldTimer = powerUp.duration;
        }
      }
      game.powerUps.splice(i, 1);
    }
  }
}

export function handleSouls(game) {
  for (let i = game.souls.length - 1; i >= 0; i--) {
    let soul = game.souls[i], collected = false;
    for (let unit of game.units) {
      let unitCenterX = unit.x + unit.width / 2;
      let unitCenterY = unit.y + unit.height / 2;
      let soulCenterX = soul.x + soul.width / 2;
      let soulCenterY = soul.y + soul.height / 2;
      if (Math.hypot(unitCenterX - soulCenterX, unitCenterY - soulCenterY) < 40) {
        if (soul.soulType === "green") {
          game.units.push(spawnVassal(unit.leader));
          collected = true;
          break;
        } else if (soul.soulType === "blue" && unit.unitType === "vassal" && unit.level === 1) {
          unit.level = 2;
          collected = true;
          break;
        } else if (soul.soulType === "purple" && unit.unitType === "vassal" && unit.level === 2) {
          unit.level = 3;
          collected = true;
          break;
        }
      }
    }
    if (collected) game.souls.splice(i, 1);
  }
}

export function handleBuildings(game) {
  for (let i = game.buildings.length - 1; i >= 0; i--) {
    let building = game.buildings[i];
    if (building.hp <= 0) {
      let soulType = (building.buildingType === "barn") ? "green" : (building.buildingType === "house" ? "blue" : "purple");
      game.souls.push(new Soul(building.x, building.y, soulType));
      game.buildings.splice(i, 1);
    }
  }
}

// Eine kleine Wrapper-Funktion, um ein neues Projektil zu erzeugen.
export function ProjectileWrapper(x, y, target, damage) {
  return new Projectile(x, y, target, damage);
}
