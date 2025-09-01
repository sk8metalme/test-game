import ParticleEffect from './ParticleEffect.js';
import ParticleEmitter from './ParticleEmitter.js';

/**
 * ゲームエフェクトの基底クラス
 * テトリスゲームの各種イベントに対応するパーティクルエフェクトを提供
 */
export default class GameEffect extends ParticleEffect {
  /**
   * GameEffectのコンストラクタ
   *
   * @param {string} name - エフェクト名
   * @param {Object} config - エフェクト設定
   * @param {number} config.duration - 持続時間（ミリ秒）
   * @param {number} config.particleCount - パーティクル数
   * @param {number} config.intensity - 強度（0.0-1.0）
   * @param {number} config.scale - スケール倍率
   * @param {string[]} config.colors - 色の配列
   * @param {Object} config.position - 発生位置 {x, y}
   * @param {Object} config.direction - 方向ベクトル {x, y}
   * @param {number} config.speed - 速度
   * @param {number} config.gravity - 重力
   * @param {number} config.friction - 摩擦
   */
  constructor(name, config = {}) {
    // デフォルト設定
    const defaultConfig = {
      duration: 2000,
      particleCount: 50,
      intensity: 1.0,
      scale: 1.0,
      colors: ['#ffffff'],
      position: { x: 400, y: 300 },
      direction: { x: 0, y: -1 },
      speed: 100,
      gravity: 0,
      friction: 0.98,
      loop: false,
      ...config,
    };

    super(defaultConfig);

    this.name = name;
    this.type = 'GameEffect';
    this.config = defaultConfig;

    // エフェクト固有の設定
    this.particleCount = defaultConfig.particleCount;
    this.intensity = defaultConfig.intensity;
    this.scale = defaultConfig.scale;
    this.colors = defaultConfig.colors;
    this.position = defaultConfig.position;
    this.direction = defaultConfig.direction;
    this.speed = defaultConfig.speed;
    this.gravity = defaultConfig.gravity;
    this.friction = defaultConfig.friction;

    // エフェクトの状態
    this.isInitialized = false;
    this.emitters = [];
  }

  /**
   * エフェクトを初期化する
   */
  initialize() {
    if (this.isInitialized) return;

    // エミッターを作成
    this._createEmitters();

    this.isInitialized = true;
  }

  /**
   * エミッターを作成する（サブクラスで実装）
   */
  _createEmitters() {
    // 基底クラスでは基本的なエミッターを作成
    const emitter = new ParticleEmitter({
      name: `${this.name}-main`,
      emissionRate: this.particleCount / (this.duration / 1000),
      burstCount: Math.floor(this.particleCount * 0.3),
      particleConfig: {
        size: 10 * this.scale,
        color: this.colors[0],
        life: this.duration,
        maxLife: this.duration,
        velocity: {
          x: this.direction.x * this.speed,
          y: this.direction.y * this.speed,
        },
        gravity: this.gravity,
        friction: this.friction,
      },
    });

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * エフェクトを開始する
   */
  start() {
    if (!this.isInitialized) {
      this.initialize();
    }
    super.start();
  }

  /**
   * エフェクトの強度を設定する
   *
   * @param {number} intensity - 強度（0.0-1.0）
   */
  setIntensity(intensity) {
    this.intensity = Math.max(0, Math.min(1, intensity));

    // エミッターの設定を更新
    this.emitters.forEach(emitter => {
      if (emitter.particleConfig) {
        emitter.particleConfig.size *= this.intensity;
        emitter.emissionRate *= this.intensity;
        emitter.burstCount = Math.floor(emitter.burstCount * this.intensity);
      }
    });
  }

  /**
   * エフェクトのスケールを設定する
   *
   * @param {number} scale - スケール倍率
   */
  setScale(scale) {
    this.scale = Math.max(0.1, scale);

    // エミッターの設定を更新
    this.emitters.forEach(emitter => {
      if (emitter.particleConfig) {
        emitter.particleConfig.size = 10 * this.scale;
      }
    });
  }

  /**
   * エフェクトの位置を設定する
   *
   * @param {Object} position - 位置 {x, y}
   */
  setPosition(position) {
    this.position = { ...position };

    // エミッターの位置を更新
    this.emitters.forEach(emitter => {
      emitter.position = { ...this.position };
    });
  }

  /**
   * エフェクトの色を設定する
   *
   * @param {string[]} colors - 色の配列
   */
  setColors(colors) {
    this.colors = [...colors];

    // エミッターの色を更新
    this.emitters.forEach((emitter, index) => {
      if (emitter.particleConfig && this.colors[index]) {
        emitter.particleConfig.color = this.colors[index];
      }
    });
  }

  /**
   * エフェクトの設定を更新する
   *
   * @param {Object} newConfig - 新しい設定
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // 各プロパティを更新
    if (newConfig.intensity !== undefined) {
      this.setIntensity(newConfig.intensity);
    }
    if (newConfig.scale !== undefined) {
      this.setScale(newConfig.scale);
    }
    if (newConfig.position !== undefined) {
      this.setPosition(newConfig.position);
    }
    if (newConfig.colors !== undefined) {
      this.setColors(newConfig.colors);
    }
  }

  /**
   * エフェクトの統計情報を取得する
   *
   * @returns {Object} 統計情報
   */
  getEffectStats() {
    const baseStats = super.getStats();

    return {
      ...baseStats,
      type: this.type,
      intensity: this.intensity,
      scale: this.scale,
      colors: this.colors,
      position: this.position,
      emitterCount: this.emitters.length,
      isInitialized: this.isInitialized,
    };
  }

  /**
   * エフェクトをリセットする
   */
  reset() {
    super.reset();
    this.isInitialized = false;
    this.emitters = [];
  }

  /**
   * エフェクトの文字列表現を取得する
   *
   * @returns {string} 文字列表現
   */
  toString() {
    return `GameEffect[name=${this.name}, type=${this.type}, intensity=${this.intensity}, scale=${this.scale}, emitters=${this.emitters.length}]`;
  }
}
