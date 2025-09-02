/**
 * E2E専用Jest設定
 */

const isCI = process.env.CI === 'true';

export default {
  // ルートディレクトリ設定
  rootDir: '../../../',

  // テストマッチパターン
  testMatch: ['<rootDir>/tests/e2e/tests/**/*.e2e.test.js'],

  // ES Modules設定
  preset: null,
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // タイムアウト設定
  testTimeout: isCI ? 60000 : 30000,

  // 並列実行設定
  maxWorkers: isCI ? 2 : 4,
  maxConcurrency: isCI ? 1 : 3,

  // セットアップ
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/config/setup.js'],

  // レポート設定
  reporters: ['default'],

  // カバレッジ除外
  collectCoverage: false,

  // 失敗時の詳細表示
  verbose: true,

  // テスト環境
  testEnvironment: 'node',
};
