/**
 * E2Eテスト共通セットアップ
 */

import { testConfig } from './puppeteer.config.js';

// Jest拡張マッチャー
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toBeValidFPS(received) {
    const pass = received >= testConfig.performance.fps.minimum && received <= 120;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid FPS`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be a valid FPS (>= ${testConfig.performance.fps.minimum})`,
        pass: false,
      };
    }
  },

  toBeWithinMemoryLimit(received, limitMB) {
    const limitBytes = limitMB * 1024 * 1024;
    const pass = received <= limitBytes;
    if (pass) {
      return {
        message: () => `expected ${received} bytes not to be within memory limit ${limitMB}MB`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} bytes to be within memory limit ${limitMB}MB`,
        pass: false,
      };
    }
  },
});

// グローバルタイムアウト設定は jest.config.js で設定済み

// 未処理の Promise rejection をエラーとして扱う
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  throw reason;
});

// テスト開始時の情報表示
beforeAll(() => {
  console.log(`🧪 E2Eテスト開始 (CI: ${process.env.CI === 'true'})`);
  console.log(
    `📊 設定: タイムアウト ${testConfig.testTimeout}ms, リトライ ${testConfig.retryCount}回`
  );
});

// テスト終了時の情報表示
afterAll(() => {
  console.log('✅ E2Eテスト完了');
});
