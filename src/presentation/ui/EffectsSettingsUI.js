/**
 * EffectsSettingsUI - エフェクト設定UIコンポーネント
 *
 * パーティクルエフェクトのリアルタイム設定調整UI
 * プリセット管理、強度調整、統計表示機能を提供
 *
 * @author AI Assistant
 * @version 1.0.0
 */

export default class EffectsSettingsUI {
  /**
   * EffectsSettingsUIのコンストラクタ
   *
   * @param {HTMLElement} container - UIコンテナ要素
   * @param {Object} effectManager - エフェクト管理システム
   * @param {Object} modernUI - ModernUIインスタンス
   * @param {Object} config - UI設定
   */
  constructor(container, effectManager, modernUI, config = {}) {
    if (!container) {
      throw new Error('Container element is required');
    }

    if (!effectManager) {
      throw new Error('EffectManager is required');
    }

    this.container = container;
    this.effectManager = effectManager;
    this.modernUI = modernUI;

    // 設定
    this.config = {
      showPreview: config.showPreview !== false,
      enableRealTimeUpdates: config.enableRealTimeUpdates !== false,
      showStatistics: config.showStatistics !== false,
      autoUpdateInterval: config.autoUpdateInterval || 1000,
      position: config.position || 'center',
      ...config,
    };

    // 状態
    this.state = {
      isVisible: false,
      isInitialized: false,
      currentSettings: null,
      autoUpdateTimer: null,
    };

    // プリセット定義
    this.presets = {
      low: {
        particleCount: 50,
        quality: 0.5,
        animationDuration: 200,
        intensity: 0.4,
        preset: 'low',
      },
      medium: {
        particleCount: 200,
        quality: 0.75,
        animationDuration: 300,
        intensity: 0.7,
        preset: 'medium',
      },
      high: {
        particleCount: 500,
        quality: 1.0,
        animationDuration: 400,
        intensity: 1.0,
        preset: 'high',
      },
    };

    // 初期化
    this._initialize();
  }

  /**
   * 初期化
   * @private
   */
  _initialize() {
    try {
      // 現在の設定を取得
      this.state.currentSettings = this.effectManager.getConfig();
      this.state.isInitialized = true;
    } catch (error) {
      // Error logged('EffectsSettingsUI initialization failed:', error);
      if (this.modernUI && this.modernUI.showNotification) {
        this.modernUI.showNotification('エフェクト設定UIの初期化に失敗しました', 'error');
      }
    }
  }

  /**
   * エフェクト設定UIを表示
   */
  show() {
    if (this.state.isVisible) return;

    try {
      this._createUI();
      this._setupEventListeners();
      this._updateUI();

      this.state.isVisible = true;

      if (this.config.showStatistics) {
        this._startAutoUpdate();
      }
    } catch (error) {
      // Error logged('Failed to show effects settings UI:', error);
      if (this.modernUI && this.modernUI.showNotification) {
        this.modernUI.showNotification('エフェクト設定画面の表示に失敗しました', 'error');
      }
    }
  }

  /**
   * エフェクト設定UIを隠す
   */
  hide() {
    if (!this.state.isVisible) return;

    this._stopAutoUpdate();
    this._removeEventListeners();
    this._clearUI();

    this.state.isVisible = false;
  }

  /**
   * UIの作成
   * @private
   */
  _createUI() {
    const effectsSettingsHTML = `
      <div class="effects-settings-overlay">
        <div class="effects-settings">
          <div class="effects-settings-header">
            <h2>エフェクト設定</h2>
            <button class="close-button" aria-label="閉じる">×</button>
          </div>
          
          <div class="effects-settings-content">
            <!-- エフェクト有効/無効 -->
            <div class="setting-section">
              <h3>基本設定</h3>
              <div class="setting-item">
                <label>エフェクト有効:</label>
                <input type="checkbox" class="effects-enable-toggle" checked>
              </div>
            </div>

            <!-- エフェクト強度調整 -->
            <div class="setting-section">
              <h3>エフェクト調整</h3>
              <div class="setting-item">
                <label>エフェクト強度:</label>
                <input type="range" class="effects-intensity-slider" min="0" max="1" step="0.1" value="0.7">
                <span class="intensity-value">0.7</span>
              </div>
              <div class="setting-item">
                <label>画質:</label>
                <input type="range" class="effects-quality-slider" min="0.1" max="1" step="0.1" value="0.75">
                <span class="quality-value">0.75</span>
              </div>
              <div class="setting-item">
                <label>パーティクル数:</label>
                <input type="range" class="particle-count-slider" min="10" max="1000" step="10" value="200">
                <span class="particle-count-value">200</span>
              </div>
            </div>

            <!-- プリセット選択 -->
            <div class="setting-section">
              <h3>プリセット</h3>
              <div class="preset-buttons">
                <button class="preset-button" data-preset="low">低品質</button>
                <button class="preset-button" data-preset="medium">標準</button>
                <button class="preset-button" data-preset="high">高品質</button>
              </div>
            </div>

            <!-- エフェクトプレビュー -->
            ${this.config.showPreview ? this._createPreviewSection() : ''}

            <!-- 統計情報 -->
            ${this.config.showStatistics ? this._createStatsSection() : ''}
          </div>

          <div class="effects-settings-footer">
            <button class="apply-button">適用</button>
            <button class="reset-button">リセット</button>
            <button class="cancel-button">キャンセル</button>
          </div>
        </div>
      </div>
    `;

    this.container.insertAdjacentHTML('beforeend', effectsSettingsHTML);
  }

