import { describe, it, expect } from 'vitest';
import { levels, platformX } from '../src/levels';
import { GameState, SPEED, formatTime } from '../src/physics';
const idle = { x: 0, z: 0, jump: false };
const advance = (game: GameState, seconds: number, input = idle) => {
  for (let i = 0; i < Math.ceil(seconds * 120); i++) game.step(1 / 120, input);
};
describe('game physics and progression', () => {
  it('does not advance before starting or while paused', () => {
    const g = new GameState(levels[0]);
    advance(g, 2);
    expect(g.elapsed).toBe(0);
    g.start();
    advance(g, 1);
    g.phase = 'paused';
    const elapsed = g.elapsed;
    advance(g, 2, { x: 1, z: 1, jump: true });
    expect(g.elapsed).toBe(elapsed);
    expect(g.player.x).toBe(0);
  });
  it('normalizes diagonal movement speed', () => {
    const g = new GameState(levels[0]);
    g.start();
    advance(g, 0.1, { x: 1, z: 1, jump: false });
    expect(Math.hypot(g.player.x, g.player.z - 3)).toBeCloseTo(SPEED * 0.1, 5);
  });
  it('jumps, lands, and does not repeat a held jump', () => {
    const g = new GameState(levels[0]);
    g.start();
    advance(g, 0.2, { ...idle, jump: true });
    expect(g.player.y).toBeGreaterThan(1);
    advance(g, 1, { ...idle, jump: true });
    expect(g.player.grounded).toBe(true);
    expect(g.events.filter((e) => e === 'jump')).toHaveLength(1);
  });
  it('allows a late jump just after leaving a ledge', () => {
    const g = new GameState(levels[0]);
    g.start();
    g.player.x = 2.95;
    advance(g, 0.03, { x: 1, z: 0, jump: false });
    expect(g.player.grounded).toBe(false);
    g.step(1 / 120, { x: 0, z: 0, jump: true });
    expect(g.player.vy).toBeGreaterThan(0);
  });
  it('buffers a jump pressed just before landing', () => {
    const g = new GameState(levels[0]);
    g.start();
    g.player.y = 0.08;
    g.player.vy = -3;
    g.player.grounded = false;
    g.coyote = 0;
    advance(g, 0.06, { ...idle, jump: true });
    expect(g.player.vy).toBeGreaterThan(0);
  });
  it('restores the last checkpoint and retains crystals after a fall', () => {
    const g = new GameState(levels[0]);
    g.start();
    const p = g.level.platforms[3];
    Object.assign(g.player, { x: p.x, z: p.z, y: p.y + 0.01, vy: -1, grounded: false });
    advance(g, 0.03);
    expect(g.checkpoint).toBe(3);
    expect(g.collected.has(3)).toBe(true);
    g.player.y = -8;
    g.step(1 / 120, idle);
    expect(g.falls).toBe(1);
    expect(g.player.z).toBe(p.z);
    expect(g.collected.has(3)).toBe(true);
  });
  it('carries the player with a moving island', () => {
    const g = new GameState(levels[1]);
    g.start();
    const p = g.level.platforms[4];
    Object.assign(g.player, { x: p.x, z: p.z, y: p.y, vy: 0, grounded: true, platform: 4 });
    advance(g, 0.2);
    expect(g.player.x).toBeCloseTo(platformX(p, g.worldTime), 5);
    expect(g.player.grounded).toBe(true);
  });
  it('respawns on contact with the spinner and allows jumping over it', () => {
    const g = new GameState(levels[2]);
    g.start();
    const p = g.level.platforms[4];
    Object.assign(g.player, { x: p.x, z: p.z, y: p.y, vy: 0, grounded: true, platform: 4 });
    g.step(1 / 120, idle);
    expect(g.falls).toBe(1);
    Object.assign(g.player, { x: p.x, z: p.z, y: p.y + 1, vy: 0, grounded: false, platform: -1 });
    g.invulnerable = 0;
    g.step(1 / 120, idle);
    expect(g.falls).toBe(1);
  });
  it('requires entering the finish portal and freezes the completed timer', () => {
    const g = new GameState(levels[0]);
    g.start();
    const p = g.level.platforms.at(-1)!;
    Object.assign(g.player, { x: p.x, z: p.z, y: p.y, vy: 0, grounded: true, platform: 8 });
    g.step(1 / 120, idle);
    expect(g.phase).toBe('complete');
    const time = g.elapsed;
    advance(g, 1);
    expect(g.elapsed).toBe(time);
  });
  it('formats race times predictably', () => {
    expect(formatTime(65.25)).toBe('01:05.2');
    expect(formatTime(NaN)).toBe('00:00.0');
  });
});
