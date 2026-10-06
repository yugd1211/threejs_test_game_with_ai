# SKYHOP

**A little leap. A big adventure.**

Three.js로 만든 싱글플레이 3D 공중섬 파쿠르 게임입니다. 설치·로그인·API 키 없이 브라우저에서 플레이합니다.

## 실행

Node.js 22.12 이상이 필요합니다. 이 클라우드 환경에서는 Node.js 24와 npm을 사용합니다.

```sh
npm ci --cache /workspace/.npm-cache
npm run dev
```

개발 서버는 포트 **5173**, 호스트 `0.0.0.0`에서 실행됩니다. 다른 로컬 환경에서는 `npm ci`로 설치해도 됩니다.

```sh
npm run build       # TypeScript 검증 + 프로덕션 dist 생성
npm run preview     # 프로덕션 빌드 확인
npm test            # 물리/기록 저장 단위 테스트
npm run test:e2e     # 실제 Chromium 키보드·터치·완주 테스트
npm run format:check
```

브라우저 테스트는 클라우드에 설치된 `/usr/bin/chromium`을 사용합니다. 다른 환경에서는 `CHROMIUM_PATH`로 실행 파일 경로를 지정하거나 `npx playwright install chromium`으로 Playwright Chromium을 설치하세요. 시스템 Chromium이 없으면 Playwright 브라우저를 사용합니다.

## 플레이

- **이동:** WASD / 방향키. **점프:** Space. **일시정지:** Esc / P.
- 모바일에서는 방향 버튼과 JUMP 버튼을 동시에 누를 수 있습니다.
- 떠 있는 섬을 건너 마지막 포털에 들어가면 완주합니다.
- 코스마다 크리스털 7–17개와 체크포인트 2개가 있습니다. 크리스털 수집은 선택 목표입니다.
- 떨어지면 마지막 체크포인트로 복귀하며, 모은 크리스털은 유지됩니다.
- 코스별 최고 기록은 현재 브라우저의 localStorage에 저장됩니다. 새 10레벨 기록은 v2 키에 저장하며 이전 기록(v1)은 삭제하지 않습니다.
- 소리, 절전 그래픽, 전체 화면을 게임 화면 오른쪽 위에서 설정할 수 있습니다.

## 10개 레벨

이전 하드 코스인 Moonlight Run이 이제 **레벨 1 / Easy**입니다. 레벨 번호가 올라갈수록 높낮이 차이, 발판 폭, 승강 타이밍과 경로 길이가 어려워집니다.

| 번호 | 코스             | 난이도  | 특징                                           |
| ---- | ---------------- | ------- | ---------------------------------------------- |
| 01   | Moonlight Run    | Easy    | 이전 하드와 동일한 배치, 회전 장애물·좌우 이동 |
| 02   | Terrace Ascent   | Easy+   | 높은 계단과 중간 하강                          |
| 03   | Canyon Descent   | Normal  | 연속 급강하, 재상승                            |
| 04   | Lift Gardens     | Normal+ | 위아래로 움직이는 승강 발판                    |
| 05   | Switchback Ridge | Hard    | 좁은 지그재그 능선                             |
| 06   | Pendulum Steps   | Hard+   | 서로 반대 위상으로 움직이는 리프트             |
| 07   | Needle Pass      | Expert  | 작은 발판과 높은 단차                          |
| 08   | Skyfall Tower    | Expert+ | 높은 곳에서 하강 후 재상승                     |
| 09   | Orbit Stairway   | Master  | 좌우·상하 복합 이동                            |
| 10   | Summit Trial     | Master+ | 19개 발판, 17개 크리스털, 종합 도전            |

- 노란 테두리는 좌우 이동, **청록 테두리와 가이드 선은 승강 발판**입니다.
- 발판에 서 있으면 상하·좌우 이동을 따라갑니다. 높은 단차에서는 리프트 타이밍을 기다리세요.
- 발판은 두께가 있는 고체입니다. 옆면을 통과할 수 없고, 아랫면에 머리를 부딪히면 상승이 멈춥니다.
- 전체 코스가 보이도록 준비 화면 카메라를 자동 조정하며, 플레이 중 현재 고도를 표시합니다.

## 구성

- `src/levels.ts`: 코스 데이터와 이동 발판 경로
- `src/collision.ts`: 캐릭터의 폭·높이를 반영한 연속 충돌 검사와 이동 발판 상대 운동
- `src/physics.ts`: 고정 시간 간격 물리, 점프·충돌·체크포인트·완주
- `src/scene.ts`: Three.js 렌더러, 직접 만든 3D 에셋, 카메라·조명
- `src/main.ts`: UI, 입력, 상태 전환, 접근성, 게임 루프
- `src/storage.ts`: 검증된 로컬 최고 기록 저장
- `src/audio.ts`: Web Audio 합성 효과음
- `tests/`: 물리·저장·실제 브라우저 테스트
- [기획·조사 기록](docs/GAME_DESIGN.md)
- [QA와 개선 기록](docs/QA.md)

모든 3D 모델은 코드로 생성합니다. 아이콘은 Lucide, 폰트는 로컬 번들된 DM Sans와 Manrope이며 각 패키지 라이선스를 따릅니다. 런타임 외부 폰트·이미지·API 요청은 없습니다. 온라인 리더보드, 계정, 멀티플레이는 없습니다.

## 검증의 범위

Chromium의 실제 WebGL 렌더링, 데스크톱 키보드, 모바일 터치 에뮬레이션으로 검증합니다. 실제 iOS/Android 기기의 발열·성능과 Safari/Firefox는 아직 별도 검증하지 않았습니다. `?qa=1` 개발 모드에서는 읽기 전용 상태 정보가 노출되어 테스트가 실제 입력으로 코스를 진행합니다. 프로덕션 빌드에는 이 개발용 분기가 제거됩니다.

최신 인기 순위 조사 대상 사이트가 환경 프록시에서 차단되어, 장르 선택은 검증된 실시간 순위가 아닌 구현 범위와 즉시 플레이 적합성에 근거했습니다. 상세 내용은 기획 문서를 참고하세요.

의존성을 다시 설치할 때는 먼저 이 프로젝트의 개발 서버를 종료하고, `npm ci` 후 다시 시작하세요. 실행 중인 Vite가 교체 전 의존성 캐시를 기억하면 `504 Outdated Optimize Dep` 응답이 발생할 수 있습니다.
