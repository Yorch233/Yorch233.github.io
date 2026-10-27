import { test, expect, trackRequests } from './helpers';
import type { Locator } from '@playwright/test';

const spectrumReady = async (view: Locator) => {
  await expect(view).toHaveAttribute('aria-busy', 'false');
  await expect(view.locator('.spectrum-status')).toHaveCount(0);
  await expect(view.locator('canvas')).toHaveAttribute('data-time', /[0-9]/);
};

for (const route of ['RSB', 'CoF']) {
  test(`${route}: current-time spectrum is lazy and follows pause, playback and seek`, async ({ page }) => {
    await page.setViewportSize({ width: 1005, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const requests = trackRequests(page);
    await page.goto(`/${route}/`);
    await expect(page.locator('html')).not.toHaveClass(/is-loading/);
    const card = page.locator('.wave-compare').first();
    await card.scrollIntoViewIfNeeded();
    await expect(page.locator('astro-island[component-url*="AudioDemoIsland"]')).not.toHaveAttribute('ssr', '');
    await expect(card.locator('.view-toggle-btn')).toHaveCount(3);
    expect(requests.some(url => url.includes('spectrum.worker'))).toBe(false);
    await card.getByRole('button', { name: 'Spectrum', exact: true }).click();
    const view = card.locator('.spectrum-view');
    await view.scrollIntoViewIfNeeded();
    await spectrumReady(view);
    const canvas = view.locator('canvas');
    await expect(view.locator('figcaption')).toHaveCount(0);
    const info = view.locator('.spectrum-info');
    const infoButton = info.getByRole('button', { name: 'Spectrum settings', exact: true });
    const tooltip = info.getByRole('tooltip');
    await expect(tooltip).toBeHidden();
    await infoButton.hover();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('Window: 10.0 ms');
    await expect(tooltip).toContainText('FFT: 4096 points');
    await expect(tooltip).toContainText('Bins: 11.7 Hz');
    await canvas.hover();
    await expect(tooltip).toBeHidden();
    const spectrumButton = card.getByRole('button', { name: 'Spectrum', exact: true });
    await expect(spectrumButton.locator('.spectrum-info')).toHaveCount(0);
    await expect(infoButton.locator('[data-icon="help-circle"]')).toBeVisible();
    const infoBounds = await infoButton.boundingBox();
    const plotBounds = await canvas.boundingBox();
    expect(infoBounds!.x + infoBounds!.width / 2).toBeGreaterThan(plotBounds!.x + plotBounds!.width - 28);
    expect(infoBounds!.y + infoBounds!.height / 2).toBeLessThan(plotBounds!.y + 28);
    expect(await infoButton.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + 3));
    }), 'The upper edge of the help target must not be clipped').toBe(true);
    await spectrumButton.focus();
    await spectrumButton.press('Tab');
    await expect(infoButton).toBeFocused();
    await expect(tooltip).toBeVisible();
    await infoButton.press('Escape');
    await expect(tooltip).toBeHidden();
    await infoButton.press('Tab');
    await expect(canvas).toHaveAttribute('aria-label', /20 Hz to 20 kHz.*logarithmic/i);
    await expect(canvas).toHaveAttribute('data-time', '0');
    expect(requests.some(url => url.includes('spectrum.worker'))).toBe(true);
    expect(requests.some(url => url.endsWith('.spectrogram.avif'))).toBe(false);
    await expect(view.locator('.spectrum-legend')).toHaveCount(0);
    await card.getByRole('button', { name: 'Play', exact: true }).click();
    await expect.poll(async () => Number(await canvas.getAttribute('data-time'))).toBeGreaterThan(.1);
    // The time label can advance while interpolation keeps drawing an old frame.
    // Compare actual canvas pixels while audio is still playing.
    const playingImage = await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL());
    const playbackTime = Number(await canvas.getAttribute('data-time'));
    await expect.poll(async () => Number(await canvas.getAttribute('data-time'))).toBeGreaterThan(playbackTime + .35);
    await expect.poll(async () => (await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())) !== playingImage,
      { timeout: 1500, message: 'Spectrum pixels must change during playback' }).toBe(true);
    await expect(card.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
    await card.getByRole('button', { name: 'Pause', exact: true }).click();
    await card.getByRole('slider', { name: 'Playback position' }).fill('1.5');
    await expect.poll(async () => Number(await canvas.getAttribute('data-time'))).toBeCloseTo(1.5, 2);
    const before = await canvas.screenshot();
    await card.getByRole('slider', { name: 'Playback position' }).fill('2.5');
    await expect.poll(async () => Number(await canvas.getAttribute('data-time'))).toBeCloseTo(2.5, 2);
    expect((await canvas.screenshot()).equals(before)).toBe(false);
    await card.locator('.method-group-secondary .method-chip').first().click();
    await view.scrollIntoViewIfNeeded();
    await spectrumReady(view);
    await expect(view.locator('.spectrum-legend')).toHaveCount(0);
    await expect.poll(async () => Number(await canvas.getAttribute('data-time'))).toBeGreaterThan(.1);
    const comparisonImage = await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL());
    await expect.poll(async () => (await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())) !== comparisonImage,
      { timeout: 1500, message: 'Both-track Spectrum must animate during method playback' }).toBe(true);
    await card.getByRole('button', { name: 'Spectrogram', exact: true }).click();
    await expect(view).toHaveCount(0);
    await expect.poll(() => requests.some(url => url.endsWith('.spectrogram.avif'))).toBe(true);
    await card.getByRole('button', { name: 'Waveform', exact: true }).click();
    await expect(card.locator('.wave-canvas')).toBeVisible();
  });
}

