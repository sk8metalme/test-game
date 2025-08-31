/**
 * AdaptiveDifficultyController - 適応的難易度制御システム
 *
 * フェーズ3: ゲームプレイ拡張とユーザビリティ向上
 *
 * 責任:
 * - プレイヤーのパフォーマンス分析
 * - 学習アルゴリズムによる推奨事項生成
 * - 難易度調整の最適化
 * - 安定性と成長性のバランス制御
 *
 * @author AI Assistant
 * @version 1.0.0
 */

export default class AdaptiveDifficultyController {
  /**
   * AdaptiveDifficultyControllerのコンストラクタ
   *
   * @param {Object} config - 初期設定
   */
  constructor(config = {}) {
    this.config = {
      learningRate: config.learningRate || 0.01,
      stabilityThreshold: config.stabilityThreshold || 0.1,
      growthThreshold: config.growthThreshold || 0.05,
      volatilityThreshold: config.volatilityThreshold || 0.3,
      maxHistorySize: config.maxHistorySize || 50,
      analysisWindow: config.analysisWindow || 10,
      ...config,
    };

    // パフォーマンス履歴
    this.performanceHistory = [];

    // 調整履歴
    this.adjustmentHistory = [];

    // 学習状態
    this.learningState = {
      lastAdjustment: null,
      consecutiveAdjustments: 0,
      stabilityScore: 1.0,
      growthScore: 0.0,
    };

    // 統計情報
    this.statistics = {
      totalAnalyses: 0,
      totalAdjustments: 0,
      averagePerformance: 0.5,
      performanceVolatility: 0.0,
    };
  }

