/**
 * ParticleEffect - パーティクルエフェクトの管理クラス
 *
 * 複数のParticleEmitterを組み合わせて、複雑な視覚効果を作成・制御します。
 * エフェクトのライフサイクル、エミッター管理、統計情報の管理を担当します。
 */

export default class ParticleEffect {
  /**
   * コンストラクタ
   *
   * @param {Object} config - エフェクトの設定
   * @param {string} config.name - エフェクトの識別名
   * @param {number} config.duration - エフェクトの継続時間（ミリ秒、-1で無限）
   * @param {boolean} config.loop - ループ実行フラグ
   */
  constructor(config = {}) {
    // 基本設定
    this.name = config.name !== undefined ? config.name : 'unnamed';
    this.duration = config.duration !== undefined ? config.duration : -1; // -1 = 無限
    this.loop = config.loop === true ? true : false; // null/undefined/falseは全てfalse

    // エミッター管理
    this.emitters = [];
    this.emitterMap = new Map(); // 名前による高速検索

    // 状態管理
    this.active = false;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.currentLoop = 0;

    // 統計情報
    this.stats = {
      totalRuns: 0,
      totalDuration: 0,
      averageDuration: 0,
      lastRunDuration: 0,
    };

    // 内部状態
    this._isInitialized = true;
    this._lastUpdateTime = Date.now();
  }

  /**
   * エフェクトを開始
   *
   * @param {Object} position - 開始位置（オプション）
   * @param {number} position.x - X座標
   * @param {number} position.y - Y座標
   * @returns {boolean} 開始に成功した場合true
   */
  start(position = null) {
    if (this.active) return false;

    this.active = true;
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.currentLoop = 0;

    // 全エミッターを開始
    this.emitters.forEach(emitter => {
      if (position && emitter.position) {
        emitter.position.x = position.x;
        emitter.position.y = position.y;
      }
      emitter.start();
    });

    this.stats.totalRuns++;
    return true;
  }

  /**
   * エフェクトを停止
   *
   * @returns {boolean} 停止に成功した場合true
   */
  stop() {
    if (!this.active) return false;

    this.active = false;
    this.elapsedTime = Date.now() - this.startTime;

    // 統計を更新
    this.stats.lastRunDuration = this.elapsedTime;
    this.stats.totalDuration += this.elapsedTime;
    this.stats.averageDuration = this.stats.totalDuration / this.stats.totalRuns;

    // 全エミッターを停止
    this.emitters.forEach(emitter => emitter.stop());

    return true;
  }

  /**
   * エフェクトを更新
   *
   * @param {number} deltaTime - 前回の更新からの経過時間（秒）
   */
  update(deltaTime) {
    if (!this.active) return;

    const now = Date.now();
    this.elapsedTime = now - this.startTime;

    // 継続時間のチェック
    if (this.duration > 0 && this.elapsedTime >= this.duration) {
      if (this.loop) {
        this._restart();
      } else {
        this.stop();
      }
      return;
    }

    // 全エミッターを更新
    this.emitters.forEach(emitter => {
      emitter.update(deltaTime);
    });
  }

  /**
   * エミッターを追加
   *
   * @param {Object} emitter - 追加するエミッター
   * @returns {ParticleEffect} このインスタンス（チェーン用）
   * @throws {Error} 無効なエミッターの場合
   */
  addEmitter(emitter) {
    if (!this._validateEmitter(emitter)) {
      throw new Error('ParticleEffect: 無効なエミッターです');
    }

    if (this.emitterMap.has(emitter.name)) {
      throw new Error(`ParticleEffect: エミッター名 "${emitter.name}" は既に存在します`);
    }

    this.emitters.push(emitter);
    this.emitterMap.set(emitter.name, emitter);

    return this;
  }

  /**
   * エミッターを削除
   *
   * @param {Object|string} emitterOrName - 削除するエミッターまたは名前
   * @returns {boolean} 削除に成功した場合true
   */
  removeEmitter(emitterOrName) {
    let emitter;
    let name;

    if (typeof emitterOrName === 'string') {
      name = emitterOrName;
      emitter = this.emitterMap.get(name);
    } else {
      emitter = emitterOrName;
      if (!emitter) return false; // null/undefinedの場合は早期リターン
      name = emitter.name;
    }

    if (!emitter) return false;

    const index = this.emitters.indexOf(emitter);
    if (index > -1) {
      this.emitters.splice(index, 1);
      this.emitterMap.delete(name);
      return true;
    }

    return false;
  }