  /**
   * プレビューセクションの作成
   * @private
   * @returns {string} プレビューセクションHTML
   */
  _createPreviewSection() {
    return `
      <div class="setting-section effects-preview">
        <h3>エフェクトプレビュー</h3>
        <div class="preview-buttons">
          <button class="preview-button preview-line-clear" data-effect="line-clear">ライン削除</button>
          <button class="preview-button preview-t-spin" data-effect="t-spin">T-Spin</button>
          <button class="preview-button preview-perfect-clear" data-effect="perfect-clear">Perfect Clear</button>
          <button class="preview-button preview-level-up" data-effect="level-up">レベルアップ</button>
          <button class="preview-button preview-game-over" data-effect="game-over">ゲームオーバー</button>
        </div>
        <button class="preview-all-effects">全エフェクトプレビュー</button>
      </div>
    `;
  }

  /**
   * 統計セクションの作成
   * @private
   * @returns {string} 統計セクションHTML
   */
  _createStatsSection() {
    return `
      <div class="setting-section effects-stats">
        <h3>エフェクト統計</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">総エフェクト数:</span>
            <span class="stat-value total-effects-count">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">ライン削除:</span>
            <span class="stat-value line-clear-count">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">T-Spin:</span>
            <span class="stat-value t-spin-count">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">レベルアップ:</span>
            <span class="stat-value level-up-count">0</span>
          </div>
        </div>
        <button class="reset-stats-button">統計リセット</button>
      </div>
    `;
  }

  /**
   * UIの更新
   * @private
   */
  _updateUI() {
    try {
      const settings = this.state.currentSettings;

      // 基本設定の更新
      const enableToggle = this.container.querySelector('.effects-enable-toggle');
      if (enableToggle) {
        enableToggle.checked = this.effectManager.isEnabled();
      }

      // スライダーの更新
      this._updateSlider(
        '.effects-intensity-slider',
        '.intensity-value',
        settings.intensity || 0.7
      );
      this._updateSlider('.effects-quality-slider', '.quality-value', settings.quality || 0.75);
      this._updateSlider(
        '.particle-count-slider',
        '.particle-count-value',
        settings.particleCount || 200
      );

      // プリセットボタンの状態更新
      this._updatePresetButtons(settings.preset);

      // 統計情報の更新
      if (this.config.showStatistics) {
        this.updateStatistics();
      }
    } catch (error) {
      // Error logged('Failed to update UI:', error);
    }
  }

  /**
   * スライダーの更新
   * @private
   * @param {string} sliderSelector - スライダーのセレクター
   * @param {string} valueSelector - 値表示のセレクター
   * @param {number} value - 設定値
   */
  _updateSlider(sliderSelector, valueSelector, value) {
    const slider = this.container.querySelector(sliderSelector);
    const valueDisplay = this.container.querySelector(valueSelector);

    if (slider) {
      slider.value = value;
    }

    if (valueDisplay) {
      valueDisplay.textContent = typeof value === 'number' ? value.toFixed(1) : value;
    }
  }

