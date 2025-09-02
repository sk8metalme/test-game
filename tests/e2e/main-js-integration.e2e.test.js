/**
 * E2Eテスト: main.js初期化順序修正とエフェクト統合
 *
 * ユーザー要求:
 * - 修正後の画面確認
 * - スクリーンショット撮影
 * - 実装の正常性確認
 */

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const screenshotDir = path.join(process.cwd(), 'tests/e2e/screenshots');

describe('main.js初期化順序修正とエフェクト統合E2Eテスト', () => {
  let browser;
  let page;

  beforeAll(async () => {
    // スクリーンショットディレクトリ作成
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    browser = await puppeteer.launch({
      headless: false, // デバッグ用にブラウザを表示
      slowMo: 50, // アクションの間隔を50ms
      defaultViewport: {
        width: 1280,
        height: 800,
      },
    });
    page = await browser.newPage();

    // コンソールログを取得
    page.on('console', msg => {
      console.log(`[Browser Console ${msg.type()}]:`, msg.text());
    });

    // エラーを取得
    page.on('error', err => {
      console.error('[Browser Error]:', err.message);
    });

    // ページエラーを取得
    page.on('pageerror', err => {
      console.error('[Page Error]:', err.message);
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('ゲーム初期化とエフェクト統合が正常に動作する', async () => {
    // 1. テストページを読み込み
    const testPagePath = path.join(process.cwd(), 'tests/e2e/test-page.html');
    await page.goto(`file://${testPagePath}`);

    // 初期画面のスクリーンショット
    await page.screenshot({
      path: path.join(screenshotDir, '01-initial-load.png'),
      fullPage: true,
    });

    // 2. ゲーム初期化完了を待機（最大10秒）
    await page.waitForFunction(() => window.debugInfo && window.debugInfo.initializationComplete, {
      timeout: 10000,
    });

    // 初期化完了後のスクリーンショット
    await page.screenshot({
      path: path.join(screenshotDir, '02-initialization-complete.png'),
      fullPage: true,
    });

    // 3. 初期化状態の確認
    const debugInfo = await page.evaluate(() => window.debugInfo);

    expect(debugInfo.initializationComplete).toBe(true);
    expect(debugInfo.componentsLoaded).toBe(true);
    expect(debugInfo.errors.length).toBe(0);

    console.log('✅ ゲーム初期化成功');

    // 4. コンポーネント存在確認
    const gameExists = await page.evaluate(() => {
      return (
        window.tetrisGame &&
        window.tetrisGame.eventEmitter &&
        window.tetrisGame.gameLogic &&
        typeof window.tetrisGame.gameLogic.getEventEmitter === 'function'
      );
    });

    expect(gameExists).toBe(true);
    console.log('✅ 主要コンポーネント存在確認');

    // 5. 初期化順序確認（eventEmitterがGameLogicに正しく渡されているか）
    const initializationOrder = await page.evaluate(() => {
      const gameLogicEmitter = window.tetrisGame.gameLogic.getEventEmitter();
      const mainEmitter = window.tetrisGame.eventEmitter;
      return gameLogicEmitter === mainEmitter;
    });

    expect(initializationOrder).toBe(true);
    console.log('✅ 初期化順序正常（EventEmitter共有確認）');

    // 6. EffectManagerとGameEventIntegratorの存在確認
    const effectSystemExists = await page.evaluate(() => {
      return window.tetrisGame.effectManager && window.tetrisGame.gameEventIntegrator;
    });

    expect(effectSystemExists).toBe(true);
    console.log('✅ エフェクトシステム統合確認');

    // エフェクトシステム確認後のスクリーンショット
    await page.screenshot({
      path: path.join(screenshotDir, '03-effect-system-ready.png'),
      fullPage: true,
    });

    // 7. パフォーマンス確認（FPS測定）
    await page.waitForTimeout(2000); // 2秒間パフォーマンス測定

    const finalDebugInfo = await page.evaluate(() => window.debugInfo);
    expect(finalDebugInfo.fps).toBeGreaterThan(30); // 最低30FPS

    console.log(`✅ パフォーマンス確認: ${finalDebugInfo.fps.toFixed(1)} FPS`);

    // 最終状態のスクリーンショット
    await page.screenshot({
      path: path.join(screenshotDir, '04-final-state.png'),
      fullPage: true,
    });

    // 8. メニュー操作テスト
    const startButton = await page.$('text=Start Game'); // GameUIのボタンを探す
    if (startButton) {
      await startButton.click();

      // ゲーム画面表示のスクリーンショット
      await page.screenshot({
        path: path.join(screenshotDir, '05-game-screen.png'),
        fullPage: true,
      });

      console.log('✅ ゲーム開始操作確認');
    }

    console.log(
      '\n🎉 E2Eテスト完了 - スクリーンショットは tests/e2e/screenshots/ に保存されました'
    );
  }, 30000); // 30秒のタイムアウト

  test('エフェクト動作確認テスト', async () => {
    // テストページを再読み込み
    const testPagePath = path.join(process.cwd(), 'tests/e2e/test-page.html');
    await page.goto(`file://${testPagePath}`);

    // 初期化完了を待機
    await page.waitForFunction(() => window.debugInfo && window.debugInfo.initializationComplete, {
      timeout: 10000,
    });

    // エフェクトテスト用のイベント発火
    const effectsTriggered = await page.evaluate(() => {
      if (!window.tetrisGame || !window.tetrisGame.eventEmitter) {
        return false;
      }

      try {
        // テスト用のイベント発火
        window.tetrisGame.eventEmitter.emit('lines.cleared', {
          lines: 2,
          y: 18,
          clearedRows: [18, 19],
        });

        window.tetrisGame.eventEmitter.emit('level.up', {
          oldLevel: 1,
          newLevel: 2,
          totalLines: 10,
        });

        return true;
      } catch (error) {
        console.error('Effect trigger error:', error);
        return false;
      }
    });

    expect(effectsTriggered).toBe(true);

    // エフェクト実行中のスクリーンショット
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotDir, '06-effects-triggered.png'),
      fullPage: true,
    });

    console.log('✅ エフェクト動作テスト完了');
  });
});
