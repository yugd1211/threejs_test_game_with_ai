import { type Level, platformX } from './levels';
export type Phase = 'ready' | 'running' | 'paused' | 'complete';
export interface Input {
  x: number;
  z: number;
  jump: boolean;
}
export interface Player {
  x: number;
  y: number;
  z: number;
  vy: number;
  grounded: boolean;
  platform: number;
}
export const SPEED = 6.4;
export const JUMP = 9.5;
export const GRAVITY = 22;
export class GameState {
  phase: Phase = 'ready';
  player: Player = { x: 0, y: 0, z: 3, vy: 0, grounded: true, platform: 0 };
  elapsed = 0;
  worldTime = 0;
  falls = 0;
  checkpoint = 0;
  farthest = 0;
  collected = new Set<number>();
  coyote = 0.12;
  buffer = 0;
  lastJump = false;
  invulnerable = 0;
  events: string[] = [];
  constructor(public level: Level) {
    this.reset();
  }
  reset() {
    const p = this.level.platforms[0];
    this.player = { x: p.x, y: p.y, z: p.z, vy: 0, grounded: true, platform: 0 };
    this.phase = 'ready';
    this.elapsed = 0;
    this.worldTime = 0;
    this.falls = 0;
    this.checkpoint = 0;
    this.farthest = 0;
    this.collected.clear();
    this.coyote = 0.12;
    this.buffer = 0;
    this.lastJump = false;
    this.invulnerable = 0;
    this.events = [];
  }
  start() {
    this.phase = 'running';
    this.events.push('start');
  }
  respawn() {
    const p = this.level.platforms[this.checkpoint];
    Object.assign(this.player, {
      x: platformX(p, this.worldTime),
      y: p.y,
      z: p.z,
      vy: 0,
      grounded: true,
      platform: this.checkpoint,
    });
    this.falls++;
    this.coyote = 0.12;
    this.buffer = 0;
    this.invulnerable = 1.4;
    this.events.push('fall');
  }
  step(delta: number, input: Input) {
    if (this.phase !== 'running') return;
    const dt = Math.min(delta, 1 / 30);
    const previousTime = this.worldTime;
    this.worldTime += dt;
    this.elapsed += dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    const p = this.player;
    if (p.grounded && p.platform >= 0) {
      const support = this.level.platforms[p.platform];
      p.x += platformX(support, this.worldTime) - platformX(support, previousTime);
    }
    if (input.jump && !this.lastJump) this.buffer = 0.14;
    this.lastJump = input.jump;
    this.buffer -= dt;
    this.coyote = p.grounded ? 0.12 : this.coyote - dt;
    if (this.buffer > 0 && this.coyote > 0) {
      p.vy = JUMP;
      p.grounded = false;
      p.platform = -1;
      this.coyote = 0;
      this.buffer = 0;
      this.events.push('jump');
    }
    const length = Math.max(1, Math.hypot(input.x, input.z));
    p.x += (input.x / length) * SPEED * dt;
    p.z += (input.z / length) * SPEED * dt;
    const oldY = p.y;
    p.vy -= GRAVITY * dt;
    p.y += p.vy * dt;
    p.grounded = false;
    p.platform = -1;
    for (let i = 0; i < this.level.platforms.length; i++) {
      const island = this.level.platforms[i];
      const x = platformX(island, this.worldTime);
      if (
        Math.abs(p.x - x) < island.w / 2 + 0.14 &&
        Math.abs(p.z - island.z) < island.d / 2 + 0.14 &&
        p.vy <= 0 &&
        oldY >= island.y - 0.025 &&
        p.y <= island.y
      ) {
        p.y = island.y;
        p.vy = 0;
        p.grounded = true;
        p.platform = i;
        this.farthest = Math.max(this.farthest, i);
        if (island.checkpoint && i > this.checkpoint) {
          this.checkpoint = i;
          this.events.push('checkpoint');
        }
        break;
      }
    }
    for (let i = 1; i < this.level.platforms.length - 1; i++) {
      const island = this.level.platforms[i];
      if (
        !this.collected.has(i) &&
        Math.hypot(p.x - platformX(island, this.worldTime), p.z - island.z) < 1.05 &&
        p.y >= island.y - 0.1 &&
        p.y < island.y + 2.2
      ) {
        this.collected.add(i);
        this.events.push('crystal');
      }
    }
    if (p.grounded && this.level.platforms[p.platform]?.hazard && this.invulnerable <= 0) {
      const island = this.level.platforms[p.platform];
      const angle = this.worldTime * 1.8;
      const dx = p.x - island.x,
        dz = p.z - island.z;
      const along = dx * Math.cos(angle) + dz * Math.sin(angle);
      const across = -dx * Math.sin(angle) + dz * Math.cos(angle);
      if (Math.abs(along) < 1.75 && Math.abs(across) < 0.32) {
        this.respawn();
        return;
      }
    }
    if (p.y < -7) {
      this.respawn();
      return;
    }
    const goal = this.level.platforms.at(-1)!;
    if (
      p.grounded &&
      p.platform === this.level.platforms.length - 1 &&
      Math.hypot(p.x - goal.x, p.z - goal.z) < 1.3
    ) {
      this.phase = 'complete';
      this.events.push('complete');
    }
  }
}
export function formatTime(seconds: number) {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  return `${Math.floor(safe / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(safe % 60)
    .toString()
    .padStart(2, '0')}.${Math.floor((safe % 1) * 10)}`;
}
