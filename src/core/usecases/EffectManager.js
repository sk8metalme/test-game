import ParticleSystem from './ParticleSystem.js';
import LineClearEffect from './LineClearEffect.js';
import TSpinEffect from './TSpinEffect.js';
import PerfectClearEffect from './PerfectClearEffect.js';
import LevelUpEffect from './LevelUpEffect.js';
import GameOverEffect from './GameOverEffect.js';

/**
 * エフェクト管理システム
 * ゲームイベントに応じてパーティクルエフェクトを管理・実行する
 */
export default class EffectManager {
  /**
   * EffectManagerのコンストラクタ
   *
   * @param {HTMLCanvasElement} canvas - Canvas要素
   * @param {Object} config - 設定
   * @param {number} config.maxConcurrentEffects - 同時実行可能なエフェクト数
   * @param {boolean} config.enableEffects - エフェクトの有効/無効
   * @param {Object} config.effectSettings - エフェクト固有の設定
   */
  constructor(canvas, config = {}) {
    if (!canvas) {
      throw new Error('EffectManager: Canvas要素が必要です');
    }

    this.canvas = canvas;
    this.config = {
      maxConcurrentEffects: config.maxConcurrentEffects || 10,
      enableEffects: config.enableEffects !== false,
      effectSettings: config.effectSettings || {},
      ...config,
    };

    // パーティクルシステムの初期化
    this.particleSystem = new ParticleSystem(canvas, {
      maxParticles: 2000,
      targetFPS: 60,
      enableOptimization: true,
      ...config.particleSystem,
    });

    // エフェクトの登録
    this.effects = new Map();
    this.activeEffects = new Map();
    this.effectQueue = [];

    // 統計情報
    this.stats = {
      totalEffectsPlayed: 0,
      activeEffectsCount: 0,
      queuedEffectsCount: 0,
      lastEffectTime: 0,
    };

    // イベントリスナー
    this.listeners = new Map();

    // 初期化
    this._initializeEffects();
  }

  /**
   * エフェクトを初期化する
   */
  _initializeEffects() {
    // ライン削除エフェクト
    this.effects.set('line-clear', LineClearEffect);

    // T-Spinエフェクト
    this.effects.set('t-spin', TSpinEffect);

    // Perfect Clearエフェクト
    this.effects.set('perfect-clear', PerfectClearEffect);

    // レベルアップエフェクト
    this.effects.set('level-up', LevelUpEffect);

    // ゲームオーバーエフェクト
    this.effects.set('game-over', GameOverEffect);
  }

