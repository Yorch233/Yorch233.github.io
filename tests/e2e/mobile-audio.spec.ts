import { test, expect, trackRequests, waitForExpr } from './helpers';

test.use({ actionTimeout: 10_000 });

for (const route of ['RSB', 'CoF']) {
  test(`${route}: phone sample accordion and floating player`, async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const requests = trackRequests(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${route}/`);
    await expect(page.locator('html')).not.toHaveClass(/is-loading/);
    expect(requests.some(url => url.endsWith('.opus'))).toBe(false);
    await page.locator('.audio-demo-island').scrollIntoViewIfNeeded();
    await expect(page.locator('.mobile-sample')).toHaveCount(10);
    await expect(page.locator('.wave-compare')).toHaveCount(0);
    await expect(page.locator('.floating-audio-player')).toHaveCount(0);
    expect(requests.some(url => url.endsWith('.opus'))).toBe(false);
    const group = page.locator('.mobile-audio-group').first();
    const row = group.locator('.mobile-sample').first();
    await row.getByRole('button', { expanded: false }).click();
    await expect(row.locator('.mobile-method-panel')).toBeVisible();
    expect(requests.some(url => url.endsWith('.opus'))).toBe(false);
    const method = row.locator('.method-chip').nth(2);
    await method.click();
    const player = page.getByRole('complementary', { name: 'Audio player' });
    await expect(player).toBeVisible();
    await waitForExpr(page, "(() => { const audio = document.querySelector('.mobile-audio-demo audio'); return audio && !audio.paused && audio.currentSrc.startsWith('blob:') && audio.duration > 0; })()", 'Method selection did not play the phone audio.');
    await expect(method).toHaveAttribute('aria-pressed', 'true');
    expect([...new Set(requests.filter(url => url.endsWith('.opus')))]).toHaveLength(1);
    expect(requests.some(url => url.endsWith('.wav') || url.endsWith('.spectrogram.avif') || url.includes('waveform.worker'))).toBe(false);
    await player.getByRole('button', { name: 'Pause', exact: true }).click();
    const source = await page.locator('.mobile-audio-demo audio').evaluate((el: HTMLAudioElement) => el.currentSrc);
    await player.getByRole('button', { name: 'Volume', exact: true }).click();
    await player.getByRole('slider', { name: 'Global volume' }).fill('125');
    await expect(player.locator('output')).toHaveText('125%');
    await page.keyboard.press('Escape');
    await expect(player.locator('.mobile-volume-panel')).toHaveCount(0);
    await player.getByRole('button', { name: 'Visualization', exact: true }).click();
    await expect(player.getByRole('tab', { name: 'Waveform', exact: true })).toHaveAttribute('aria-selected', 'true');
    await waitForExpr(page, "(() => { const canvas = document.querySelector('.floating-audio-player canvas'); return canvas && canvas.width > 0 && canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((v, i) => i % 4 === 3 && v > 0); })()", 'The phone waveform never painted.');
    expect(requests.some(url => url.includes('waveform.worker'))).toBe(true);
    const slider = player.getByRole('slider', { name: 'Playback position' });
    await slider.fill('1');
    expect(await page.locator('.mobile-audio-demo audio').evaluate((el: HTMLAudioElement) => Math.abs(el.currentTime - 1))).toBeLessThan(.05);
    await player.getByRole('button', { name: 'Visualization', exact: true }).click();
    await expect(player.locator('.mobile-player-visualization')).toHaveCount(0);
    await expect(player.getByRole('button', { name: 'Visualization', exact: true })).toBeFocused();
    await player.getByRole('button', { name: 'Visualization', exact: true }).click();
    await player.getByRole('tab', { name: 'Waveform', exact: true }).focus();
    for (const [key, label] of [['Home', 'Waveform'], ['End', 'Spectrum'], ['End', 'Spectrum'], ['Home', 'Waveform']]) {
      const scrollY = await page.evaluate(() => window.scrollY);
      await page.keyboard.press(key);
      await expect(player.getByRole('tab', { name: label, exact: true })).toBeFocused();
      await expect(player.getByRole('tab', { name: label, exact: true })).toHaveAttribute('aria-selected', 'true');
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      expect(await page.evaluate(() => window.scrollY), `${key} must not scroll the page at a tab boundary`).toBe(scrollY);
    }
    await page.keyboard.press('ArrowRight');
    await expect(player.getByRole('tab', { name: 'Spectrogram', exact: true })).toBeFocused();
    await expect(player.getByRole('tab', { name: 'Spectrogram', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect.poll(() => player.locator('.mobile-visualization-tabs').evaluate(track => {
      const style = getComputedStyle(track, '::before');
      const selected = track.querySelector('[aria-selected=true]')!;
      const bounds = selected.getBoundingClientRect();
      const center = track.getBoundingClientRect().left + parseFloat(style.left) + new DOMMatrixReadOnly(style.transform).m41 + parseFloat(style.width) / 2;
      return Math.abs(center - bounds.left - bounds.width / 2);
    })).toBeLessThan(1);
    expect(await player.getByRole('tab').evaluateAll(tabs => tabs.every(tab =>
      getComputedStyle(tab).boxShadow === 'none' && getComputedStyle(tab, '::before').content === 'none' && getComputedStyle(tab, '::after').content === 'none'
    ))).toBe(true);
    await waitForExpr(page, "(() => { const images = [...document.querySelectorAll('.floating-audio-player .spectrogram-canvas')]; return images.length === 2 && images.every(img => img.complete && img.naturalWidth > 0); })()", 'Phone spectrograms must use the static AVIF pair.');
    expect([...new Set(requests.filter(url => url.endsWith('.spectrogram.avif')))]).toHaveLength(2);
    await player.screenshot({ path: testInfo.outputPath(`${route}-phone-player.png`) });
    const wav = player.locator('a[download]');
    expect((await wav.getAttribute('href'))?.endsWith('.wav')).toBe(true);
    const response = await page.request.get((await wav.getAttribute('href'))!);
    expect(response.ok()).toBe(true);
    await player.getByRole('button', { name: 'Minimize player' }).click();
    await expect(player).toHaveClass(/is-minimized/);
    await expect(player.getByRole('button')).toHaveCount(2);
    await expect.poll(() => player.evaluate(el => {
      const mini = el.getBoundingClientRect(), pdf = document.querySelector('.demo-resources-capsule')!.getBoundingClientRect();
      const glass = getComputedStyle(el, '::before');
      return mini.right + 8 <= pdf.left && pdf.right <= innerWidth && glass.backdropFilter === 'blur(18px) saturate(1.12)';
    })).toBe(true);
    await expect(player.getByRole('button', { name: 'Expand player' })).toBeFocused();
    await player.getByRole('button', { name: 'Play', exact: true }).click();
    await waitForExpr(page, '!document.querySelector(".mobile-audio-demo audio").paused', 'Minimized playback did not resume.');
    await player.getByRole('button', { name: 'Pause', exact: true }).click();
    await player.getByRole('button', { name: 'Expand player' }).click();
    await expect(player).not.toHaveClass(/is-minimized/);
    expect(await page.locator('.mobile-audio-demo audio').evaluate((el: HTMLAudioElement) => el.currentSrc)).toBe(source);
    // All controls remain usable in narrow, landscape and zoom-equivalent layouts.
    for (const [width, height] of [[320, 568], [390, 844], [667, 375], [640, 400], [720, 900]]) {
      await page.setViewportSize({ width, height });
      await expect(player).toBeVisible();
      await expect.poll(() => player.evaluate(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && el.scrollWidth <= el.clientWidth + 1;
      })).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const control of await player.locator('.mobile-player-controls button, .mobile-player-controls a').all()) {
        const box = await control.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.width).toBeGreaterThanOrEqual(44);
      }
      for (const tab of await player.getByRole('tab').all()) {
        const box = await tab.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(await tab.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await player.getByRole('button', { name: 'Visualization', exact: true }).click();
    await player.getByRole('button', { name: 'Visualization', exact: true }).click();
    await player.getByRole('button', { name: 'Minimize player' }).click();
    await group.locator('.mobile-sample-trigger').nth(1).click();
    await group.locator('.mobile-sample').nth(1).locator('.method-chip').last().click();
    const selectedId = await group.locator('.mobile-sample-id').nth(1).textContent();
    expect((await player.getAttribute('data-sample'))?.startsWith(selectedId!)).toBe(true);
    await player.getByRole('button', { name: 'Expand player' }).click();
    if (route === 'CoF') {
      await player.getByRole('button', { name: 'Visualization', exact: true }).click();
      await group.getByRole('button', { name: '1 NFE', exact: true }).click();
      await expect(group).toHaveAttribute('data-budget', 'nfe1');
      await expect(page.locator('.mobile-audio-group').nth(1)).toHaveAttribute('data-budget', 'nfe4');
      await expect(player).toHaveAttribute('data-budget', '1 NFE');
      await expect(player.locator('a[download]')).toHaveAttribute('href', /\/nfe1\//);
    }
    // Close and reopen must preserve a working audio graph.
    await player.getByRole('button', { name: 'Minimize player' }).click();
    await group.locator('.mobile-sample-trigger').nth(1).click();
    await player.getByRole('button', { name: 'Expand player' }).click();
    await player.getByRole('button', { name: 'Close player' }).click();
    await expect(player).toHaveCount(0);
    await expect(group.locator('.mobile-sample-trigger').nth(1)).toBeFocused();
    await group.locator('.mobile-sample-trigger').nth(1).click();
    await group.locator('.mobile-sample').nth(1).locator('.method-chip').first().click();
    await waitForExpr(page, '!document.querySelector(".mobile-audio-demo audio").paused', 'Player did not restart after closing.');
    const media = await page.locator('.mobile-audio-demo audio').elementHandle();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('.floating-audio-player')).toHaveCount(0);
    await expect(page.locator('.wave-compare')).toHaveCount(2);
    expect(await media!.evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.mobile-sample')).toHaveCount(10);
    await expect(page.locator('.floating-audio-player')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('phone player keeps the last selection and can retry a failed download', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/CoF/');
  await expect(page.locator('html')).not.toHaveClass(/is-loading/);
  await page.locator('.audio-demo-island').scrollIntoViewIfNeeded();
  const row = page.locator('.mobile-sample').first();
  await row.locator('.mobile-sample-trigger').click();
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/audio/CoF/nfe4/SB-VE_pretrain/*.opus', async route => { await held; await route.continue(); });
  const requested = page.waitForRequest(/SB-VE_pretrain.*\.opus/);
  await row.locator('.method-chip').nth(2).click();
  await requested;
  await row.locator('.method-chip').nth(3).click();
  const player = page.locator('.floating-audio-player');
  await expect(player).toHaveAttribute('data-method', 'SB-VE_cof');
  await waitForExpr(page, '!document.querySelector(".mobile-audio-demo audio").paused', 'The latest method did not play.');
  const source = await page.locator('.mobile-audio-demo audio').evaluate((el: HTMLAudioElement) => el.currentSrc);
  release();
  await page.waitForResponse(/SB-VE_pretrain.*\.opus/);
  expect(await page.locator('.mobile-audio-demo audio').evaluate((el: HTMLAudioElement) => el.currentSrc)).toBe(source);
  let attempts = 0;
  await page.route('**/audio/CoF/nfe4/OT-CFM_pretrain/*.opus', route => ++attempts === 1 ? route.abort('failed') : route.continue());
  await row.locator('.method-chip').nth(4).click();
  await expect(player.getByRole('status')).toContainText('Audio could not play');
  await player.getByRole('button', { name: 'Try again' }).click();
  await expect(player.locator('.mobile-player-error')).toHaveCount(0);
  await waitForExpr(page, '!document.querySelector(".mobile-audio-demo audio").paused', 'Retry did not recover playback.');
  expect(attempts).toBe(2);
});
