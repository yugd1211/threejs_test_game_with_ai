import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import './style.css';
import {
  createIcons,
  Layers,
  ArrowUpRight,
  ArrowRight,
  Play,
  Gem,
  Flag,
  Trophy,
  Volume2,
  VolumeX,
  Maximize2,
  Pause,
  RotateCcw,
  X,
  Check,
  ChevronRight,
  Sparkles,
  Keyboard,
  CircleHelp,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
} from 'lucide';
import { levels, crystalTotal, checkpointTotal } from './levels';
import { GameState, formatTime } from './physics';
import { World } from './scene';
import { loadRecords, saveRecord } from './storage';
import { Sound } from './audio';
const icons = {
  Layers,
  ArrowUpRight,
  ArrowRight,
  Play,
  Gem,
  Flag,
  Trophy,
  Volume2,
  VolumeX,
  Maximize2,
  Pause,
  RotateCcw,
  X,
  Check,
  ChevronRight,
  Sparkles,
  Keyboard,
  CircleHelp,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
};
const icon = (name: string) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const refreshIcons = () => createIcons({ icons, attrs: { 'stroke-width': 1.8 } });
const islandArt = (index: number) =>
  `<svg viewBox="0 0 118 94" aria-hidden="true"><ellipse cx="62" cy="80" rx="34" ry="5" fill="currentColor" opacity=".1"/><path d="m22 46 36-20 37 20-37 20z" fill="${['#a9ce99', '#efb997', '#b9afe3'][index % 3]}"/><path d="m22 46 36 20 37-20v13L58 81 22 59z" fill="#f3ead2"/><path d="m58 66 37-20v13L58 81z" fill="#d7d6c0"/><path d="m36 66 22 13 22-13-22 24z" fill="#b9c8b2"/><path d="M37 37V20" stroke="#867e62" stroke-width="3"/><path d="m25 25 12-22 12 22-12 8z" fill="${['#639780', '#d2937e', '#8f84b8'][index % 3]}"/><path d="M72 45V25" stroke="#fdf6df" stroke-width="2"/><path d="M73 25h13l-4 5 4 5H73" fill="${['#f29873', '#f0e3a7', '#d7ecb0'][index % 3]}"/><path d="m57 34 5 7-5 8-5-8z" fill="#fff1a1"/></svg>`;
