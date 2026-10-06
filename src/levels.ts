export interface Platform {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  checkpoint?: boolean;
  moving?: boolean;
  motion?: { x?: number; y?: number; speed: number; phase?: number };
  hazard?: boolean;
}
export interface Level {
  id: string;
  title: string;
  subtitle: string;
  difficulty: string;
  duration: string;
  description: string;
  sky: number;
  accent: number;
  grass: number;
  par: number;
  platforms: Platform[];
}
// Rendering and collision share this depth: the entire island is a solid block.
export const PLATFORM_THICKNESS = 1.5;
const p = (
  x: number,
  y: number,
  z: number,
  w = 3,
  d = 3.6,
  extra: Partial<Platform> = {},
): Platform => ({ x, y, z, w, d, ...extra });
interface Course {
  id: string;
  title: string;
  subtitle: string;
  difficulty: string;
  heights: number[];
  xs: number[];
  width: number;
  spacing: number;
  checkpoints: number[];
  hazards: number[];
  motions?: Record<number, NonNullable<Platform['motion']>>;
  palette: [number, number, number];
}
function course(c: Course): Level {
  const last = c.heights.length - 1;
  return {
    id: `v2-${c.id}`,
    title: c.title,
    subtitle: c.subtitle,
    difficulty: c.difficulty,
    duration: last < 12 ? '2–4분' : '3–6분',
    description: `${c.subtitle}.\n높이와 타이밍을 읽고, 다음 착지를 준비하세요.`,
    sky: c.palette[0],
    accent: c.palette[1],
    grass: c.palette[2],
    par: last * 7,
    platforms: c.heights.map((height, i) => {
      const safe = i === 0 || i === last || c.checkpoints.includes(i);
      return p(
        c.xs[i],
        height,
        3 - i * c.spacing,
        i === 0 || i === last ? 5.6 : safe || c.hazards.includes(i) ? 3.8 : c.width,
        i === 0 || i === last ? 5 : safe || c.hazards.includes(i) ? 3.6 : c.width + 0.35,
        {
          checkpoint: c.checkpoints.includes(i),
          hazard: c.hazards.includes(i),
          motion: c.motions?.[i],
        },
      );
    }),
  };
}
const mint: [number, number, number] = [0xc9dfde, 0xb9ef8b, 0xa2c790];
const sunset: [number, number, number] = [0xe8cec4, 0xffb186, 0xd7ad8c];
const moon: [number, number, number] = [0xb7bfdc, 0xc5b7f1, 0x9c9bc4];
export const levels: Level[] = [
  {
    id: 'v2-moonlight-run',
    title: 'Moonlight Run',
    subtitle: '이전 HARD, 새로운 출발선',
    difficulty: 'EASY',
    duration: '2–4분',
    description: '이전 하드 코스가 이제 시작점이에요.\n회전 장애물과 이동 발판을 넘어보세요.',
    sky: moon[0],
    accent: moon[1],
    grass: moon[2],
    par: 65,
    platforms: [
      p(0, 0, 3, 5.6, 5.5),
      p(-1.2, 0.4, -2.5),
      p(1, 0.75, -7.6),
      p(-0.7, 1.1, -12.8, 4.2, 4, { checkpoint: true }),
      p(-1, 1.4, -18, 4, 4, { hazard: true }),
      p(1, 1.8, -23.1),
      p(-1, 2, -28.3, 4.2, 4, { checkpoint: true }),
      p(0, 2.35, -33.7, 3.4, 3.5, { moving: true }),
      p(0, 2.6, -39.1, 5.8, 5.4),
    ],
  },
  course({
    id: 'terrace-ascent',
    title: 'Terrace Ascent',
    subtitle: '높은 계단을 향한 도약',
    difficulty: 'EASY+',
    palette: mint,
    width: 2.8,
    spacing: 4.6,
    heights: [0, 1.1, 2.3, 3.5, 2.5, 3.8, 5, 4, 5.3, 6.6, 7.8],
    xs: [0, -1, 1, 0, -1.2, 0.8, 0, 1.1, -1, 0.6, 0],
    checkpoints: [3, 7],
    hazards: [6],
  }),
  course({
    id: 'canyon-descent',
    title: 'Canyon Descent',
    subtitle: '급강하 뒤 다시 오르기',
    difficulty: 'NORMAL',
    palette: sunset,
    width: 2.6,
    spacing: 4.9,
    heights: [7, 5.2, 3.3, 4.5, 2.6, 0.8, 2.1, 0.2, -1.5, -0.1, 1.3, 2.5],
    xs: [0, 1.4, -0.8, 0.7, -1.2, 1, 0, -1, 1.4, -0.5, 1, 0],
    checkpoints: [3, 7],
    hazards: [6],
  }),
  course({
    id: 'lift-gardens',
    title: 'Lift Gardens',
    subtitle: '오르내리는 리프트에 올라타기',
    difficulty: 'NORMAL+',
    palette: mint,
    width: 2.55,
    spacing: 4.6,
    heights: [0, 1, 1.5, 2.7, 2, 3.2, 4.4, 3.5, 4.6, 5.8, 6.6, 7.6],
    xs: [0, -0.8, 0.7, 0, 1, -1, 0, 1, -0.8, 0.6, -0.6, 0],
    checkpoints: [3, 7],
    hazards: [6],
    motions: {
      2: { y: 0.85, speed: 1 },
      5: { y: 0.9, speed: 0.9, phase: 1.3 },
      9: { y: 1, speed: 1.1, phase: 2 },
    },
  }),
  course({
    id: 'switchback-ridge',
    title: 'Switchback Ridge',
    subtitle: '좁은 능선 위 지그재그',
    difficulty: 'HARD',
    palette: sunset,
    width: 2.2,
    spacing: 4.5,
    heights: [0, 1.3, 2.6, 1.2, 2.6, 3.9, 2.4, 3.8, 5.1, 3.5, 4.9, 6.2, 7.5],
    xs: [0, -1.5, 1.2, -0.8, 1.4, -1, 1.2, -1.2, 1.2, -1.3, 0.9, -0.8, 0],
    checkpoints: [4, 8],
    hazards: [6],
    motions: { 3: { x: 0.6, speed: 1.2 }, 10: { y: 0.7, speed: 1.1 } },
  }),
  course({
    id: 'pendulum-steps',
    title: 'Pendulum Steps',
    subtitle: '엇갈리는 승강 발판의 리듬',
    difficulty: 'HARD+',
    palette: moon,
    width: 2.15,
    spacing: 4.6,
    heights: [0, 1.2, 2.2, 3.3, 2, 3.3, 4.2, 5.3, 4, 5.4, 6.4, 7.6, 6, 7.4],
    xs: [0, 0.8, -0.9, 0.8, 0, -1, 0.8, 0, -1, 1, -0.6, 0.8, -1, 0],
    checkpoints: [4, 8],
    hazards: [7, 12],
    motions: {
      2: { y: 1, speed: 0.95 },
      3: { y: 1, speed: 0.95, phase: Math.PI },
      6: { y: 1.05, speed: 1.1, phase: 1 },
      10: { x: 0.65, y: 0.7, speed: 1 },
    },
  }),
  course({
    id: 'needle-pass',
    title: 'Needle Pass',
    subtitle: '작은 착지 공간을 정확하게',
    difficulty: 'EXPERT',
    palette: mint,
    width: 1.9,
    spacing: 4.4,
    heights: [0, 1.4, 2.8, 1.2, 2.7, 4.1, 2.5, 4, 5.4, 3.7, 5.2, 6.6, 5, 6.5, 7.9],
    xs: [0, -1, 1, -1, 0.8, -0.9, 1, -0.8, 1, -1, 0.8, -0.8, 1, -0.7, 0],
    checkpoints: [4, 9],
    hazards: [6, 12],
    motions: {
      3: { x: 0.65, speed: 1.3 },
      8: { y: 0.8, speed: 1.1 },
      11: { x: 0.7, y: 0.6, speed: 1.1 },
    },
  }),
  course({
    id: 'skyfall-tower',
    title: 'Skyfall Tower',
    subtitle: '높은 탑에서 내려갔다가 정상으로',
    difficulty: 'EXPERT+',
    palette: sunset,
    width: 1.85,
    spacing: 4.5,
    heights: [10, 8, 6, 4, 2, 3.5, 5, 3.3, 4.8, 6.3, 4.5, 6, 7.5, 9, 7, 8.5],
    xs: [0, 1, -1, 0.8, -0.9, 0.8, 0, -1, 1, -1, 0.8, -0.8, 1, -1, 0.7, 0],
    checkpoints: [4, 9],
    hazards: [6, 12],
    motions: {
      3: { y: 1, speed: 1.1 },
      7: { x: 0.6, y: 0.8, speed: 1.15 },
      11: { y: 1.1, speed: 1 },
      14: { x: 0.8, speed: 1.3 },
    },
  }),
  course({
    id: 'orbit-stairway',
    title: 'Orbit Stairway',
    subtitle: '좌우와 높이가 함께 바뀌는 길',
    difficulty: 'MASTER',
    palette: moon,
    width: 1.8,
    spacing: 4.4,
    heights: [0, 1.45, 2.9, 1.2, 2.65, 4.1, 2.3, 3.8, 5.3, 3.5, 5, 6.5, 4.7, 6.2, 7.7, 6, 7.5],
    xs: [0, -1, 1, -0.8, 0.9, -0.8, 1, -1, 0.8, -0.8, 1, -1, 0.8, -0.9, 0.8, -0.7, 0],
    checkpoints: [5, 10],
    hazards: [5, 10, 14],
    motions: {
      2: { x: 0.6, y: 0.85, speed: 1.05 },
      6: { x: 0.7, y: 0.85, speed: 1.15, phase: 1.4 },
      8: { y: 1.1, speed: 1.1 },
      12: { x: 0.7, y: 1, speed: 1.1 },
      15: { y: 1.2, speed: 1.05 },
    },
  }),
  course({
    id: 'summit-trial',
    title: 'Summit Trial',
    subtitle: '모든 도약을 연결하는 마지막 시험',
    difficulty: 'MASTER+',
    palette: [0xb9ccdb, 0xe6d297, 0x92b5b5],
    width: 1.65,
    spacing: 4.35,
    heights: [
      0, 1.5, 3, 1.2, 2.7, 4.2, 2.4, 3.9, 5.4, 3.6, 5.1, 6.6, 4.8, 6.3, 7.8, 6, 7.5, 9, 10.5,
    ],
    xs: [0, -1, 1, -1, 0.9, -0.8, 1, -1, 0.8, -0.8, 1, -1, 0.9, -0.9, 0.8, -0.8, 1, -0.7, 0],
    checkpoints: [5, 11],
    hazards: [5, 9, 14, 17],
    motions: {
      2: { y: 1, speed: 1.1 },
      4: { x: 0.7, y: 0.8, speed: 1.05 },
      7: { y: 1.1, speed: 1.15 },
      10: { x: 0.75, y: 0.9, speed: 1.15 },
      13: { x: 0.75, y: 1, speed: 1.05 },
      16: { y: 1.1, speed: 1.15 },
    },
  }),
];
export function platformX(platform: Platform, time: number): number {
  const m = platform.motion;
  return (
    platform.x +
    (m
      ? Math.sin(time * m.speed + (m.phase ?? 0)) * (m.x ?? 0)
      : platform.moving
        ? Math.sin(time * 1.3) * 1.2
        : 0)
  );
}
export function platformY(platform: Platform, time: number): number {
  const m = platform.motion;
  return platform.y + (m ? Math.sin(time * m.speed + (m.phase ?? 0)) * (m.y ?? 0) : 0);
}
export const crystalTotal = (level: Level) => level.platforms.length - 2;
export const checkpointTotal = (level: Level) => level.platforms.filter((p) => p.checkpoint).length;
