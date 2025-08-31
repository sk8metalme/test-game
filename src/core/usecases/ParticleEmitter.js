/**
 * ParticleEmitter - パーティクル発射制御クラス
 *
 * パーティクルの発射タイミング、数、設定を管理します。
 * 継続発射、バースト発射、時間制限などの機能を提供します。
 *
 * @author AI Assistant
 * @version 1.0.0
 */

export default class ParticleEmitter {
  /**
   * ParticleEmitterのコンストラクタ
   *
   * @param {Object} config - エミッターの設定
   * @param {string} config.name - エミッターの名前
   * @param {Object} config.particleConfig - パーティクルの基本設定
   * @param {number} config.emissionRate - 発射率（パーティクル/秒、デフォルト: 10）
   * @param {number} config.burstCount - バースト発射時のパーティクル数（デフォルト: 1）
   * @param {number} config.duration - 継続時間（ミリ秒、-1で無限、デフォルト: -1）
   * @param {boolean} config.active - 初期状態（デフォルト: true）
   */
  constructor(config = {}) {
    // 基本設定
    this.name = config.name || 'unnamed';
    this.particleConfig = config.particleConfig || {};

    // 発射設定
    this.emissionRate = Math.max(1, config.emissionRate || 10);
    this.burstCount = Math.max(1, config.burstCount || 1);
    this.duration = config.duration !== undefined ? config.duration : -1;

    // 状態管理
    this.active = config.active !== false;
    this.startTime = Date.now();
    this.lastEmissionTime = 0;

    // 統計情報
    this.stats = {
      totalEmitted: 0,
      totalEmittedInCurrentSession: 0,
      activeTime: 0,
      lastEmissionCount: 0,
    };

    // 内部状態
    this._isInitialized = true;
    this._lastUpdateTime = Date.now();
  }

  /**
   * パーティクルを発射
   *
   * @param {Object} position - 発射位置 { x, y }
   * @param {number} count - 発射するパーティクル数
   * @param {Object} particlePool - パーティクルプール（オプション）
   * @returns {Array} 発射されたパーティクルの配列
   */
  emit(position, count = 1, particlePool = null) {
    // バリデーション
    if (!this.active || !position || count <= 0) {
      return [];
    }

    // パーティクルプールが提供されない場合は空配列を返す
    if (!particlePool || typeof particlePool.createParticle !== 'function') {
      return [];
    }

    const particles = [];
    // countを指定された場合はその数だけ発射、burstCountは制限として機能
    const actualCount = Math.min(count, this.burstCount);

    // パーティクルを作成・発射
    for (let i = 0; i < actualCount; i++) {
      try {
        const particle = particlePool.createParticle();

        if (particle) {
          // 位置を設定
          if (particle.position) {
            particle.position.x = position.x;
            particle.position.y = position.y;
          }

          // パーティクル設定を適用
          if (Object.keys(this.particleConfig).length > 0) {
            if (typeof particle.updateConfig === 'function') {
              particle.updateConfig(this.particleConfig);
            } else {
              // updateConfigメソッドがない場合は直接設定
              Object.assign(particle, this.particleConfig);
            }
          }

          particles.push(particle);
        }
      } catch (error) {
        // エラーが発生した場合は次のパーティクルに進む
        continue;
      }
    }

    // 統計を更新
    this.stats.totalEmitted += particles.length;
    this.stats.totalEmittedInCurrentSession += particles.length;
    this.stats.lastEmissionCount = particles.length;
    this.lastEmissionTime = Date.now();

    return particles;
  }

  /**
   * エミッターを更新
   *
   * @param {number} _deltaTime - 前回の更新からの経過時間（秒）
   */
  update(_deltaTime) {
    if (!this.active) return;

    const now = Date.now();
    this._lastUpdateTime = now;

    // アクティブ時間を更新
    this.stats.activeTime = now - this.startTime;

    // 継続時間のチェック
    if (this.duration > 0 && this.stats.activeTime >= this.duration) {
      this.stop();
      return;
    }

    // 継続発射の処理（必要に応じて実装）
    // 現在は手動発射のみサポート
  }

