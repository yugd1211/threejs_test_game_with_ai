import { type Platform, PLATFORM_THICKNESS, platformX, platformY } from './levels';
export const PLAYER_RADIUS = 0.28;
export const PLAYER_HEIGHT = 1.6;
const SKIN = 0.00001;
type Vec = { x: number; y: number; z: number };
type Axis = keyof Vec;
interface Hit {
  time: number;
  axis: Axis;
  sign: number;
  index: number;
}

// Sweep the player's feet through each platform's Minkowski-expanded solid box.
// Relative motion makes an approaching lift/wall collide with a stationary player too.
function sweep(position: Vec, motion: Vec, min: Vec, max: Vec): Omit<Hit, 'index'> | null {
  let entry = -Infinity,
    exit = Infinity,
    axis: Axis = 'y',
    sign = 1;
  for (const a of ['x', 'y', 'z'] as const) {
    if (Math.abs(motion[a]) < 1e-10) {
      // Tangential motion on a face is free, rather than catching a ledge's side.
      if (position[a] <= min[a] + SKIN / 2 || position[a] >= max[a] - SKIN / 2) return null;
      continue;
    }
    const first = (min[a] - position[a]) / motion[a],
      last = (max[a] - position[a]) / motion[a];
    const near = Math.min(first, last),
      far = Math.max(first, last);
    if (near > entry) {
      entry = near;
      axis = a;
      sign = motion[a] > 0 ? -1 : 1;
    }
    exit = Math.min(exit, far);
  }
  if (entry < -1e-7 || entry > 1 || entry > exit || exit < 0) return null;
  return { time: Math.max(0, entry), axis, sign };
}
export function moveAndCollide(
  position: Vec,
  displacement: Vec,
  platforms: Platform[],
  before: number,
  after: number,
) {
  const result = { ...position };
  let remaining = { ...displacement },
    fraction = 0,
    support = -1,
    headHit = false;
  const shifts = platforms.map((p) => ({
    x: platformX(p, after) - platformX(p, before),
    y: platformY(p, after) - platformY(p, before),
    z: 0,
  }));
  for (let pass = 0; pass < 8 && fraction < 1; pass++) {
    let hit: Hit | null = null;
    platforms.forEach((p, index) => {
      const shift = shifts[index];
      const x = platformX(p, before) + shift.x * fraction,
        y = platformY(p, before) + shift.y * fraction;
      const relative = {
        x: remaining.x - shift.x * (1 - fraction),
        y: remaining.y - shift.y * (1 - fraction),
        z: remaining.z,
      };
      const candidate = sweep(
        result,
        relative,
        {
          x: x - p.w / 2 - PLAYER_RADIUS,
          y: y - PLATFORM_THICKNESS - PLAYER_HEIGHT,
          z: p.z - p.d / 2 - PLAYER_RADIUS,
        },
        { x: x + p.w / 2 + PLAYER_RADIUS, y, z: p.z + p.d / 2 + PLAYER_RADIUS },
      );
      if (candidate && (!hit || candidate.time < hit.time)) hit = { ...candidate, index };
    });
    if (!hit) {
      for (const a of ['x', 'y', 'z'] as const) result[a] += remaining[a];
      break;
    }
    const contact = hit as Hit;
    for (const a of ['x', 'y', 'z'] as const) {
      result[a] += remaining[a] * contact.time;
      remaining[a] *= 1 - contact.time;
    }
    fraction += (1 - fraction) * contact.time;
    result[contact.axis] += contact.sign * SKIN;
    remaining[contact.axis] = shifts[contact.index][contact.axis] * (1 - fraction);
    if (contact.axis === 'y') {
      if (contact.sign === 1) support = contact.index;
      else headHit = true;
    }
  }
  if (support >= 0) {
    const p = platforms[support];
    if (
      Math.abs(result.x - platformX(p, after)) >= p.w / 2 + PLAYER_RADIUS ||
      Math.abs(result.z - p.z) >= p.d / 2 + PLAYER_RADIUS ||
      Math.abs(result.y - platformY(p, after)) > 0.002
    )
      support = -1;
    else result.y = platformY(p, after);
  }
  return { ...result, support, headHit };
}
