/**
 * DifficultyHistory - 難易度変更履歴管理システム
 *
 * フェーズ3: ゲームプレイ拡張とユーザビリティ向上
 *
 * 責任:
 * - 難易度変更の詳細履歴記録
 * - 履歴データの分析とトレンド計算
 * - 履歴の検索・フィルタリング
 * - 履歴データの永続化と管理
 *
 * @author AI Assistant
 * @version 1.0.0
 */

export default class DifficultyHistory {
  /**
   * DifficultyHistoryのコンストラクタ
   *
   * @param {Object} config - 初期設定
   */
  constructor(config = {}) {
    this.config = {
      maxHistorySize: config.maxHistorySize || 50,
      enablePersistence: config.enablePersistence !== false,
      storageKey: config.storageKey || 'tetris_difficulty_history',
      enableCompression: config.enableCompression !== false,
      analysisWindow: config.analysisWindow || 20,
      ...config,
    };

    // 履歴データ
    this.history = [];

    // 分析キャッシュ
    this.analysisCache = new Map();

    // 統計情報
    this.statistics = {
      totalChanges: 0,
      lastChange: null,
      averageChangeInterval: 0,
      mostFrequentReason: null,
    };

    // 初期化
    this.initialize();
  }

  /**
   * 初期化処理
   */
  initialize() {
    // 永続化された履歴の読み込み
    if (this.config.enablePersistence) {
      this.loadHistory();
    }

    // 統計情報の更新
    this.updateStatistics();
  }

  /**
   * 履歴の記録
   *
   * @param {Object} change - 変更情報
   */
  recordChange(change) {
    const historyEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      changeType: change.changeType || 'manual',
      oldSettings: { ...change.oldSettings },
      newSettings: { ...change.newSettings },
      reason: change.reason || '不明',
      skillDifference: change.skillDifference || 0,
      performance: change.performance || null,
      metadata: {
        sessionId: change.sessionId || null,
        playerId: change.playerId || null,
        gameVersion: change.gameVersion || '1.0.0',
        ...change.metadata,
      },
    };

    // 履歴に追加
    this.history.push(historyEntry);

    // 履歴サイズの制限
    if (this.history.length > this.config.maxHistorySize) {
      this.history.shift();
    }

    // 分析キャッシュのクリア
    this.clearAnalysisCache();

    // 統計情報の更新
    this.updateStatistics();

