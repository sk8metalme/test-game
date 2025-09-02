/**
 * Puppeteer設定ファイル
 * ローカル開発とCI環境の両方に対応
 */

const isCI = process.env.CI === 'true';
const isHeadless = process.env.HEADLESS !== 'false';

export const puppeteerConfig = {
  // 基本設定
  headless: isCI ? 'new' : isHeadless ? 'new' : false,
  slowMo: isCI ? 0 : 50,

  // ビューポート設定
  defaultViewport: {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
  },

  // ブラウザ引数（CI環境最適化）
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--disable-default-apps',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    // メモリ使用量削減
    '--memory-pressure-off',
    '--max_old_space_size=4096',
  ],

  // タイムアウト設定
  timeout: isCI ? 60000 : 30000,

  // 開発者ツール（ローカルのみ）
  devtools: !isCI && !isHeadless,
};

export const testConfig = {
  // テスト実行設定
  testTimeout: isCI ? 45000 : 30000,
  retryCount: isCI ? 3 : 1,

  // スクリーンショット設定
  screenshot: {
    type: 'png',
    fullPage: true,
    quality: isCI ? 80 : 100,
    threshold: isCI ? 0.05 : 0.01,
    failureThreshold: 0.01,
    failureThresholdType: 'percent',
    allowSizeMismatch: true,
  },

  // パフォーマンス設定
  performance: {
    fps: {
      target: 60,
      minimum: isCI ? 30 : 45,
      measureDuration: 5000,
    },
    memory: {
      leakThreshold: isCI ? 100 : 50, // MB
      initialAllowance: 50, // MB
    },
  },

  // 待機設定
  waitFor: {
    gameInit: 10000,
    effectComplete: 5000,
    uiStable: 3000,
    networkIdle: 2000,
  },
};

export const urlConfig = {
  // テストページURL
  testPage: 'file://tests/e2e/fixtures/test-page.html',

  // 開発サーバー（将来的にExpress使用予定）
  devServer: {
    port: 3001,
    host: 'localhost',
  },
};

export default {
  puppeteerConfig,
  testConfig,
  urlConfig,
};
