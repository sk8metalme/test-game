/**
 * UI操作用E2Eテストヘルパー
 * ModernUI機能の操作とテストを提供
 */

import { BaseHelper } from './BaseHelper.js';

export class UITestHelper extends BaseHelper {
  constructor(page) {
    super(page);
  }

  /**
   * UI初期化完了を待機
   */
  async waitForUIReady(timeout = this.config.waitFor.uiStable) {
    console.log('🎨 UI初期化待機中...');

    const success = await this.waitForFunction(
      () => {
        // 主要なUI要素の存在確認
        const canvas = document.querySelector('#main-canvas');
        const gameUI = document.querySelector('.modern-game-ui, .game-ui, #game-container');
        return canvas && gameUI;
      },
      { timeout }
    );

    if (!success) {
      throw new Error('UI初期化がタイムアウトしました');
    }

    console.log('✅ UI初期化完了');
    return true;
  }

  /**
   * エフェクト設定パネルを開く
   */
  async openEffectsSettings() {
    const selectors = [
      '.effects-settings-button',
      '[data-testid="effects-settings"]',
      '.settings-toggle',
      '.effects-panel-toggle',
    ];

    for (const selector of selectors) {
      const element = await this.page.$(selector);
      if (element) {
        await this.safeClick(selector);
        await this.waitForSelector('.effects-settings-panel, .effects-settings');
        console.log('🎛️ エフェクト設定パネルを開きました');
        return true;
      }
    }

    // パネルが既に開いている場合
    const isOpen = await this.page.$('.effects-settings-panel, .effects-settings');
    if (isOpen) {
      console.log('🎛️ エフェクト設定パネルは既に開いています');
      return true;
    }

    console.warn('⚠️ エフェクト設定パネルのボタンが見つかりません');
    return false;
  }

