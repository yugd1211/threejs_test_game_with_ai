import { type Level, platformX, platformY } from '../../src/levels';
import { type GameState, type Input } from '../../src/physics';
// Input-only course driver. It never sets player coordinates, checkpoints or progress.
export class Pilot {
  lastPlatform = 0;
  crossingHazard = false;
  previousGrounded = true;
  constructor(public tolerance = 0.06) {}
  input(state: Pick<GameState, 'player' | 'worldTime' | 'level'>): Input {
    const { player: p, worldTime: t, level } = state;
    if (p.grounded) {
      this.lastPlatform = p.platform;
      this.crossingHazard = Boolean(
        level.platforms[p.platform].hazard && p.z > level.platforms[p.platform].z - 0.9,
      );
    }
    const current = level.platforms[this.lastPlatform];
    const targetIndex = this.crossingHazard
      ? this.lastPlatform
      : Math.min(this.lastPlatform + 1, level.platforms.length - 1);
    const target = level.platforms[targetIndex];
    const x = platformX(target, t) + (target.hazard ? 1.4 : 0);
    const z = target.z + (target.hazard ? (this.crossingHazard ? -1.4 : 1.4) : 0.2);
    const sign = (d: number) => (Math.abs(d) < this.tolerance ? 0 : Math.sign(d));
    if (p.grounded) {
      if (p.platform === level.platforms.length - 1)
        return { x: sign(target.x - p.x), z: sign(target.z - p.z), jump: false };
      if (this.crossingHazard) return { x: sign(x - p.x), z: sign(z - p.z), jump: true };
      const launchZ = current.z - current.d / 2 + 0.35;
      if (p.z > launchZ + this.tolerance) return { x: 0, z: -1, jump: false };
      // Wait for a lift's useful phase instead of attempting an impossible rise.
      const expectedY = platformY(target, t + 0.65);
      if (expectedY - p.y > 1.65) return { x: 0, z: 0, jump: false };
      return { x: sign(x - p.x), z: sign(z - p.z), jump: true };
    }
    return { x: sign(x - p.x), z: sign(z - p.z), jump: false };
  }
}
