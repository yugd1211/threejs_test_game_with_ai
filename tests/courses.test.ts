import { describe, it, expect } from 'vitest';
import { levels } from '../src/levels';
import { GameState } from '../src/physics';
import { Pilot } from './support/pilot';
describe('ten-course playability with input-only traversal', () => {
  it('has ten unique courses and preserves the former hard course as Easy', () => {
    expect(levels).toHaveLength(10);
    expect(new Set(levels.map((l) => l.id)).size).toBe(10);
    expect(levels[0].difficulty).toBe('EASY');
    expect(levels[0].platforms[4].hazard).toBe(true);
    expect(levels[0].platforms[7].moving).toBe(true);
  });
  for (const level of levels)
    it(`completes ${level.title}`, () => {
      const game = new GameState(level);
      const pilot = new Pilot();
      game.start();
      for (let i = 0; i < 120 * 180 && game.phase !== 'complete'; i++)
        game.step(1 / 120, pilot.input(game));
      console.log(level.title, {
        phase: game.phase,
        farthest: game.farthest,
        falls: game.falls,
        time: game.elapsed,
        player: game.player,
      });
      expect(game.phase, `${level.title}: reached ${game.farthest}, fell ${game.falls} times`).toBe(
        'complete',
      );
    });
});