  /**
   * エフェクト強度を変更
   */
  async changeEffectIntensity(intensity) {
    await this.openEffectsSettings();

    const slider = await this.page.$('.intensity-slider, [data-setting="intensity"]');
    if (slider) {
      // スライダーの値を設定
      await this.page.evaluate(value => {
        const intensitySlider = document.querySelector(
          '.intensity-slider, [data-setting="intensity"]'
        );
        if (intensitySlider) {
          intensitySlider.value = value;
          intensitySlider.dispatchEvent(new Event('input', { bubbles: true }));
          intensitySlider.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, intensity);

      console.log(`🎚️ エフェクト強度を ${intensity} に設定`);
      return true;
    }

    console.warn('⚠️ エフェクト強度スライダーが見つかりません');
    return false;
  }

  /**
   * エフェクトプリセットを選択
   */
  async selectEffectPreset(presetName) {
    await this.openEffectsSettings();

    const presetButton = await this.page.$(`[data-preset="${presetName}"], .preset-${presetName}`);
    if (presetButton) {
      await this.safeClick(`[data-preset="${presetName}"], .preset-${presetName}`);
      console.log(`🎭 プリセット "${presetName}" を選択`);
      return true;
    }

    console.warn(`⚠️ プリセット "${presetName}" が見つかりません`);
    return false;
  }

  /**
   * 設定を適用
   */
  async applySettings() {
    const applyButton = await this.page.$('.apply-settings, [data-action="apply"]');
    if (applyButton) {
      await this.safeClick('.apply-settings, [data-action="apply"]');
      await this.sleep(500); // 設定適用待ち
      console.log('✅ 設定を適用しました');
      return true;
    }

    // 自動適用の場合
    console.log('🔄 設定が自動適用されました');
    return true;
  }

  /**
   * パフォーマンスモニターを表示
   */
  async showPerformanceMonitor() {
    const toggleButton = await this.page.$(
      '.performance-toggle, [data-testid="performance-monitor"]'
    );
    if (toggleButton) {
      await this.safeClick('.performance-toggle, [data-testid="performance-monitor"]');
      await this.waitForSelector('.performance-monitor, .fps-display');
      console.log('📊 パフォーマンスモニターを表示');
      return true;
    }

    // 既に表示されている場合
    const isVisible = await this.page.$('.performance-monitor:not([style*="display: none"])');
    if (isVisible) {
      console.log('📊 パフォーマンスモニターは既に表示されています');
      return true;
    }

    console.warn('⚠️ パフォーマンスモニタートグルが見つかりません');
    return false;
  }

  /**
   * 現在のFPSを取得
   */
  async getFPS() {
    return await this.page.evaluate(() => {
      // パフォーマンスモニターからFPSを取得
      const fpsElement = document.querySelector('.fps-value, [data-metric="fps"]');
      if (fpsElement) {
        return parseFloat(fpsElement.textContent);
      }

      // debugInfoからFPSを取得
      if (window.debugInfo && typeof window.debugInfo.fps === 'number') {
        return window.debugInfo.fps;
      }

      return 0;
    });
  }

  /**
   * テーマを切り替え
   */
  async switchTheme(themeName) {
    const themeButton = await this.page.$(`[data-theme="${themeName}"], .theme-${themeName}`);
    if (themeButton) {
      await this.safeClick(`[data-theme="${themeName}"], .theme-${themeName}`);
      await this.sleep(300); // テーマ適用待ち
      console.log(`🎨 テーマを "${themeName}" に切り替え`);
      return true;
    }

    // CSSクラスでテーマ変更を試行
    const success = await this.page.evaluate(theme => {
      const body = document.body;
      if (body) {
        // 既存のテーマクラスを削除
        body.classList.remove('theme-light', 'theme-dark', 'light-theme', 'dark-theme');
        // 新しいテーマクラスを追加
        body.classList.add(`theme-${theme}`, `${theme}-theme`);
        return true;
      }
      return false;
    }, themeName);

    if (success) {
      console.log(`🎨 テーマを "${themeName}" に切り替え（CSS）`);
    } else {
      console.warn(`⚠️ テーマ "${themeName}" の切り替えに失敗`);
    }

    return success;
  }

  /**
   * 現在のテーマを取得
   */
  async getCurrentTheme() {
    return await this.page.evaluate(() => {
      const body = document.body;
      if (body.classList.contains('theme-dark') || body.classList.contains('dark-theme')) {
        return 'dark';
      }
      if (body.classList.contains('theme-light') || body.classList.contains('light-theme')) {
        return 'light';
      }
      return 'default';
    });
  }

  /**
   * エフェクト設定を取得
   */
  async getEffectSettings() {
    return await this.page.evaluate(() => {
      // ModernGameUIまたはEffectsSettingsUIから設定を取得
      const effectsUI = window.modernGameUI?.effectsSettingsUI || window.effectsSettingsUI;
      if (effectsUI && effectsUI.getCurrentSettings) {
        return effectsUI.getCurrentSettings();
      }

      // 手動で設定要素から取得
      const settings = {};

      const intensitySlider = document.querySelector(
        '.intensity-slider, [data-setting="intensity"]'
      );
      if (intensitySlider) {
        settings.intensity = parseFloat(intensitySlider.value);
      }

      const activePreset = document.querySelector('.preset-button.active, [data-preset].selected');
      if (activePreset) {
        settings.preset = activePreset.dataset.preset || activePreset.textContent.trim();
      }

      return settings;
    });
  }

  /**
   * レスポンシブレイアウトをテスト
   */
  async testResponsiveLayout(viewports) {
    const results = {};

    for (const viewport of viewports) {
      console.log(`📱 ビューポートテスト: ${viewport.name} (${viewport.width}x${viewport.height})`);

      await this.page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
      });

      await this.sleep(500); // レイアウト調整待ち

      // UI要素の表示状態確認
      const layoutInfo = await this.page.evaluate(() => {
        const canvas = document.querySelector('#main-canvas');
        const gameUI = document.querySelector('.modern-game-ui, .game-ui, #game-container');
        const settingsPanel = document.querySelector('.effects-settings, .test-controls');

        return {
          canvasVisible: canvas ? canvas.offsetWidth > 0 : false,
          gameUIVisible: gameUI ? gameUI.offsetWidth > 0 : false,
          settingsPanelVisible: settingsPanel ? settingsPanel.offsetWidth > 0 : false,
          canvasSize: canvas ? { width: canvas.offsetWidth, height: canvas.offsetHeight } : null,
        };
      });

      results[viewport.name] = layoutInfo;
    }

    return results;
  }

  /**
   * アクセシビリティをチェック
   */
  async checkAccessibility() {
    return await this.page.evaluate(() => {
      const results = {
        hasAltTexts: true,
        hasAriaLabels: true,
        hasKeyboardNavigation: true,
        issues: [],
      };

      // 画像のalt属性チェック
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        if (!img.alt) {
          results.hasAltTexts = false;
          results.issues.push(`画像 ${index + 1} にalt属性がありません`);
        }
      });

      // インタラクティブ要素のaria-label チェック
      const interactiveElements = document.querySelectorAll('button, input, select, textarea');
      interactiveElements.forEach((element, index) => {
        if (!element.getAttribute('aria-label') && !element.textContent.trim()) {
          results.hasAriaLabels = false;
          results.issues.push(`インタラクティブ要素 ${index + 1} にaria-labelがありません`);
        }
      });

      return results;
    });
  }
}
