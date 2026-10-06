export interface Platform {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  checkpoint?: boolean;
  moving?: boolean;
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
const p = (
  x: number,
  y: number,
  z: number,
  w = 3.7,
  d = 3.6,
  extra: Partial<Platform> = {},
): Platform => ({ x, y, z, w, d, ...extra });
export const levels: Level[] = [
  {
    id: 'cloud-gardens',
    title: 'Cloud Gardens',
    subtitle: '구름 위의 첫걸음',
    difficulty: 'EASY',
    duration: '1–2분',
    description: '서두르지 않아도 괜찮아요.\n구름 사이, 나만의 길을 찾아보세요.',
    sky: 0xc9dfde,
    accent: 0xb9ef8b,
    grass: 0xb2d5a0,
    par: 45,
    platforms: [
      p(0, 0, 3, 5.6, 5.5),
      p(0, 0.15, -2.3),
      p(1.7, 0.4, -7.1),
      p(-0.3, 0.65, -12, 4.4, 4.1, { checkpoint: true }),
      p(-2.2, 0.9, -17),
      p(0.1, 1.1, -21.9),
      p(2, 1.35, -26.8, 4.4, 4.1, { checkpoint: true }),
      p(0.3, 1.5, -31.7),
      p(0, 1.65, -37, 5.8, 5.4),
    ],
  },
  {
    id: 'sunset-circuit',
    title: 'Sunset Circuit',
    subtitle: '노을을 따라 달려요',
    difficulty: 'NORMAL',
    duration: '2–3분',
    description: '움직이는 섬의 리듬을 느껴보세요.\n노을 끝에 새로운 기록이 기다려요.',
    sky: 0xe8cec4,
    accent: 0xffb186,
    grass: 0xdfb797,
    par: 55,
    platforms: [
      p(0, 0, 3, 5.6, 5.5),
      p(1, 0.35, -2.5, 3.3),
      p(-1.1, 0.7, -7.5, 3.3),
      p(1, 0.95, -12.6, 4.2, 4, { checkpoint: true }),
      p(0, 1.2, -17.8, 3.7, 3.5, { moving: true }),
      p(-1.5, 1.5, -22.9, 3.2),
      p(0.5, 1.8, -28, 4.2, 4, { checkpoint: true }),
      p(2, 2, -33.2, 3.2),
      p(0, 2.2, -38.5, 5.8, 5.4),
    ],
  },
  {
    id: 'moonlight-run',
    title: 'Moonlight Run',
    subtitle: '별빛 속의 도전',
    difficulty: 'HARD',
    duration: '2–4분',
    description: '좁아진 발판, 회전하는 장애물.\n조금 더 대담한 점프가 필요해요.',
    sky: 0xb7bfdc,
    accent: 0xc5b7f1,
    grass: 0xaaa9d2,
    par: 65,
    platforms: [
      p(0, 0, 3, 5.6, 5.5),
      p(-1.2, 0.4, -2.5, 3),
      p(1, 0.75, -7.6, 3),
      p(-0.7, 1.1, -12.8, 4.2, 4, { checkpoint: true }),
      p(-1, 1.4, -18, 4, 4, { hazard: true }),
      p(1, 1.8, -23.1, 3),
      p(-1, 2, -28.3, 4.2, 4, { checkpoint: true }),
      p(0, 2.35, -33.7, 3.4, 3.5, { moving: true }),
      p(0, 2.6, -39.1, 5.8, 5.4),
    ],
  },
];
export function platformX(platform: Platform, time: number): number {
  return platform.x + (platform.moving ? Math.sin(time * 1.3) * 1.2 : 0);
}