$('#app').innerHTML = `
  <header class="site-header">
    <a class="brand" href="./" aria-label="SKYHOP 홈"><span class="brand-mark">${icon('layers')}</span><span>skyhop<span class="brand-period">.</span></span><span class="brand-tag">PLAY ABOVE</span></a>
    <nav aria-label="주 메뉴"><button class="nav-link active" id="nav-play">플레이<span class="nav-dot"></span></button><button class="nav-link" id="help-nav">플레이 방법</button><button class="nav-link" id="records-nav">나의 기록 ${icon('arrow-up-right')}</button></nav>
    <div class="header-note"><span class="online-dot"></span> A SMALL ESCAPE, A BIG ADVENTURE</div>
  </header>
  <main>
    <div class="eyebrow-row"><span>YOUR NEXT LITTLE ADVENTURE</span><span>${icon('sparkles')} 가볍게 시작하는 3D 파쿠르</span></div>
    <section class="play-layout" aria-label="SKYHOP 게임">
      <aside class="intro-panel">
        <span class="pill">${icon('layers')} 3D PARKOUR <span>•</span> FREE TO PLAY</span>
        <h1>A little leap.<br>A big<br><span>adventure.</span><svg viewBox="0 0 260 16" aria-hidden="true"><path d="M2 11C65 0 165 2 256 7"/></svg></h1>
        <p class="intro-copy" id="level-description">서두르지 않아도 괜찮아요.<br>구름 사이, 나만의 길을 찾아보세요.</p>
        <button id="play-button" class="button primary">모험 시작하기 ${icon('arrow-up-right')}</button>
        <div class="play-caption"><span class="tiny-dot"></span> 설치 없이, 바로 플레이</div>
        <div class="session-card">
          <div class="session-heading"><span>이번 모험</span><span id="session-state">READY TO HOP</span></div>
          <div class="session-values"><div><span class="stat-label">${icon('gem')} 크리스털</span><strong><span id="crystal-count">0</span><small> / <span id="crystal-total">7</span></small></strong></div><div><span class="stat-label">${icon('flag')} 체크포인트</span><strong><span id="checkpoint-count">0</span><small> / <span id="checkpoint-total">2</span></small></strong></div></div>
          <div class="progress-track"><div id="progress-fill"></div></div>
          <div class="session-bottom"><span id="objective">첫 번째 섬으로 점프해 보세요</span><span id="progress-label">0%</span></div>
        </div>
        <div class="personal-best">${icon('trophy')}<span>나의 최고 기록</span><strong id="best-time">아직 없어요</strong></div>
      </aside>
      <div class="game-column">
        <div class="game-viewport" id="game-viewport">
          <div id="canvas-container"></div>
          <div class="viewport-top"><div class="world-label"><span class="world-number" id="world-number">01</span><div><span class="small-caps">YOU ARE EXPLORING</span><strong id="world-title">Cloud Gardens</strong></div></div><div class="viewport-tools"><button class="icon-button" id="sound-button" aria-label="소리 끄기" aria-pressed="true" title="소리 켜기/끄기">${icon('volume-2')}</button><button class="icon-button" id="quality-button" aria-label="절전 그래픽 켜기" aria-pressed="false" title="그래픽 품질">${icon('sliders-horizontal')}</button><button class="icon-button" id="fullscreen-button" aria-label="게임 전체 화면" title="전체 화면">${icon('maximize-2')}</button></div></div>
          <div class="timer-badge">${icon('sparkles')}<span id="timer">00:00.0</span><button id="pause-button" aria-label="일시정지" title="일시정지 (Esc)" disabled>${icon('pause')}</button></div>
          <div class="scene-intro" id="scene-intro"><span class="scene-intro-line"></span><span>조금 더 높이, 조금 더 멀리.</span><span class="scene-intro-line"></span></div>
          <div id="toast" class="toast" role="status" aria-live="polite"></div>
          <div class="viewport-bottom"><span class="live-label"><span></span> <span id="altitude">ALT +0.0 m</span></span><span id="level-difficulty" class="difficulty">${icon('layers')} EASY</span></div>
          <div class="screen-overlay" id="pause-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title" hidden><div class="overlay-card"><span class="overlay-icon">${icon('pause')}</span><span class="small-caps">TAKE A LITTLE BREATH</span><h2 id="pause-title">잠깐, 쉬어가요.</h2><p>구름은 도망가지 않아요.<br>준비되면 이어서 모험해요.</p><button id="resume-button" class="button primary">계속 플레이 ${icon('play')}</button><button id="restart-button" class="button secondary">처음부터 다시 ${icon('rotate-ccw')}</button></div></div>
          <div class="screen-overlay" id="complete-overlay" role="dialog" aria-modal="true" aria-labelledby="complete-title" hidden><div class="overlay-card complete-card"><span class="overlay-icon">${icon('trophy')}</span><span class="small-caps" id="result-eyebrow">ADVENTURE COMPLETE</span><h2 id="complete-title">멋진 착지예요!</h2><p>한 번의 작은 점프가, 멋진 모험이 됐네요.</p><div class="result-stats"><div><span>완주 기록</span><strong id="result-time"></strong></div><div><span>크리스털</span><strong id="result-crystals"></strong></div><div><span>재도전</span><strong id="result-falls"></strong></div></div><p class="save-message" id="save-message"></p><button id="next-button" class="button primary">다음 모험으로 ${icon('arrow-right')}</button><button id="replay-button" class="button secondary">기록에 다시 도전 ${icon('rotate-ccw')}</button></div></div>
          <div class="touch-controls" id="touch-controls"><div class="dpad"><button data-control="forward" class="pad-up" aria-label="앞으로 이동">${icon('arrow-up')}</button><button data-control="left" class="pad-left" aria-label="왼쪽 이동">${icon('arrow-left')}</button><button data-control="back" class="pad-down" aria-label="뒤로 이동">${icon('arrow-down')}</button><button data-control="right" class="pad-right" aria-label="오른쪽 이동">${icon('arrow-right')}</button></div><button data-control="jump" class="jump-pad" aria-label="점프">${icon('arrow-up')}<span>JUMP</span></button></div>
          <div class="screen-overlay" id="error-overlay" hidden><div class="overlay-card"><h2>3D 화면을 열 수 없어요</h2><p>브라우저의 하드웨어 가속을 켜고 새로고침해 주세요. 최신 Chrome, Edge, Safari를 권장합니다.</p><button class="button primary" id="reload-button">다시 불러오기</button></div></div>
        </div>
        <div class="control-strip"><div class="keyboard-hints"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 이동</span><span><kbd class="space-key">SPACE</kbd> 점프</span><span><kbd>ESC</kbd> 일시정지</span></div><span class="mobile-hint">방향 버튼으로 이동 · JUMP로 점프</span><button id="help-button">처음 오셨나요? ${icon('circle-help')}</button></div>
      </div>
    </section>
    <section class="worlds-section" aria-labelledby="worlds-heading"><div class="section-heading"><div><span class="section-kicker">FIND YOUR NEXT HOP</span><h2 id="worlds-heading">어떤 하늘을 만나볼까요?</h2></div><span class="world-count">${String(levels.length).padStart(2, '0')} WORLDS <span>·</span> ENDLESS LITTLE MOMENTS</span></div><div class="world-cards">${levels.map((level, index) => `<button class="world-card ${index === 0 ? 'selected' : ''}" data-level="${index}" aria-pressed="${index === 0}"><span class="world-art art-${index % 3}">${islandArt(index)}</span><span class="world-card-body"><span class="world-card-top">WORLD ${String(index + 1).padStart(2, '0')}<span class="level-tag tag-${index % 3}">${level.difficulty}</span></span><strong>${level.title}</strong><span class="world-card-description">${level.subtitle} <span>· ${level.duration}</span></span></span><span class="world-card-arrow">${icon(index === 0 ? 'check' : 'arrow-up-right')}</span></button>`).join('')}</div></section>
    <footer><span>작은 점프에도, 당신만의 모험이 있어요.</span><span>BUILT WITH THREE.JS <span class="footer-cross">✳</span> PLAY A LITTLE. FEEL A LOT.</span></footer>
  </main>
  <dialog id="info-dialog" aria-labelledby="dialog-title"><button class="dialog-close icon-button" id="dialog-close" aria-label="닫기">${icon('x')}</button><div id="dialog-content"></div></dialog>
`;
refreshIcons();
const sound = new Sound();
let index = 0;
let state = new GameState(levels[index]);
let world: World | undefined;
let lowQuality = false;
let toastUntil = 0;
let previousPhase = state.phase;
const keys = new Set<string>(),
  touch = new Set<string>();
