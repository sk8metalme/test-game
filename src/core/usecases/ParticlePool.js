import ObjectPool from './ObjectPool.js';
import { Particle } from '../entities/Particle.js';

/**
 * ParticlePool - パーティクル専用オブジェクトプール
 *
 * 既存のObjectPoolクラスを拡張して、パーティクル固有の機能を提供します。
 * メモリ効率化とパフォーマンス向上を実現し、大量のパーティクルを効率的に管理します。
 *
 * @extends ObjectPool
 * @author AI Assistant
 * @version 1.0.0
 */
export default class ParticlePool extends ObjectPool {
  /**
   * ParticlePoolのコンストラクタ
   *
   * @param {Object} config - プールの設定
   * @param {number} config.initialSize - 初期プールサイズ（デフォルト: 100）
   * @param {number} config.maxSize - 最大プールサイズ（デフォルト: 1000）
   * @param {Object} config.particleConfig - パーティクルのデフォルト設定
   * @param {string} config.particleType - パーティクルのタイプ（デフォルト: 'default'）
   * @param {boolean} config.autoOptimize - 自動最適化の有効/無効（デフォルト: true）
   * @param {number} config.optimizationThreshold - 最適化の閾値（デフォルト: 0.8）
   * @param {number} config.cleanupInterval - クリーンアップ間隔（ミリ秒、デフォルト: 5000）
   */
  constructor(config = {}) {
    // ObjectPoolの初期化
    super(
      () => new Particle(config.particleConfig || {}), // createFn
      particle => particle.reset(), // resetFn
      config.initialSize || 100, // initialSize
      config.maxSize || 1000 // maxSize
    );

    // パーティクル固有の設定
    this.particleConfig = config.particleConfig || {};
    this.particleType = config.particleType || 'default';
    this._autoOptimizeEnabled = config.autoOptimize !== false;

    // パーティクル固有の統計
    this.particleStats = {
      totalEmitted: 0,
      totalRecycled: 0,
      averageLifeTime: 0,
      peakActiveCount: 0,
    };

    // 最適化設定
    this.optimizationThreshold = Math.max(0.1, Math.min(0.99, config.optimizationThreshold || 0.8));
    this.cleanupInterval = Math.max(1000, Math.min(60000, config.cleanupInterval || 5000)); // 5秒
    this._lastCleanup = Date.now();

    // ライフタイム統計の追跡
    this._lifeTimeSum = 0;
    this._lifeTimeCount = 0;

    // アクティブパーティクルの効率的な追跡
    this._activeParticles = new Set();
    this._activeParticleArray = [];
    this._arrayDirty = false;
  }

  /**
   * パーティクルを作成・取得
   *
   * @param {Object} config - パーティクルの設定
   * @returns {Particle} パーティクルインスタンス
   */
  createParticle(config = {}) {
    // ObjectPoolからパーティクルを取得
    const particle = this.acquire();

    // 設定を適用
    if (config && Object.keys(config).length > 0) {
      particle.updateConfig(config);
    }

    // アクティブパーティクルとして登録
    this._activeParticles.add(particle);
    this._arrayDirty = true;

    // 統計を更新
    this.particleStats.totalEmitted++;
    this.particleStats.peakActiveCount = Math.max(
      this.particleStats.peakActiveCount,
      this.activeCount
    );

    return particle;
  }

  /**
   * パーティクルをリセットしてプールに返却
   *
   * @param {Particle} particle - リセットするパーティクル
   */
  resetParticle(particle) {
    if (!particle) return;

    // アクティブパーティクルから削除
    this._activeParticles.delete(particle);
    this._arrayDirty = true;

    // ライフタイム統計を更新
    this._updateLifeTimeStats(particle);

    // ObjectPoolに返却
    this.release(particle);

    // 統計を更新
    this.particleStats.totalRecycled++;
  }

  /**
   * 指定された数のパーティクルを一括発射
   *
   * @param {number} count - 発射するパーティクル数
   * @param {Object} config - パーティクルの設定
   * @returns {Array} 発射されたパーティクルの配列
   */
  emitParticles(count, config = {}) {
    const particles = [];

    for (let i = 0; i < count; i++) {
      const particle = this.createParticle(config);
      particles.push(particle);
    }

    return particles;
  }

  /**
   * プールの詳細統計を取得
   *
   * @returns {Object} 統計情報
   */
  getPoolStats() {
    const baseStats = this.getStats();

    return {
      ...baseStats,
      particleStats: { ...this.particleStats },
      particleType: this.particleType,
      autoOptimize: this._autoOptimizeEnabled,
      optimizationThreshold: this.optimizationThreshold,
      lastCleanup: this._lastCleanup,
    };
  }