  /**
   * エミッターを開始
   */
  start() {
    this.active = true;
    this.startTime = Date.now();
    this.stats.totalEmittedInCurrentSession = 0;
  }

  /**
   * エミッターを停止
   */
  stop() {
    this.active = false;
  }

  /**
   * エミッターがアクティブかどうかを確認
   *
   * @returns {boolean} アクティブな場合true
   */
  isActive() {
    return this.active;
  }

  /**
   * 発射率を設定
   *
   * @param {number} rate - 新しい発射率
   */
  setEmissionRate(rate) {
    this.emissionRate = Math.max(1, rate);
  }

  /**
   * バースト数を設定
   *
   * @param {number} count - 新しいバースト数
   */
  setBurstCount(count) {
    this.burstCount = Math.max(1, count);
  }

  /**
   * 継続時間を設定
   *
   * @param {number} duration - 新しい継続時間（ミリ秒、-1で無限）
   */
  setDuration(duration) {
    this.duration = duration;
  }

  /**
   * パーティクル設定を更新
   *
   * @param {Object} config - 更新する設定
   */
  updateParticleConfig(config) {
    if (config && typeof config === 'object') {
      this.particleConfig = { ...this.particleConfig, ...config };
    }
  }

  /**
   * エミッター設定を一括更新
   *
   * @param {Object} config - 更新する設定
   */
  updateConfig(config) {
    if (config.emissionRate !== undefined) {
      this.setEmissionRate(config.emissionRate);
    }

    if (config.burstCount !== undefined) {
      this.setBurstCount(config.burstCount);
    }

    if (config.duration !== undefined) {
      this.setDuration(config.duration);
    }

    if (config.active !== undefined) {
      this.active = config.active;
    }

    if (config.particleConfig) {
      this.updateParticleConfig(config.particleConfig);
    }
  }

  /**
   * 統計情報を取得
   *
   * @returns {Object} 統計情報
   */
  getStats() {
    return {
      ...this.stats,
      name: this.name,
      active: this.active,
      emissionRate: this.emissionRate,
      burstCount: this.burstCount,
      duration: this.duration,
      startTime: this.startTime,
      lastEmissionTime: this.lastEmissionTime,
    };
  }

  /**
   * 統計情報をリセット
   */
  resetStats() {
    this.stats = {
      totalEmitted: 0,
      totalEmittedInCurrentSession: 0,
      activeTime: 0,
      lastEmissionCount: 0,
    };
    this.startTime = Date.now();
    this.lastEmissionTime = 0;
  }

  /**
   * エミッターをリセット
   */
  reset() {
    this.active = true;
    this.resetStats();
  }

  /**
   * エミッターの状態を複製
   *
   * @returns {ParticleEmitter} 新しいエミッターインスタンス
   */
  clone() {
    return new ParticleEmitter({
      name: this.name,
      particleConfig: { ...this.particleConfig },
      emissionRate: this.emissionRate,
      burstCount: this.burstCount,
      duration: this.duration,
      active: this.active,
    });
  }

  /**
   * エミッターの設定を検証
   *
   * @returns {Object} 検証結果 { isValid: boolean, errors: Array }
   */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim() === '') {
      errors.push('エミッター名が設定されていません');
    }

    if (this.emissionRate < 1) {
      errors.push('発射率は1以上である必要があります');
    }

    if (this.burstCount < 1) {
      errors.push('バースト数は1以上である必要があります');
    }

    if (this.duration !== -1 && this.duration < 0) {
      errors.push('継続時間は-1（無限）または0以上である必要があります');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * エミッターの情報を文字列として取得
   *
   * @returns {string} エミッターの情報
   */
  toString() {
    return `ParticleEmitter(${this.name}) - Active: ${this.active}, Rate: ${this.emissionRate}, Burst: ${this.burstCount}, Duration: ${this.duration}`;
  }
}
