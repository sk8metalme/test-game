import GameEffect from './GameEffect.js';
import ParticleEmitter from './ParticleEmitter.js';

/**
 * ライン削除エフェクト
 * テトリスでラインが削除された時の爆発効果を提供
 */
export default class LineClearEffect extends GameEffect {
  /**
   * LineClearEffectのコンストラクタ
   *
   * @param {Object} config - エフェクト設定
   * @param {number} config.lineHeight - ラインの高さ
   * @param {number} config.explosionRadius - 爆発半径
   * @param {number} config.smokeIntensity - 煙の強度
   * @param {number} config.lineCount - 削除されたライン数
   */
  constructor(config = {}) {
    const defaultConfig = {
      name: 'line-clear',
      duration: 1500,
      particleCount: 80,
      intensity: 1.0,
      scale: 1.0,
      colors: ['#ff6b35', '#f7931e', '#ffd23f', '#ffffff'],
      position: { x: 400, y: 300 },
      direction: { x: 0, y: -1 },
      speed: 150,
      gravity: 0.5,
      friction: 0.95,
      lineHeight: 20,
      explosionRadius: 100,
      smokeIntensity: 0.8,
      lineCount: 1,
      ...config,
    };

    super('line-clear', defaultConfig);

    this.type = 'LineClearEffect';
    this.lineHeight = defaultConfig.lineHeight;
    this.explosionRadius = defaultConfig.explosionRadius;
    this.smokeIntensity = defaultConfig.smokeIntensity;
    this.lineCount = defaultConfig.lineCount;
  }

  /**
   * エミッターを作成する
   */
  _createEmitters() {
    // 1. メイン爆発エフェクト
    this._createMainExplosionEmitter();

    // 2. 光の粒子エフェクト
    this._createLightParticlesEmitter();

    // 3. 煙のエフェクト
    this._createSmokeEmitter();

    // 4. ライン数に応じた追加エフェクト
    if (this.lineCount > 1) {
      this._createMultiLineEmitter();
    }
  }

  /**
   * メイン爆発エミッターを作成
   */
  _createMainExplosionEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-main-explosion`,
      position: this.position,
      emissionRate: 0, // バーストのみ
      burstCount: Math.floor(this.particleCount * 0.4),
      particleConfig: {
        size: 12 * this.scale,
        color: this.colors[0], // オレンジ
        life: this.duration,
        maxLife: this.duration,
        velocity: {
          x: 0,
          y: 0,
        },
        gravity: this.gravity,
        friction: this.friction,
        alpha: 1.0,
      },
    });

    // 爆発の方向を設定
    emitter.onBurst = particles => {
      particles.forEach(particle => {
        // ランダムな方向に爆発
        const angle = Math.random() * Math.PI * 2;
        const speed = this.speed * (0.5 + Math.random() * 0.5);

        particle.velocity.x = Math.cos(angle) * speed;
        particle.velocity.y = Math.sin(angle) * speed;

        // サイズのばらつき
        particle.size = (8 + Math.random() * 8) * this.scale;

        // 色のばらつき
        particle.color = this.colors[Math.floor(Math.random() * this.colors.length)];
      });
    };

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * 光の粒子エミッターを作成
   */
  _createLightParticlesEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-light-particles`,
      position: this.position,
      emissionRate: 0, // バーストのみ
      burstCount: Math.floor(this.particleCount * 0.3),
      particleConfig: {
        size: 6 * this.scale,
        color: '#ffffff',
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

    // 光の粒子の方向を設定
    emitter.onBurst = particles => {
      particles.forEach(particle => {
        // 上方向に光の粒子
        const angle = Math.PI / 2 + ((Math.random() - 0.5) * Math.PI) / 3;
        const speed = this.speed * 1.5 * (0.7 + Math.random() * 0.3);

        particle.velocity.x = Math.cos(angle) * speed;
        particle.velocity.y = Math.sin(angle) * speed;

        // 小さなサイズ
        particle.size = (4 + Math.random() * 4) * this.scale;

        // 白色または薄い黄色
        particle.color = Math.random() > 0.5 ? '#ffffff' : '#ffffcc';
      });
    };

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * 煙のエミッターを作成
   */
  _createSmokeEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-smoke`,
      position: this.position,
      emissionRate: 20, // 継続的な煙
      burstCount: Math.floor(this.particleCount * 0.2),
      particleConfig: {
        size: 15 * this.scale,
        color: '#666666',
        life: this.duration * 1.5,
        maxLife: this.duration * 1.5,
        velocity: {
          x: 0,
          y: -20,
        },
        gravity: -0.2, // 上昇
        friction: 0.99,
        alpha: 0.6,
      },
    });

    // 煙の動きを設定
    emitter.onBurst = particles => {
      particles.forEach(particle => {
        // ゆっくりと上昇
        particle.velocity.x = (Math.random() - 0.5) * 30;
        particle.velocity.y = -20 - Math.random() * 20;

        // 大きなサイズ
        particle.size = (10 + Math.random() * 10) * this.scale;

        // グレーの色合い
        const gray = 100 + Math.random() * 100;
        particle.color = `rgb(${gray}, ${gray}, ${gray})`;

        // 透明度
        particle.alpha = 0.3 + Math.random() * 0.4;
      });
    };

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * 複数ライン削除時の追加エミッターを作成
   */
  _createMultiLineEmitter() {
    const emitter = new ParticleEmitter({
      name: `${this.name}-multi-line`,
      position: this.position,
      emissionRate: 0, // バーストのみ
      burstCount: Math.floor(this.particleCount * 0.1 * this.lineCount),
      particleConfig: {
        size: 8 * this.scale,
        color: '#ff0000',
        life: this.duration * 0.6,
        maxLife: this.duration * 0.6,
        velocity: {
          x: 0,
          y: 0,
        },
        gravity: 0.3,
        friction: 0.92,
        alpha: 1.0,
      },
    });

    // 複数ライン削除の特別なエフェクト
    emitter.onBurst = particles => {
      particles.forEach(particle => {
        // より激しい爆発
        const angle = Math.random() * Math.PI * 2;
        const speed = this.speed * 1.5 * (0.8 + Math.random() * 0.4);

        particle.velocity.x = Math.cos(angle) * speed;
        particle.velocity.y = Math.sin(angle) * speed;

        // 赤い色
        particle.color = '#ff0000';
        particle.size = (6 + Math.random() * 6) * this.scale;
      });
    };

    // エミッターの位置を設定
    emitter.position = this.position;

    this.addEmitter(emitter);
    this.emitters.push(emitter);
  }

  /**
   * ライン数に応じてエフェクトを調整
   *
   * @param {number} lineCount - 削除されたライン数
   */
  setLineCount(lineCount) {
    this.lineCount = Math.max(1, lineCount);

    // ライン数に応じてパーティクル数を調整
    this.particleCount = 80 + (lineCount - 1) * 20;

    // 強度を調整
    this.intensity = Math.min(1.0, 0.7 + lineCount * 0.1);

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
      lineHeight: this.lineHeight,
      explosionRadius: this.explosionRadius,
      smokeIntensity: this.smokeIntensity,
      lineCount: this.lineCount,
    };
  }

  /**
   * エフェクトの文字列表現を取得
   *
   * @returns {string} 文字列表現
   */
  toString() {
    return `LineClearEffect[name=${this.name}, lineCount=${this.lineCount}, intensity=${this.intensity}, emitters=${this.emitters.length}]`;
  }
}
