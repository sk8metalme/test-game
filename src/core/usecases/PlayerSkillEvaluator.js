/**
 * PlayerSkillEvaluator - プレイヤースキル評価システム
 *
 * フェーズ3: ゲームプレイ拡張とユーザビリティ向上
 *
 * 責任:
 * - プレイヤーのゲームプレイパフォーマンス分析
 * - 複数指標を組み合わせた総合スキル評価
 * - スキル履歴の管理とトレンド分析
 * - スキル評価の信頼性計算
 *
 * @author AI Assistant
 * @version 1.0.0
 */

export default class PlayerSkillEvaluator {
  /**
   * PlayerSkillEvaluatorのコンストラクタ
   */
  constructor() {
    this.metrics = new Map();
    this.weights = this.initializeWeights();
    this.history = [];
    this.maxHistorySize = 100;
    this.currentSkillData = null;
  }

  /**
   * 重み付けの初期化
   *
   * @returns {Object} 重み付け設定
   */
  initializeWeights() {
    return {
      scoreEfficiency: 0.25,
      lineClearRate: 0.2,
      piecePlacementEfficiency: 0.2,
      tspinUsage: 0.15,
      perfectClearRate: 0.1,
      comboEfficiency: 0.1,
    };
  }

  /**
   * プレイヤースキルの評価
   *
   * @param {Object} gameData - ゲームデータ
   * @returns {Object} 評価結果
   */
  evaluateSkill(gameData) {
    const metrics = this.calculateMetrics(gameData);
    const skillLevel = this.calculateSkillLevel(metrics);
    const confidence = this.calculateConfidence(metrics);
    const trend = this.analyzeTrend();

    // 履歴の更新
    this.updateHistory(metrics, skillLevel);

    // 現在のスキルデータの更新
    this.currentSkillData = {
      metrics,
      skillLevel,
      confidence,
      trend,
      timestamp: Date.now(),
    };

    return this.currentSkillData;
  }

  /**
   * 各指標の計算
   *
   * @param {Object} gameData - ゲームデータ
   * @returns {Object} 計算された指標
   */
  calculateMetrics(gameData) {
    const { score, time, lines, pieces, specialMoves, errors } = gameData;

    return {
      scoreEfficiency: this.calculateScoreEfficiency(score, time),
      lineClearRate: this.calculateLineClearRate(lines, pieces),
      piecePlacementEfficiency: this.calculatePlacementEfficiency(pieces),
      tspinUsage: this.calculateTSpinUsage(specialMoves),
      perfectClearRate: this.calculatePerfectClearRate(specialMoves),
      comboEfficiency: this.calculateComboEfficiency(specialMoves),
      errorRate: this.calculateErrorRate(errors, pieces),
    };
  }

  /**
   * スコア効率の計算
   *
   * @param {number} score - 獲得スコア
   * @param {number} time - ゲーム時間（秒）
   * @returns {number} スコア効率（0.0-1.0）
   */
  calculateScoreEfficiency(score, time) {
    if (time <= 0) return 0;

    // スコア効率を正規化（例: 1000点/分を基準）
    const scorePerMinute = (score / time) * 60;
    const normalizedEfficiency = Math.min(scorePerMinute / 1000, 1.0);

    return Math.max(0, normalizedEfficiency);
  }

  /**
   * ライン削除率の計算
   *
   * @param {number} lines - 削除されたライン数
   * @param {number} pieces - 配置されたピース数
   * @returns {number} ライン削除率（0.0-1.0）
   */
  calculateLineClearRate(lines, pieces) {
    if (pieces <= 0) return 0;

    // ピースあたりのライン削除率を計算
    const linesPerPiece = lines / pieces;
    const normalizedRate = Math.min(linesPerPiece / 0.4, 1.0); // 0.4ライン/ピースを基準

    return Math.max(0, normalizedRate);
  }

  /**
   * ピース配置効率の計算
   *
   * @param {number} pieces - 配置されたピース数
   * @returns {number} 配置効率（0.0-1.0）
   */
  calculatePlacementEfficiency(pieces) {
    // ピース配置効率は基本的に高く評価（テトリスは基本的に効率的）
    // より詳細な計算は将来的に実装
    return Math.min(pieces / 100, 1.0); // 100ピースを基準
  }