    // 永続化
    if (this.config.enablePersistence) {
      this.saveHistory();
    }
  }

  /**
   * 履歴の取得
   *
   * @param {Object} options - 取得オプション
   * @returns {Array} 履歴一覧
   */
  getHistory(options = {}) {
    const {
      limit = this.history.length,
      offset = 0,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      filter = {},
    } = options;

    let filteredHistory = [...this.history];

    // フィルタリング
    if (filter.changeType) {
      filteredHistory = filteredHistory.filter(entry => entry.changeType === filter.changeType);
    }

    if (filter.reason) {
      filteredHistory = filteredHistory.filter(entry =>
        entry.reason.toLowerCase().includes(filter.reason.toLowerCase())
      );
    }

    if (filter.dateRange) {
      const { start, end } = filter.dateRange;
      filteredHistory = filteredHistory.filter(entry => {
        const timestamp = entry.timestamp;
        return (!start || timestamp >= start) && (!end || timestamp <= end);
      });
    }

    if (filter.skillRange) {
      const { min, max } = filter.skillRange;
      filteredHistory = filteredHistory.filter(entry => {
        const skillDiff = Math.abs(entry.skillDifference);
        return (!min || skillDiff >= min) && (!max || skillDiff <= max);
      });
    }

    // ソート
    filteredHistory.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'skillDifference':
          comparison = Math.abs(a.skillDifference) - Math.abs(b.skillDifference);
          break;
        case 'changeType':
          comparison = a.changeType.localeCompare(b.changeType);
          break;
        case 'reason':
          comparison = a.reason.localeCompare(b.reason);
          break;
        default:
          comparison = a.timestamp - b.timestamp;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // ページネーション
    return filteredHistory.slice(offset, offset + limit);
  }

  /**
   * 履歴の検索
   *
   * @param {string} searchTerm - 検索語
   * @returns {Array} 検索結果
   */
  searchHistory(searchTerm) {
    if (!searchTerm) return this.history;

    const term = searchTerm.toLowerCase();
    return this.history.filter(
      entry =>
        entry.reason.toLowerCase().includes(term) ||
        entry.changeType.toLowerCase().includes(term) ||
        JSON.stringify(entry.metadata).toLowerCase().includes(term)
    );
  }

  /**
   * 履歴の分析
   *
   * @returns {Object} 分析結果
   */
  analyzeTrends() {
    // キャッシュされた分析結果がある場合は返す
    if (this.analysisCache.has('trends')) {
      return this.analysisCache.get('trends');
    }

    if (this.history.length < 2) {
      return {
        trend: 'stable',
        volatility: 0,
        recommendation: null,
        changeFrequency: 0,
        averageSkillDifference: 0,
      };
    }

    // 最近の履歴を分析
    const recentHistory = this.history.slice(-this.config.analysisWindow);
    const skillDifferences = recentHistory.map(entry => entry.skillDifference);
    const timestamps = recentHistory.map(entry => entry.timestamp);

    // トレンド計算
    const trend = this.calculateTrend(skillDifferences);

    // ボラティリティ計算
    const volatility = this.calculateVolatility(skillDifferences);

    // 変更頻度計算
    const changeFrequency = this.calculateChangeFrequency(timestamps);

    // 平均スキル差計算
    const averageSkillDifference =
      skillDifferences.reduce((sum, diff) => sum + Math.abs(diff), 0) / skillDifferences.length;

    // 推奨事項の生成
    const recommendation = this.generateRecommendation(trend, volatility, changeFrequency);

    const analysisResult = {
      trend,
      volatility,
      recommendation,
      changeFrequency,
      averageSkillDifference,
      analysisWindow: this.config.analysisWindow,
      totalEntries: recentHistory.length,
    };

    // キャッシュに保存
    this.analysisCache.set('trends', analysisResult);

    return analysisResult;
  }

  /**
   * トレンドの計算
   *
   * @param {Array} values - 値の配列
   * @returns {string} トレンド（'improving', 'declining', 'stable'）
   */
  calculateTrend(values) {
    if (values.length < 3) return 'stable';

    // 線形回帰によるトレンド計算
    const n = values.length;
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

    if (slope > 0.01) return 'improving';
    if (slope < -0.01) return 'declining';
    return 'stable';
  }

  /**
   * ボラティリティの計算
   *
   * @param {Array} values - 値の配列
   * @returns {number} ボラティリティ（0.0-1.0）
   */
  calculateVolatility(values) {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    // ボラティリティを0.0-1.0の範囲に正規化
    return Math.min(standardDeviation * 2, 1.0);
  }

  /**
   * 変更頻度の計算
   *
   * @param {Array} timestamps - タイムスタンプの配列
   * @returns {number} 変更頻度（変更/時間）
   */
  calculateChangeFrequency(timestamps) {
    if (timestamps.length < 2) return 0;

    const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
    const timeSpanHours = timeSpan / (1000 * 60 * 60);

    return timestamps.length / Math.max(timeSpanHours, 0.1);
  }

  /**
   * 推奨事項の生成
   *
   * @param {string} trend - トレンド
   * @param {number} volatility - ボラティリティ
   * @param {number} changeFrequency - 変更頻度
   * @returns {Object} 推奨事項
   */
  generateRecommendation(trend, volatility, changeFrequency) {
    let action = 'maintain';
    let reason = '現在の設定が適切です';
    let priority = 'low';

    if (volatility > 0.5) {
      action = 'stabilize';
      reason = '難易度の変動が大きすぎます';
      priority = 'high';
    } else if (trend === 'declining' && changeFrequency > 2) {
      action = 'decrease';
      reason = '難易度が高すぎる可能性があります';
      priority = 'medium';
    } else if (trend === 'improving' && changeFrequency < 0.5) {
      action = 'increase';
      reason = '難易度を上げる余地があります';
      priority = 'medium';
    }

    return {
      action,
      reason,
      priority,
      confidence: this.calculateConfidence(volatility, changeFrequency),
    };
  }

  /**
   * 信頼性の計算
   *
   * @param {number} volatility - ボラティリティ
   * @param {number} changeFrequency - 変更頻度
   * @returns {number} 信頼性（0.0-1.0）
   */
  calculateConfidence(volatility, changeFrequency) {
    // 履歴の長さに基づく信頼性
    const historyConfidence = Math.min(this.history.length / 20, 1.0);

    // 安定性に基づく信頼性
    const stabilityConfidence = 1 - volatility;

    // 頻度に基づく信頼性（適度な頻度が良い）
    const frequencyConfidence = changeFrequency > 0.1 && changeFrequency < 5 ? 1.0 : 0.5;

    return (historyConfidence + stabilityConfidence + frequencyConfidence) / 3;
  }

  /**
   * 統計情報の取得
   *
   * @returns {Object} 統計情報
   */
  getStatistics() {
    return {
      ...this.statistics,
      totalHistorySize: this.history.length,
      maxHistorySize: this.config.maxHistorySize,
      changeTypes: this.getChangeTypeDistribution(),
      reasons: this.getReasonDistribution(),
      timeDistribution: this.getTimeDistribution(),
    };
  }

  /**
   * 変更タイプの分布を取得
   *
   * @returns {Object} 変更タイプの分布
   */
  getChangeTypeDistribution() {
    const distribution = {};

    for (const entry of this.history) {
      const type = entry.changeType;
      distribution[type] = (distribution[type] || 0) + 1;
    }

    return distribution;
  }

  /**
   * 理由の分布を取得
   *
   * @returns {Object} 理由の分布
   */
  getReasonDistribution() {
    const distribution = {};

    for (const entry of this.history) {
      const reason = entry.reason;
      distribution[reason] = (distribution[reason] || 0) + 1;
    }

    return distribution;
  }

  /**
   * 時間分布を取得
   *
   * @returns {Object} 時間分布
   */
  getTimeDistribution() {
    if (this.history.length === 0) return {};

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    const distribution = {
      lastHour: 0,
      lastDay: 0,
      lastWeek: 0,
      lastMonth: 0,
      older: 0,
    };

    for (const entry of this.history) {
      const age = now - entry.timestamp;

      if (age <= 60 * 60 * 1000) {
        distribution.lastHour++;
      } else if (age <= oneDay) {
        distribution.lastDay++;
      } else if (age <= oneWeek) {
        distribution.lastWeek++;
      } else if (age <= oneMonth) {
        distribution.lastMonth++;
      } else {
        distribution.older++;
      }
    }

    return distribution;
  }

  /**
   * 履歴のクリア
   */
  clearHistory() {
    this.history = [];
    this.analysisCache.clear();
    this.updateStatistics();

    if (this.config.enablePersistence) {
      this.saveHistory();
    }
  }

  /**
   * 分析キャッシュのクリア
   */
  clearAnalysisCache() {
    this.analysisCache.clear();
  }

  /**
   * 統計情報の更新
   */
  updateStatistics() {
    if (this.history.length === 0) {
      this.statistics = {
        totalChanges: 0,
        lastChange: null,
        averageChangeInterval: 0,
        mostFrequentReason: null,
      };
      return;
    }

    this.statistics.totalChanges = this.history.length;
    this.statistics.lastChange = this.history[this.history.length - 1];

    // 平均変更間隔の計算
    if (this.history.length > 1) {
      let totalInterval = 0;
      for (let i = 1; i < this.history.length; i++) {
        totalInterval += this.history[i].timestamp - this.history[i - 1].timestamp;
      }
      this.statistics.averageChangeInterval = totalInterval / (this.history.length - 1);
    }

    // 最も頻繁な理由の特定
    const reasonCounts = this.getReasonDistribution();
    let maxCount = 0;
    let mostFrequent = null;

    for (const [reason, count] of Object.entries(reasonCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = reason;
      }
    }

    this.statistics.mostFrequentReason = mostFrequent;
  }

  /**
   * 履歴の永続化
   */
  saveHistory() {
    try {
      let dataToSave = this.history;

      // 圧縮が有効な場合
      if (this.config.enableCompression) {
        dataToSave = this.compressHistory(this.history);
      }

      localStorage.setItem(this.config.storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('DifficultyHistory: 履歴の保存でエラーが発生しました:', error);
    }
  }

  /**
   * 履歴の読み込み
   */
  loadHistory() {
    try {
      const storedData = localStorage.getItem(this.config.storageKey);
      if (storedData) {
        let parsedData = JSON.parse(storedData);

        // 圧縮されたデータの場合は展開
        if (this.config.enableCompression && typeof parsedData === 'string') {
          parsedData = this.decompressHistory(parsedData);
        }

        this.history = parsedData || [];
      }
    } catch (error) {
      console.error('DifficultyHistory: 履歴の読み込みでエラーが発生しました:', error);
      this.history = [];
    }
  }

  /**
   * 履歴の圧縮
   *
   * @param {Array} history - 履歴データ
   * @returns {string} 圧縮されたデータ
   */
  compressHistory(history) {
    // 簡易的な圧縮（実際の実装ではより高度な圧縮アルゴリズムを使用）
    return JSON.stringify(history).replace(/"([^"]+)":/g, '$1:');
  }

  /**
   * 履歴の展開
   *
   * @param {string} compressedData - 圧縮されたデータ
   * @returns {Array} 展開された履歴データ
   */
  decompressHistory(compressedData) {
    // 簡易的な展開（実際の実装ではより高度な展開アルゴリズムを使用）
    return JSON.parse(compressedData.replace(/([a-zA-Z0-9_]+):/g, '"$1":'));
  }

  /**
   * IDの生成
   *
   * @returns {string} ユニークID
   */
  generateId() {
    return `diff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 履歴管理システムの破棄
   */
  destroy() {
    // 履歴の保存
    if (this.config.enablePersistence) {
      this.saveHistory();
    }

    // データのクリア
    this.history = [];
    this.analysisCache.clear();
    this.statistics = {
      totalChanges: 0,
      lastChange: null,
      averageChangeInterval: 0,
      mostFrequentReason: null,
    };
  }
}
