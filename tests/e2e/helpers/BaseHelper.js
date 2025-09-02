/**
 * E2Eテスト用ベースヘルパークラス
 * 全てのヘルパークラスの基底クラス
 */

import { testConfig } from '../config/puppeteer.config.js';

export class BaseHelper {
  constructor(page) {
    this.page = page;
    this.config = testConfig;
  }

  /**
   * 安全な要素待機
   */
  async waitForSelector(selector, options = {}) {
    const timeout = options.timeout || this.config.waitFor.uiStable;
    try {
      await this.page.waitForSelector(selector, { timeout, ...options });
      return true;
    } catch (error) {
      console.warn(`⚠️ セレクター待機失敗: ${selector}`);
      return false;
    }
  }

  /**
   * 安全な関数実行待機
   */
  async waitForFunction(fn, options = {}, ...args) {
    const timeout = options.timeout || this.config.waitFor.uiStable;
    try {
      return await this.page.waitForFunction(fn, { timeout, ...options }, ...args);
    } catch (error) {
      console.warn(`⚠️ 関数実行待機失敗: ${fn.toString()}`);
      return false;
    }
  }

  /**
   * リトライ機能付き実行
   */
  async retry(fn, maxRetries = this.config.retryCount, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`リトライ ${maxRetries} 回失敗: ${error.message}`);
        }

        console.log(`⚠️ 試行 ${attempt}/${maxRetries} 失敗、${delay}ms後にリトライ`);
        await this.sleep(delay * attempt); // 指数バックオフ
      }
    }
  }

  /**
   * 待機ユーティリティ
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ページエラーの収集
   */
  async collectPageErrors() {
    return await this.page.evaluate(() => {
      return window.debugInfo?.errors || [];
    });
  }

  /**
   * 安全なクリック
   */
  async safeClick(selector, options = {}) {
    await this.waitForSelector(selector);
    await this.page.click(selector, options);
    await this.sleep(100); // クリック後の安定化
  }

  /**
   * 安全なキー入力
   */
  async safeType(selector, text, options = {}) {
    await this.waitForSelector(selector);
    await this.page.type(selector, text, { delay: 50, ...options });
  }

  /**
   * デバッグ情報の取得
   */
  async getDebugInfo() {
    return await this.page.evaluate(() => {
      return window.debugInfo || {};
    });
  }

  /**
   * コンソールログの収集
   */
  setupConsoleLogging() {
    this.page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warn') {
        console.log(`[Browser ${type.toUpperCase()}]:`, msg.text());
      }
    });

    this.page.on('pageerror', err => {
      console.error('[Page Error]:', err.message);
    });
  }
}
