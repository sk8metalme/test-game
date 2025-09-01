import GameEffect from './GameEffect.js';
import ParticleEmitter from './ParticleEmitter.js';

/**
 * レベルアップエフェクト
 * テトリスでレベルアップが発生した時の祝福のエフェクト
 */
class LevelUpEffect extends GameEffect {
  constructor(config = {}) {
    const defaultConfig = {
      name: 'LevelUpEffect',
      duration: 3000, // 3秒間の祝福エフェクト
      loop: false,
      particleCount: 80, // 適度なパーティクル数
      intensity: 1.0,
      scale: 1.0,
      colors: ['#ffd700', '#ffffff', '#ffff00', '#ffa500', '#ffeb3b'], // 金色系の祝福色
      position: { x: 0, y: 0 },
      direction: { x: 0, y: -1 },
      speed: 120,
      gravity: 0.2,
      friction: 0.99,
      ...config,
    };

    super('LevelUpEffect', defaultConfig);

    this.name = 'LevelUpEffect';
    this.type = 'LevelUpEffect';
    this.config = defaultConfig;

    // レベルアップ固有の設定
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

    // レベルアップ専用のエミッターを作成
    this._createRisingLightEmitter();
    this._createBlessingStarsEmitter();
    this._createLightRainEmitter();
    this._createLevelUpTextEmitter();
    this._createGoldenSparklesEmitter();
  }

  /**
   * 上昇する光の粒子エフェクト（画面下部から上部へ）
   */
  _createRisingLightEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-rising-light`,
      emissionRate: (this.particleCount / (this.duration / 1000)) * 0.4, // 40%の継続発射
      burstCount: 0,
      particleConfig: {
        size: 8 * this.scale,
        color: () => this.colors[Math.floor(Math.random() * 3)], // 金色、白、黄色
        life: this.duration * 0.8,
        maxLife: this.duration * 0.8,
        velocity: {
          x: () => (Math.random() - 0.5) * this.speed * 0.3,
          y: () => -this.speed * (0.7 + Math.random() * 0.6),
        },
        gravity: this.gravity * 0.1,
        friction: this.friction,
        alpha: 0.9,
        rotation: () => Math.random() * Math.PI * 2,
        rotationSpeed: () => (Math.random() - 0.5) * 0.04,
      },
    });

    // エミッターの位置を設定（画面下部）
    emitter.position = { x: this.position.x, y: this.position.y + 100 };

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * 祝福の星エフェクト（金色の星型パーティクル）
   */
  _createBlessingStarsEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-blessing-stars`,
      emissionRate: 0, // バーストのみ
      burstCount: Math.floor(this.particleCount * 0.25), // 25%のパーティクル
      particleConfig: {
        size: 12 * this.scale,
        color: this.colors[0], // 金色
        life: this.duration * 0.9,
        maxLife: this.duration * 0.9,
        velocity: {
          x: () => (Math.random() - 0.5) * this.speed * 0.8,
          y: () => -this.speed * (0.5 + Math.random() * 0.5),
        },
        gravity: this.gravity * 0.2,
        friction: this.friction,
        alpha: 1.0,
        rotation: () => Math.random() * Math.PI * 2,
        rotationSpeed: () => (Math.random() - 0.5) * 0.1,
      },
    });

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * 光の雨エフェクト（上から降り注ぐ祝福の光）
   */
  _createLightRainEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-light-rain`,
      emissionRate: (this.particleCount / (this.duration / 1000)) * 0.2, // 20%の継続発射
      burstCount: 0,
      particleConfig: {
        size: 6 * this.scale,
        color: () => this.colors[Math.floor(Math.random() * 2) + 1], // 白、黄色
        life: this.duration * 0.6,
        maxLife: this.duration * 0.6,
        velocity: {
          x: () => (Math.random() - 0.5) * this.speed * 0.2,
          y: () => this.speed * (0.3 + Math.random() * 0.4),
        },
        gravity: this.gravity * 0.5,
        friction: this.friction,
        alpha: 0.8,
        rotation: () => Math.random() * Math.PI * 2,
        rotationSpeed: () => (Math.random() - 0.5) * 0.03,
      },
    });

    // エミッターの位置を設定（画面上部）
    emitter.position = { x: this.position.x, y: this.position.y - 100 };

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * レベルアップテキストエフェクト（文字を形成するパーティクル）
   */
  _createLevelUpTextEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-level-up-text`,
      emissionRate: 0, // バーストのみ
      burstCount: Math.floor(this.particleCount * 0.1), // 10%のパーティクル
      particleConfig: {
        size: 10 * this.scale,
        color: this.colors[0], // 金色
        life: this.duration * 0.7,
        maxLife: this.duration * 0.7,
        velocity: {
          x: () => (Math.random() - 0.5) * this.speed * 0.1,
          y: () => -this.speed * 0.2,
        },
        gravity: this.gravity * 0.05,
        friction: this.friction,
        alpha: 0.9,
        rotation: () => Math.random() * Math.PI * 2,
        rotationSpeed: () => (Math.random() - 0.5) * 0.02,
      },
    });

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * 金色のスパークルエフェクト（キラキラ光る祝福の粒子）
   */
  _createGoldenSparklesEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-golden-sparkles`,
      emissionRate: (this.particleCount / (this.duration / 1000)) * 0.15, // 15%の継続発射
      burstCount: 0,
      particleConfig: {
        size: 4 * this.scale,
        color: () => this.colors[Math.floor(Math.random() * this.colors.length)],
        life: this.duration * 0.5,
        maxLife: this.duration * 0.5,
        velocity: {
          x: () => (Math.random() - 0.5) * this.speed * 0.6,
          y: () => (Math.random() - 0.5) * this.speed * 0.6,
        },
        gravity: this.gravity * 0.3,
        friction: this.friction,
        alpha: 1.0,
        rotation: () => Math.random() * Math.PI * 2,
        rotationSpeed: () => (Math.random() - 0.5) * 0.15,
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

    // レベルアップ固有の更新処理
    if (this.isActive()) {
      // 時間経過に応じてエフェクトの強度を調整
      const progress = this.elapsedTime / this.duration;

      // 祝福のエフェクトは徐々に強くなる
      const baseIntensity = this.config.intensity || 1.0;
      this.intensity = baseIntensity + progress * 0.3;
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

export default LevelUpEffect;