const viewport = $('#game-viewport');
const dialog = $<HTMLDialogElement>('#info-dialog');
const input = () => ({
  x:
    Number(keys.has('KeyD') || keys.has('ArrowRight') || touch.has('right')) -
    Number(keys.has('KeyA') || keys.has('ArrowLeft') || touch.has('left')),
  z:
    Number(keys.has('KeyS') || keys.has('ArrowDown') || touch.has('back')) -
    Number(keys.has('KeyW') || keys.has('ArrowUp') || touch.has('forward')),
  jump: keys.has('Space') || touch.has('jump'),
});
function clearInput() {
  keys.clear();
  touch.clear();
  document.querySelectorAll('.touch-controls .held').forEach((el) => el.classList.remove('held'));
}
function toast(message: string) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastUntil = performance.now() + 3000;
}
function best() {
  const r = loadRecords()[state.level.id];
  $('#best-time').textContent = r ? formatTime(r.time) : '아직 없어요';
}
function syncUI() {
  $('#crystal-total').textContent = String(crystalTotal(state.level));
  $('#checkpoint-total').textContent = String(checkpointTotal(state.level));
  const active = state.phase === 'running';
  $('#pause-overlay').hidden = state.phase !== 'paused';
  $('#complete-overlay').hidden = state.phase !== 'complete';
  $('#scene-intro').hidden = state.phase !== 'ready';
  $('#touch-controls').classList.toggle('playing', active);
  $<HTMLButtonElement>('#pause-button').disabled = !active;
  $('#session-state').textContent = {
    ready: 'READY TO HOP',
    running: 'ON AN ADVENTURE',
    paused: 'TAKE A BREATH',
    complete: 'NICELY DONE!',
  }[state.phase];
  $('#play-button').innerHTML =
    state.phase === 'ready'
      ? `모험 시작하기 ${icon('arrow-up-right')}`
      : active
        ? `잠시 쉬어가기 ${icon('pause')}`
        : state.phase === 'paused'
          ? `계속 플레이 ${icon('play')}`
          : `다시 도전하기 ${icon('rotate-ccw')}`;
  refreshIcons();
}
function start() {
  if (!world) return;
  sound.unlock();
  clearInput();
  if (state.phase === 'complete') state.reset();
  state.start();
  syncUI();
  ($(':focus') as HTMLElement | null)?.blur();
  if (matchMedia('(max-width: 740px)').matches)
    viewport.scrollIntoView({ behavior: 'instant', block: 'center' });
}
function pause() {
  if (state.phase !== 'running') return;
  state.phase = 'paused';
  clearInput();
  syncUI();
  $('#resume-button').focus();
}
function resume() {
  if (state.phase !== 'paused') return;
  clearInput();
  state.phase = 'running';
  syncUI();
  $('#play-button').focus({ preventScroll: true });
  $('#play-button').blur();
}
function restart() {
  state.reset();
  start();
}
function chooseLevel(next: number) {
  index = next;
  clearInput();
  state = new GameState(levels[index]);
  world?.setLevel(state.level);
  $('#world-number').textContent = String(index + 1).padStart(2, '0');
  $('#world-title').textContent = state.level.title;
  $('#level-description').textContent = state.level.description;
  $('#level-difficulty').innerHTML = `${icon('layers')} ${state.level.difficulty}`;
  document.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((button, i) => {
    button.classList.toggle('selected', i === index);
    button.setAttribute('aria-pressed', String(i === index));
    button.querySelector('.world-card-arrow')!.innerHTML = icon(
      i === index ? 'check' : 'arrow-up-right',
    );
  });
  $('#toast').classList.remove('visible');
  best();
  syncUI();
}
function finish() {
  clearInput();
  const result = saveRecord(state.level.id, {
    time: state.elapsed,
    crystals: state.collected.size,
    falls: state.falls,
  });
  $('#result-eyebrow').textContent = result.isBest ? 'A NEW PERSONAL BEST!' : 'ADVENTURE COMPLETE';
  $('#result-time').textContent = formatTime(state.elapsed);
  $('#result-crystals').textContent = `${state.collected.size} / ${crystalTotal(state.level)}`;
  $('#result-falls').textContent = `${state.falls}회`;
  $('#save-message').textContent = result.saved
    ? '이 브라우저에 최고 기록을 저장했어요.'
    : '브라우저 저장 공간을 사용할 수 없어 기록이 저장되지 않았어요.';
  $('#next-button').innerHTML =
    index < levels.length - 1
      ? `다음 모험으로 ${icon('arrow-right')}`
      : `첫 번째 하늘로 ${icon('arrow-right')}`;
  best();
  syncUI();
  $('#next-button').focus();
}
function showHelp() {
  if (state.phase === 'running') pause();
  $('#dialog-content').innerHTML =
    `<span class="dialog-kicker">A QUICK FIELD GUIDE</span><h2 id="dialog-title">첫 점프는, 가볍게.</h2><p class="dialog-lead">공중섬을 따라 마지막 빛나는 포털에 도착하세요.</p><div class="guide-grid"><div><span class="guide-number">01</span><h3>걷고, 점프하고</h3><p><kbd>W A S D</kbd> 또는 방향키로 이동하고 <kbd>Space</kbd>로 점프하세요. 화면 위쪽이 앞으로예요.</p></div><div><span class="guide-number">02</span><h3>반짝임을 따라가요</h3><p>현재 코스의 황금 크리스털 ${crystalTotal(state.level)}개를 모아보세요. 모두 모으지 않아도 포털을 통과하면 완주예요.</p></div><div><span class="guide-number">03</span><h3>떨어져도 괜찮아요</h3><p>깃발이 있는 섬은 체크포인트예요. 떨어지면 마지막 깃발로 돌아오고, 수집한 크리스털은 유지돼요.</p></div><div><span class="guide-number">04</span><h3>나만의 페이스로</h3><p><kbd>Esc</kbd> 또는 <kbd>P</kbd>로 잠시 쉬세요. 타이머도 멈춰요. 모바일에서는 화면의 방향 버튼과 JUMP를 사용해요.</p></div></div><div class="guide-tip">${icon('sparkles')} 섬 가장자리에서 점프하면 멀리 갈 수 있어요. 노란 테두리는 좌우 이동, 청록 테두리는 승강 발판이에요. 높은 발판은 상승 타이밍을 기다리세요. 옆면과 아랫면은 통과할 수 없어요.</div><button id="guide-done" class="button primary">좋아요, 준비됐어요 ${icon('arrow-right')}</button>`;
  refreshIcons();
  dialog.showModal();
  $('#guide-done').onclick = () => dialog.close();
}
function showRecords() {
  if (state.phase === 'running') pause();
  const records = loadRecords();
  $('#dialog-content').innerHTML =
    `<span class="dialog-kicker">YOUR LITTLE MILESTONES</span><h2 id="dialog-title">나의 모험 기록</h2><p class="dialog-lead">각 하늘에서 가장 빨랐던 순간을 모았어요.</p><div class="records-list">${levels
      .map((level, i) => {
        const record = records[level.id];
        return `<div class="record-row"><span class="record-index">${String(i + 1).padStart(2, '0')}</span><div><strong>${level.title}</strong><span>${record ? `크리스털 ${record.crystals}/${crystalTotal(level)} · 재도전 ${record.falls}회` : '첫 모험을 기다리고 있어요'}</span></div><b>${record ? formatTime(record.time) : '—'}</b></div>`;
      })
      .join(
        '',
      )}</div><p class="record-note">기록은 현재 브라우저에 저장됩니다. 브라우저 데이터를 지우면 기록도 초기화돼요.</p>`;
  dialog.showModal();
}
$('#play-button').onclick = () =>
  state.phase === 'running' ? pause() : state.phase === 'paused' ? resume() : start();