  /**
   * パフォーマンスの分析
   *
   * @param {Object} sessionData - セッションデータ
   * @returns {Object} 分析結果
   */
  analyzePerformance(sessionData) {
    try {
      const performance = this.calculatePerformanceScore(sessionData);
      const trend = this.calculateTrend();
      const volatility = this.calculateVolatility();
      const recommendation = this.generateRecommendation(performance, trend, volatility);

      // 履歴の更新
      this.updatePerformanceHistory(performance, sessionData);
      this.updateStatistics();

      return {
        performance,
        trend,
        volatility,
        recommendation,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(
        'AdaptiveDifficultyController: パフォーマンス分析でエラーが発生しました:',
        error
      );
      return {
        performance: 0.5,
        trend: 'stable',
        volatility: 0.0,
        recommendation: null,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * パフォーマンススコアの計算
   *
   * @param {Object} sessionData - セッションデータ
   * @returns {number} パフォーマンススコア（0.0-1.0）
   */
  calculatePerformanceScore(sessionData) {
    const { score, time, lines, errors, specialMoves, level } = sessionData;

    // 基本パフォーマンス指標
    const scoreEfficiency = this.calculateScoreEfficiency(score, time);
    const lineEfficiency = this.calculateLineEfficiency(lines, time);
    const errorPenalty = this.calculateErrorPenalty(errors, lines);
    const specialBonus = this.calculateSpecialBonus(specialMoves);
    const levelBonus = this.calculateLevelBonus(level);

    // 重み付けによる総合スコア計算
    const weights = {
      scoreEfficiency: 0.35,
      lineEfficiency: 0.25,
      errorPenalty: 0.2,
      specialBonus: 0.15,
      levelBonus: 0.05,
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [metric, value] of Object.entries({
      scoreEfficiency,
      lineEfficiency,
      errorPenalty,
      specialBonus,
      levelBonus,
    })) {
      if (weights[metric]) {
        totalScore += value * weights[metric];
        totalWeight += weights[metric];
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
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
   * ライン効率の計算
   *
   * @param {number} lines - 削除されたライン数
   * @param {number} time - ゲーム時間（秒）
   * @returns {number} ライン効率（0.0-1.0）
   */
  calculateLineEfficiency(lines, time) {
    if (time <= 0) return 0;

    // ライン効率を正規化（例: 10ライン/分を基準）
    const linesPerMinute = (lines / time) * 60;
    const normalizedEfficiency = Math.min(linesPerMinute / 10, 1.0);

    return Math.max(0, normalizedEfficiency);
  }

  /**
   * エラーペナルティの計算
   *
   * @param {number} errors - エラー数
   * @param {number} lines - 削除されたライン数
   * @returns {number} エラーペナルティ（0.0-1.0）
   */
  calculateErrorPenalty(errors, lines) {
    if (lines <= 0) return 0.5; // ラインがない場合は中立的

    const errorRate = errors / lines;
    // エラー率が低いほど良いので、1から引いて正規化
    return Math.max(0, 1 - Math.min(errorRate, 1.0));
  }

  /**
   * 特殊ボーナスの計算
   *
   * @param {Array} specialMoves - 特殊ムーブの配列
   * @returns {number} 特殊ボーナス（0.0-1.0）
   */
  calculateSpecialBonus(specialMoves) {
    if (!specialMoves || specialMoves.length === 0) return 0;

    let totalBonus = 0;
    const moveWeights = {
      tspin: 0.4,
      perfectclear: 0.3,
      combo: 0.2,
      backtoback: 0.1,
    };

    for (const move of specialMoves) {
      const weight = moveWeights[move.type] || 0.1;
      const moveScore = this.calculateMoveScore(move);
      totalBonus += moveScore * weight;
    }

    return Math.min(totalBonus, 1.0);
  }

  /**
   * 個別ムーブスコアの計算
   *
   * @param {Object} move - ムーブオブジェクト
   * @returns {number} ムーブスコア（0.0-1.0）
   */
  calculateMoveScore(move) {
    switch (move.type) {
      case 'tspin':
        return Math.min((move.count || 1) / 3, 1.0); // 3回T-Spinを基準
      case 'perfectclear':
        return 1.0; // Perfect Clearは最高評価
      case 'combo':
        return Math.min((move.count || 1) / 5, 1.0); // 5コンボを基準
      case 'backtoback':
        return Math.min((move.count || 1) / 3, 1.0); // 3回Back-to-Backを基準
      default:
        return 0.5;
    }
  }

  /**
   * レベルボーナスの計算
   *
   * @param {number} level - 現在のレベル
   * @returns {number} レベルボーナス（0.0-1.0）
   */
  calculateLevelBonus(level) {
    if (!level || level <= 0) return 0;

    // レベルが高いほどボーナス（例: 20レベルを基準）
    return Math.min(level / 20, 1.0);
  }

  /**
   * トレンドの計算
   *
   * @returns {string} トレンド（'improving', 'declining', 'stable'）
   */
  calculateTrend() {
    if (this.performanceHistory.length < 3) return 'stable';

    const recentHistory = this.performanceHistory.slice(-this.config.analysisWindow);
    const performanceValues = recentHistory.map(entry => entry.performance);

    // 線形回帰によるトレンド計算
    const trend = this.calculateLinearTrend(performanceValues);

    if (trend > this.config.growthThreshold) return 'improving';
    if (trend < -this.config.growthThreshold) return 'declining';
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
   * ボラティリティ（変動性）の計算
   *
   * @returns {number} ボラティリティ（0.0-1.0）
   */
  calculateVolatility() {
    if (this.performanceHistory.length < 2) return 0;

    const recentHistory = this.performanceHistory.slice(-this.config.analysisWindow);
    const performanceValues = recentHistory.map(entry => entry.performance);

    // 標準偏差によるボラティリティ計算
    const mean = performanceValues.reduce((sum, val) => sum + val, 0) / performanceValues.length;
    const variance =
      performanceValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      performanceValues.length;
    const standardDeviation = Math.sqrt(variance);

    // ボラティリティを0.0-1.0の範囲に正規化
    return Math.min(standardDeviation * 2, 1.0);
  }

  /**
   * 推奨事項の生成
   *
   * @param {number} performance - 現在のパフォーマンス
   * @param {string} trend - トレンド
   * @param {number} volatility - ボラティリティ
   * @returns {Object} 推奨事項
   */
  generateRecommendation(performance, trend, volatility) {
    // 学習状態の更新
    this.updateLearningState(performance, trend, volatility);

    // 推奨事項の生成
    if (trend === 'improving' && volatility < this.config.volatilityThreshold) {
      return {
        action: 'increase',
        factor: this.calculateAdjustmentFactor('increase'),
        reason: '安定した成長',
        confidence: this.calculateConfidence(performance, trend, volatility),
      };
    } else if (trend === 'declining' || performance < 0.3) {
      return {
        action: 'decrease',
        factor: this.calculateAdjustmentFactor('decrease'),
        reason: 'パフォーマンス低下',
        confidence: this.calculateConfidence(performance, trend, volatility),
      };
    } else if (volatility > this.config.volatilityThreshold) {
      return {
        action: 'stabilize',
        factor: this.calculateAdjustmentFactor('stabilize'),
        reason: '不安定なパフォーマンス',
        confidence: this.calculateConfidence(performance, trend, volatility),
      };
    } else {
      return {
        action: 'maintain',
        factor: 0.0,
        reason: '適切な難易度',
        confidence: this.calculateConfidence(performance, trend, volatility),
      };
    }
  }

  /**
   * 調整係数の計算
   *
   * @param {string} action - 調整アクション
   * @returns {number} 調整係数
   */
  calculateAdjustmentFactor(action) {
    const baseFactor = 0.1;
    const learningMultiplier = 1 + this.learningState.stabilityScore * 0.5;

    switch (action) {
      case 'increase':
        return Math.min(baseFactor * learningMultiplier, 0.2);
      case 'decrease':
        return Math.min(baseFactor * learningMultiplier, 0.25);
      case 'stabilize':
        return Math.min(baseFactor * 0.5, 0.1);
      default:
        return 0.0;
    }
  }

  /**
   * 信頼性の計算
   *
   * @param {number} performance - 現在のパフォーマンス
   * @param {string} trend - トレンド
   * @param {number} volatility - ボラティリティ
   * @returns {number} 信頼性（0.0-1.0）
   */
  calculateConfidence(performance, trend, volatility) {
    // 履歴の長さに基づく信頼性
    const historyConfidence = Math.min(this.performanceHistory.length / 10, 1.0);

    // パフォーマンスの安定性に基づく信頼性
    const stabilityConfidence = 1 - volatility;

    // トレンドの明確性に基づく信頼性
    const trendConfidence = this.calculateTrendConfidence(trend);

    // 平均信頼性
    return (historyConfidence + stabilityConfidence + trendConfidence) / 3;
  }

  /**
   * トレンド信頼性の計算
   *
   * @param {string} trend - トレンド
   * @returns {number} トレンド信頼性（0.0-1.0）
   */
  calculateTrendConfidence(trend) {
    if (trend === 'stable') return 0.8;
    if (trend === 'improving' || trend === 'declining') return 0.9;
    return 0.5;
  }

  /**
   * 学習状態の更新
   *
   * @param {number} performance - 現在のパフォーマンス
   * @param {string} trend - トレンド
   * @param {number} volatility - ボラティリティ
   */
  updateLearningState(performance, trend, volatility) {
    // 安定性スコアの更新
    this.learningState.stabilityScore = Math.max(0.1, 1 - volatility);

    // 成長スコアの更新
    if (trend === 'improving') {
      this.learningState.growthScore = Math.min(
        1.0,
        this.learningState.growthScore + this.config.learningRate
      );
    } else if (trend === 'declining') {
      this.learningState.growthScore = Math.max(
        0.0,
        this.learningState.growthScore - this.config.learningRate
      );
    }

    // 連続調整回数の更新
    if (trend !== 'stable') {
      this.learningState.consecutiveAdjustments++;
    } else {
      this.learningState.consecutiveAdjustments = 0;
    }
  }

  /**
   * パフォーマンス履歴の更新
   *
   * @param {number} performance - パフォーマンススコア
   * @param {Object} sessionData - セッションデータ
   */
  updatePerformanceHistory(performance, sessionData) {
    const historyEntry = {
      performance,
      sessionData: { ...sessionData },
      timestamp: Date.now(),
    };

    this.performanceHistory.push(historyEntry);

    // 履歴サイズの制限
    if (this.performanceHistory.length > this.config.maxHistorySize) {
      this.performanceHistory.shift();
    }
  }

  /**
   * 統計情報の更新
   */
  updateStatistics() {
    this.statistics.totalAnalyses++;

    if (this.performanceHistory.length > 0) {
      const performances = this.performanceHistory.map(entry => entry.performance);
      this.statistics.averagePerformance =
        performances.reduce((sum, val) => sum + val, 0) / performances.length;
      this.statistics.performanceVolatility = this.calculateVolatility();
    }
  }

  /**
   * 調整履歴の記録
   *
   * @param {Object} adjustment - 調整情報
   */
  recordAdjustment(adjustment) {
    const adjustmentEntry = {
      ...adjustment,
      timestamp: Date.now(),
      learningState: { ...this.learningState },
    };

    this.adjustmentHistory.push(adjustmentEntry);

    // 履歴サイズの制限
    if (this.adjustmentHistory.length > this.config.maxHistorySize) {
      this.adjustmentHistory.shift();
    }

    this.statistics.totalAdjustments++;
  }

  /**
   * 難易度調整の計算
   *
   * @param {number} currentSkill - 現在のスキルレベル
   * @param {number} targetSkill - 目標スキルレベル
   * @param {Object} currentDifficulty - 現在の難易度設定
   * @returns {Object} 調整後の難易度設定
   */
  calculateAdjustment(currentSkill, targetSkill, currentDifficulty) {
    const skillDifference = targetSkill - currentSkill;
    const adjustmentFactor = this.calculateSkillAdjustmentFactor(skillDifference);

    const newSettings = this.applyDifficultyAdjustments(adjustmentFactor, currentDifficulty);

    // 調整履歴の記録
    this.recordAdjustment({
      currentSkill,
      targetSkill,
      skillDifference,
      adjustmentFactor,
      oldSettings: { ...currentDifficulty },
      newSettings,
    });

    return newSettings;
  }

  /**
   * スキル調整係数の計算
   *
   * @param {number} skillDifference - スキル差
   * @returns {number} 調整係数
   */
  calculateSkillAdjustmentFactor(skillDifference) {
    // シグモイド関数による滑らかな調整
    return Math.tanh(skillDifference * 2) * 0.1;
  }

  /**
   * 難易度調整の適用
   *
   * @param {number} adjustmentFactor - 調整係数
   * @param {Object} currentDifficulty - 現在の難易度設定
   * @returns {Object} 調整後の難易度設定
   */
  applyDifficultyAdjustments(adjustmentFactor, currentDifficulty) {
    const newSettings = { ...currentDifficulty };

    // 落下速度の調整
    if (newSettings.dropSpeed) {
      newSettings.dropSpeed = Math.max(
        100,
        Math.min(2000, newSettings.dropSpeed * (1 - adjustmentFactor))
      );
    }

    // ピース生成の調整
    if (newSettings.pieceGeneration) {
      newSettings.pieceGeneration = {
        ...newSettings.pieceGeneration,
        biasAdjustment: Math.max(-0.3, Math.min(0.3, adjustmentFactor * 2)),
      };
    }

    // 特殊ルールの調整
    if (newSettings.specialRules) {
      newSettings.specialRules = {
        ...newSettings.specialRules,
        tspinDifficulty: Math.max(
          0.5,
          Math.min(
            2.0,
            (newSettings.specialRules.tspinDifficulty || 1.0) * (1 + adjustmentFactor * 0.5)
          )
        ),
      };
    }

    return newSettings;
  }

  /**
   * パフォーマンス履歴を取得
   *
   * @returns {Array} パフォーマンス履歴
   */
  getPerformanceHistory() {
    return [...this.performanceHistory];
  }

  /**
   * 調整履歴を取得
   *
   * @returns {Array} 調整履歴
   */
  getAdjustmentHistory() {
    return [...this.adjustmentHistory];
  }

  /**
   * 学習状態を取得
   *
   * @returns {Object} 学習状態
   */
  getLearningState() {
    return { ...this.learningState };
  }

  /**
   * 統計情報を取得
   *
   * @returns {Object} 統計情報
   */
  getStatistics() {
    return {
      ...this.statistics,
      learningState: this.learningState,
      historySize: this.performanceHistory.length,
      adjustmentHistorySize: this.adjustmentHistory.length,
    };
  }

  /**
   * 履歴のクリア
   */
  clearHistory() {
    this.performanceHistory = [];
    this.adjustmentHistory = [];
    this.statistics.totalAnalyses = 0;
    this.statistics.totalAdjustments = 0;
  }

  /**
   * 学習状態のリセット
   */
  resetLearningState() {
    this.learningState = {
      lastAdjustment: null,
      consecutiveAdjustments: 0,
      stabilityScore: 1.0,
      growthScore: 0.0,
    };
  }

  /**
   * 適応的難易度制御システムの破棄
   */
  destroy() {
    this.performanceHistory = [];
    this.adjustmentHistory = [];
    this.learningState = {
      lastAdjustment: null,
      consecutiveAdjustments: 0,
      stabilityScore: 1.0,
      growthScore: 0.0,
    };
    this.statistics = {
      totalAnalyses: 0,
      totalAdjustments: 0,
      averagePerformance: 0.5,
      performanceVolatility: 0.0,
    };
  }
}
