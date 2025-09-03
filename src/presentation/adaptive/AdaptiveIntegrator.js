/**
 * AdaptiveIntegrator.js - 既存システム統合管理クラス
 *
 * 責任:
 * - 既存システム（Responsive/Accessibility/Performance）の統合管理
 * - システム間のデータ連携と整合性保証
 * - エラーハンドリングと障害分離
 * - 統合ライフサイクル管理
 */

export class AdaptiveIntegrator {
  constructor(config = {}) {
    // デフォルト設定
    this.config = {
      enableAutoSync: true,
      syncInterval: 1000,
      maxRetries: 3,
      ...config,
    };

    // システム統合マップ
    this.systemIntegrations = new Map();

    // データストリーム管理
    this.dataStreams = new Map();

    // 同期キュー
    this.syncQueue = [];

    // 状態フラグ
    this.isDestroyed = false;

    // 統合状態キャッシュ
    this._cachedState = {};
    this._lastSyncTime = 0;
  }

  /**
   * ResponsiveComboManagerとの統合
   */
  async integrateResponsiveManager(manager) {
    this._validateNotDestroyed();
    this._validateManager(manager, 'ResponsiveManager');

    try {
      // システム統合情報を登録
      this.systemIntegrations.set('responsive', {
        instance: manager,
        callbacks: manager._resizeCallbacks || [],
        state: () => ({
          breakpoint: manager.currentBreakpoint,
          orientation: manager.currentOrientation,
          performance: manager.devicePerformance,
        }),
      });

      // ブレークポイント変更コールバックを登録
      if (manager._breakpointChangeCallbacks) {
        manager._breakpointChangeCallbacks.push(this._handleBreakpointChange.bind(this));
      }

      // 方向変更コールバックを登録
      if (manager._orientationChangeCallbacks) {
        manager._orientationChangeCallbacks.push(this._handleOrientationChange.bind(this));
      }

      // 統合状態を更新
      this._updateIntegratedState();
    } catch (error) {
      this._handleIntegrationError('responsive', error);
      throw error;
    }
  }

  /**
   * AccessibilityEnhancerとの統合
   */
  async integrateAccessibilityEnhancer(enhancer) {
    this._validateNotDestroyed();
    this._validateManager(enhancer, 'AccessibilityEnhancer');

    try {
      // システム統合情報を登録
      this.systemIntegrations.set('accessibility', {
        instance: enhancer,
        state: () => ({
          highContrast: enhancer.isHighContrastEnabled,
          voiceGuidance: enhancer.isVoiceGuidanceEnabled,
          reducedMotion: enhancer.isReducedMotionEnabled,
          feedbackLevel: enhancer.feedbackLevel,
        }),
        settings: enhancer.userSettings,
      });

      // 統合状態を更新
      this._updateIntegratedState();
    } catch (error) {
      this._handleIntegrationError('accessibility', error);
      throw error;
    }
  }

  /**
   * PerformanceOptimizerとの統合
   */
  async integratePerformanceOptimizer(optimizer) {
    this._validateNotDestroyed();
    this._validateManager(optimizer, 'PerformanceOptimizer');

    try {
      // システム統合情報を登録
      this.systemIntegrations.set('performance', {
        instance: optimizer,
        state: () => ({
          currentFPS: optimizer.performanceMetrics.fps,
          frameTime: optimizer.performanceMetrics.frameTime,
          memoryUsage: optimizer.performanceMetrics.memoryUsage,
          cpuUsage: optimizer.performanceMetrics.cpuUsage,
        }),
      });

      // 統合状態を更新
      this._updateIntegratedState();
    } catch (error) {
      this._handleIntegrationError('performance', error);
      throw error;
    }
  }

  /**
   * 統合された全システムの状態を取得
   */
  getIntegratedState() {
    this._validateNotDestroyed();

    const state = {};

    // 各統合システムの状態を取得
    for (const [systemType, integration] of this.systemIntegrations) {
      try {
        if (integration.state && typeof integration.state === 'function') {
          state[systemType] = integration.state();
        }
      } catch (error) {
        // エラーが発生しても他のシステムには影響しない
        // 本番環境では詳細ログを抑制
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn(`Failed to get state for system: ${systemType}`, error);
        }
        state[systemType] = {};
      }
    }

    return state;
  }

  /**
   * システム状態の同期
   */
  async syncSystemStates() {
    this._validateNotDestroyed();

    try {
      // 統合状態を更新
      this._updateIntegratedState();
      this._lastSyncTime = Date.now();

      return true;
    } catch (error) {
      // エラーが発生しても例外は投げない（分離処理）
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to sync system states:', error);
      }
      return false;
    }
  }

  /**
   * 統合システムの破棄
   */
  destroy() {
    if (this.isDestroyed) {
      return;
    }

    try {
      // 統合システムをクリア
      this.systemIntegrations.clear();
      this.dataStreams.clear();
      this.syncQueue = [];

      // キャッシュクリア
      this._cachedState = {};

      // 破棄フラグを設定
      this.isDestroyed = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error during AdaptiveIntegrator destruction:', error);
    }
  }

  // === プライベートメソッド ===

  /**
   * ブレークポイント変更ハンドラー
   */
  _handleBreakpointChange(_breakpoint) {
    try {
      this._updateIntegratedState();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to handle breakpoint change:', error);
      }
    }
  }

  /**
   * 方向変更ハンドラー
   */
  _handleOrientationChange(_orientation) {
    try {
      this._updateIntegratedState();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to handle orientation change:', error);
      }
    }
  }

  /**
   * 統合状態の更新
   */
  _updateIntegratedState() {
    if (this.isDestroyed) {
      return;
    }

    this._cachedState = this.getIntegratedState();
  }

  /**
   * 破棄状態のバリデーション
   */
  _validateNotDestroyed() {
    if (this.isDestroyed) {
      throw new Error('AdaptiveIntegrator has been destroyed');
    }
  }

  /**
   * マネージャーのバリデーション
   */
  _validateManager(manager, type) {
    if (manager === null || manager === undefined) {
      throw new Error(`${type} cannot be null or undefined`);
    }
  }

  /**
   * 統合エラーハンドリング
   */
  _handleIntegrationError(systemType, error) {
    // eslint-disable-next-line no-console
    console.error(`Integration error for ${systemType}:`, error);

    // エラーが発生したシステムを分離
    if (this.systemIntegrations.has(systemType)) {
      const integration = this.systemIntegrations.get(systemType);
      integration.hasError = true;
      integration.lastError = error;
      integration.errorTime = Date.now();
    }
  }
}
