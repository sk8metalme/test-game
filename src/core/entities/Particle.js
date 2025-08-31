/**
 * パーティクルエンティティ
 * ゲーム内の視覚効果を表現する個別のパーティクル
 */
export class Particle {
  /**
   * パーティクルのコンストラクタ
   * @param {Object} config - パーティクルの設定
   * @param {Object} config.position - 初期位置 {x, y}
   * @param {Object} config.velocity - 初期速度 {x, y}
   * @param {Object} config.acceleration - 初期加速度 {x, y}
   * @param {number} config.life - 初期ライフ (0.0 - 1.0)
   * @param {number} config.maxLife - 最大ライフ時間（ミリ秒）
   * @param {number} config.size - パーティクルのサイズ
   * @param {string} config.color - パーティクルの色
   * @param {number} config.alpha - 透明度 (0.0 - 1.0)
   * @param {number} config.rotation - 初期回転角度
   * @param {number} config.rotationSpeed - 回転速度
   * @param {number} config.gravity - 重力の強さ
   * @param {number} config.friction - 摩擦係数
   */
  constructor(config = {}) {
    // 基本プロパティ
    this.id = this._generateUniqueId();

    // 位置・速度・加速度
    this.position = {
      x: this._validateNumber(config.position?.x, 0),
      y: this._validateNumber(config.position?.y, 0),
    };
    this.velocity = {
      x: this._validateNumber(config.velocity?.x, 0),
      y: this._validateNumber(config.velocity?.y, 0),
    };
    this.acceleration = {
      x: this._validateNumber(config.acceleration?.x, 0),
      y: this._validateNumber(config.acceleration?.y, 0),
    };

    // ライフサイクル
    this.life = this._validateNumber(config.life, 1.0, 0.0, 1.0);
    this.maxLife = this._validateNumber(config.maxLife, 1000, 1, 100000);
    this._lifeDecreaseRate = 1.0 / this.maxLife;

    // 視覚的プロパティ
    this._size = this._validateNumber(config.size, 2, 0.1, 1000);
    this.color = this._validateColor(config.color, '#ffffff');
    this._alpha = this._validateNumber(config.alpha, 1.0, 0.0, 1.0);

    // 回転
    this.rotation = this._validateNumber(config.rotation, 0, -Math.PI * 2, Math.PI * 2);
    this.rotationSpeed = this._validateNumber(config.rotationSpeed, 0, -10, 10);

    // 物理プロパティ
    this.gravity = this._validateNumber(config.gravity, 0.1, -10, 10);
    this.friction = this._validateNumber(config.friction, 0.98, 0.0, 1.0);

    // 内部状態
    this._isActive = true;
    this._lastUpdateTime = 0;
  }

  /**
   * パーティクルの状態を更新
   * @param {number} deltaTime - 前フレームからの経過時間（ミリ秒）
   */
  update(deltaTime) {
    if (!this._isActive || this.isDead()) {
      return;
    }

    const dt = deltaTime / 1000; // 秒単位に変換

    // 加速度を速度に適用
    this.velocity.x += this.acceleration.x * dt;
    this.velocity.y += this.acceleration.y * dt;

    // 重力を適用
    this.velocity.y += this.gravity * dt;

    // 摩擦を適用
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;

    // 位置を更新
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    // 回転を更新
    this.rotation += this.rotationSpeed * dt;

    // ライフを減少
    this.life -= this._lifeDecreaseRate * deltaTime;

    // ライフが0以下になったら非アクティブにする
    if (this.life <= 0) {
      this.life = 0;
      this._isActive = false;
    }

    // アルファ値をライフに連動させる（オプション）
    if (this.life < 0.3) {
      this.alpha = this.life / 0.3;
    }

    this._lastUpdateTime = Date.now();
  }

  /**
   * パーティクルが死亡しているかチェック
   * @returns {boolean} 死亡している場合true
   */
  isDead() {
    return this.life <= 0 || !this._isActive;
  }

