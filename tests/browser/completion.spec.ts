import { test, expect } from '@playwright/test';
import { levels, crystalTotal } from '../../src/levels';
import { Pilot } from '../support/pilot';

for (const [index, level] of levels.entries()) {
  test(`level ${index + 1}: keyboard completion and persistent record — ${level.title}`, async ({
    page,
  }) => {
    test.setTimeout(150_000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/?qa=1');
    await page.locator(`[data-level="${index}"]`).click();
    await expect(page.locator('#world-number')).toHaveText(String(index + 1).padStart(2, '0'));
    await expect(page.locator('#crystal-total')).toHaveText(String(crystalTotal(level)));
    await page.getByRole('button', { name: '모험 시작하기', exact: true }).click();
    const held = new Set<string>(),
      pilot = new Pilot(0.2);
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
    const end = Date.now() + 110_000;
    while (Date.now() < end) {
      const state = await page.evaluate(() => (window as any).__skyhop);
      if (state.phase === 'complete') break;
      const input = pilot.input({ ...state, level });
      const keys: string[] = [];
      if (input.x < 0) keys.push('KeyA');
      if (input.x > 0) keys.push('KeyD');
      if (input.z < 0) keys.push('KeyW');
      if (input.z > 0) keys.push('KeyS');
      if (input.jump) keys.push('Space');
      await controls(keys);
      await page.waitForTimeout(24);
    }
    await controls([]);
    const final = await page.evaluate(() => (window as any).__skyhop);
    console.log('Course result', {
      level: index + 1,
      phase: final.phase,
      platform: final.farthest,
      time: final.elapsed.toFixed(2),
      falls: final.falls,
      crystals: final.collected.length,
    });
    expect(final.phase, `Reached platform ${final.farthest}, fell ${final.falls} times`).toBe(
      'complete',
    );
    await expect(page.locator('#result-crystals')).toHaveText(
      `${final.collected.length} / ${crystalTotal(level)}`,
    );
    await expect(page.locator('#save-message')).toContainText('저장했어요');
    await page.screenshot({ path: `test-results/level-${index + 1}-complete.png` });
    await page
      .getByRole('button', {
        name: index === levels.length - 1 ? '첫 번째 하늘로' : '다음 모험으로',
        exact: true,
      })
      .click();
    await expect
      .poll(() => page.evaluate(() => (window as any).__skyhop.level))
      .toBe((index + 1) % levels.length);
    await page.reload();
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('skyhop-records-v2') || '{}'),
    );
    expect(saved[level.id].time).toBeGreaterThan(0);
    await page.getByRole('button', { name: '나의 기록' }).click();
    await expect(page.locator('.record-row')).toHaveCount(10);
    expect(errors).toEqual([]);
  });
}
