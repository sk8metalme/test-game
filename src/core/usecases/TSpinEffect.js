import GameEffect from './GameEffect.js';
import ParticleEmitter from './ParticleEmitter.js';

/**
 * T-Spinエフェクト
 * テトリスでT-Spin成功時の特殊な光の効果を提供
 */
export default class TSpinEffect extends GameEffect {
  /**
   * TSpinEffectのコンストラクタ
   *
   * @param {Object} config - エフェクト設定
   * @param {number} config.rotationSpeed - 回転速度
   * @param {number} config.spiralRadius - 螺旋半径
   * @param {number} config.starCount - 星の数
   * @param {string} config.spinType - T-Spinの種類 ('single', 'double', 'triple')
   */
  constructor(config = {}) {
    const defaultConfig = {
      name: 't-spin',
      duration: 2500,
      particleCount: 60,
      intensity: 1.0,
      scale: 1.0,
      colors: ['#4a90e2', '#7b68ee', '#ffffff', '#e6e6fa'],
      position: { x: 400, y: 300 },
      direction: { x: 0, y: -1 },
      speed: 120,
      gravity: 0,
      friction: 0.99,
      rotationSpeed: 0.1,
      spiralRadius: 80,
      starCount: 8,
      spinType: 'single',
      ...config,
    };

    super('t-spin', defaultConfig);

    this.type = 'TSpinEffect';
    this.rotationSpeed = defaultConfig.rotationSpeed;
    this.spiralRadius = defaultConfig.spiralRadius;
    this.starCount = defaultConfig.starCount;
    this.spinType = defaultConfig.spinType;
    this.rotationAngle = 0;
  }

  /**
   * エミッターを作成する
   */
  _createEmitters() {
    // 1. 螺旋状の光の粒子
    this._createSpiralEmitter();

    // 2. 回転する光の輪
    this._createRotatingRingEmitter();

    // 3. 星型の爆発
    this._createStarBurstEmitter();

    // 4. T-Spinタイプに応じた追加エフェクト
    this._createTypeSpecificEmitter();
  }

