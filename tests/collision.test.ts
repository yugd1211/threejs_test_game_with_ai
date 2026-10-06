import { describe, it, expect } from 'vitest';
import { moveAndCollide, PLAYER_HEIGHT, PLAYER_RADIUS } from '../src/collision';
import { levels, PLATFORM_THICKNESS, platformX, platformY, type Platform } from '../src/levels';
import { GameState } from '../src/physics';
const box: Platform = { x: 0, y: 0, z: 0, w: 3, d: 3 };
describe('solid island collision', () => {
  it.each(['x', 'z'] as const)('blocks both %s side faces and permits sliding', (axis) => {
    for (const sign of [-1, 1]) {
      const start = { x: 0, y: -0.8, z: 0 };
      start[axis] = sign * 3;
      const movement = { x: 0, y: -0.1, z: 0 };
      movement[axis] = -sign * 5;
      const p = moveAndCollide(start, movement, [box], 0, 1 / 30);
      expect(p[axis]).toBeCloseTo(sign * (1.5 + PLAYER_RADIUS), 3);
      expect(p.y).toBeCloseTo(-0.9, 4);
      expect(p.support).toBe(-1);
    }
  });
  it('stops a rising head against the underside', () => {
    const p = moveAndCollide({ x: 0, y: -4, z: 0 }, { x: 0.2, y: 4, z: 0 }, [box], 0, 1 / 30);
    expect(p.y + PLAYER_HEIGHT).toBeCloseTo(-PLATFORM_THICKNESS, 3);
    expect(p.headHit).toBe(true);
    expect(p.support).toBe(-1);
  });
  it('lands on top even with a large downward displacement', () => {
    const p = moveAndCollide({ x: 0, y: 8, z: 0 }, { x: 0, y: -20, z: 0 }, [box], 0, 1 / 30);
    expect(p.y).toBe(0);
    expect(p.support).toBe(0);
  });
  it('does not turn side contact into a top landing', () => {
    const p = moveAndCollide({ x: -3, y: -0.3, z: 0 }, { x: 4, y: -0.3, z: 0 }, [box], 0, 1 / 30);
    expect(p.x).toBeLessThan(-1.5);
    expect(p.y).toBeLessThan(0);
    expect(p.support).toBe(-1);
  });
  it('allows movement across a top surface and underneath a cleared bottom', () => {
    const top = moveAndCollide(
      { x: 0, y: 0, z: 0 },
      { x: 0.2, y: -0.01, z: 0.3 },
      [box],
      0,
      1 / 120,
    );
    expect(top.x).toBeCloseTo(0.2);
    expect(top.z).toBeCloseTo(0.3);
    expect(top.support).toBe(0);
    const below = moveAndCollide({ x: -3, y: -4, z: 0 }, { x: 6, y: 0, z: 0 }, [box], 0, 1 / 120);
    expect(below.x).toBeCloseTo(3);
  });
  it('pushes a stationary character when a moving wall approaches', () => {
    const moving = { ...box, motion: { x: 1, speed: 1 } };
    const p = moveAndCollide({ x: 1.9, y: -0.5, z: 0 }, { x: 0, y: 0, z: 0 }, [moving], 0, 0.5);
    expect(p.x).toBeCloseTo(platformX(moving, 0.5) + 1.5 + PLAYER_RADIUS, 3);
  });
  it.each([0, Math.PI])(
    'carries a rider upward and downward without losing support (phase %s)',
    (phase) => {
      const lift = { ...box, motion: { y: 1.2, speed: 1, phase } };
      const g = new GameState({ ...levels[0], platforms: [lift, { ...box, z: -20 }] });
      g.start();
      for (let i = 0; i < 120; i++) {
        g.step(1 / 120, { x: 0, z: 0, jump: false });
        expect(g.player.grounded).toBe(true);
        expect(g.player.y).toBeCloseTo(platformY(lift, g.worldTime), 5);
      }
    },
  );
  it('lands relative to a rising or falling lift and can jump away from it', () => {
    const lift = { ...box, motion: { y: 0.6, speed: 1 } };
    const g = new GameState({ ...levels[0], platforms: [lift, { ...box, z: -20 }] });
    g.start();
    g.player.y = 3;
    g.player.grounded = false;
    g.player.platform = -1;
    for (let i = 0; i < 120; i++) g.step(1 / 120, { x: 0, z: 0, jump: false });
    expect(g.player.grounded).toBe(true);
    g.step(1 / 120, { x: 0, z: 0, jump: true });
    expect(g.player.grounded).toBe(false);
    expect(g.player.vy).toBeGreaterThan(0);
    g.phase = 'paused';
    const y = g.player.y,
      time = g.worldTime;
    g.step(1 / 30, { x: 0, z: 0, jump: false });
    expect(g.worldTime).toBe(time);
    expect(g.player.y).toBe(y);
  });
});

it('a descending platform pushes a character below its solid underside', () => {
  const lift = { ...box, motion: { y: -1, speed: 1 } };
  const p = moveAndCollide({ x: 0, y: -3.3, z: 0 }, { x: 0, y: 0, z: 0 }, [lift], 0, 0.5);
  expect(p.headHit).toBe(true);
  expect(p.y + PLAYER_HEIGHT).toBeCloseTo(platformY(lift, 0.5) - PLATFORM_THICKNESS, 3);
});

it('walking into a higher island cannot walk through the wall or activate its checkpoint', () => {
  const floor = { ...box, x: -4, w: 4 };
  const wall = { ...box, y: 1.8, checkpoint: true };
  const g = new GameState({ ...levels[0], platforms: [floor, wall, { ...box, z: -20 }] });
  g.start();
  for (let i = 0; i < 150; i++) g.step(1 / 120, { x: 1, z: 0, jump: false });
  expect(g.player.x).toBeCloseTo(-1.5 - PLAYER_RADIUS, 3);
  expect(g.player.y).toBe(0);
  expect(g.checkpoint).toBe(0);
  expect(g.collected.size).toBe(0);
});
