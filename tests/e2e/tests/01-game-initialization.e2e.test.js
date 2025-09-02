/**
 * E2Eテスト: ゲーム初期化テスト
 * 基本的なゲーム初期化と初期状態の確認
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { puppeteerConfig, testConfig, urlConfig } from '../config/puppeteer.config.js';
import { GameTestHelper } from '../helpers/GameTestHelper.js';
import { UITestHelper } from '../helpers/UITestHelper.js';
import { ScreenshotHelper } from '../helpers/ScreenshotHelper.js';
import { TestServer } from '../config/test-server.js';

describe('ゲーム初期化 E2Eテスト', () => {
  let browser;
  let page;
  let gameHelper;
  let uiHelper;
  let screenshotHelper;
  let testServer;

  beforeAll(async () => {
    // テストサーバー開始
    testServer = new TestServer(3001);
    await testServer.start();

    browser = await puppeteer.launch(puppeteerConfig);
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }

    if (testServer) {
      await testServer.stop();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();

    // ヘルパー初期化
    gameHelper = new GameTestHelper(page);
    uiHelper = new UITestHelper(page);
    screenshotHelper = new ScreenshotHelper(page, 'game-initialization');

    // コンソールログ設定
    gameHelper.setupConsoleLogging();

    // テストページ読み込み（HTTPサーバー経由）
    await page.goto(testServer.getTestPageURL());
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('ゲーム初期化が正常に完了する', async () => {
    console.log('🧪 テスト開始: ゲーム初期化');

    // 初期画面のスクリーンショット
    await screenshotHelper.capture('01-initial-load');

    // ゲーム初期化完了を待機
    await gameHelper.waitForGameReady();

    // 初期化完了後のスクリーンショット
    await screenshotHelper.capture('02-initialization-complete');

    // デバッグ情報の確認
    const debugInfo = await gameHelper.getDebugInfo();

    expect(debugInfo.initializationComplete).toBe(true);
    expect(debugInfo.componentsLoaded).toBe(true);
    expect(debugInfo.errors.length).toBe(0);

    console.log('✅ ゲーム初期化テスト完了');
  });

  test('必須UIエレメントが表示される', async () => {
    console.log('🧪 テスト開始: UI要素表示確認');

    await gameHelper.waitForGameReady();
    await uiHelper.waitForUIReady();

    // 必須要素の存在確認
    const requiredElements = [
      '#main-canvas',
      '#game-container',
      '.debug-panel',
      '.test-controls',
      '.performance-monitor',
    ];

    for (const selector of requiredElements) {
      const element = await page.$(selector);
      expect(element).not.toBeNull();
      console.log(`✅ 要素存在確認: ${selector}`);
    }

    // UI要素のスクリーンショット
    await screenshotHelper.capture('03-ui-elements');

    console.log('✅ UI要素表示テスト完了');
  });

  test('ゲーム初期状態が正しく設定される', async () => {
    console.log('🧪 テスト開始: 初期状態確認');

    await gameHelper.waitForGameReady();

    // ゲーム状態の取得
    const gameState = await gameHelper.getGameState();

    // 初期状態の確認
    expect(gameState).not.toBeNull();
    expect(gameState.level).toBe(1);
    expect(gameState.lines).toBe(0);
    expect(gameState.score).toBe(0);

    // ボード状態の確認
    const boardState = await gameHelper.getBoardState();
    expect(boardState).not.toBeNull();
    expect(boardState.width).toBe(10);
    expect(boardState.height).toBe(20);

    console.log('✅ 初期状態確認テスト完了');
  });

  test('コンポーネント間の依存関係が正しく設定される', async () => {
    console.log('🧪 テスト開始: コンポーネント依存関係確認');

    await gameHelper.waitForGameReady();

    // コンポーネントの存在確認
    const componentCheck = await page.evaluate(() => {
      const game = window.tetrisGame;
      if (!game) return { valid: false, error: 'tetrisGame not found' };

      const checks = {
        eventEmitter: !!game.eventEmitter,
        gameLogic: !!game.gameLogic,
        effectManager: !!game.effectManager,
        gameEventIntegrator: !!game.gameEventIntegrator,
        eventEmitterShared: game.gameLogic?.getEventEmitter?.() === game.eventEmitter,
      };

      return {
        valid: Object.values(checks).every(Boolean),
        checks,
        error: null,
      };
    });

    expect(componentCheck.valid).toBe(true);
    expect(componentCheck.checks.eventEmitter).toBe(true);
    expect(componentCheck.checks.gameLogic).toBe(true);
    expect(componentCheck.checks.effectManager).toBe(true);
    expect(componentCheck.checks.gameEventIntegrator).toBe(true);
    expect(componentCheck.checks.eventEmitterShared).toBe(true);

    console.log('✅ コンポーネント依存関係確認テスト完了');
  });

  test('エラーハンドリングが正常に機能する', async () => {
    console.log('🧪 テスト開始: エラーハンドリング確認');

    await gameHelper.waitForGameReady();

    // 初期エラー状態の確認
    const initialErrors = await gameHelper.collectPageErrors();
    expect(initialErrors.length).toBe(0);

    // 意図的にエラーを発生させてハンドリングをテスト
    await page.evaluate(() => {
      try {
        // 存在しないメソッドを呼び出し
        window.tetrisGame.nonExistentMethod();
      } catch (error) {
        // エラーがキャッチされることを確認
        console.log('Expected error caught:', error.message);
      }
    });

    // エラーログの確認（ページレベルのエラーは発生しないはず）
    const finalErrors = await gameHelper.collectPageErrors();

    // JavaScriptエラーは発生せず、適切にキャッチされているはず
    expect(finalErrors.length).toBe(0);

    console.log('✅ エラーハンドリング確認テスト完了');
  });

  test('パフォーマンス監視が機能する', async () => {
    console.log('🧪 テスト開始: パフォーマンス監視確認');

    await gameHelper.waitForGameReady();

    // パフォーマンス情報の取得を待機
    await gameHelper.sleep(2000);

    const performanceInfo = await page.evaluate(() => {
      return {
        fps: window.debugInfo?.fps || 0,
        memory: window.debugInfo?.memory || 0,
        fpsElement: !!document.getElementById('fps-display'),
        memoryElement: !!document.getElementById('memory-usage'),
      };
    });

    // パフォーマンス監視の確認
    expect(performanceInfo.fpsElement).toBe(true);
    expect(performanceInfo.memoryElement).toBe(true);
    expect(performanceInfo.fps).toBeValidFPS();

    // パフォーマンス監視画面のスクリーンショット
    await screenshotHelper.capture('04-performance-monitoring');

    console.log(`✅ パフォーマンス監視確認テスト完了 (FPS: ${performanceInfo.fps})`);
  });

  test('レスポンシブレイアウトが正常に動作する', async () => {
    console.log('🧪 テスト開始: レスポンシブレイアウト確認');

    await gameHelper.waitForGameReady();

    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];

    // 各ビューポートでのレイアウト確認
    const layoutResults = await uiHelper.testResponsiveLayout(viewports);

    for (const [viewportName, result] of Object.entries(layoutResults)) {
      expect(result.canvasVisible).toBe(true);
      expect(result.gameUIVisible).toBe(true);
      console.log(`✅ ${viewportName} レイアウト確認完了`);
    }

    // レスポンシブスクリーンショット
    await screenshotHelper.captureResponsive('05-responsive', viewports);

    console.log('✅ レスポンシブレイアウト確認テスト完了');
  });

  test('初期化パフォーマンスが要件を満たす', async () => {
    console.log('🧪 テスト開始: 初期化パフォーマンス確認');

    const startTime = Date.now();

    // ページ読み込みから初期化完了まで測定
    await gameHelper.waitForGameReady();

    const endTime = Date.now();
    const initializationTime = endTime - startTime;

    // 初期化時間が10秒以内であることを確認
    expect(initializationTime).toBeLessThan(10000);

    console.log(`✅ 初期化時間: ${initializationTime}ms`);

    // メモリ使用量の確認
    const memoryUsage = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });

    const memoryMB = memoryUsage / 1024 / 1024;

    // 初期メモリ使用量が100MB以下であることを確認
    expect(memoryMB).toBeLessThan(100);

    console.log(`✅ 初期メモリ使用量: ${memoryMB.toFixed(1)}MB`);
    console.log('✅ 初期化パフォーマンス確認テスト完了');
  });
});
