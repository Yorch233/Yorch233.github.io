import { test, expect, seenWelcome } from './helpers';

test('compact navigation and resources stay reachable without overflow', async ({ page }) => {
  test.setTimeout(180_000);
  await seenWelcome(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 640, 720, 1280, 2560]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/#publications');
    await expect(page.locator('.pub').first()).toBeVisible();
    await expect(page.locator('html')).not.toHaveClass(/is-loading/);
    const nav = page.locator('.toplink[href="#publications"]');
    await expect(nav).toHaveAccessibleName('Publications');
    await expect(nav).toHaveAttribute('aria-current', 'location');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width <= 720) {
      await expect(nav.locator('.nav-label')).toBeVisible();
      const label = await nav.locator('.nav-label').boundingBox();
      const selection = await page.locator('.home-nav-indicator').boundingBox();
      expect(label!.x).toBeGreaterThanOrEqual(selection!.x);
      expect(label!.x + label!.width).toBeLessThanOrEqual(selection!.x + selection!.width);
      expect(label!.y + label!.height).toBeLessThanOrEqual(selection!.y + selection!.height);
      for (const button of await page.locator('.pub-links .compact-ghost').all()) {
        const box = await button.boundingBox();
        expect(box?.width).toBe(44);
        expect(box?.height).toBe(44);
        await expect(button).toHaveAccessibleName(/.+/);
      }
      if (width === 390) {
        for (const row of await page.locator('.pub-links').all()) {
          const tops = await row.locator('a, button').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().top));
          expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(1);
        }
        await page.locator('.link-pill-copy').first().click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.locator('.link-pill-copy').first()).toBeFocused();
      }
    }
    for (const route of ['/RSB/', '/CoF/']) {
      await page.goto(route);
      await expect(page.locator('html')).not.toHaveClass(/is-loading/);
      const resources = page.locator('.paper-resource-group');
      if (width <= 720) {
        expect(await resources.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
        for (const link of await resources.locator('a').all()) {
          const box = await link.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(width);
          expect(box!.height).toBeGreaterThanOrEqual(44);
          await expect(link).toHaveAccessibleName(/.+/);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});
