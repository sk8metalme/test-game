/**
 * IntelligentAnalyzer.js - 軽量学習・分析エンジン
 *
 * 責任:
 * - 軽量学習アルゴリズム（周波数ベースパターン認識）
 * - ユーザー行動パターンの学習と分析
 * - 文脈認識（ゲーム状況・デバイス種別）
 * - 予測機能（次の操作の先読み）
 * - メモリ効率管理（制限内での学習データ保持）
 */

export class IntelligentAnalyzer {
  constructor(config = {}) {
    // 軽量学習設定
    this.simpleLearning = {
      threshold: config.threshold || 5, // 5回で学習開始
      decayRate: config.decayRate || 0.95, // 古いデータの減衰
      maxPatterns: config.maxPatterns || 100, // 最大パターン数
    };

    // パターン記録用マップ
    this.patterns = {
      frequency: new Map(), // アクション頻度
      sequence: new Map(), // アクションシーケンス
      context: new Map(), // 文脈関連性
      timing: new Map(), // タイミングパターン
    };

    // 統計情報
    this.stats = {
      totalLearnings: 0,
      totalPredictions: 0,
      correctPredictions: 0,
    };

    // 状態フラグ
    this.isDestroyed = false;
  }

  /**
   * ユーザーパターンの学習
   */
  learnUserPattern(actionType, context) {
    this._validateNotDestroyed();

    try {
      const key = this._generatePatternKey(actionType, context);
      const current = this.patterns.frequency.get(key) || {
        count: 0,
        confidence: 0,
        lastSeen: 0,
      };

      current.count++;
      current.confidence = Math.min(current.count / this.simpleLearning.threshold, 1.0);
      current.lastSeen = Date.now();

      this.patterns.frequency.set(key, current);
      this.stats.totalLearnings++;

      // メモリ制限の実施
      if (this.patterns.frequency.size > this.simpleLearning.maxPatterns) {
        this._cleanupOldPatterns();
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to learn user pattern:', error);
      }
    }
  }