  /**
   * T-Spin使用率の計算
   *
   * @param {Array} specialMoves - 特殊ムーブの配列
   * @returns {number} T-Spin使用率（0.0-1.0）
   */
  calculateTSpinUsage(specialMoves) {
    if (!specialMoves || specialMoves.length === 0) return 0;

    const tspinMoves = specialMoves.filter(move => move.type === 'tspin');
    const usageRate = tspinMoves.length / specialMoves.length;

    return Math.min(usageRate, 1.0);
  }

  /**
   * Perfect Clear率の計算
   *
   * @param {Array} specialMoves - 特殊ムーブの配列
   * @returns {number} Perfect Clear率（0.0-1.0）
   */
  calculatePerfectClearRate(specialMoves) {
    if (!specialMoves || specialMoves.length === 0) return 0;

    const perfectClearMoves = specialMoves.filter(move => move.type === 'perfectclear');
    const rate = perfectClearMoves.length / Math.max(specialMoves.length, 1);

    return Math.min(rate, 1.0);
  }

  /**
   * コンボ効率の計算
   *
   * @param {Array} specialMoves - 特殊ムーブの配列
   * @returns {number} コンボ効率（0.0-1.0）
   */
  calculateComboEfficiency(specialMoves) {
    if (!specialMoves || specialMoves.length === 0) return 0;

    const comboMoves = specialMoves.filter(move => move.type === 'combo');
    if (comboMoves.length === 0) return 0;

    // コンボの平均長さを計算
    const totalComboLength = comboMoves.reduce((sum, move) => sum + (move.count || 0), 0);
    const averageComboLength = totalComboLength / comboMoves.length;

    // コンボ効率を正規化（例: 5コンボを基準）
    const normalizedEfficiency = Math.min(averageComboLength / 5, 1.0);

    return Math.max(0, normalizedEfficiency);
  }

  /**
   * エラー率の計算
   *
   * @param {number} errors - エラー数
   * @param {number} pieces - 配置されたピース数
   * @returns {number} エラー率（0.0-1.0）
   */
  calculateErrorRate(errors, pieces) {
    if (pieces <= 0) return 0;

    const errorRate = errors / pieces;
    // エラー率は低いほど良いので、1から引いて正規化
    return Math.max(0, 1 - Math.min(errorRate, 1.0));
  }

