/**
 * スクリーンショット撮影・比較用E2Eテストヘルパー
 * 視覚回帰テストとスクリーンショット管理機能を提供
 */

import { BaseHelper } from './BaseHelper.js';
import fs from 'fs';
import path from 'path';

export class ScreenshotHelper extends BaseHelper {
  constructor(page, testName = 'default') {
    super(page);
    this.testName = testName;
    this.screenshotDir = path.join(process.cwd(), 'tests/e2e/screenshots');
    this.baselineDir = path.join(this.screenshotDir, 'baseline');
    this.actualDir = path.join(this.screenshotDir, 'actual');
    this.diffDir = path.join(this.screenshotDir, 'diff');

    this._ensureDirectories();
  }

  /**
   * 必要なディレクトリを作成
   */
  _ensureDirectories() {
    [this.screenshotDir, this.baselineDir, this.actualDir, this.diffDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * スクリーンショットを撮影
   */
  async capture(name, options = {}) {
    const config = {
      type: 'png',
      fullPage: true,
      ...options,
    };

    // PNG形式の場合はqualityオプションを除外
    if (config.type === 'png' && 'quality' in config) {
      delete config.quality;
    }

    const filename = `${this.testName}-${name}.png`;
    const filepath = path.join(this.actualDir, filename);

    try {
      // ページの安定化を待つ
      await this._waitForPageStable();

      // スクリーンショット撮影
      await this.page.screenshot({
        path: filepath,
        ...config,
      });

      console.log(`📸 スクリーンショット撮影: ${filename}`);
      return filepath;
    } catch (error) {
      console.error(`❌ スクリーンショット撮影失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 要素のスクリーンショットを撮影
   */
  async captureElement(selector, name, options = {}) {
    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(`要素が見つかりません: ${selector}`);
    }

    const config = {
      type: 'png',
      quality: this.config.screenshot.quality,
      ...options,
    };

    const filename = `${this.testName}-${name}-element.png`;
    const filepath = path.join(this.actualDir, filename);

    try {
      await this._waitForPageStable();

      await element.screenshot({
        path: filepath,
        ...config,
      });

      console.log(`📸 要素スクリーンショット撮影: ${filename} (${selector})`);
      return filepath;
    } catch (error) {
      console.error(`❌ 要素スクリーンショット撮影失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 複数ビューポートでスクリーンショット撮影
   */
  async captureResponsive(name, viewports, options = {}) {
    const results = {};

    for (const viewport of viewports) {
      console.log(
        `📱 ${viewport.name} (${viewport.width}x${viewport.height}) でスクリーンショット撮影`
      );

      await this.page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.deviceScaleFactor || 1,
      });

      await this.sleep(500); // レイアウト調整待ち

      const filename = `${name}-${viewport.name}`;
      const filepath = await this.capture(filename, options);
      results[viewport.name] = filepath;
    }

    return results;
  }

  /**
   * アニメーション状態のスクリーンショット撮影
   */
  async captureAnimation(name, animationSelector, frames = 5, interval = 200) {
    const results = [];

    console.log(`🎬 アニメーションスクリーンショット撮影: ${frames}フレーム`);

    // アニメーション開始を待つ
    await this.waitForSelector(animationSelector);

    for (let i = 0; i < frames; i++) {
      const filename = `${name}-frame-${i + 1}`;
      const filepath = await this.capture(filename, { fullPage: false });
      results.push(filepath);

      if (i < frames - 1) {
        await this.sleep(interval);
      }
    }

    return results;
  }

  /**
   * 視覚回帰テスト用の比較
   */
  async compareSnapshot(name, options = {}) {
    const actualPath = await this.capture(name, options);
    const baselineFilename = `${this.testName}-${name}.png`;
    const baselinePath = path.join(this.baselineDir, baselineFilename);

    // ベースライン画像が存在しない場合は作成
    if (!fs.existsSync(baselinePath)) {
      fs.copyFileSync(actualPath, baselinePath);
      console.log(`📋 ベースライン画像作成: ${baselineFilename}`);
      return {
        match: true,
        isNewBaseline: true,
        actualPath,
        baselinePath,
      };
    }

    // 画像比較（簡易版 - 実際の実装では画像比較ライブラリを使用）
    const result = await this._compareImages(baselinePath, actualPath, name);

    if (result.match) {
      console.log(`✅ 視覚回帰テスト通過: ${name}`);
    } else {
      console.warn(`⚠️ 視覚回帰テスト失敗: ${name} (差異: ${result.diffPercentage.toFixed(2)}%)`);
    }

    return result;
  }

  /**
   * ページの安定化を待つ
   */
  async _waitForPageStable() {
    // ローディング要素の消失を待つ
    try {
      await this.page.waitForFunction(
        () => {
          const loadingElements = document.querySelectorAll(
            '.loading, .spinner, [data-loading="true"]'
          );
          return loadingElements.length === 0;
        },
        { timeout: 3000 }
      );
    } catch (e) {
      // ローディング要素がない場合は無視
    }

    // アニメーションの完了を待つ
    await this.page
      .waitForFunction(
        () => {
          const animatedElements = document.querySelectorAll('*');
          for (const element of animatedElements) {
            const style = getComputedStyle(element);
            if (style.animationPlayState === 'running' || style.transitionProperty !== 'none') {
              return false;
            }
          }
          return true;
        },
        { timeout: 2000 }
      )
      .catch(() => {
        // アニメーション検出失敗時は短時間待機
        return this.sleep(300);
      });

    // ネットワークアイドルを待つ
    try {
      await this.page.waitForLoadState?.('networkidle', { timeout: 1000 });
    } catch (e) {
      // PuppeteerにはwaitForLoadStateがないため無視
    }

    // 最終的な安定化待機
    await this.sleep(200);
  }

  /**
   * 画像比較（簡易版）
   */
  async _compareImages(baselinePath, actualPath, name) {
    try {
      // Node.js環境での基本的なファイルサイズ比較
      const baselineStats = fs.statSync(baselinePath);
      const actualStats = fs.statSync(actualPath);

      const sizeDiff = Math.abs(baselineStats.size - actualStats.size);
      const sizeDiffPercentage = (sizeDiff / baselineStats.size) * 100;

      const threshold = this.config.screenshot.threshold * 100; // パーセンテージに変換
      const match = sizeDiffPercentage <= threshold;

      const result = {
        match,
        diffPercentage: sizeDiffPercentage,
        baselinePath,
        actualPath,
        diffPath: null,
      };

      // 差異がある場合は差分画像を作成（将来の実装用）
      if (!match) {
        const diffFilename = `${this.testName}-${name}-diff.png`;
        const diffPath = path.join(this.diffDir, diffFilename);

        // 実際の実装では画像比較ライブラリで差分画像を作成
        result.diffPath = diffPath;

        // ログファイルに差異情報を記録
        const logPath = path.join(this.diffDir, `${this.testName}-${name}-diff.log`);
        const logContent = `
画像比較結果:
- ベースライン: ${baselinePath}
- 実際の画像: ${actualPath}
- 差異: ${sizeDiffPercentage.toFixed(2)}%
- 閾値: ${threshold}%
- 判定: ${match ? 'PASS' : 'FAIL'}
- タイムスタンプ: ${new Date().toISOString()}
        `.trim();

        fs.writeFileSync(logPath, logContent);
      }

      return result;
    } catch (error) {
      console.error(`画像比較エラー: ${error.message}`);
      return {
        match: false,
        error: error.message,
        baselinePath,
        actualPath,
      };
    }
  }

  /**
   * すべてのスクリーンショットを削除
   */
  cleanupScreenshots(keepBaseline = true) {
    const dirsToClean = [this.actualDir, this.diffDir];
    if (!keepBaseline) {
      dirsToClean.push(this.baselineDir);
    }

    dirsToClean.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (file.startsWith(this.testName)) {
            fs.unlinkSync(path.join(dir, file));
          }
        });
      }
    });

    console.log(`🧹 スクリーンショットクリーンアップ完了: ${this.testName}`);
  }

  /**
   * スクリーンショットレポート生成
   */
  generateReport() {
    const report = {
      testName: this.testName,
      timestamp: new Date().toISOString(),
      screenshots: {
        baseline: [],
        actual: [],
        diff: [],
      },
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
      },
    };

    // 各ディレクトリのファイルを収集
    [
      { dir: this.baselineDir, key: 'baseline' },
      { dir: this.actualDir, key: 'actual' },
      { dir: this.diffDir, key: 'diff' },
    ].forEach(({ dir, key }) => {
      if (fs.existsSync(dir)) {
        const files = fs
          .readdirSync(dir)
          .filter(file => file.startsWith(this.testName) && file.endsWith('.png'))
          .map(file => ({
            name: file,
            path: path.join(dir, file),
            size: fs.statSync(path.join(dir, file)).size,
          }));

        report.screenshots[key] = files;
      }
    });

    // サマリー計算
    report.summary.total = report.screenshots.actual.length;
    report.summary.failed = report.screenshots.diff.length;
    report.summary.passed = report.summary.total - report.summary.failed;

    return report;
  }
}