for (const [route, width] of [['RSB', 390], ['CoF', 320]] as const) {
  test(`${route}: phone spectrum uses the expanded view without crowding transport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const requests = trackRequests(page);
    await page.goto(`/${route}/`);
    await expect(page.locator('html')).not.toHaveClass(/is-loading/);
    await page.locator('.audio-demo-island').scrollIntoViewIfNeeded();
    const row = page.locator('.mobile-sample').first();
    await row.getByRole('button', { expanded: false }).click();
    await row.locator('.method-chip').nth(2).click();
    const player = page.getByRole('complementary', { name: 'Audio player' });
    await expect(player).toBeVisible();
    expect(requests.some(url => url.includes('spectrum.worker'))).toBe(false);
    await player.getByRole('button', { name: 'Visualization', exact: true }).click();
    await player.getByRole('tab', { name: 'Spectrum', exact: true }).click();
    const view = player.locator('.spectrum-view');
    await spectrumReady(view);
    await expect(view.locator('figcaption')).toHaveCount(0);
    const infoButton = player.getByRole('button', { name: 'Spectrum settings', exact: true });
    const touchBounds = await infoButton.boundingBox();
    const contentBounds = await player.locator('.mobile-visualization-content').boundingBox();
    expect(touchBounds!.width).toBeGreaterThanOrEqual(44);
    expect(touchBounds!.height).toBeGreaterThanOrEqual(44);
    expect(touchBounds!.y).toBeGreaterThanOrEqual(contentBounds!.y);
    await infoButton.click();
    const tooltip = view.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('Window: 10.0 ms');
    await expect(tooltip).toContainText('FFT: 4096 points');
    const bounds = await tooltip.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(Number(width));
    await infoButton.press('Escape');
    await expect(tooltip).toBeHidden();
    await expect(view).toBeVisible();
    await expect(view.locator('.spectrum-legend')).toHaveCount(0);
    await player.getByRole('button', { name: 'Pause', exact: true }).click();
    await player.getByRole('slider', { name: 'Playback position' }).fill('1');
    await expect.poll(async () => Number(await view.locator('canvas').getAttribute('data-time'))).toBeCloseTo(1, 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await player.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    await expect(player.locator('.mobile-player-controls button, .mobile-player-controls a')).toHaveCount(5);
    await player.getByRole('button', { name: 'Visualization', exact: true }).click();
    await expect(view).toHaveCount(0);
    await expect(player.getByRole('button', { name: 'Visualization', exact: true })).toBeFocused();
  });
}

test('CoF: spectrum retries failed resources and follows the sampling budget', async ({ page }) => {
  await page.setViewportSize({ width: 1005, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const requests = trackRequests(page);
  await page.goto('/CoF/');
  await expect(page.locator('html')).not.toHaveClass(/is-loading/);
  const card = page.locator('.wave-compare').first();
  await card.scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island[component-url*="AudioDemoIsland"]')).not.toHaveAttribute('ssr', '');
  await card.getByRole('button', { name: 'Spectrum', exact: true }).click();
  const view = card.locator('.spectrum-view');
  await view.scrollIntoViewIfNeeded();
  await spectrumReady(view);
  const blocked = '**/SB-VE_pretrain/*.opus';
  await page.route(blocked, route => route.abort());
  await card.locator('.method-group-secondary .method-chip').first().click();
  await expect(view.getByRole('button', { name: 'Retry spectrum' })).toBeVisible();
  await page.unroute(blocked);
  await view.getByRole('button', { name: 'Retry spectrum' }).click();
  await spectrumReady(view);
  await expect(view.locator('.spectrum-legend')).toHaveCount(0);
  await card.locator('.budget-toggle').getByRole('button', { name: '1 NFE', exact: true }).click();
  await expect.poll(() => requests.some(url => url.includes('/nfe1/SB-VE_pretrain/'))).toBe(true);
  await spectrumReady(view);
  await expect(view.locator('canvas')).toHaveAttribute('data-time', '0');
  await expect(card).not.toHaveClass(/is-fading/);
});