  /**
   * 総合スキルレベルの計算
   *
   * @param {Object} metrics - 各指標の値
   * @returns {number} 総合スキルレベル（0.0-1.0）
   */
  calculateSkillLevel(metrics) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [metric, value] of Object.entries(metrics)) {
      if (this.weights[metric]) {
        totalScore += value * this.weights[metric];
        totalWeight += this.weights[metric];
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * 信頼性の計算
   *
   * @param {Object} metrics - 各指標の値
   * @returns {number} 信頼性（0.0-1.0）
   */
  calculateConfidence(metrics) {
    // 履歴の長さに基づく信頼性
    const historyConfidence = Math.min(this.history.length / 10, 1.0);

    // 指標の一貫性に基づく信頼性
    const consistencyConfidence = this.calculateConsistencyConfidence(metrics);

    // 平均信頼性
    return (historyConfidence + consistencyConfidence) / 2;
  }

  /**
   * 一貫性信頼性の計算
   *
   * @param {Object} metrics - 各指標の値
   * @returns {number} 一貫性信頼性（0.0-1.0）
   */
  calculateConsistencyConfidence(metrics) {
    if (this.history.length < 2) return 0.5;

    // 最近の履歴との一貫性を計算
    const recentHistory = this.history.slice(-5);
    let totalConsistency = 0;

    for (const entry of recentHistory) {
      const consistency = this.calculateMetricsConsistency(metrics, entry.metrics);
      totalConsistency += consistency;
    }

    return totalConsistency / recentHistory.length;
  }

  /**
   * 指標間の一貫性を計算
   *
   * @param {Object} metrics1 - 指標1
   * @param {Object} metrics2 - 指標2
   * @returns {number} 一貫性（0.0-1.0）
   */
  calculateMetricsConsistency(metrics1, metrics2) {
    let totalDifference = 0;
    let metricCount = 0;

    for (const [key, value1] of Object.entries(metrics1)) {
      if (metrics2[key] !== undefined) {
        const difference = Math.abs(value1 - metrics2[key]);
        totalDifference += difference;
        metricCount++;
      }
    }

    if (metricCount === 0) return 0;

    const averageDifference = totalDifference / metricCount;
    // 差が小さいほど一貫性が高い
    return Math.max(0, 1 - averageDifference);
  }

  /**
   * トレンド分析
   *
   * @returns {string} トレンド（'improving', 'declining', 'stable'）
   */
  analyzeTrend() {
    if (this.history.length < 3) return 'stable';

    const recentHistory = this.history.slice(-5);
    const skillLevels = recentHistory.map(entry => entry.skillLevel);

    // 線形回帰によるトレンド計算
    const trend = this.calculateLinearTrend(skillLevels);

    if (trend > 0.01) return 'improving';
    if (trend < -0.01) return 'declining';
    return 'stable';
  }

  /**
   * 線形トレンドの計算
   *
   * @param {Array} values - 値の配列
   * @returns {number} トレンド係数
   */
  calculateLinearTrend(values) {
    const n = values.length;
    if (n < 2) return 0;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * 履歴の更新
   *
   * @param {Object} metrics - 指標
   * @param {number} skillLevel - スキルレベル
   */
  updateHistory(metrics, skillLevel) {
    const historyEntry = {
      timestamp: Date.now(),
      metrics: { ...metrics },
      skillLevel,
    };

    this.history.push(historyEntry);

    // 履歴サイズの制限
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * 現在のスキルレベルを取得
   *
   * @returns {number} 現在のスキルレベル（0.0-1.0）
   */
  getCurrentSkillLevel() {
    return this.currentSkillData ? this.currentSkillData.skillLevel : 0.5;
  }

  /**
   * 現在のスキルデータを取得
   *
   * @returns {Object|null} 現在のスキルデータ
   */
  getCurrentSkillData() {
    return this.currentSkillData;
  }

  /**
   * スキル履歴を取得
   *
   * @returns {Array} スキル履歴
   */
  getSkillHistory() {
    return [...this.history];
  }

  /**
   * 統計情報を取得
   *
   * @returns {Object} 統計情報
   */
  getStatistics() {
    if (this.history.length === 0) {
      return {
        totalEvaluations: 0,
        averageSkillLevel: 0.5,
        skillLevelRange: { min: 0, max: 0 },
        trend: 'stable',
        confidence: 0,
      };
    }

    const skillLevels = this.history.map(entry => entry.skillLevel);
    const minSkill = Math.min(...skillLevels);
    const maxSkill = Math.max(...skillLevels);
    const averageSkill = skillLevels.reduce((sum, level) => sum + level, 0) / skillLevels.length;

    return {
      totalEvaluations: this.history.length,
      averageSkillLevel: averageSkill,
      skillLevelRange: { min: minSkill, max: maxSkill },
      trend: this.analyzeTrend(),
      confidence: this.calculateConfidence(this.currentSkillData?.metrics || {}),
      lastEvaluation: this.currentSkillData?.timestamp || 0,
    };
  }

  /**
   * 履歴のクリア
   */
  clearHistory() {
    this.history = [];
    this.currentSkillData = null;
  }

  /**
   * 重み付けの更新
   *
   * @param {Object} newWeights - 新しい重み付け
   */
  updateWeights(newWeights) {
    this.weights = { ...this.weights, ...newWeights };
  }

  /**
   * 重み付けの取得
   *
   * @returns {Object} 現在の重み付け
   */
  getWeights() {
    return { ...this.weights };
  }

  /**
   * プレイヤースキル評価システムの破棄
   */
  destroy() {
    this.history = [];
    this.currentSkillData = null;
    this.metrics.clear();
  }
}
