/**
 * ObjectPool - メモリ割り当ての最適化
 *
 * ゲームオブジェクトの再利用によるメモリ効率の向上
 * ガベージコレクションの圧力を軽減し、パフォーマンスを向上
 *
 * @author AI Assistant
 * @version 1.0.0
 */

export default class ObjectPool {
  /**
   * ObjectPoolのコンストラクタ
   *
   * @param {Function} createFn - オブジェクト作成関数
   * @param {Function} resetFn - オブジェクトリセット関数
   * @param {number} initialSize - 初期プールサイズ
   * @param {number} maxSize - 最大プールサイズ
   */
  constructor(createFn, resetFn, initialSize = 10, maxSize = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.initialSize = initialSize;
    this.maxSize = maxSize;

    this.pool = [];
    this.activeCount = 0;
    this.totalCreated = 0;

    // 初期プールの作成
    this.initializePool();
  }

  /**
   * 初期プールを作成
   */
  initializePool() {
    for (let i = 0; i < this.initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  /**
   * プールからオブジェクトを取得
   *
   * @returns {Object} 再利用可能なオブジェクト
   */
  acquire() {
    if (this.pool.length > 0) {
      const obj = this.pool.pop();
      this.activeCount++;
      return obj;
    }

    // プールが空の場合は新規作成
    if (this.activeCount < this.maxSize) {
      const obj = this.createFn();
      this.activeCount++;
      this.totalCreated++;
      return obj;
    }

    // 最大サイズに達している場合は警告
    // console.warn('ObjectPool: 最大サイズに達しました。パフォーマンスが低下する可能性があります。');
    return this.createFn();
  }

  /**
   * オブジェクトをプールに返却
   *
   * @param {Object} obj - 返却するオブジェクト
   */
  release(obj) {
    if (!obj) return;

    // オブジェクトをリセット
    this.resetFn(obj);

    // プールサイズが最大を超えない場合のみ追加
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }

    this.activeCount--;
  }

  /**
   * プールの統計情報を取得
   *
   * @returns {Object} 統計情報
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      activeCount: this.activeCount,
      totalCreated: this.totalCreated,
      utilization: this.activeCount / (this.activeCount + this.pool.length),
      memoryEfficiency: this.pool.length / (this.activeCount + this.pool.length),
    };
  }

  /**
   * プールをクリア
   */
  clear() {
    this.pool.length = 0;
    this.activeCount = 0;
    this.totalCreated = 0;
  }

  /**
   * プールサイズを調整
   *
   * @param {number} newSize - 新しいプールサイズ
   */
  resize(newSize) {
    if (newSize < this.activeCount) {
      // console.warn('ObjectPool: アクティブなオブジェクト数より小さいサイズには設定できません。');
      return;
    }

    this.maxSize = newSize;

    // プールサイズを調整
    while (this.pool.length > newSize) {
      this.pool.pop();
    }
  }

  /**
   * プールの状態を監視
   *
   * @returns {Object} 監視情報
   */
  monitor() {
    const stats = this.getStats();

    // パフォーマンス警告
    if (stats.utilization > 0.8) {
      // console.warn('ObjectPool: 高い使用率です。プールサイズの増加を検討してください。');
    }

    if (stats.memoryEfficiency < 0.2) {
      // console.warn('ObjectPool: 低いメモリ効率です。プールサイズの調整を検討してください。');
    }

    return {
      ...stats,
      warnings: [],
    };
  }
}
