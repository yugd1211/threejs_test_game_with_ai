import { test, expect } from '@playwright/test';

test('complete all three courses with real keyboard controls, then retain best records after reload', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.goto('/?qa=1');
  const held = new Set<string>();
  async function controls(codes: string[]) {
    for (const key of [...held])
      if (!codes.includes(key)) {
        await page.keyboard.up(key);
        held.delete(key);
      }
    for (const key of codes)
      if (!held.has(key)) {
        await page.keyboard.down(key);
        held.add(key);
      }
  }
  for (let level = 0; level < 3; level++) {
    if (level > 0) await page.locator(`[data-level="${level}"]`).click();
    await page
      .getByRole('button', { name: level === 0 ? '모험 시작하기' : '모험 시작하기', exact: true })
      .click();
    const end = Date.now() + 50000;
    let jumpStarted = 0,
      lastPlatform = -1;
    while (Date.now() < end) {
      const s = await page.evaluate(() => (window as any).__skyhop);
      if (s.phase === 'complete') break;
      const p = s.player;
      const nextIndex = p.grounded ? Math.min(p.platform + 1, 8) : Math.min(lastPlatform + 1, 8);
      const current = s.platforms[p.grounded ? p.platform : Math.max(lastPlatform, 0)];
      const next = s.platforms[nextIndex];
      const nextX =
        next.x + (next.moving ? Math.sin(s.worldTime * 1.3) * 1.2 : 0) + (next.hazard ? 1.25 : 0);
      const nextZ = next.z + (next.hazard ? -1.3 : 0);
      const codes: string[] = [];
      if (p.grounded) {
        if (p.platform === 8) {
          if (p.z > next.z + 0.25) codes.push('KeyW');
          if (p.z < next.z - 0.25) codes.push('KeyS');
          if (p.x > next.x + 0.25) codes.push('KeyA');
          if (p.x < next.x - 0.25) codes.push('KeyD');
        } else {
          lastPlatform = p.platform;
          const edge = current.z - current.d / 2 + 0.42;
          if (p.z > edge + 0.12) codes.push('KeyW');
          else {
            codes.push('Space', 'KeyW');
            jumpStarted = Date.now();
          }
        }
      } else {
        if (Date.now() - jumpStarted < 80) codes.push('Space');
        if (p.z > nextZ + 0.23) codes.push('KeyW');
        if (p.z < nextZ - 0.23) codes.push('KeyS');
        if (p.x > nextX + 0.23) codes.push('KeyA');
        if (p.x < nextX - 0.23) codes.push('KeyD');
      }
      await controls(codes);
      await page.waitForTimeout(32);
    }
    await controls([]);
    const final = await page.evaluate(() => (window as any).__skyhop);
    console.log('Course result', {
      level,
      phase: final.phase,
      time: final.elapsed.toFixed(2),
      falls: final.falls,
      crystals: final.collected.length,
    });
    expect(final.phase, `Course ${level}: platform ${final.farthest}, falls ${final.falls}`).toBe(
      'complete',
    );
    await expect(page.locator('#complete-overlay')).toBeVisible();
    await expect(page.locator('#save-message')).toContainText('저장했어요');
    await page.screenshot({ path: `test-results/course-${level + 1}-complete.png` });
  }
  await page.reload();
  await page.getByRole('button', { name: '나의 기록' }).click();
  await expect(page.locator('.record-row b')).not.toHaveText(['—', '—', '—']);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('skyhop-records-v1') || '{}'),
  );
  expect(Object.keys(saved)).toHaveLength(3);
});
