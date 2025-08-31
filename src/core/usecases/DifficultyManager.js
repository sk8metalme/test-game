/**
 * DifficultyManager - 難易度管理システム
 *
 * フェーズ3: ゲームプレイ拡張とユーザビリティ向上
 *
 * 責任:
 * - プレイヤースキルレベルの評価
 * - 動的難易度調整システム
 * - 適応的難易度制御
 * - 難易度プリセット管理
 * - 難易度変更の履歴管理
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import PlayerSkillEvaluator from './PlayerSkillEvaluator.js';
import AdaptiveDifficultyController from './AdaptiveDifficultyController.js';
import DifficultyPresetManager from './DifficultyPresetManager.js';
import DifficultyHistory from './DifficultyHistory.js';

export default class DifficultyManager {
  /**
   * DifficultyManagerのコンストラクタ
   *
   * @param {Object} config - 初期設定
   */
  constructor(config = {}) {
    this.config = {
      enableAdaptiveDifficulty: config.enableAdaptiveDifficulty !== false,
      enableSkillEvaluation: config.enableSkillEvaluation !== false,
      enablePresets: config.enablePresets !== false,
      enableHistory: config.enableHistory !== false,
      evaluationInterval: config.evaluationInterval || 30000, // 30秒
      adjustmentThreshold: config.adjustmentThreshold || 0.1,
      maxHistorySize: config.maxHistorySize || 100,
      ...config,
    };

    // 現在の難易度設定
    this.currentDifficulty = {};

    // サブシステム
    this.playerSkill = new PlayerSkillEvaluator();
    this.adaptiveController = new AdaptiveDifficultyController();
    this.presets = new DifficultyPresetManager();
    this.history = new DifficultyHistory();

    // イベントリスナー
    this.listeners = new Map();

    // 内部状態
    this.isInitialized = false;
    this.lastEvaluation = 0;
    this.evaluationTimer = null;

    // 初期化
    this.initialize();
  }

  /**
   * 初期化処理
   */
  initialize() {
    // デフォルト難易度の設定
    this.currentDifficulty = this.presets.loadPreset('Beginner');

    // 適応的難易度の開始
    if (this.config.enableAdaptiveDifficulty) {
      this.startAdaptiveDifficulty();
    }

    this.isInitialized = true;
    this.emit('initialized');
  }

  /**
   * 適応的難易度の開始
   */
  startAdaptiveDifficulty() {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
    }

    this.evaluationTimer = setInterval(() => {
      this.performPeriodicEvaluation();
    }, this.config.evaluationInterval);
  }

  /**
   * 定期的な評価の実行
   */
  performPeriodicEvaluation() {
    if (!this.config.enableSkillEvaluation) {
      return;
    }

    try {
      const skillData = this.playerSkill.getCurrentSkillData();
      if (skillData) {
        this.evaluateAndAdjustDifficulty(skillData);
      }
    } catch (error) {
      console.error('DifficultyManager: 定期評価でエラーが発生しました:', error);
    }
  }

  /**
   * プレイヤースキルの評価と難易度調整
   *
   * @param {Object} gameData - ゲームデータ
   * @returns {Object} 評価結果
   */
  evaluatePlayerSkill(gameData) {
    if (!this.config.enableSkillEvaluation) {
      return { skillLevel: 0.5, confidence: 0, trend: 'stable' };
    }

    try {
      const evaluation = this.playerSkill.evaluateSkill(gameData);

      // 履歴の記録
      if (this.config.enableHistory) {
        this.history.recordChange({
          changeType: 'skill_evaluation',
          oldSettings: { ...this.currentDifficulty },
          newSettings: { ...this.currentDifficulty },
          skillDifference: evaluation.skillLevel - (this.playerSkill.getCurrentSkillLevel() || 0.5),
          reason: 'スキル評価実行',
        });
      }

      // 難易度調整の実行
      if (this.config.enableAdaptiveDifficulty) {
        this.adjustDifficulty(evaluation.skillLevel);
      }

      this.emit('skillEvaluated', evaluation);
      return evaluation;
    } catch (error) {
      console.error('DifficultyManager: スキル評価でエラーが発生しました:', error);
      return { skillLevel: 0.5, confidence: 0, trend: 'stable' };
    }
  }

  /**
   * 難易度の調整
   *
   * @param {number} targetSkill - 目標スキルレベル
   * @returns {Object} 調整後の難易度設定
   */
  adjustDifficulty(targetSkill) {
    const currentSkill = this.playerSkill.getCurrentSkillLevel();
    const skillDifference = targetSkill - currentSkill;

    // 調整閾値のチェック
    if (Math.abs(skillDifference) < this.config.adjustmentThreshold) {
      return this.currentDifficulty;
    }

    const oldSettings = { ...this.currentDifficulty };
    const newSettings = this.adaptiveController.calculateAdjustment(
      currentSkill,
      targetSkill,
      this.currentDifficulty
    );

    // 新しい設定の適用
    this.currentDifficulty = { ...this.currentDifficulty, ...newSettings };

    // 履歴の記録
    if (this.config.enableHistory) {
      this.history.recordChange({
        changeType: 'skill_evaluation',
        oldSettings,
        newSettings,
        skillDifference,
        reason: `スキル調整: ${skillDifference > 0 ? '上昇' : '下降'}`,
      });
    }

    // イベントの発火
    this.emit('difficultyAdjusted', {
      oldSettings,
      newSettings,
      reason: `スキル調整: ${skillDifference > 0 ? '上昇' : '下降'}`,
    });

    return this.currentDifficulty;
  }

  /**
   * 難易度設定の適用
   *
   * @param {Object} settings - 適用する難易度設定
   */
  applyDifficultySettings(settings) {
    const oldSettings = { ...this.currentDifficulty };
    this.currentDifficulty = { ...this.currentDifficulty, ...settings };

    // 履歴の記録
    if (this.config.enableHistory) {
      this.history.recordChange({
        changeType: 'manual_change',
        oldSettings,
        newSettings: this.currentDifficulty,
        reason: '手動設定変更',
      });
    }

    // イベントの発火
    this.emit('difficultyAdjusted', {
      oldSettings,
      newSettings: this.currentDifficulty,
      reason: '手動設定変更',
    });
  }

  /**
   * 現在の難易度設定を取得
   *
   * @returns {Object} 現在の難易度設定
   */
  getCurrentDifficulty() {
    return { ...this.currentDifficulty };
  }

  /**
   * パフォーマンスの分析
   *
   * @param {Object} sessionData - セッションデータ
   * @returns {Object} 分析結果
   */
  analyzePerformance(sessionData) {
    if (!this.config.enableAdaptiveDifficulty) {
      return { performance: 0.5, trend: 'stable', recommendation: null };
    }

    try {
      const analysis = this.adaptiveController.analyzePerformance(sessionData);

      // 推奨事項に基づく調整
      if (analysis.recommendation) {
        this.applyAdaptiveChanges(analysis.recommendation);
      } else {
        // 推奨事項がない場合でも、分析結果を履歴に記録
        if (this.config.enableHistory) {
          this.history.recordChange({
            changeType: 'performance_analysis',
            oldSettings: { ...this.currentDifficulty },
            newSettings: { ...this.currentDifficulty },
            reason: 'パフォーマンス分析実行',
          });
        }
      }

      this.emit('adaptiveAdjustment', analysis);
      return analysis;
    } catch (error) {
      console.error('DifficultyManager: パフォーマンス分析でエラーが発生しました:', error);
      return { performance: 0.5, trend: 'stable', recommendation: null };
    }
  }

  /**
   * 適応的変更の適用
   *
   * @param {Object} recommendation - 推奨事項
   */
  applyAdaptiveChanges(recommendation) {
    const { action, factor, reason } = recommendation;

    if (action === 'maintain') {
      return;
    }

    const oldSettings = { ...this.currentDifficulty };
    let newSettings = { ...this.currentDifficulty };

    // 推奨事項に基づく調整
    switch (action) {
      case 'increase':
        newSettings = this.increaseDifficulty(factor);
        break;
      case 'decrease':
        newSettings = this.decreaseDifficulty(factor);
        break;
      case 'stabilize':
        newSettings = this.stabilizeDifficulty(factor);
        break;
    }

    // 設定の適用
    this.currentDifficulty = newSettings;

    // 履歴の記録
    if (this.config.enableHistory) {
      this.history.recordChange({
        changeType: 'adaptive_adjustment',
        oldSettings,
        newSettings,
        reason: `適応的調整: ${reason}`,
      });
    }

    // イベントの発火
    this.emit('difficultyAdjusted', {
      oldSettings,
      newSettings,
      reason: `適応的調整: ${reason}`,
    });
  }

  /**
   * 難易度の上昇
   *
   * @param {number} factor - 上昇係数
   * @returns {Object} 新しい難易度設定
   */
  increaseDifficulty(factor) {
    const newSettings = { ...this.currentDifficulty };

    // 落下速度の調整
    if (newSettings.dropSpeed) {
      newSettings.dropSpeed = Math.max(100, newSettings.dropSpeed * (1 - factor));
    }

    // 特殊ルールの難易度上昇
    if (newSettings.specialRules) {
      newSettings.specialRules = {
        ...newSettings.specialRules,
        tspinDifficulty: Math.min(
          2.0,
          (newSettings.specialRules.tspinDifficulty || 1.0) * (1 + factor)
        ),
      };
    }

    return newSettings;
  }

  /**
   * 難易度の下降
   *
   * @param {number} factor - 下降係数
   * @returns {Object} 新しい難易度設定
   */
  decreaseDifficulty(factor) {
    const newSettings = { ...this.currentDifficulty };

    // 落下速度の調整
    if (newSettings.dropSpeed) {
      newSettings.dropSpeed = Math.min(2000, newSettings.dropSpeed * (1 + factor));
    }

    // 特殊ルールの難易度下降
    if (newSettings.specialRules) {
      newSettings.specialRules = {
        ...newSettings.specialRules,
        tspinDifficulty: Math.max(
          0.5,
          (newSettings.specialRules.tspinDifficulty || 1.0) * (1 - factor)
        ),
      };
    }

    return newSettings;
  }

  /**
   * 難易度の安定化
   *
   * @param {number} factor - 安定化係数
   * @returns {Object} 新しい難易度設定
   */
  stabilizeDifficulty(factor) {
    const newSettings = { ...this.currentDifficulty };

    // 現在の設定を基準値に近づける
    const baseDifficulty = this.presets.loadPreset('Beginner');

    if (newSettings.dropSpeed && baseDifficulty.dropSpeed) {
      const difference = baseDifficulty.dropSpeed - newSettings.dropSpeed;
      newSettings.dropSpeed += difference * factor;
    }

    return newSettings;
  }

  /**
   * プリセットの読み込み
   *
   * @param {string} presetName - プリセット名
   * @returns {Object} プリセット設定
   */
  loadPreset(presetName) {
    if (!this.config.enablePresets) {
      throw new Error('DifficultyManager: プリセット機能が無効です');
    }

    try {
      const preset = this.presets.loadPreset(presetName);
      this.applyDifficultySettings(preset);

      // 履歴の記録
      if (this.config.enableHistory) {
        this.history.recordChange({
          changeType: 'preset_change',
          oldSettings: { ...this.currentDifficulty },
          newSettings: preset,
          reason: `プリセット変更: ${presetName}`,
        });
      }

      this.emit('presetChanged', { presetName, settings: preset });
      return preset;
    } catch (error) {
      console.error(
        `DifficultyManager: プリセット '${presetName}' の読み込みでエラーが発生しました:`,
        error
      );
      throw error;
    }
  }

  /**
   * カスタムプリセットの保存
   *
   * @param {string} name - プリセット名
   * @param {Object} settings - プリセット設定
   * @returns {boolean} 保存結果
   */
  saveCustomPreset(name, settings) {
    if (!this.config.enablePresets) {
      throw new Error('DifficultyManager: プリセット機能が無効です');
    }

    try {
      const result = this.presets.saveCustomPreset(name, settings);

      if (result) {
        this.emit('customPresetSaved', { name, settings });
      }

      return result;
    } catch (error) {
      console.error(`DifficultyManager: プリセット '${name}' の保存でエラーが発生しました:`, error);
      throw error;
    }
  }

  /**
   * 利用可能なプリセットを取得
   *
   * @returns {Array} プリセット一覧
   */
  getAvailablePresets() {
    if (!this.config.enablePresets) {
      return [];
    }

    return this.presets.getAvailablePresets();
  }

  /**
   * 難易度変更履歴を取得
   *
   * @returns {Array} 履歴一覧
   */
  getDifficultyHistory() {
    if (!this.config.enableHistory) {
      return [];
    }

    return this.history.getHistory();
  }

  /**
   * 履歴のトレンド分析
   *
   * @returns {Object} トレンド分析結果
   */
  analyzeTrends() {
    if (!this.config.enableHistory) {
      return { trend: 'stable', volatility: 0, recommendation: null };
    }

    return this.history.analyzeTrends();
  }

  /**
   * 現在のスキルレベルを取得
   *
   * @returns {number} スキルレベル（0.0-1.0）
   */
  getCurrentSkillLevel() {
    return this.playerSkill.getCurrentSkillLevel();
  }

  /**
   * スキル評価の統計を取得
   *
   * @returns {Object} スキル統計
   */
  getSkillStatistics() {
    return this.playerSkill.getStatistics();
  }

  /**
   * 適応的制御の統計を取得
   *
   * @returns {Object} 適応的制御統計
   */
  getAdaptiveStatistics() {
    return this.adaptiveController.getStatistics();
  }

  /**
   * 難易度管理システムの統計を取得
   *
   * @returns {Object} システム統計
   */
  getSystemStatistics() {
    return {
      isInitialized: this.isInitialized,
      enableAdaptiveDifficulty: this.config.enableAdaptiveDifficulty,
      enableSkillEvaluation: this.config.enableSkillEvaluation,
      enablePresets: this.config.enablePresets,
      enableHistory: this.config.enableHistory,
      currentDifficulty: this.currentDifficulty,
      lastEvaluation: this.lastEvaluation,
      evaluationInterval: this.config.evaluationInterval,
      adjustmentThreshold: this.config.adjustmentThreshold,
    };
  }

  /**
   * イベントリスナーの追加
   *
   * @param {string} event - イベント名
   * @param {Function} listener - リスナー関数
   */
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
  }

  /**
   * イベントの発生
   *
   * @param {string} event - イベント名
   * @param {*} data - イベントデータ
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`DifficultyManager event error:`, error);
        }
      });
    }
  }

  /**
   * 難易度管理システムの破棄
   */
  destroy() {
    // 破棄イベントを先に発火
    this.emit('destroyed');

    // タイマーの停止
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = null;
    }

    // サブシステムの破棄
    if (this.playerSkill) {
      this.playerSkill.destroy();
    }
    if (this.adaptiveController) {
      this.adaptiveController.destroy();
    }
    if (this.presets) {
      this.presets.destroy();
    }
    if (this.history) {
      this.history.destroy();
    }

    // イベントリスナーの削除
    this.listeners.clear();

    // 状態のリセット
    this.isInitialized = false;
    this.currentDifficulty = {};
    this.lastEvaluation = 0;
  }
}
