import { test, expect } from '@playwright/test';
test('desktop: WebGL, instructions, movement, pause, fall, restart, settings and course choice', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?qa=1');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#error-overlay')).toBeHidden();
  await expect(page.locator('[data-level]')).toHaveCount(10);
  await expect(page.locator('#world-title')).toHaveText('Moonlight Run');
  await expect(page.locator('#level-difficulty')).toContainText('EASY');
  await page.screenshot({ path: 'test-results/desktop-ready.png', fullPage: true });
  await page.getByRole('button', { name: '플레이 방법', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '좋아요, 준비됐어요' }).click();
  await page.getByRole('button', { name: '모험 시작하기' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__skyhop.phase)).toBe('running');
  await page.keyboard.down('Space');
  await page.waitForTimeout(200);
  await page.keyboard.up('Space');
  await expect
    .poll(() => page.evaluate(() => (window as any).__skyhop.player.y))
    .toBeGreaterThan(0.2);
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause-overlay')).toBeVisible();
  const timer = await page.locator('#timer').textContent();
  await page.waitForTimeout(300);
  expect(await page.locator('#timer').textContent()).toBe(timer);
  await page.getByRole('button', { name: '계속 플레이', exact: true }).last().click();
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1800);
  await page.keyboard.up('KeyD');
  await expect.poll(() => page.evaluate(() => (window as any).__skyhop.falls)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '처음부터 다시' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__skyhop.falls)).toBe(0);
  await page.getByRole('button', { name: '소리 끄기', exact: true }).click();
  await expect(page.getByRole('button', { name: '소리 켜기', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.getByRole('button', { name: '절전 그래픽 켜기' }).click();
  await expect(page.getByRole('button', { name: '절전 그래픽 끄기' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.locator('[data-level="1"]').click();
  await page.getByRole('button', { name: '코스 변경하기' }).click();
  await expect(page.locator('#world-title')).toHaveText('Terrace Ascent');
  await expect.poll(() => page.evaluate(() => (window as any).__skyhop.phase)).toBe('ready');
  await page.locator('[data-level="2"]').click();
  await expect(page.locator('#world-title')).toHaveText('Canyon Descent');
  await page.getByRole('button', { name: '나의 기록' }).click();
  await expect(page.getByRole('heading', { name: '나의 모험 기록' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('mobile: responsive layout, touch movement and jump', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto('/?qa=1');
  await expect(page.locator('canvas')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-ready.png', fullPage: true });
  await page.getByRole('button', { name: '모험 시작하기' }).tap();
  const forward = page.getByRole('button', { name: '앞으로 이동', exact: true });
  await expect(forward).toBeVisible();
  await forward.scrollIntoViewIfNeeded();
  const cdp = await context.newCDPSession(page);
  async function touchStart(selector: string) {
    const box = await page.locator(selector).boundingBox();
    if (!box) throw new Error('Missing touch target');
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }],
    });
  }
  await touchStart('[data-control="jump"]');
  await expect
    .poll(() => page.evaluate(() => (window as any).__skyhop.player.y), { intervals: [16, 32, 50] })
    .toBeGreaterThan(0.2);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => (window as any).__skyhop.player.grounded)).toBe(true);
  await touchStart('[data-control="forward"]');
  await expect
    .poll(() => page.evaluate(() => (window as any).__skyhop.player.z), { intervals: [16, 32, 50] })
    .toBeLessThan(3);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.screenshot({ path: 'test-results/mobile-playing.png', fullPage: true });
  await context.close();
});