  /**
   * プリセットボタンの状態更新
   * @private
   * @param {string} currentPreset - 現在のプリセット
   */
  _updatePresetButtons(currentPreset) {
    const presetButtons = this.container.querySelectorAll('.preset-button');
    presetButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.preset === currentPreset);
    });
  }

  /**
   * イベントリスナーの設定
   * @private
   */
  _setupEventListeners() {
    // 閉じるボタン
    const closeButton = this.container.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }

    // エフェクト有効/無効切り替え
    const enableToggle = this.container.querySelector('.effects-enable-toggle');
    if (enableToggle) {
      enableToggle.addEventListener('change', e => this._handleEffectsToggle(e));
    }

    // スライダー
    this._setupSliderListener('.effects-intensity-slider', '.intensity-value', 'intensity');
    this._setupSliderListener('.effects-quality-slider', '.quality-value', 'quality');
    this._setupSliderListener('.particle-count-slider', '.particle-count-value', 'particleCount');

    // プリセットボタン
    const presetButtons = this.container.querySelectorAll('.preset-button');
    presetButtons.forEach(button => {
      button.addEventListener('click', e => this._handlePresetSelect(e));
    });

    // プレビューボタン
    if (this.config.showPreview) {
      this._setupPreviewListeners();
    }

    // 統計リセットボタン
    if (this.config.showStatistics) {
      const resetStatsButton = this.container.querySelector('.reset-stats-button');
      if (resetStatsButton) {
        resetStatsButton.addEventListener('click', () => this._handleStatsReset());
      }
    }

    // フッターボタン
    this._setupFooterListeners();
  }

  /**
   * スライダーのイベントリスナー設定
   * @private
   * @param {string} sliderSelector - スライダーのセレクター
   * @param {string} valueSelector - 値表示のセレクター
   * @param {string} configKey - 設定キー
   */
  _setupSliderListener(sliderSelector, valueSelector, configKey) {
    const slider = this.container.querySelector(sliderSelector);
    const valueDisplay = this.container.querySelector(valueSelector);

    if (slider) {
      slider.addEventListener('input', e => {
        const value = parseFloat(e.target.value);

        if (valueDisplay) {
          valueDisplay.textContent = value.toFixed(1);
        }

        if (this.config.enableRealTimeUpdates) {
          this._updateEffectSetting(configKey, value);
        }
      });
    }
  }

  /**
   * プレビューのイベントリスナー設定
   * @private
   */
  _setupPreviewListeners() {
    const previewButtons = this.container.querySelectorAll('.preview-button');
    previewButtons.forEach(button => {
      button.addEventListener('click', e => this._handlePreviewClick(e));
    });

    const previewAllButton = this.container.querySelector('.preview-all-effects');
    if (previewAllButton) {
      previewAllButton.addEventListener('click', () => this._handlePreviewAll());
    }
  }

  /**
   * フッターのイベントリスナー設定
   * @private
   */
  _setupFooterListeners() {
    const applyButton = this.container.querySelector('.apply-button');
    const resetButton = this.container.querySelector('.reset-button');
    const cancelButton = this.container.querySelector('.cancel-button');

    if (applyButton) {
      applyButton.addEventListener('click', () => this._handleApply());
    }

    if (resetButton) {
      resetButton.addEventListener('click', () => this._handleReset());
    }

    if (cancelButton) {
      cancelButton.addEventListener('click', () => this.hide());
    }
  }

  /**
   * エフェクト有効/無効切り替えの処理
   * @private
   * @param {Event} event - イベント
   */
  _handleEffectsToggle(event) {
    try {
      const enabled = event.target.checked;
      this.effectManager.setEnabled(enabled);

      if (this.modernUI && this.modernUI.showNotification) {
        this.modernUI.showNotification(
          enabled ? 'エフェクトを有効にしました' : 'エフェクトを無効にしました',
          'info'
        );
      }
    } catch (error) {
      // Error logged('Failed to toggle effects:', error);
      if (this.modernUI && this.modernUI.showNotification) {
        this.modernUI.showNotification('エフェクト切り替えに失敗しました', 'error');
      }
    }
  }

  /**
   * エフェクト設定の更新
   * @private
   * @param {string} key - 設定キー
   * @param {*} value - 設定値
   */
  _updateEffectSetting(key, value) {
    try {
      // 値の正規化
      const normalizedValue = this._normalizeValue(key, value);

      const config = {};
      config[key] = normalizedValue;

      this.effectManager.updateConfig(config);
      this.state.currentSettings[key] = normalizedValue;
    } catch (error) {
      // Error logged('Failed to update effect setting:', error);
      if (this.modernUI && this.modernUI.showNotification) {
        this.modernUI.showNotification('エフェクト設定の更新に失敗しました', 'error');
      }
    }
  }

  /**
   * 値の正規化
   * @private
   * @param {string} key - 設定キー
   * @param {*} value - 値
   * @returns {*} 正規化された値
   */
  _normalizeValue(key, value) {
    // NaN や無効な値をデフォルト値に変換
    let normalizedValue = value;

    if (typeof value === 'string') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        normalizedValue = numValue;
      }
    }

    switch (key) {
      case 'intensity':
        return isNaN(normalizedValue) ? 0.7 : Math.max(0, Math.min(1, normalizedValue));
      case 'quality':
        return isNaN(normalizedValue) ? 0.75 : Math.max(0, Math.min(1, normalizedValue));
      case 'particleCount':
        return isNaN(normalizedValue)
          ? 200
          : Math.max(10, Math.min(1000, parseInt(normalizedValue)));
      case 'animationDuration':
        return isNaN(normalizedValue)
          ? 300
          : Math.max(100, Math.min(1000, parseInt(normalizedValue)));
      default:
        return normalizedValue;
    }
  }

  /**
   * プリセット選択の処理
   * @private
   * @param {Event} event - イベント
   */
  _handlePresetSelect(event) {
    try {
      const presetName = event.target.dataset.preset;
      const preset = this.presets[presetName];

      if (preset) {
        this.applySettings(preset);
        this._updatePresetButtons(presetName);

        if (this.modernUI && this.modernUI.showNotification) {
          const presetNames = {
            low: '低品質',
            medium: '標準',
            high: '高品質',
          };
          this.modernUI.showNotification(
            `${presetNames[presetName]}プリセットを適用しました`,
            'success'
          );
        }
      }
    } catch (error) {
      // Error logged('Failed to apply preset:', error);
      if (this.modernUI && this.modernUI.showNotification) {
        this.modernUI.showNotification('プリセットの適用に失敗しました', 'error');
      }
    }
  }

  /**
   * プレビュークリックの処理
   * @private
   * @param {Event} event - イベント
   */
  _handlePreviewClick(event) {
    try {
      const effectType = event.target.dataset.effect;
      const previewConfig = {
        x: this.container.offsetWidth / 2,
        y: this.container.offsetHeight / 2,
        intensity: this.state.currentSettings.intensity || 0.7,
      };

      this.effectManager.playEffect(effectType, previewConfig);
    } catch (error) {
      // Error logged('Failed to preview effect:', error);
    }
  }

  /**
   * 全エフェクトプレビューの処理
   * @private
   */
  _handlePreviewAll() {
    try {
      const effects = ['line-clear', 't-spin', 'perfect-clear', 'level-up', 'game-over'];
      const baseConfig = {
        x: this.container.offsetWidth / 2,
        y: this.container.offsetHeight / 2,
        intensity: this.state.currentSettings.intensity || 0.7,
      };

      effects.forEach((effect, index) => {
        setTimeout(() => {
          this.effectManager.playEffect(effect, {
            ...baseConfig,
            x: baseConfig.x + (index - 2) * 100,
          });
        }, index * 500);
      });
    } catch (error) {
      // Error logged('Failed to preview all effects:', error);
    }
  }

  /**
   * 統計リセットの処理
   * @private
   */
  _handleStatsReset() {
    try {
      if (this.effectManager.resetStats) {
        this.effectManager.resetStats();
      }

      this.updateStatistics();

      if (this.modernUI && this.modernUI.showNotification) {
        this.modernUI.showNotification('統計情報をリセットしました', 'info');
      }
    } catch (error) {
      // Error logged('Failed to reset stats:', error);
    }
  }

  /**
   * 適用ボタンの処理
   * @private
   */
  _handleApply() {
    this.saveSettings(this.state.currentSettings);
    this.hide();

    if (this.modernUI && this.modernUI.showNotification) {
      this.modernUI.showNotification('エフェクト設定を適用しました', 'success');
    }
  }

  /**
   * リセットボタンの処理
   * @private
   */
  _handleReset() {
    try {
      const defaultSettings = this.presets.medium;
      this.applySettings(defaultSettings);

      if (this.modernUI && this.modernUI.showNotification) {
        this.modernUI.showNotification('エフェクト設定をリセットしました', 'info');
      }
    } catch (error) {
      // Error logged('Failed to reset settings:', error);
    }
  }

  /**
   * 設定の適用
   * @param {Object} settings - 適用する設定
   */
  applySettings(settings) {
    try {
      // 設定の正規化
      const normalizedSettings = {};
      Object.keys(settings).forEach(key => {
        normalizedSettings[key] = this._normalizeValue(key, settings[key]);
      });

      // effectsEnabledがある場合は別途処理
      if ('effectsEnabled' in normalizedSettings) {
        this.effectManager.setEnabled(normalizedSettings.effectsEnabled);
        delete normalizedSettings.effectsEnabled;
      }

      // プリセット適用時のみ intensity を除外（presetキーが存在する場合のみ）
      if ('preset' in settings && 'intensity' in normalizedSettings) {
        delete normalizedSettings.intensity;
      }

      // EffectManagerへの適用
      if (Object.keys(normalizedSettings).length > 0) {
        this.effectManager.updateConfig(normalizedSettings);
      }

      // 内部状態の更新（正規化された値を使用）
      this.state.currentSettings = { ...this.state.currentSettings, ...normalizedSettings };

      // UIの更新
      this._updateUI();
    } catch (error) {
      // Error logged('Failed to apply settings:', error);

      // デフォルト値の適用
      const defaultSettings = {
        intensity: 0.5,
        quality: 0.75,
        particleCount: 200,
        animationDuration: 300,
      };

      this.effectManager.updateConfig(defaultSettings);
      this.state.currentSettings = { ...this.state.currentSettings, ...defaultSettings };
      this._updateUI();
    }
  }

  /**
   * 統計情報の更新
   */
  updateStatistics() {
    try {
      const stats = this.effectManager.getStats();

      const totalCount = this.container.querySelector('.total-effects-count');
      const lineClearCount = this.container.querySelector('.line-clear-count');
      const tSpinCount = this.container.querySelector('.t-spin-count');
      const levelUpCount = this.container.querySelector('.level-up-count');

      if (totalCount) {
        totalCount.textContent = stats.totalEffectsTriggered || 0;
      }

      if (lineClearCount && stats.effectsByType) {
        lineClearCount.textContent = stats.effectsByType['line-clear'] || 0;
      }

      if (tSpinCount && stats.effectsByType) {
        tSpinCount.textContent = stats.effectsByType['t-spin'] || 0;
      }

      if (levelUpCount && stats.effectsByType) {
        levelUpCount.textContent = stats.effectsByType['level-up'] || 0;
      }
    } catch (error) {
      // Error logged('Failed to update statistics:', error);
    }
  }

  /**
   * 設定の保存
   * @param {Object} settings - 保存する設定
   */
  saveSettings(settings) {
    try {
      localStorage.setItem('tetris-effects-settings', JSON.stringify(settings));
    } catch (error) {
      // Error logged('Failed to save settings:', error);
    }
  }

  /**
   * 設定の読み込み
   * @returns {Object} 読み込んだ設定
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('tetris-effects-settings');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      // Error logged('Failed to load settings:', error);
      return null;
    }
  }

  /**
   * プレビューの有効/無効設定
   * @param {boolean} enabled - プレビュー有効フラグ
   */
  setPreviewEnabled(enabled) {
    const previewSection = this.container.querySelector('.effects-preview');
    if (previewSection) {
      previewSection.style.display = enabled ? '' : 'none';
    }
  }

  /**
   * 自動更新の開始
   * @private
   */
  _startAutoUpdate() {
    this._stopAutoUpdate();
    this.state.autoUpdateTimer = setInterval(() => {
      this.updateStatistics();
    }, this.config.autoUpdateInterval);
  }

  /**
   * 自動更新の停止
   * @private
   */
  _stopAutoUpdate() {
    if (this.state.autoUpdateTimer) {
      clearInterval(this.state.autoUpdateTimer);
      this.state.autoUpdateTimer = null;
    }
  }

  /**
   * 統計自動更新の設定
   * @param {boolean} enabled - 自動更新有効フラグ
   * @param {number} interval - 更新間隔（ミリ秒）
   */
  setAutoUpdateStats(enabled, interval = 1000) {
    if (enabled) {
      this.config.autoUpdateInterval = interval;
      this._startAutoUpdate();
    } else {
      this._stopAutoUpdate();
    }
  }

  /**
   * イベントリスナーの削除
   * @private
   */
  _removeEventListeners() {
    // DOMが削除されるため、明示的な削除は不要
  }

  /**
   * UIのクリア
   * @private
   */
  _clearUI() {
    const overlay = this.container.querySelector('.effects-settings-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * 初期化状態の確認
   * @returns {boolean} 初期化完了フラグ
   */
  isInitialized() {
    return this.state.isInitialized;
  }

  /**
   * 表示状態の確認
   * @returns {boolean} 表示状態フラグ
   */
  isVisible() {
    return this.state.isVisible;
  }

  /**
   * 設定を取得
   * @returns {Object} 現在の設定
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * リソース解放
   */
  destroy() {
    this._stopAutoUpdate();
    this.hide();

    // UIを完全にクリア
    if (this.container) {
      this.container.innerHTML = '';
    }

    this.state.isInitialized = false;
    this.effectManager = null;
    this.modernUI = null;
    this.container = null;
  }
}
