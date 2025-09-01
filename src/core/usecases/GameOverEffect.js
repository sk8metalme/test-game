import GameEffect from './GameEffect.js';
import ParticleEmitter from './ParticleEmitter.js';

/**
 * ゲームオーバーエフェクト
 * テトリスでゲームオーバーが発生した時の悲しいエフェクト
 */
class GameOverEffect extends GameEffect {
  constructor(config = {}) {
    const defaultConfig = {
      name: 'GameOverEffect',
      duration: 4000, // 4秒間の悲しいエフェクト
      loop: false,
      particleCount: 100, // 中程度のパーティクル数
      intensity: 1.0,
      scale: 1.0,
      colors: ['#2c2c2c', '#1a1a1a', '#404040', '#666666', '#808080'], // 暗い色系
      position: { x: 0, y: 0 },
      direction: { x: 0, y: 1 },
      speed: 80,
      gravity: 0.3,
      friction: 0.95,
      ...config,
    };

    super('GameOverEffect', defaultConfig);

    this.name = 'GameOverEffect';
    this.type = 'GameOverEffect';
    this.config = defaultConfig;

    // ゲームオーバー固有の設定
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
   * エミッターを作成する
   */
  _createEmitters() {
    // 基底クラスのエミッターを作成
    super._createEmitters();

    // ゲームオーバー専用のエミッターを作成
    this._createFallingDarkParticlesEmitter();
    this._createFadingLightEmitter();
    this._createSadnessSmokeEmitter();
    this._createGameOverTextEmitter();
    this._createDarkCloudsEmitter();
  }

  /**
   * 下降する暗い粒子エフェクト（画面上部から下部へ）
   */
  _createFallingDarkParticlesEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-falling-dark-particles`,
      emissionRate: (this.particleCount / (this.duration / 1000)) * 0.4, // 40%の継続発射
      burstCount: 0,
      particleConfig: {
        size: 6 * this.scale,
        color: () => this.colors[Math.floor(Math.random() * 3)], // 暗い色（黒、濃いグレー、中グレー）
        life: this.duration * 0.9,
        maxLife: this.duration * 0.9,
        velocity: {
          x: () => (Math.random() - 0.5) * this.speed * 0.3,
          y: () => this.speed * (0.6 + Math.random() * 0.4),
        },
        gravity: this.gravity * 0.8,
        friction: this.friction,
        alpha: 0.8,
        rotation: () => Math.random() * Math.PI * 2,
        rotationSpeed: () => (Math.random() - 0.5) * 0.02,
      },
    });

    // エミッターの位置を設定（画面上部）
    emitter.position = { x: this.position.x, y: this.position.y - 100 };

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * 消えていく光エフェクト（薄い色の粒子）
   */
  _createFadingLightEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-fading-light`,
      emissionRate: 0, // バーストのみ
      burstCount: Math.floor(this.particleCount * 0.25), // 25%のパーティクル
      particleConfig: {
        size: 10 * this.scale,
        color: this.colors[this.colors.length - 1], // 最後の色（薄いグレー）
        life: this.duration * 0.7,
        maxLife: this.duration * 0.7,
        velocity: {
          x: () => (Math.random() - 0.5) * this.speed * 0.5,
          y: () => (Math.random() - 0.5) * this.speed * 0.3,
        },
        gravity: 0,
        friction: this.friction * 0.9,
        alpha: 0.6,
        rotation: () => Math.random() * Math.PI * 2,
        rotationSpeed: () => (Math.random() - 0.5) * 0.01,
      },
    });

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * 悲しみの煙エフェクト（ゆっくり上昇する暗い煙）
   */
  _createSadnessSmokeEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-sadness-smoke`,
      emissionRate: (this.particleCount / (this.duration / 1000)) * 0.2, // 20%の継続発射
      burstCount: 0,
      particleConfig: {
        size: 12 * this.scale,
        color: () => this.colors[Math.floor(Math.random() * 2) + 1], // 暗いグレー系
        life: this.duration * 0.8,
        maxLife: this.duration * 0.8,
        velocity: {
          x: () => (Math.random() - 0.5) * this.speed * 0.2,
          y: () => -this.speed * (0.2 + Math.random() * 0.3),
        },
        gravity: this.gravity * 0.1,
        friction: this.friction,
        alpha: 0.5,
        rotation: () => Math.random() * Math.PI * 2,
        rotationSpeed: () => (Math.random() - 0.5) * 0.005,
      },
    });

    // エミッターの位置を設定（画面下部）
    emitter.position = { x: this.position.x, y: this.position.y + 80 };

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * ゲームオーバーテキストエフェクト（文字を形成するパーティクル）
   */
  _createGameOverTextEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-game-over-text`,
      emissionRate: 0, // バーストのみ
      burstCount: Math.floor(this.particleCount * 0.1), // 10%のパーティクル
      particleConfig: {
        size: 8 * this.scale,
        color: this.colors[Math.min(3, this.colors.length - 1)], // 中間グレーまたは利用可能な最後の色
        life: this.duration * 0.6,
        maxLife: this.duration * 0.6,
        velocity: {
          x: () => (Math.random() - 0.5) * this.speed * 0.1,
          y: () => this.speed * 0.1,
        },
        gravity: this.gravity * 0.05,
        friction: this.friction,
        alpha: 0.7,
        rotation: () => Math.random() * Math.PI * 2,
        rotationSpeed: () => (Math.random() - 0.5) * 0.01,
      },
    });

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * 暗い雲エフェクト（重い雰囲気を演出）
   */
  _createDarkCloudsEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-dark-clouds`,
      emissionRate: (this.particleCount / (this.duration / 1000)) * 0.15, // 15%の継続発射
      burstCount: 0,
      particleConfig: {
        size: 16 * this.scale,
        color: () => this.colors[Math.floor(Math.random() * 2)], // 最も暗い色
        life: this.duration * 1.0,
        maxLife: this.duration * 1.0,
        velocity: {
          x: () => (Math.random() - 0.5) * this.speed * 0.4,
          y: () => (Math.random() - 0.5) * this.speed * 0.2,
        },
        gravity: this.gravity * 0.2,
        friction: this.friction * 0.98,
        alpha: 0.4,
        rotation: () => Math.random() * Math.PI * 2,
        rotationSpeed: () => (Math.random() - 0.5) * 0.003,
      },
    });

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * エフェクトの更新処理
   * @param {number} deltaTime - 経過時間
   */
  update(deltaTime) {
    super.update(deltaTime);

    // ゲームオーバー固有の更新処理
    if (this.isActive()) {
      // 時間経過に応じてエフェクトの強度を調整
      const progress = this.elapsedTime / this.duration;

      // 悲しみのエフェクトは徐々に弱くなる（希望の光が消えていく）
      const baseIntensity = this.config.intensity || 1.0;
      this.intensity = baseIntensity * (1.0 - progress * 0.4);
    }
  }

  /**
   * エフェクトの開始処理
   */
  start() {
    if (!this.isInitialized) {
      this._createEmitters();
      this.isInitialized = true;
    }
    super.start();
  }

  /**
   * エフェクトの停止処理
   */
  stop() {
    super.stop();
  }

  /**
   * エフェクトのリセット処理
   */
  reset() {
    super.reset();
    this.isInitialized = false;
    this.emitters = [];
  }
}

export default GameOverEffect;