  /**
   * パーティクルをリセット
   * @param {Object} config - 新しい設定（オプション）
   */
  reset(config = {}) {
    // 基本プロパティをリセット
    this.position = {
      x: this._validateNumber(config.position?.x, 0),
      y: this._validateNumber(config.position?.y, 0),
    };
    this.velocity = {
      x: this._validateNumber(config.velocity?.x, 0),
      y: this._validateNumber(config.velocity?.y, 0),
    };
    this.acceleration = {
      x: this._validateNumber(config.acceleration?.x, 0),
      y: this._validateNumber(config.acceleration?.y, 0),
    };

    // ライフサイクルをリセット
    this.life = this._validateNumber(config.life, 1.0, 0.0, 1.0);

    // 視覚的プロパティをリセット
    this._size = this._validateNumber(config.size, 2, 0.1, 1000);
    this.color = this._validateColor(config.color, '#ffffff');
    this._alpha = this._validateNumber(config.alpha, 1.0, 0.0, 1.0);

    // 回転をリセット
    this.rotation = this._validateNumber(config.rotation, 0, -Math.PI * 2, Math.PI * 2);
    this.rotationSpeed = this._validateNumber(config.rotationSpeed, 0, -10, 10);

    // 物理プロパティをリセット
    this.gravity = this._validateNumber(config.gravity, 0.1, -10, 10);
    this.friction = this._validateNumber(config.friction, 0.98, 0.0, 1.0);

    // 内部状態をリセット
    this._isActive = true;
    this._lastUpdateTime = 0;
  }

  /**
   * パーティクルをアクティブにする
   */
  activate() {
    this._isActive = true;
  }

  /**
   * パーティクルを非アクティブにする
   */
  deactivate() {
    this._isActive = false;
  }

  /**
   * パーティクルがアクティブかチェック
   * @returns {boolean} アクティブな場合true
   */
  isActive() {
    return this._isActive;
  }

  /**
   * パーティクルの設定を動的に変更
   * @param {Object} config - 変更する設定
   */
  updateConfig(config) {
    if (config.position) {
      this.position = { ...this.position, ...config.position };
    }
    if (config.velocity) {
      this.velocity = { ...this.velocity, ...config.velocity };
    }
    if (config.acceleration) {
      this.acceleration = { ...this.acceleration, ...config.acceleration };
    }
    if (config.size !== undefined) {
      this._size = this._validateNumber(config.size, this._size, 0.1, 1000);
    }
    if (config.color) {
      this.color = this._validateColor(config.color, this.color);
    }
    if (config.alpha !== undefined) {
      this._alpha = this._validateNumber(config.alpha, this._alpha, 0.0, 1.0);
    }
    if (config.gravity !== undefined) {
      this.gravity = this._validateNumber(config.gravity, this.gravity, -10, 10);
    }
    if (config.friction !== undefined) {
      this.friction = this._validateNumber(config.friction, this.friction, 0.0, 1.0);
    }
  }

  // =============================================================================
  // プロパティセッター（バリデーション付き）
  // =============================================================================

  /**
   * サイズを設定（バリデーション付き）
   * @param {number} value - 新しいサイズ
   */
  set size(value) {
    this._size = this._validateNumber(value, this._size || 2, 0.1, 1000);
  }

  /**
   * サイズを取得
   * @returns {number} 現在のサイズ
   */
  get size() {
    return this._size || 2;
  }

  /**
   * アルファ値を設定（バリデーション付き）
   * @param {number} value - 新しいアルファ値
   */
  set alpha(value) {
    this._alpha = this._validateNumber(value, this._alpha || 1.0, 0.0, 1.0);
  }

  /**
   * アルファ値を取得
   * @returns {number} 現在のアルファ値
   */
  get alpha() {
    return this._alpha || 1.0;
  }

  // =============================================================================
  // プライベートメソッド
  // =============================================================================

  /**
   * ユニークIDを生成
   * @returns {string} ユニークID
   * @private
   */
  _generateUniqueId() {
    return `particle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 数値のバリデーション
   * @param {number} value - 検証する値
   * @param {number} defaultValue - デフォルト値
   * @param {number} min - 最小値
   * @param {number} max - 最大値
   * @returns {number} 検証済みの値
   * @private
   */
  _validateNumber(value, defaultValue, min = -Infinity, max = Infinity) {
    if (typeof value !== 'number' || isNaN(value)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 色のバリデーション
   * @param {string} color - 検証する色
   * @param {string} defaultColor - デフォルト色
   * @returns {string} 検証済みの色
   * @private
   */
  _validateColor(color, defaultColor) {
    if (typeof color !== 'string' || !color.match(/^#[0-9A-F]{6}$/i)) {
      return defaultColor;
    }
    return color;
  }
}