  /**
   * エフェクトを再生する
   *
   * @param {string} effectName - エフェクト名
   * @param {Object} data - エフェクトデータ
   * @param {Object} data.position - 位置 {x, y}
   * @param {number} data.intensity - 強度
   * @param {Object} data.customConfig - カスタム設定
   * @returns {boolean} 再生成功かどうか
   */
  playEffect(effectName, data = {}) {
    if (!this.config.enableEffects) {
      return false;
    }

    const EffectClass = this.effects.get(effectName);
    if (!EffectClass) {
      // console.warn(`EffectManager: エフェクト '${effectName}' が見つかりません`);
      return false;
    }

    // 同時実行数の制限チェック
    if (this.activeEffects.size >= this.config.maxConcurrentEffects) {
      // キューに追加
      this.effectQueue.push({ effectName, data });
      this.stats.queuedEffectsCount = this.effectQueue.length;
      return false;
    }

    try {
      // エフェクトの設定を準備
      const effectConfig = {
        ...this.config.effectSettings[effectName],
        ...data.customConfig,
        position: data.position || { x: 400, y: 300 },
        intensity: data.intensity || 1.0,
      };

      // エフェクトインスタンスを作成
      const effect = new EffectClass(effectConfig);

      // ユニークなIDを生成
      const effectId = `${effectName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      effect.id = effectId;

      // エフェクトをパーティクルシステムに追加
      const success = this.particleSystem.addEffect(effect);

      if (success) {
        // アクティブエフェクトとして登録（ユニークなIDを使用）
        this.activeEffects.set(effectId, effect);

        // 統計を更新
        this.stats.totalEffectsPlayed++;
        this.stats.activeEffectsCount = this.activeEffects.size;
        this.stats.lastEffectTime = Date.now();

        // エフェクト終了時の処理を設定
        this._setupEffectCleanup(effect);

        // イベントを発火
        this.emit('effectStarted', { effectName, effect });

        return true;
      } else {
        // console.warn(`EffectManager: エフェクト '${effectName}' の追加に失敗しました`);
        return false;
      }
    } catch (error) {
      // console.error(`EffectManager: エフェクト '${effectName}' の再生中にエラーが発生しました:`, error);
      return false;
    }
  }

  /**
   * エフェクトの終了処理を設定する
   *
   * @param {GameEffect} effect - エフェクトインスタンス
   */
  _setupEffectCleanup(effect) {
    const originalUpdate = effect.update.bind(effect);

    effect.update = deltaTime => {
      originalUpdate(deltaTime);

      // エフェクトが終了したかチェック
      if (!effect.isActive && effect.elapsedTime > effect.duration + 1000) {
        this._cleanupEffect(effect);
      }
    };
  }

  /**
   * エフェクトをクリーンアップする
   *
   * @param {GameEffect} effect - エフェクトインスタンス
   */
  _cleanupEffect(effect) {
    // アクティブエフェクトから削除（ユニークなIDを使用）
    this.activeEffects.delete(effect.id);

    // 統計を更新
    this.stats.activeEffectsCount = this.activeEffects.size;

    // イベントを発火
    this.emit('effectEnded', { effectName: effect.name, effect });

    // キューから次のエフェクトを再生
    this._processQueue();
  }

  /**
   * エフェクトキューを処理する
   */
  _processQueue() {
    if (this.effectQueue.length > 0 && this.activeEffects.size < this.config.maxConcurrentEffects) {
      const queuedEffect = this.effectQueue.shift();
      this.stats.queuedEffectsCount = this.effectQueue.length;

      // エフェクトを再生
      this.playEffect(queuedEffect.effectName, queuedEffect.data);
    }
  }

  /**
   * エフェクトを停止する
   *
   * @param {string} effectName - エフェクト名
   * @returns {boolean} 停止成功かどうか
   */
  stopEffect(effectName) {
    // 名前が一致する最初のエフェクトを停止
    for (const [_id, effect] of this.activeEffects.entries()) {
      if (effect.name === effectName) {
        effect.stop();
        this._cleanupEffect(effect);
        return true;
      }
    }
    return false;
  }

  /**
   * 全エフェクトを停止する
   */
  stopAllEffects() {
    this.activeEffects.forEach(effect => {
      effect.stop();
    });
    this.activeEffects.clear();
    this.effectQueue = [];
    this.stats.activeEffectsCount = 0;
    this.stats.queuedEffectsCount = 0;
  }

  /**
   * システムを更新する
   *
   * @param {number} deltaTime - 経過時間
   */
  update(deltaTime) {
    if (!this.config.enableEffects) return;

    // パーティクルシステムを更新
    this.particleSystem.update(deltaTime);

    // キューを処理
    this._processQueue();
  }

  /**
   * システムを描画する
   */
  render() {
    if (!this.config.enableEffects) return;

    this.particleSystem.render();
  }

  /**
   * エフェクトを登録する
   *
   * @param {string} name - エフェクト名
   * @param {Class} EffectClass - エフェクトクラス
   */
  registerEffect(name, EffectClass) {
    this.effects.set(name, EffectClass);
  }

  /**
   * エフェクトの登録を解除する
   *
   * @param {string} name - エフェクト名
   */
  unregisterEffect(name) {
    this.effects.delete(name);
  }

  /**
   * 設定を更新する
   *
   * @param {Object} newConfig - 新しい設定
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // パーティクルシステムの設定も更新
    if (newConfig.particleSystem) {
      this.particleSystem.updateConfig(newConfig.particleSystem);
    }
  }

  /**
   * 統計情報を取得する
   *
   * @returns {Object} 統計情報
   */
  getStats() {
    const particleSystemStats = this.particleSystem.getSystemStats();

    return {
      ...this.stats,
      registeredEffects: this.effects.size,
      particleSystemStats,
      config: this.config,
    };
  }

  /**
   * イベントリスナーを追加する
   *
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * イベントリスナーを削除する
   *
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   */
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * イベントを発火する
   *
   * @param {string} event - イベント名
   * @param {Object} data - イベントデータ
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          // console.error(`EffectManager: イベント '${event}' のコールバックでエラーが発生しました:`, error);
        }
      });
    }
  }

  /**
   * システムを開始する
   */
  start() {
    this.particleSystem.start();
  }

  /**
   * システムを停止する
   */
  stop() {
    this.particleSystem.stop();
    this.stopAllEffects();
  }

  /**
   * システムをリセットする
   */
  reset() {
    this.particleSystem.reset();
    this.stopAllEffects();
    this.stats = {
      totalEffectsPlayed: 0,
      activeEffectsCount: 0,
      queuedEffectsCount: 0,
      lastEffectTime: 0,
    };
  }

  /**
   * システムの妥当性を検証する
   *
   * @returns {boolean} 妥当性
   */
  validate() {
    return this.canvas && this.particleSystem && this.particleSystem.validate();
  }

  /**
   * 文字列表現を取得する
   *
   * @returns {string} 文字列表現
   */
  toString() {
    return `EffectManager[effects=${this.effects.size}, active=${this.activeEffects.size}, queued=${this.effectQueue.length}]`;
  }
}