  /**
   * エミッターを取得
   *
   * @param {string} name - エミッター名
   * @returns {Object|null} エミッターまたはnull
   */
  getEmitter(name) {
    return this.emitterMap.get(name) || null;
  }

  /**
   * 設定を更新
   *
   * @param {Object} config - 更新する設定
   * @returns {ParticleEffect} このインスタンス（チェーン用）
   */
  updateConfig(config) {
    if (config.name !== undefined) {
      this.name = config.name;
    }

    if (config.duration !== undefined) {
      this.duration = config.duration;
    }

    if (config.loop !== undefined) {
      this.loop = config.loop === true ? true : false;
    }

    return this;
  }

  /**
   * エフェクトをリセット
   *
   * @returns {ParticleEffect} このインスタンス（チェーン用）
   */
  reset() {
    this.stop();
    this.startTime = 0;
    this.elapsedTime = 0;
    this.currentLoop = 0;

    this.emitters.forEach(emitter => emitter.reset());

    return this;
  }

  /**
   * エフェクトがアクティブかどうかを確認
   *
   * @returns {boolean} アクティブな場合true
   */
  isActive() {
    return this.active;
  }

  /**
   * エフェクトが完了したかどうかを確認
   *
   * @returns {boolean} 完了した場合true
   */
  isFinished() {
    if (this.duration <= 0) return false;
    return this.elapsedTime >= this.duration;
  }

  /**
   * エフェクトの進行状況を取得
   *
   * @returns {number} 進行状況（0.0 - 1.0）
   */
  getProgress() {
    if (this.duration <= 0) return 0;
    return Math.min(1.0, this.elapsedTime / this.duration);
  }

  /**
   * 統計情報を取得
   *
   * @returns {Object} 統計情報
   */
  getStats() {
    return {
      ...this.stats,
      active: this.active,
      elapsedTime: this.elapsedTime,
      progress: this.getProgress(),
      emitterCount: this.emitters.length,
    };
  }

  /**
   * エミッターの統計情報を取得
   *
   * @returns {Array} エミッターの統計情報配列
   */
  getEmitterStats() {
    return this.emitters.map(emitter => ({
      name: emitter.name,
      active: emitter.isActive(),
      stats: emitter.getStats(),
    }));
  }

  /**
   * エフェクトをクローン
   *
   * @returns {ParticleEffect} クローンされたエフェクト
   */
  clone() {
    const clonedEffect = new ParticleEffect({
      name: this.name,
      duration: this.duration,
      loop: this.loop,
    });

    // エミッターをクローン（浅いコピー）
    this.emitters.forEach(emitter => {
      if (typeof emitter.clone === 'function') {
        clonedEffect.addEmitter(emitter.clone());
      } else {
        clonedEffect.addEmitter(emitter);
      }
    });

    return clonedEffect;
  }

  /**
   * エフェクトの妥当性を検証
   *
   * @returns {Object} 検証結果
   */
  validate() {
    const errors = [];

    if (!this.name || typeof this.name !== 'string') {
      errors.push('name must be a non-empty string');
    }

    if (typeof this.duration !== 'number') {
      errors.push('duration must be a number');
    }

    if (typeof this.loop !== 'boolean') {
      errors.push('loop must be a boolean');
    }

    // エミッターの妥当性をチェック
    this.emitters.forEach((emitter, index) => {
      if (!this._validateEmitter(emitter)) {
        errors.push(`emitter at index ${index} is invalid`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 文字列表現を取得
   *
   * @returns {string} 文字列表現
   */
  toString() {
    return `ParticleEffect(name="${this.name}", active=${this.active}, emitters=${this.emitters.length})`;
  }

  /**
   * エフェクトを再開始（内部メソッド）
   */
  _restart() {
    this.currentLoop++;
    this.startTime = Date.now();
    this.elapsedTime = 0;

    // 全エミッターを再開始
    this.emitters.forEach(emitter => emitter.start());
  }

  /**
   * エミッターの妥当性を検証（内部メソッド）
   *
   * @param {Object} emitter - 検証するエミッター
   * @returns {boolean} 妥当な場合true
   */
  _validateEmitter(emitter) {
    if (!emitter) return false;
    if (typeof emitter.name !== 'string') return false;
    if (typeof emitter.start !== 'function') return false;
    if (typeof emitter.stop !== 'function') return false;
    if (typeof emitter.update !== 'function') return false;

    return true;
  }
}