$('#nav-play').onclick = () => {
  viewport.scrollIntoView({
    behavior: world?.reducedMotion ? 'instant' : 'smooth',
    block: 'center',
  });
};
$('#pause-button').onclick = pause;
$('#resume-button').onclick = resume;
$('#restart-button').onclick = restart;
$('#replay-button').onclick = restart;
$('#next-button').onclick = () => {
  chooseLevel((index + 1) % levels.length);
  start();
};
$('#help-nav').onclick = showHelp;
$('#help-button').onclick = showHelp;
$('#records-nav').onclick = showRecords;
$('#dialog-close').onclick = () => dialog.close();
// Clicking the native dialog backdrop closes it; clicks inside content do not.
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    )
      dialog.close();
  }
});
dialog.addEventListener('close', () => clearInput());
$('#sound-button').onclick = () => {
  sound.enabled = !sound.enabled;
  if (sound.enabled) sound.unlock();
  $('#sound-button').innerHTML = icon(sound.enabled ? 'volume-2' : 'volume-x');
  $('#sound-button').setAttribute('aria-label', sound.enabled ? '소리 끄기' : '소리 켜기');
  $('#sound-button').setAttribute('aria-pressed', String(sound.enabled));
  refreshIcons();
};
$('#quality-button').onclick = () => {
  lowQuality = !lowQuality;
  world?.quality(!lowQuality);
  $('#quality-button').setAttribute('aria-pressed', String(lowQuality));
  $('#quality-button').setAttribute(
    'aria-label',
    lowQuality ? '절전 그래픽 끄기' : '절전 그래픽 켜기',
  );
  toast(lowQuality ? '절전 모드 · 더 가볍게 플레이해요' : '고화질 모드 · 그림자가 더 선명해요');
};
$('#fullscreen-button').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (viewport.requestFullscreen) await viewport.requestFullscreen();
    else toast('이 브라우저는 전체 화면을 지원하지 않아요');
  } catch {
    toast('현재 브라우저에서 전체 화면을 열 수 없어요');
  }
};
$('#reload-button').onclick = () => location.reload();
document.querySelectorAll<HTMLButtonElement>('[data-level]').forEach(
  (button) =>
    (button.onclick = () => {
      const next = Number(button.dataset.level);
      if (next === index) return;
      if (state.phase === 'running' || state.phase === 'paused') {
        pause();
        $('#dialog-content').innerHTML =
          `<span class="dialog-kicker">A DIFFERENT SKY</span><h2 id="dialog-title">새로운 하늘로 떠날까요?</h2><p class="dialog-lead">현재 진행 중인 모험은 초기화돼요. 저장된 최고 기록은 유지됩니다.</p><div class="dialog-actions"><button id="confirm-level" class="button primary">코스 변경하기 ${icon('arrow-right')}</button><button id="cancel-level" class="button secondary">지금 모험 계속하기</button></div>`;
        refreshIcons();
        dialog.showModal();
        $('#confirm-level').onclick = () => {
          dialog.close();
          chooseLevel(next);
        };
        $('#cancel-level').onclick = () => {
          dialog.close();
          resume();
        };
      } else chooseLevel(next);
    }),
);
window.addEventListener('keydown', (event) => {
  if (dialog.open) return;
  if (event.code === 'Tab' && (state.phase === 'paused' || state.phase === 'complete')) {
    const overlay = state.phase === 'paused' ? $('#pause-overlay') : $('#complete-overlay');
    const buttons = [...overlay.querySelectorAll<HTMLButtonElement>('button')];
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = (current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[next].focus();
    return;
  }
  if (['Escape', 'KeyP'].includes(event.code)) {
    event.preventDefault();
    state.phase === 'running' ? pause() : resume();
    return;
  }
  if (
    [
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'Space',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
    ].includes(event.code) &&
    state.phase === 'running'
  ) {
    event.preventDefault();
    keys.add(event.code);
  }
});
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => {
  clearInput();
  if (state.phase === 'running') pause();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInput();
    pause();
  }
});
document.querySelectorAll<HTMLButtonElement>('[data-control]').forEach((button) => {
  button.addEventListener('pointerdown', (event) => {
    if (state.phase !== 'running') return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    touch.add(button.dataset.control!);
    button.classList.add('held');
  });
  const release = () => {
    touch.delete(button.dataset.control!);
    button.classList.remove('held');
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
});
try {
  world = new World($('#canvas-container'), state.level);
  world.renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    pause();
    $('#error-overlay').hidden = false;
    $<HTMLButtonElement>('#play-button').disabled = true;
  });
} catch (error) {
  console.error('Unable to initialize WebGL', error);
  $('#error-overlay').hidden = false;
  $<HTMLButtonElement>('#play-button').disabled = true;
}
chooseLevel(0);
let last = performance.now();
let accumulator = 0;
function frame(now: number) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  const controls = input();
  accumulator += dt;
  while (accumulator >= 1 / 120) {
    state.step(1 / 120, controls);
    accumulator -= 1 / 120;
  }
  for (const event of state.events) {
    sound.play(event);
    if (event === 'checkpoint') toast('체크포인트 저장! 이제 여기서 다시 시작해요');
    if (event === 'crystal' && state.collected.size === crystalTotal(state.level))
      toast(`크리스털 ${crystalTotal(state.level)}개를 모두 모았어요!`);
    if (event === 'fall') toast('괜찮아요. 다시 한 번, 가볍게!');
    if (event === 'complete') finish();
  }
  state.events = [];
  if (state.phase !== previousPhase) {
    syncUI();
    previousPhase = state.phase;
  }
  $('#timer').textContent = formatTime(state.elapsed);
  $('#altitude').textContent =
    `ALT ${state.player.y >= 0 ? '+' : ''}${state.player.y.toFixed(1)} m`;
  $('#crystal-count').textContent = String(state.collected.size);
  $('#checkpoint-count').textContent = String(
    state.level.platforms.slice(0, state.checkpoint + 1).filter((p) => p.checkpoint).length,
  );
  const progress = Math.round((state.farthest / (state.level.platforms.length - 1)) * 100);
  $('#progress-fill').style.width = `${progress}%`;
  $('#progress-label').textContent = `${progress}%`;
  $('#objective').textContent =
    state.phase === 'complete'
      ? '구름 위 모험을 완주했어요!'
      : state.farthest === 0
        ? '첫 번째 섬으로 점프해 보세요'
        : state.farthest >= state.level.platforms.length - 2
          ? '마지막 포털이 기다리고 있어요'
          : `다음 섬으로! · ${state.farthest + 1} / ${state.level.platforms.length} 구간`;
  if (now > toastUntil) $('#toast').classList.remove('visible');
  if (world) {
    if (controls.x || controls.z) {
      const angle = Math.atan2(-controls.x, -controls.z);
      world.avatar.rotation.y = angle;
    }
    world.update(state, dt, Boolean(controls.x || controls.z));
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Read-only telemetry is exposed only on the development server with ?qa=1.
// Browser QA uses real keyboard/touch input; there is no teleport or win shortcut.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('qa')) {
  Object.defineProperty(window, '__skyhop', {
    get: () => ({
      phase: state.phase,
      player: { ...state.player },
      elapsed: state.elapsed,
      worldTime: state.worldTime,
      falls: state.falls,
      checkpoint: state.checkpoint,
      collected: [...state.collected],
      farthest: state.farthest,
      level: index,
      platforms: state.level.platforms.map((p) => ({ ...p })),
    }),
  });
}
