/**
 * EffectsSettingsUI テスト
 *
 * エフェクト設定UIコンポーネントのテスト
 *
 * テスト範囲:
 * - エフェクト強度調整
 * - プリセット管理
 * - EffectManagerとの連携
 * - リアルタイム設定反映
 */

import EffectsSettingsUI from '../../../../src/presentation/ui/EffectsSettingsUI.js';

describe('EffectsSettingsUI', () => {
  let container;
  let effectsSettingsUI;
  let mockEffectManager;
  let mockModernUI;

  beforeEach(() => {
    // テスト用DOM環境の設定
    container = document.createElement('div');
    container.id = 'effects-settings-container';
    document.body.appendChild(container);

    // EffectManagerのモック
    mockEffectManager = {
      getConfig: jest.fn(() => ({
        effectsEnabled: true,
        particleCount: 200,
        quality: 0.75,
        animationDuration: 300,
      })),
      updateConfig: jest.fn(),
      getStats: jest.fn(() => ({
        totalEffectsTriggered: 10,
        effectsByType: {
          'line-clear': 5,
          'level-up': 3,
          't-spin': 2,
        },
      })),
      playEffect: jest.fn(),
      stopAllEffects: jest.fn(),
      isEnabled: jest.fn(() => true),
      setEnabled: jest.fn(),
      resetStats: jest.fn(),
    };

    // ModernUIのモック
    mockModernUI = {
      showNotification: jest.fn(),
      getState: jest.fn(() => ({ currentTheme: 'dark' })),
      on: jest.fn(),
      emit: jest.fn(),
    };

    // グローバルAPIのモック
    global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
  });

  afterEach(() => {
    if (effectsSettingsUI) {
      effectsSettingsUI.destroy();
    }
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe('初期化', () => {
    test('正常に初期化される', () => {
      effectsSettingsUI = new EffectsSettingsUI(container, mockEffectManager, mockModernUI);

      expect(effectsSettingsUI).toBeDefined();
      expect(effectsSettingsUI.isInitialized()).toBe(true);
      expect(mockEffectManager.getConfig).toHaveBeenCalled();
    });

    test('必須パラメータが不足している場合はエラーが発生する', () => {
      expect(() => {
        new EffectsSettingsUI(null, mockEffectManager, mockModernUI);
      }).toThrow('Container element is required');

      expect(() => {
        new EffectsSettingsUI(container, null, mockModernUI);
      }).toThrow('EffectManager is required');
    });

    test('デフォルト設定が正しく適用される', () => {
      effectsSettingsUI = new EffectsSettingsUI(container, mockEffectManager, mockModernUI);

      const config = effectsSettingsUI.getConfig();
      expect(config.showPreview).toBe(true);
      expect(config.enableRealTimeUpdates).toBe(true);
      expect(config.showStatistics).toBe(true);
    });
  });

  describe('UI生成', () => {
    beforeEach(() => {
      effectsSettingsUI = new EffectsSettingsUI(container, mockEffectManager, mockModernUI);
    });

    test('エフェクト設定UIが正しく生成される', () => {
      effectsSettingsUI.show();

      expect(container.querySelector('.effects-settings')).toBeTruthy();
      expect(container.querySelector('.effects-settings-header')).toBeTruthy();
      expect(container.querySelector('.effects-settings-content')).toBeTruthy();
    });

    test('有効/無効切り替えスイッチが生成される', () => {
      effectsSettingsUI.show();

      const enableToggle = container.querySelector('.effects-enable-toggle');
      expect(enableToggle).toBeTruthy();
      expect(enableToggle.type).toBe('checkbox');
      expect(enableToggle.checked).toBe(true);
    });

    test('エフェクト強度スライダーが生成される', () => {
      effectsSettingsUI.show();

      const intensitySlider = container.querySelector('.effects-intensity-slider');
      expect(intensitySlider).toBeTruthy();
      expect(intensitySlider.type).toBe('range');
      expect(intensitySlider.min).toBe('0');
      expect(intensitySlider.max).toBe('1');
    });

    test('プリセット選択ボタンが生成される', () => {
      effectsSettingsUI.show();

      const presetButtons = container.querySelectorAll('.preset-button');
      expect(presetButtons.length).toBe(3); // low, medium, high

      const lowButton = container.querySelector('[data-preset="low"]');
      const mediumButton = container.querySelector('[data-preset="medium"]');
      const highButton = container.querySelector('[data-preset="high"]');

      expect(lowButton).toBeTruthy();
      expect(mediumButton).toBeTruthy();
      expect(highButton).toBeTruthy();
    });

    test('統計情報表示エリアが生成される', () => {
      effectsSettingsUI.show();

      const statsArea = container.querySelector('.effects-stats');
      expect(statsArea).toBeTruthy();

      const totalEffects = container.querySelector('.total-effects-count');
      expect(totalEffects).toBeTruthy();
      expect(totalEffects.textContent).toContain('10');
    });
  });

  describe('エフェクト制御', () => {
    beforeEach(() => {
      effectsSettingsUI = new EffectsSettingsUI(container, mockEffectManager, mockModernUI);
      effectsSettingsUI.show();
    });

    test('エフェクト有効/無効切り替えが正常に動作する', () => {
      const enableToggle = container.querySelector('.effects-enable-toggle');

      // 無効に切り替え
      enableToggle.checked = false;
      enableToggle.dispatchEvent(new Event('change'));

      expect(mockEffectManager.setEnabled).toHaveBeenCalledWith(false);
      expect(mockModernUI.showNotification).toHaveBeenCalledWith(
        'エフェクトを無効にしました',
        'info'
      );
    });

    test('エフェクト強度変更が正常に動作する', () => {
      const intensitySlider = container.querySelector('.effects-intensity-slider');

      // 強度を0.8に変更
      intensitySlider.value = '0.8';
      intensitySlider.dispatchEvent(new Event('input'));

      expect(mockEffectManager.updateConfig).toHaveBeenCalledWith({
        intensity: 0.8,
      });
    });

    test('リアルタイム更新が正常に動作する', () => {
      const qualitySlider = container.querySelector('.effects-quality-slider');

      // 品質を0.9に変更
      qualitySlider.value = '0.9';
      qualitySlider.dispatchEvent(new Event('input'));

      // リアルタイム更新が有効な場合、即座に反映される
      expect(mockEffectManager.updateConfig).toHaveBeenCalledWith({
        quality: 0.9,
      });
    });

    test('プリセット適用が正常に動作する', () => {
      const lowPresetButton = container.querySelector('[data-preset="low"]');

      lowPresetButton.click();

      expect(mockEffectManager.updateConfig).toHaveBeenCalledWith({
        particleCount: 50,
        quality: 0.5,
        animationDuration: 200,
        preset: 'low',
      });

      expect(mockModernUI.showNotification).toHaveBeenCalledWith(
        '低品質プリセットを適用しました',
        'success'
      );
    });
  });

  describe('エフェクトプレビュー', () => {
    beforeEach(() => {
      effectsSettingsUI = new EffectsSettingsUI(container, mockEffectManager, mockModernUI);
      effectsSettingsUI.show();
    });

    test('プレビューボタンが正常に動作する', () => {
      const previewButton = container.querySelector('.preview-line-clear');

      previewButton.click();

      expect(mockEffectManager.playEffect).toHaveBeenCalledWith('line-clear', {
        x: expect.any(Number),
        y: expect.any(Number),
        intensity: expect.any(Number),
      });
    });

    test('プレビュー表示/非表示が正常に切り替わる', () => {
      // プレビューを無効にする
      effectsSettingsUI.setPreviewEnabled(false);

      const previewSection = container.querySelector('.effects-preview');
      expect(previewSection.style.display).toBe('none');

      // プレビューを有効にする
      effectsSettingsUI.setPreviewEnabled(true);

      expect(previewSection.style.display).not.toBe('none');
    });

    test('全エフェクトプレビューが正常に動作する', () => {
      jest.useFakeTimers();

      const previewAllButton = container.querySelector('.preview-all-effects');
      previewAllButton.click();

      // すべてのタイマーを実行
      jest.runAllTimers();

      expect(mockEffectManager.playEffect).toHaveBeenCalledTimes(5);
      expect(mockEffectManager.playEffect).toHaveBeenCalledWith('line-clear', expect.any(Object));
      expect(mockEffectManager.playEffect).toHaveBeenCalledWith('t-spin', expect.any(Object));
      expect(mockEffectManager.playEffect).toHaveBeenCalledWith(
        'perfect-clear',
        expect.any(Object)
      );
      expect(mockEffectManager.playEffect).toHaveBeenCalledWith('level-up', expect.any(Object));
      expect(mockEffectManager.playEffect).toHaveBeenCalledWith('game-over', expect.any(Object));

      jest.useRealTimers();
    });
  });

  describe('統計情報', () => {
    beforeEach(() => {
      effectsSettingsUI = new EffectsSettingsUI(container, mockEffectManager, mockModernUI);
      effectsSettingsUI.show();
    });

    test('統計情報が正しく表示される', () => {
      effectsSettingsUI.updateStatistics();

      const totalCount = container.querySelector('.total-effects-count');
      const lineClearCount = container.querySelector('.line-clear-count');
      const levelUpCount = container.querySelector('.level-up-count');

      expect(totalCount.textContent).toContain('10');
      expect(lineClearCount.textContent).toContain('5');
      expect(levelUpCount.textContent).toContain('3');
    });

    test('統計情報リセットが正常に動作する', () => {
      const resetButton = container.querySelector('.reset-stats-button');

      resetButton.click();

      expect(mockEffectManager.resetStats).toHaveBeenCalled();
      expect(mockModernUI.showNotification).toHaveBeenCalledWith(
        '統計情報をリセットしました',
        'info'
      );
    });

    test('統計情報の自動更新が正常に動作する', () => {
      jest.useFakeTimers();

      // 初期の呼び出し回数を記録
      const initialCallCount = mockEffectManager.getStats.mock.calls.length;

      // 短いインターバルで自動更新を有効にする
      effectsSettingsUI.setAutoUpdateStats(true, 100);

      // 時間を進める
      jest.advanceTimersByTime(200);

      const finalCallCount = mockEffectManager.getStats.mock.calls.length;
      expect(finalCallCount).toBeGreaterThan(initialCallCount); // 自動更新により呼び出し回数が増加

      effectsSettingsUI.setAutoUpdateStats(false);

      jest.useRealTimers();
    });
  });

  describe('設定の保存と復元', () => {
    beforeEach(() => {
      effectsSettingsUI = new EffectsSettingsUI(container, mockEffectManager, mockModernUI);
    });

    test('設定の保存が正常に動作する', () => {
      const settings = {
        effectsEnabled: false,
        intensity: 0.6,
        quality: 0.8,
        preset: 'high',
      };

      effectsSettingsUI.saveSettings(settings);

      // localStorageへの保存を確認
      const saved = JSON.parse(localStorage.getItem('tetris-effects-settings'));
      expect(saved).toEqual(settings);
    });

    test('設定の復元が正常に動作する', () => {
      // 事前に設定を保存
      const settings = {
        effectsEnabled: false,
        intensity: 0.3,
        quality: 0.9,
        preset: 'custom',
      };
      localStorage.setItem('tetris-effects-settings', JSON.stringify(settings));

      // 設定を復元
      const restored = effectsSettingsUI.loadSettings();

      expect(restored).toEqual(settings);
    });

    test('設定の適用が正常に動作する', () => {
      effectsSettingsUI.show();

      const settings = {
        effectsEnabled: true, // テストでは有効状態を設定
        intensity: 0.7,
        quality: 0.6,
      };

      effectsSettingsUI.applySettings(settings);

      expect(mockEffectManager.setEnabled).toHaveBeenCalledWith(true);
      expect(mockEffectManager.updateConfig).toHaveBeenCalledWith({
        intensity: 0.7,
        quality: 0.6,
      });

      // UI要素の更新確認
      const enableToggle = container.querySelector('.effects-enable-toggle');
      const intensitySlider = container.querySelector('.effects-intensity-slider');

      expect(enableToggle.checked).toBe(true);
      expect(intensitySlider.value).toBe('0.7');
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      effectsSettingsUI = new EffectsSettingsUI(container, mockEffectManager, mockModernUI);
    });

    test('EffectManagerエラーが適切に処理される', () => {
      mockEffectManager.updateConfig.mockImplementation(() => {
        throw new Error('EffectManager error');
      });

      effectsSettingsUI.show();

      const intensitySlider = container.querySelector('.effects-intensity-slider');

      expect(() => {
        intensitySlider.value = '0.8';
        intensitySlider.dispatchEvent(new Event('input'));
      }).not.toThrow();

      expect(mockModernUI.showNotification).toHaveBeenCalledWith(
        'エフェクト設定の更新に失敗しました',
        'error'
      );
    });

    test('無効な設定値が適切に処理される', () => {
      effectsSettingsUI.show();

      const settings = {
        intensity: 'invalid',
        quality: -1,
        particleCount: 'not-a-number',
      };

      expect(() => {
        effectsSettingsUI.applySettings(settings);
      }).not.toThrow();

      // デフォルト値が適用される
      expect(mockEffectManager.updateConfig).toHaveBeenCalledWith({
        intensity: 0.7, // デフォルト値（_normalizeValueから）
        quality: 0, // デフォルト値（0以下は0に正規化）
        particleCount: 200, // デフォルト値
      });
    });
  });

  describe('破棄処理', () => {
    test('リソースが正しく解放される', () => {
      effectsSettingsUI = new EffectsSettingsUI(container, mockEffectManager, mockModernUI);
      effectsSettingsUI.show();

      // 自動更新を設定
      effectsSettingsUI.setAutoUpdateStats(true, 1000);

      expect(effectsSettingsUI.isInitialized()).toBe(true);

      effectsSettingsUI.destroy();

      expect(effectsSettingsUI.isInitialized()).toBe(false);
      expect(container.innerHTML).toBe('');
    });
  });
});
