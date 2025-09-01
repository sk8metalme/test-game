import GameEffect from './GameEffect.js';
import ParticleEmitter from './ParticleEmitter.js';

/**
 * Perfect Clearエフェクト
 * テトリスでPerfect Clear（全ブロック削除）が発生した時の壮大なエフェクト
 */
class PerfectClearEffect extends GameEffect {
  constructor(config = {}) {
    const defaultConfig = {
      name: 'PerfectClearEffect',
      duration: 5000, // 5秒間の壮大なエフェクト
      loop: false,
      particleCount: 200, // 大量のパーティクル
      intensity: 1.0,
      scale: 1.0,
      colors: ['#ffffff', '#ffff00', '#ffd700', '#ff69b4', '#00ffff'], // 虹色のパーティクル
      position: { x: 0, y: 0 },
      direction: { x: 0, y: -1 },
      speed: 150,
      gravity: 0.3,
      friction: 0.98,
      ...config,
    };

    super('PerfectClearEffect', defaultConfig);

    this.name = 'PerfectClearEffect';
    this.type = 'PerfectClearEffect';
    this.config = defaultConfig;

    // Perfect Clear固有の設定
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

    // Perfect Clear専用のエミッターを作成
    this._createMainExplosionEmitter();
    this._createRainbowParticlesEmitter();
    this._createGoldenShowerEmitter();
    this._createCelebrationRingsEmitter();
    this._createSparkleBurstEmitter();
    this._createPerfectClearTextEmitter();
  }

  /**
   * メイン爆発エフェクト（中央からの大爆発）
   */
  _createMainExplosionEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-main-explosion`,
      emissionRate: 0, // バーストのみ
      burstCount: Math.floor(this.particleCount * 0.4), // 40%のパーティクル
      particleConfig: {
        size: 15 * this.scale,
        color: this.colors[0], // 白色
        life: this.duration * 0.8,
        maxLife: this.duration * 0.8,
        velocity: {
          x: () => (Math.random() - 0.5) * this.speed * 2,
          y: () => (Math.random() - 0.5) * this.speed * 2,
        },
        gravity: this.gravity * 0.5,
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
   * 虹色のパーティクルエフェクト（上昇する美しい光）
   */
  _createRainbowParticlesEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-rainbow-particles`,
      emissionRate: (this.particleCount / (this.duration / 1000)) * 0.3, // 30%の継続発射
      burstCount: 0,
      particleConfig: {
        size: 8 * this.scale,
        color: () => this.colors[Math.floor(Math.random() * this.colors.length)],
        life: this.duration * 0.6,
        maxLife: this.duration * 0.6,
        velocity: {
          x: () => (Math.random() - 0.5) * this.speed * 0.5,
          y: () => -this.speed * (0.8 + Math.random() * 0.4),
        },
        gravity: this.gravity * 0.3,
        friction: this.friction,
        alpha: 0.8,
        rotation: () => Math.random() * Math.PI * 2,
        rotationSpeed: () => (Math.random() - 0.5) * 0.05,
      },
    });

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * 金色のシャワーエフェクト（祝福の光）
   */
  _createGoldenShowerEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-golden-shower`,
      emissionRate: (this.particleCount / (this.duration / 1000)) * 0.2, // 20%の継続発射
      burstCount: 0,
      particleConfig: {
        size: 12 * this.scale,
        color: this.colors[2], // 金色
        life: this.duration * 0.7,
        maxLife: this.duration * 0.7,
        velocity: {
          x: () => (Math.random() - 0.5) * this.speed * 0.3,
          y: () => -this.speed * (0.5 + Math.random() * 0.3),
        },
        gravity: this.gravity * 0.2,
        friction: this.friction,
        alpha: 0.9,
        rotation: () => Math.random() * Math.PI * 2,
        rotationSpeed: () => (Math.random() - 0.5) * 0.08,
      },
    });

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * 祝賀の輪エフェクト（同心円状の光の輪）
   */
  _createCelebrationRingsEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-celebration-rings`,
      emissionRate: 0, // バーストのみ
      burstCount: Math.floor(this.particleCount * 0.15), // 15%のパーティクル
      particleConfig: {
        size: 6 * this.scale,
        color: this.colors[1], // 黄色
        life: this.duration * 0.9,
        maxLife: this.duration * 0.9,
        velocity: {
          x: () => {
            const angle = Math.random() * Math.PI * 2;
            return Math.cos(angle) * this.speed * 0.8;
          },
          y: () => {
            const angle = Math.random() * Math.PI * 2;
            return Math.sin(angle) * this.speed * 0.8;
          },
        },
        gravity: 0,
        friction: this.friction * 0.95,
        alpha: 0.7,
        rotation: () => Math.random() * Math.PI * 2,
        rotationSpeed: () => (Math.random() - 0.5) * 0.03,
      },
    });

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * スパークル爆発エフェクト（キラキラ光る粒子）
   */
  _createSparkleBurstEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-sparkle-burst`,
      emissionRate: 0, // バーストのみ
      burstCount: Math.floor(this.particleCount * 0.1), // 10%のパーティクル
      particleConfig: {
        size: 4 * this.scale,
        color: () => this.colors[Math.floor(Math.random() * this.colors.length)],
        life: this.duration * 0.5,
        maxLife: this.duration * 0.5,
        velocity: {
          x: () => (Math.random() - 0.5) * this.speed * 1.5,
          y: () => (Math.random() - 0.5) * this.speed * 1.5,
        },
        gravity: this.gravity * 0.8,
        friction: this.friction,
        alpha: 1.0,
        rotation: () => Math.random() * Math.PI * 2,
        rotationSpeed: () => (Math.random() - 0.5) * 0.2,
      },
    });

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * Perfect Clearテキストエフェクト（文字を形成するパーティクル）
   */
  _createPerfectClearTextEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-perfect-clear-text`,
      emissionRate: 0, // バーストのみ
      burstCount: Math.floor(this.particleCount * 0.05), // 5%のパーティクル
      particleConfig: {
        size: 10 * this.scale,
        color: this.colors[0], // 白色
        life: this.duration * 0.6,
        maxLife: this.duration * 0.6,
        velocity: {
          x: () => (Math.random() - 0.5) * this.speed * 0.2,
          y: () => -this.speed * 0.3,
        },
        gravity: this.gravity * 0.1,
        friction: this.friction,
        alpha: 0.8,
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
   * エフェクトの更新処理
   * @param {number} deltaTime - 経過時間
   */
  update(deltaTime) {
    super.update(deltaTime);

    // Perfect Clear固有の更新処理
    if (this.isActive()) {
      // 時間経過に応じてエフェクトの強度を調整
      const progress = this.elapsedTime / this.duration;

      // 後半でより激しいエフェクト
      if (progress > 0.5) {
        const baseIntensity = this.config.intensity || 1.0;
        this.intensity = baseIntensity + (progress - 0.5) * 0.5;
      }
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

export default PerfectClearEffect;