  /**
   * アクティブなパーティクルのリストを取得
   *
   * 効率的なSetベースの追跡システムを使用して高速にアクティブパーティクルを取得します。
   *
   * @returns {Array} アクティブなパーティクルの配列
   */
  getActiveParticles() {
    // 配列が古い場合は再構築
    if (this._arrayDirty) {
      this._activeParticleArray = Array.from(this._activeParticles);
      this._arrayDirty = false;
    }

    return this._activeParticleArray;
  }

  /**
   * プールの最適化を実行
   */
  optimizePool() {
    const stats = this.getStats();

    // 使用率が高い場合はプールサイズを拡張
    if (stats.utilization > this.optimizationThreshold) {
      const newSize = Math.min(this.maxSize, Math.ceil(this.maxSize * 1.5));
      this.resize(newSize);
    }

    // メモリ効率が低い場合はプールサイズを調整
    if (stats.memoryEfficiency < 0.1) {
      const newSize = Math.max(this.activeCount + 10, Math.ceil(this.maxSize * 0.7));
      this.resize(newSize);
    }

    // クリーンアップ時間を更新
    this._lastCleanup = Date.now();
  }

  /**
   * 自動最適化の実行
   */
  autoOptimize() {
    if (!this._autoOptimizeEnabled) return;

    const now = Date.now();
    if (now - this._lastCleanup > this.cleanupInterval) {
      this.optimizePool();
    }
  }

  /**
   * 死亡したパーティクルを自動クリーンアップ
   *
   * @returns {number} クリーンアップされたパーティクル数
   */
  cleanupDeadParticles() {
    const activeParticles = this.getActiveParticles();
    const deadParticles = [];

    // 死亡したパーティクルを特定
    activeParticles.forEach(particle => {
      if (particle.isDead && particle.isDead()) {
        deadParticles.push(particle);
      }
    });

    // 死亡したパーティクルをリセット
    deadParticles.forEach(particle => {
      this.resetParticle(particle);
    });

    return deadParticles.length;
  }

  /**
   * プールの状態を監視
   *
   * @returns {Object} 監視情報
   */
  monitor() {
    const baseMonitor = super.monitor();

    // パーティクル固有の警告
    const warnings = [...(baseMonitor.warnings || [])];

    if (this.particleStats.peakActiveCount > this.maxSize * 0.9) {
      warnings.push('ParticlePool: ピークアクティブ数が最大サイズの90%を超えています。');
    }

    if (this.particleStats.totalEmitted > 10000 && this.particleStats.totalRecycled < 5000) {
      warnings.push(
        'ParticlePool: パーティクルの再利用率が低いです。メモリ効率の改善を検討してください。'
      );
    }

    return {
      ...baseMonitor,
      warnings,
      particleWarnings: warnings.filter(w => w.startsWith('ParticlePool:')),
    };
  }

  /**
   * プールをクリア
   */
  clear() {
    super.clear();

    // アクティブパーティクル追跡をクリア
    this._activeParticles.clear();
    this._activeParticleArray = [];
    this._arrayDirty = false;

    // パーティクル固有の統計をリセット
    this.particleStats = {
      totalEmitted: 0,
      totalRecycled: 0,
      averageLifeTime: 0,
      peakActiveCount: 0,
    };

    this._lifeTimeSum = 0;
    this._lifeTimeCount = 0;
    this._lastCleanup = Date.now();
  }

  // =============================================================================
  // プライベートメソッド
  // =============================================================================

  /**
   * ライフタイム統計を更新
   *
   * @param {Particle} particle - 統計を更新するパーティクル
   * @private
   */
  _updateLifeTimeStats(particle) {
    if (particle._lastUpdateTime) {
      const lifeTime = Date.now() - particle._lastUpdateTime;
      this._lifeTimeSum += lifeTime;
      this._lifeTimeCount++;

      // 平均ライフタイムを更新
      this.particleStats.averageLifeTime = this._lifeTimeSum / this._lifeTimeCount;
    }
  }

  /**
   * パーティクルの設定を動的に変更
   *
   * @param {Object} config - 変更する設定
   */
  updateParticleConfig(config) {
    if (config) {
      this.particleConfig = { ...this.particleConfig, ...config };
    }
  }

  /**
   * 最適化設定を動的に変更
   *
   * @param {Object} config - 変更する設定
   */
  updateOptimizationConfig(config) {
    if (config.optimizationThreshold !== undefined) {
      this.optimizationThreshold = Math.max(0.1, Math.min(0.99, config.optimizationThreshold));
    }

    if (config.cleanupInterval !== undefined) {
      this.cleanupInterval = Math.max(1000, Math.min(60000, config.cleanupInterval));
    }

    if (config.autoOptimize !== undefined) {
      this._autoOptimizeEnabled = config.autoOptimize;
    }
  }
}