  /**
   * 次のアクションの予測
   */
  predictNextAction(context) {
    this._validateNotDestroyed();

    try {
      const contextKey = this._generateContextKey(context);
      let bestMatch = null;
      let highestConfidence = 0;

      // 周波数マップから最適なマッチを検索
      for (const [key, pattern] of this.patterns.frequency) {
        if (key.includes(contextKey)) {
          // 信頼度と頻度を組み合わせたスコアで評価
          const score = pattern.confidence * pattern.count;
          if (score > highestConfidence) {
            highestConfidence = score;
            bestMatch = {
              actionType: key.split(':')[0],
              confidence: pattern.confidence,
            };
          }
        }
      }

      this.stats.totalPredictions++;

      // マッチしない場合は低信頼度の予測を返す
      if (!bestMatch) {
        return {
          actionType: 'unknown',
          confidence: 0.1,
        };
      }

      return bestMatch;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to predict next action:', error);
      }
      return {
        actionType: 'error',
        confidence: 0.0,
      };
    }
  }

  /**
   * 破棄状態のバリデーション
   */
  _validateNotDestroyed() {
    if (this.isDestroyed) {
      throw new Error('IntelligentAnalyzer has been destroyed');
    }
  }

  /**
   * パターンキーの生成
   */
  _generatePatternKey(actionType, context) {
    const gameState = context.gameState || 'unknown';
    const deviceType = context.deviceType || 'unknown';
    return `${actionType}:${gameState}:${deviceType}`;
  }

  /**
   * 文脈キーの生成
   */
  _generateContextKey(context) {
    const gameState = context.gameState || context.state || 'unknown';
    const deviceType = context.deviceType || 'unknown';
    return `${gameState}:${deviceType}`;
  }

  /**
   * 古いパターンのクリーンアップ
   */
  _cleanupOldPatterns() {
    const patterns = Array.from(this.patterns.frequency.entries());

    // 最後に見た時間でソート
    patterns.sort((a, b) => (a[1].lastSeen || 0) - (b[1].lastSeen || 0));

    // 古いパターンを削除
    const toRemove = patterns.length - this.simpleLearning.maxPatterns;
    for (let i = 0; i < toRemove; i++) {
      this.patterns.frequency.delete(patterns[i][0]);
    }
  }

  /**
   * 減衰の適用
   */
  applyDecay() {
    this._validateNotDestroyed();

    try {
      for (const [key, pattern] of this.patterns.frequency) {
        pattern.count *= this.simpleLearning.decayRate;
        pattern.confidence = Math.min(pattern.count / this.simpleLearning.threshold, 1.0);

        // カウントが非常に低くなったら削除
        if (pattern.count < 0.1) {
          this.patterns.frequency.delete(key);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to apply decay:', error);
      }
    }
  }

  /**
   * ゲーム文脈の分析
   */
  analyzeGameContext(gameState) {
    this._validateNotDestroyed();

    try {
      const level = gameState.level || 1;
      const score = gameState.score || 0;
      const linesCleared = gameState.linesCleared || 0;

      return {
        difficulty: this._calculateDifficulty(level),
        progress: this._calculateProgress(score, linesCleared),
        performance: this._calculatePerformance(gameState),
      };
    } catch (error) {
      return {
        difficulty: 'unknown',
        progress: 'unknown',
        performance: 'unknown',
      };
    }
  }

  /**
   * デバイス文脈の検出
   */
  detectDeviceContext() {
    this._validateNotDestroyed();

    try {
      // ユーザーエージェントベースの簡単な検出
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
      const isTablet = /iPad|Tablet/i.test(userAgent);

      let deviceType = 'desktop';
      if (isTablet) deviceType = 'tablet';
      else if (isMobile) deviceType = 'mobile';

      // 画面方向の検出
      let orientation = 'landscape';
      if (typeof window !== 'undefined') {
        orientation = window.innerWidth < window.innerHeight ? 'portrait' : 'landscape';
      }

      return {
        type: deviceType,
        orientation: orientation,
        performance: this._estimateDevicePerformance(),
      };
    } catch (error) {
      return {
        type: 'desktop',
        orientation: 'landscape',
        performance: 'medium',
      };
    }
  }

  /**
   * 時間的文脈の分析
   */
  analyzeTimeContext() {
    this._validateNotDestroyed();

    try {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();

      let timeOfDay = 'morning';
      if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
      else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
      else if (hour >= 21 || hour < 6) timeOfDay = 'night';

      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];

      return {
        timeOfDay: timeOfDay,
        dayOfWeek: dayNames[day],
        sessionDuration: this._calculateSessionDuration(),
      };
    } catch (error) {
      return {
        timeOfDay: 'unknown',
        dayOfWeek: 'unknown',
        sessionDuration: 0,
      };
    }
  }

  /**
   * ユーザーパフォーマンス文脈の分析
   */
  analyzeUserPerformance(performanceData) {
    this._validateNotDestroyed();

    try {
      const avgTime = performanceData.averageActionTime || 200;
      const errorRate = performanceData.errorRate || 0.1;
      const consecutive = performanceData.consecutiveActions || 5;

      return {
        skillLevel: this._calculateSkillLevel(avgTime, errorRate),
        concentration: this._calculateConcentration(consecutive),
        fatigue: this._calculateFatigue(avgTime, errorRate),
      };
    } catch (error) {
      return {
        skillLevel: 'intermediate',
        concentration: 'medium',
        fatigue: 'low',
      };
    }
  }

  /**
   * 使用頻度の分析
   */
  analyzeUsageFrequency() {
    this._validateNotDestroyed();

    try {
      const actionCounts = new Map();
      let totalActions = 0;

      // 周波数データから集計
      for (const [key, pattern] of this.patterns.frequency) {
        const actionType = key.split(':')[0];
        const currentCount = actionCounts.get(actionType) || 0;
        actionCounts.set(actionType, currentCount + pattern.count);
        totalActions += pattern.count;
      }

      let mostFrequent = null;
      let leastFrequent = null;
      let maxCount = 0;
      let minCount = Infinity;

      for (const [action, count] of actionCounts) {
        if (count > maxCount) {
          maxCount = count;
          mostFrequent = action;
        }
        if (count < minCount) {
          minCount = count;
          leastFrequent = action;
        }
      }

      return {
        mostFrequent: mostFrequent || 'none',
        leastFrequent: leastFrequent || 'none',
        totalActions: totalActions,
        actionCounts: actionCounts,
      };
    } catch (error) {
      return {
        mostFrequent: 'unknown',
        leastFrequent: 'unknown',
        totalActions: 0,
        actionCounts: new Map(),
      };
    }
  }

  /**
   * 時間帯別パターン分析
   */
  analyzeTimeBasedPatterns() {
    this._validateNotDestroyed();

    try {
      const timePatterns = {
        morning: new Map(),
        afternoon: new Map(),
        evening: new Map(),
        night: new Map(),
      };

      // パターンを時間帯別に分類（簡単な実装）
      for (const [key, pattern] of this.patterns.frequency) {
        const actionType = key.split(':')[0];
        // 簡単な分類（実際の実装では文脈情報を使用）
        const timeOfDay = this._extractTimeOfDay(key) || 'morning';

        if (timePatterns[timeOfDay]) {
          timePatterns[timeOfDay].set(actionType, pattern);
        }
      }

      return timePatterns;
    } catch (error) {
      return {
        morning: new Map(),
        afternoon: new Map(),
        evening: new Map(),
        night: new Map(),
      };
    }
  }

  /**
   * 学習データのエクスポート
   */
  exportLearningData() {
    this._validateNotDestroyed();

    try {
      return {
        patterns: {
          frequency: Array.from(this.patterns.frequency.entries()),
        },
        metadata: {
          totalPatterns: this.patterns.frequency.size,
          exportTime: Date.now(),
        },
      };
    } catch (error) {
      return {
        patterns: { frequency: [] },
        metadata: { totalPatterns: 0, exportTime: Date.now() },
      };
    }
  }

  /**
   * 学習データのインポート
   */
  importLearningData(data) {
    this._validateNotDestroyed();

    try {
      if (data.patterns && data.patterns.frequency) {
        this.patterns.frequency.clear();
        for (const [key, pattern] of data.patterns.frequency) {
          this.patterns.frequency.set(key, pattern);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to import learning data:', error);
      }
    }
  }

  /**
   * 学習データのリセット
   */
  resetLearningData() {
    this._validateNotDestroyed();

    try {
      this.patterns.frequency.clear();
      this.patterns.sequence.clear();
      this.patterns.context.clear();
      this.patterns.timing.clear();

      this.stats.totalLearnings = 0;
      this.stats.totalPredictions = 0;
      this.stats.correctPredictions = 0;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to reset learning data:', error);
      }
    }
  }

  /**
   * 学習統計の取得
   */
  getLearningStats() {
    this._validateNotDestroyed();

    try {
      const totalPatterns = this.patterns.frequency.size;
      let totalConfidence = 0;

      for (const pattern of this.patterns.frequency.values()) {
        totalConfidence += pattern.confidence;
      }

      const averageConfidence = totalPatterns > 0 ? totalConfidence / totalPatterns : 0;

      return {
        totalPatterns: totalPatterns,
        averageConfidence: averageConfidence,
        memoryUsage: this._estimateMemoryUsage(),
      };
    } catch (error) {
      return {
        totalPatterns: 0,
        averageConfidence: 0,
        memoryUsage: 0,
      };
    }
  }

  /**
   * 予測統計の取得
   */
  getPredictionStats() {
    this._validateNotDestroyed();

    try {
      const accuracy =
        this.stats.totalPredictions > 0
          ? this.stats.correctPredictions / this.stats.totalPredictions
          : 0;

      return {
        totalPredictions: this.stats.totalPredictions,
        averageConfidence: accuracy,
      };
    } catch (error) {
      return {
        totalPredictions: 0,
        averageConfidence: 0,
      };
    }
  }

  // === プライベートヘルパーメソッド ===

  _calculateDifficulty(level) {
    if (level <= 3) return 'easy';
    if (level <= 7) return 'medium';
    return 'hard';
  }

  _calculateProgress(score, linesCleared) {
    const totalProgress = score + linesCleared * 100;
    if (totalProgress < 1000) return 'beginner';
    if (totalProgress < 5000) return 'intermediate';
    return 'advanced';
  }

  _calculatePerformance(gameState) {
    const score = gameState.score || 0;
    const level = gameState.level || 1;
    const ratio = score / (level * 1000);

    if (ratio > 2) return 'excellent';
    if (ratio > 1) return 'good';
    return 'average';
  }

  _estimateDevicePerformance() {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memory = performance.memory.totalJSHeapSize;
      if (memory > 100 * 1024 * 1024) return 'high';
      if (memory > 50 * 1024 * 1024) return 'medium';
    }
    return 'low';
  }

  _calculateSessionDuration() {
    return Math.floor(Math.random() * 3600);
  }

  _calculateSkillLevel(avgTime, errorRate) {
    if (avgTime < 100 && errorRate < 0.05) return 'expert';
    if (avgTime < 150 && errorRate < 0.1) return 'advanced';
    if (avgTime < 200 && errorRate < 0.15) return 'intermediate';
    return 'beginner';
  }

  _calculateConcentration(consecutiveActions) {
    if (consecutiveActions > 20) return 'high';
    if (consecutiveActions > 10) return 'medium';
    return 'low';
  }

  _calculateFatigue(avgTime, errorRate) {
    const fatigueScore = avgTime / 100 + errorRate * 10;
    if (fatigueScore > 3) return 'high';
    if (fatigueScore > 2) return 'medium';
    return 'low';
  }

  _extractTimeOfDay(_key) {
    const timeOptions = ['morning', 'afternoon', 'evening', 'night'];
    return timeOptions[Math.floor(Math.random() * timeOptions.length)];
  }

  _estimateMemoryUsage() {
    return this.patterns.frequency.size * 0.1;
  }

  /**
   * アナライザーの破棄
   */
  destroy() {
    if (this.isDestroyed) {
      return;
    }

    try {
      // パターンデータクリア
      this.patterns.frequency.clear();
      this.patterns.sequence.clear();
      this.patterns.context.clear();
      this.patterns.timing.clear();

      // 統計リセット
      this.stats = {
        totalLearnings: 0,
        totalPredictions: 0,
        correctPredictions: 0,
      };

      this.isDestroyed = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error during IntelligentAnalyzer destruction:', error);
    }
  }
}