  /**
   * 螺旋状の光の粒子エミッターを作成
   */
  _createSpiralEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-spiral`,
      position: this.position,
      emissionRate: 30, // 継続的な螺旋
      burstCount: Math.floor(this.particleCount * 0.4),
      particleConfig: {
        size: 8 * this.scale,
        color: this.colors[0], // 青
        life: this.duration * 0.8,
        maxLife: this.duration * 0.8,
        velocity: {
          x: 0,
          y: 0,
        },
        gravity: 0,
        friction: 0.98,
        alpha: 1.0,
      },
    });

    // 螺旋状の動きを設定
    emitter.onBurst = particles => {
      particles.forEach((particle, index) => {
        // 螺旋の角度
        const spiralAngle = (index / particles.length) * Math.PI * 4;
        const radius = this.spiralRadius * (0.5 + Math.random() * 0.5);

        // 螺旋の位置
        const x = Math.cos(spiralAngle) * radius;
        const y = Math.sin(spiralAngle) * radius;

        particle.velocity.x = x * 0.1;
        particle.velocity.y = y * 0.1;

        // サイズと色
        particle.size = (6 + Math.random() * 4) * this.scale;
        particle.color = this.colors[Math.floor(Math.random() * this.colors.length)];

        // 透明度
        particle.alpha = 0.8 + Math.random() * 0.2;
      });
    };

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * 回転する光の輪エミッターを作成
   */
  _createRotatingRingEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-rotating-ring`,
      position: this.position,
      emissionRate: 0, // バーストのみ
      burstCount: this.starCount,
      particleConfig: {
        size: 10 * this.scale,
        color: this.colors[1], // 紫
        life: this.duration,
        maxLife: this.duration,
        velocity: {
          x: 0,
          y: 0,
        },
        gravity: 0,
        friction: 0.99,
        alpha: 1.0,
      },
    });

    // 回転する光の輪を設定
    emitter.onBurst = particles => {
      particles.forEach((particle, index) => {
        // 円周上の位置
        const angle = (index / particles.length) * Math.PI * 2;
        const radius = this.spiralRadius;

        // 初期位置
        particle.position.x = this.position.x + Math.cos(angle) * radius;
        particle.position.y = this.position.y + Math.sin(angle) * radius;

        // 回転速度
        particle.velocity.x = -Math.sin(angle) * this.rotationSpeed * 100;
        particle.velocity.y = Math.cos(angle) * this.rotationSpeed * 100;

        // サイズと色
        particle.size = (8 + Math.random() * 4) * this.scale;
        particle.color = this.colors[1]; // 紫

        // 透明度
        particle.alpha = 0.9;
      });
    };

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * 星型の爆発エミッターを作成
   */
  _createStarBurstEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-star-burst`,
      position: this.position,
      emissionRate: 0, // バーストのみ
      burstCount: Math.floor(this.particleCount * 0.3),
      particleConfig: {
        size: 6 * this.scale,
        color: this.colors[2], // 白
        life: this.duration * 0.6,
        maxLife: this.duration * 0.6,
        velocity: {
          x: 0,
          y: 0,
        },
        gravity: 0,
        friction: 0.97,
        alpha: 1.0,
      },
    });

    // 星型の爆発を設定
    emitter.onBurst = particles => {
      particles.forEach(particle => {
        // 星の方向（5方向）
        const starAngle = Math.floor(Math.random() * 5) * ((Math.PI * 2) / 5);
        const speed = this.speed * (0.8 + Math.random() * 0.4);

        particle.velocity.x = Math.cos(starAngle) * speed;
        particle.velocity.y = Math.sin(starAngle) * speed;

        // サイズと色
        particle.size = (4 + Math.random() * 4) * this.scale;
        particle.color = this.colors[2]; // 白

        // 透明度
        particle.alpha = 0.9;
      });
    };

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * T-Spinタイプに応じた追加エミッターを作成
   */
  _createTypeSpecificEmitter() {
    let burstCount = 0;
    let colors = [];

    switch (this.spinType) {
      case 'single':
        burstCount = 10;
        colors = ['#4a90e2'];
        break;
      case 'double':
        burstCount = 20;
        colors = ['#4a90e2', '#7b68ee'];
        break;
      case 'triple':
        burstCount = 30;
        colors = ['#4a90e2', '#7b68ee', '#ffffff'];
        break;
      default:
        burstCount = 10;
        colors = ['#4a90e2'];
    }

    const emitter = new ParticleEmitter({
      name: `${this.name}-type-specific`,
      position: this.position,
      emissionRate: 0, // バーストのみ
      burstCount: burstCount,
      particleConfig: {
        size: 12 * this.scale,
        color: colors[0],
        life: this.duration * 0.7,
        maxLife: this.duration * 0.7,
        velocity: {
          x: 0,
          y: 0,
        },
        gravity: 0,
        friction: 0.96,
        alpha: 1.0,
      },
    });

    // タイプ固有のエフェクト
    emitter.onBurst = particles => {
      particles.forEach(particle => {
        // ランダムな方向
        const angle = Math.random() * Math.PI * 2;
        const speed = this.speed * 1.2 * (0.7 + Math.random() * 0.6);

        particle.velocity.x = Math.cos(angle) * speed;
        particle.velocity.y = Math.sin(angle) * speed;

        // サイズと色
        particle.size = (8 + Math.random() * 8) * this.scale;
        particle.color = colors[Math.floor(Math.random() * colors.length)];

        // 透明度
        particle.alpha = 0.8;
      });
    };

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * 回転角度を更新する
   *
   * @param {number} deltaTime - 経過時間
   */
  update(deltaTime) {
    super.update(deltaTime);

    // 回転角度を更新
    this.rotationAngle += this.rotationSpeed * deltaTime;

    // 回転する光の輪の位置を更新
    this.emitters.forEach((emitter, index) => {
      if (index === 1 && emitter.particles) {
        // 回転する光の輪
        emitter.particles.forEach((particle, particleIndex) => {
          if (particle && particle.isActive) {
            const angle =
              (particleIndex / emitter.particles.length) * Math.PI * 2 + this.rotationAngle;
            const radius = this.spiralRadius;

            particle.position.x = this.position.x + Math.cos(angle) * radius;
            particle.position.y = this.position.y + Math.sin(angle) * radius;
          }
        });
      }
    });
  }

  /**
   * T-Spinタイプを設定する
   *
   * @param {string} spinType - T-Spinの種類
   */
  setSpinType(spinType) {
    this.spinType = spinType;

    // タイプに応じてパーティクル数を調整
    switch (spinType) {
      case 'single':
        this.particleCount = 60;
        this.intensity = 1.0;
        break;
      case 'double':
        this.particleCount = 80;
        this.intensity = 1.2;
        break;
      case 'triple':
        this.particleCount = 100;
        this.intensity = 1.5;
        break;
    }

    // エミッターの設定を更新
    this.emitters.forEach(emitter => {
      if (emitter.particleConfig) {
        emitter.particleConfig.size *= this.intensity;
        emitter.burstCount = Math.floor(emitter.burstCount * this.intensity);
      }
    });
  }

  /**
   * エフェクトの統計情報を取得
   *
   * @returns {Object} 統計情報
   */
  getEffectStats() {
    const baseStats = super.getEffectStats();

    return {
      ...baseStats,
      rotationSpeed: this.rotationSpeed,
      spiralRadius: this.spiralRadius,
      starCount: this.starCount,
      spinType: this.spinType,
      rotationAngle: this.rotationAngle,
    };
  }

  /**
   * エフェクトの文字列表現を取得
   *
   * @returns {string} 文字列表現
   */
  toString() {
    return `TSpinEffect[name=${this.name}, spinType=${this.spinType}, intensity=${this.intensity}, rotationAngle=${this.rotationAngle.toFixed(2)}]`;
  }
}
