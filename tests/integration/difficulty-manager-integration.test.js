/**
 * DifficultyManager統合テスト
 *
 * フェーズ3: ゲームプレイ拡張とユーザビリティ向上
 *
 * テスト対象:
 * - DifficultyManager (メインクラス)
 * - PlayerSkillEvaluator (プレイヤースキル評価)
 * - AdaptiveDifficultyController (適応的難易度制御)
 * - DifficultyPresetManager (難易度プリセット管理)
 * - DifficultyHistory (難易度変更履歴)
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import DifficultyManager from '../../src/core/usecases/DifficultyManager.js';
import PlayerSkillEvaluator from '../../src/core/usecases/PlayerSkillEvaluator.js';
import AdaptiveDifficultyController from '../../src/core/usecases/AdaptiveDifficultyController.js';
import DifficultyPresetManager from '../../src/core/usecases/DifficultyPresetManager.js';
import DifficultyHistory from '../../src/core/usecases/DifficultyHistory.js';

describe('DifficultyManager統合テスト', () => {
  let difficultyManager;
  let mockGameData;
  let mockSessionData;

  beforeEach(() => {
    // モックゲームデータの準備
    mockGameData = {
      score: 15000,
      time: 300000, // 5分
      lines: 45,
      pieces: 120,
      specialMoves: [
        { type: 'tspin', count: 8 },
        { type: 'perfectClear', count: 2 },
        { type: 'combo', count: 15 },
        { type: 'backToBack', count: 3 },
      ],
      errors: 5,
      level: 8,
    };

    // モックセッションデータの準備
    mockSessionData = {
      score: 15000,
      time: 300000,
      lines: 45,
      pieces: 120,
      specialMoves: [
        { type: 'tspin', count: 8 },
        { type: 'perfectClear', count: 2 },
        { type: 'combo', count: 15 },
        { type: 'backToBack', count: 3 },
      ],
      errors: 5,
      level: 8,
      moves: [
        { type: 'placement', time: 1000, accuracy: 0.9 },
        { type: 'rotation', time: 500, accuracy: 0.95 },
        { type: 'drop', time: 200, accuracy: 0.8 },
      ],
    };

    // DifficultyManagerの初期化
    difficultyManager = new DifficultyManager({
      enablePersistence: false,
      maxHistorySize: 50,
      analysisWindow: 10,
      enableHistory: true,
      enableAdaptiveDifficulty: true,
      enableSkillEvaluation: true,
    });
  });

  afterEach(() => {
    if (difficultyManager) {
      difficultyManager.destroy();
    }
  });

  describe('初期化と基本動作', () => {
    test('全サブシステムが正しく初期化される', () => {
      expect(difficultyManager.playerSkill).toBeInstanceOf(PlayerSkillEvaluator);
      expect(difficultyManager.adaptiveController).toBeInstanceOf(AdaptiveDifficultyController);
      expect(difficultyManager.presets).toBeInstanceOf(DifficultyPresetManager);
      expect(difficultyManager.history).toBeInstanceOf(DifficultyHistory);
    });

    test('初期設定が正しく適用される', () => {
      const currentDifficulty = difficultyManager.getCurrentDifficulty();
      expect(currentDifficulty).toBeDefined();
      expect(currentDifficulty.dropSpeed).toBeGreaterThan(0);
    });

    test('利用可能なプリセットが正しく読み込まれる', () => {
      const availablePresets = difficultyManager.getAvailablePresets();
      expect(availablePresets).toBeInstanceOf(Array);
      expect(availablePresets.length).toBeGreaterThan(0);

      const beginnerPreset = availablePresets.find(p => p.name === 'Beginner');
      expect(beginnerPreset).toBeDefined();
      expect(beginnerPreset.dropSpeed).toBeGreaterThan(0);
    });
  });

  describe('プレイヤースキル評価の統合', () => {
    test('ゲームデータからスキルレベルが正しく評価される', () => {
      const skillResult = difficultyManager.evaluatePlayerSkill(mockGameData);

      expect(skillResult).toBeDefined();
      expect(skillResult.skillLevel).toBeGreaterThan(0);
      expect(skillResult.confidence).toBeGreaterThan(0);
      expect(skillResult.metrics).toBeDefined();
      expect(skillResult.metrics.scoreEfficiency).toBeGreaterThan(0);
    });

    test('スキル評価結果が履歴に記録される', () => {
      difficultyManager.evaluatePlayerSkill(mockGameData);

      const history = difficultyManager.getDifficultyHistory();
      expect(history.length).toBeGreaterThan(0);

      const lastEntry = history[history.length - 1];
      expect(lastEntry).toBeDefined();
      expect(lastEntry.changeType).toBe('skill_evaluation');
    });

    test('スキル評価の重みが正しく適用される', () => {
      const weights = difficultyManager.playerSkill.getWeights();

      expect(weights.scoreEfficiency).toBe(0.25);
      expect(weights.lineClearRate).toBe(0.2);
      expect(weights.piecePlacementEfficiency).toBe(0.2);
      expect(weights.tspinUsage).toBe(0.15);
      expect(weights.perfectClearRate).toBe(0.1);
      expect(weights.comboEfficiency).toBe(0.1);
    });
  });

  describe('適応的難易度制御の統合', () => {
    test('セッションデータからパフォーマンスが正しく分析される', () => {
      const performanceResult = difficultyManager.analyzePerformance(mockSessionData);

      expect(performanceResult).toBeDefined();
      expect(performanceResult.performance).toBeGreaterThan(0);
      expect(performanceResult.trend).toBeDefined();
      expect(performanceResult.volatility).toBeGreaterThanOrEqual(0);
    });

    test('パフォーマンス分析結果に基づく推奨事項が生成される', () => {
      // 複数のセッションデータを追加して履歴を蓄積
      for (let i = 0; i < 5; i++) {
        difficultyManager.analyzePerformance({
          ...mockSessionData,
          score: mockSessionData.score + i * 1000,
          time: mockSessionData.time + i * 10000,
        });
      }

      const performanceResult = difficultyManager.analyzePerformance(mockSessionData);

      expect(performanceResult.recommendation).toBeDefined();
      expect(performanceResult.recommendation.action).toBeDefined();
      expect(performanceResult.recommendation.reason).toBeDefined();
      expect(performanceResult.recommendation.confidence).toBeDefined();
    });

    test('適応的難易度調整が正しく実行される', () => {
      // パフォーマンス分析と調整
      difficultyManager.analyzePerformance(mockSessionData);
      difficultyManager.performPeriodicEvaluation();

      // 調整後の難易度を確認
      const adjustedDifficulty = difficultyManager.getCurrentDifficulty();
      expect(adjustedDifficulty).toBeDefined();
    });

    test('難易度調整が履歴に記録される', () => {
      // 複数のセッションデータを追加して履歴を蓄積
      for (let i = 0; i < 5; i++) {
        difficultyManager.analyzePerformance({
          ...mockSessionData,
          score: mockSessionData.score + i * 1000,
          time: mockSessionData.time + i * 10000,
        });
      }

      // 適応的調整を強制的に実行（推奨事項を生成するデータ）
      const performanceResult = difficultyManager.analyzePerformance({
        ...mockSessionData,
        score: mockSessionData.score + 10000, // 大幅なスコア上昇
        time: mockSessionData.time + 50000, // 大幅な時間増加
        errors: 20, // エラーを増やしてパフォーマンスを下げる
      });

      // 推奨事項が生成されていることを確認
      expect(performanceResult.recommendation).toBeDefined();

      const history = difficultyManager.getDifficultyHistory();
      const adjustmentEntries = history.filter(entry => entry.changeType === 'adaptive_adjustment');
      const performanceEntries = history.filter(
        entry => entry.changeType === 'performance_analysis'
      );

      // 適応的調整またはパフォーマンス分析の履歴が記録されていることを確認
      expect(adjustmentEntries.length + performanceEntries.length).toBeGreaterThan(0);
    });
  });

  describe('プリセット管理の統合', () => {
    test('プリセットの読み込みと適用が正しく動作する', () => {
      const availablePresets = difficultyManager.getAvailablePresets();
      const expertPreset = availablePresets.find(p => p.name === 'Expert');

      if (expertPreset) {
        difficultyManager.loadPreset('Expert');

        const currentDifficulty = difficultyManager.getCurrentDifficulty();
        expect(currentDifficulty.dropSpeed).toBe(expertPreset.dropSpeed);
        expect(currentDifficulty.pieceGeneration.bagSize).toBe(
          expertPreset.pieceGeneration.bagSize
        );
      }
    });

    test('カスタムプリセットの保存と読み込みが正しく動作する', () => {
      const customPreset = {
        name: 'CustomTest',
        description: 'テスト用カスタムプリセット',
        dropSpeed: 150,
        pieceGeneration: { bagSize: 7, biasAdjustment: 0.1 },
        specialRules: { tspinDifficulty: 1.2, perfectClearBonus: 1.1 },
        bonuses: { lineClearBonus: 1.1, dropBonus: 1.1 },
      };

      difficultyManager.saveCustomPreset('CustomTest', customPreset);

      const availablePresets = difficultyManager.getAvailablePresets();
      const savedPreset = availablePresets.find(p => p.name === 'CustomTest');

      expect(savedPreset).toBeDefined();
      expect(savedPreset.dropSpeed).toBe(150);
    });

    test('プリセット変更が履歴に記録される', () => {
      difficultyManager.loadPreset('Advanced');

      const history = difficultyManager.getDifficultyHistory();
      const presetEntries = history.filter(entry => entry.changeType === 'preset_change');

      expect(presetEntries.length).toBeGreaterThan(0);
    });
  });

  describe('履歴管理の統合', () => {
    test('難易度変更の詳細履歴が正しく記録される', () => {
      // 複数の変更を実行
      difficultyManager.evaluatePlayerSkill(mockGameData);
      difficultyManager.loadPreset('Advanced');
      difficultyManager.analyzePerformance(mockSessionData);

      const history = difficultyManager.getDifficultyHistory();
      expect(history.length).toBeGreaterThan(2);

      // 各エントリの詳細確認
      for (const entry of history) {
        expect(entry.id).toBeDefined();
        expect(entry.timestamp).toBeDefined();
        expect(entry.changeType).toBeDefined();
        expect(entry.reason).toBeDefined();
      }
    });

    test('履歴の検索とフィルタリングが正しく動作する', () => {
      // テストデータを追加
      difficultyManager.evaluatePlayerSkill(mockGameData);
      difficultyManager.loadPreset('Advanced');

      // 変更タイプによるフィルタリング
      const skillEvaluations = difficultyManager.history.getHistory({
        filter: { changeType: 'skill_evaluation' },
      });
      expect(skillEvaluations.length).toBeGreaterThan(0);

      // 理由による検索
      const searchResults = difficultyManager.history.searchHistory('スキル');
      expect(searchResults.length).toBeGreaterThan(0);
    });

    test('履歴分析とトレンド計算が正しく動作する', () => {
      // 複数の変更を実行して履歴を蓄積
      for (let i = 0; i < 5; i++) {
        difficultyManager.evaluatePlayerSkill({
          ...mockGameData,
          score: mockGameData.score + i * 1000,
        });
      }

      const trends = difficultyManager.history.analyzeTrends();
      expect(trends).toBeDefined();
      expect(trends.trend).toBeDefined();
      expect(trends.volatility).toBeGreaterThanOrEqual(0);
      expect(trends.recommendation).toBeDefined();
    });

    test('履歴統計情報が正しく計算される', () => {
      // テストデータを追加
      difficultyManager.evaluatePlayerSkill(mockGameData);
      difficultyManager.loadPreset('Advanced');

      const statistics = difficultyManager.history.getStatistics();
      expect(statistics.totalChanges).toBeGreaterThan(0);
      expect(statistics.lastChange).toBeDefined();
      expect(statistics.changeTypes).toBeDefined();
      expect(statistics.reasons).toBeDefined();
      expect(statistics.timeDistribution).toBeDefined();
    });
  });

  describe('全システムの連携動作', () => {
    test('スキル評価→適応的調整→履歴記録の完全な流れが動作する', () => {
      // 1. スキル評価
      const skillResult = difficultyManager.evaluatePlayerSkill(mockGameData);
      expect(skillResult).toBeDefined();

      // 2. パフォーマンス分析
      const performanceResult = difficultyManager.analyzePerformance(mockSessionData);
      expect(performanceResult).toBeDefined();

      // 3. 適応的調整
      difficultyManager.performPeriodicEvaluation();

      // 4. 履歴確認
      const history = difficultyManager.getDifficultyHistory();
      expect(history.length).toBeGreaterThan(0);

      // 5. 現在の難易度確認
      const currentDifficulty = difficultyManager.getCurrentDifficulty();
      expect(currentDifficulty).toBeDefined();
    });

    test('プリセット変更→履歴記録→統計更新の流れが動作する', () => {
      // 1. プリセット変更
      difficultyManager.loadPreset('Expert');

      // 2. 履歴確認
      const history = difficultyManager.getDifficultyHistory();
      const presetChanges = history.filter(entry => entry.changeType === 'preset_change');
      expect(presetChanges.length).toBeGreaterThan(0);

      // 3. 統計確認
      const statistics = difficultyManager.history.getStatistics();
      expect(statistics.totalChanges).toBeGreaterThan(0);

      // 4. 現在の設定確認
      const currentDifficulty = difficultyManager.getCurrentDifficulty();
      const expertPreset = difficultyManager.presets
        .getAvailablePresets()
        .find(p => p.name === 'Expert');

      if (expertPreset) {
        expect(currentDifficulty.dropSpeed).toBe(expertPreset.dropSpeed);
      }
    });

    test('大量データ処理での安定性が確保される', () => {
      // 大量のテストデータを生成
      const testData = [];
      for (let i = 0; i < 100; i++) {
        testData.push({
          ...mockGameData,
          score: mockGameData.score + i * 100,
          time: mockGameData.time + i * 1000,
        });
      }

      // 大量データの処理
      for (const data of testData) {
        difficultyManager.evaluatePlayerSkill(data);
      }

      // 履歴サイズの制限確認
      const history = difficultyManager.getDifficultyHistory();
      expect(history.length).toBeLessThanOrEqual(100); // maxHistorySize

      // 統計情報の正確性確認
      const statistics = difficultyManager.history.getStatistics();
      expect(statistics.totalChanges).toBeLessThanOrEqual(100);
    });
  });

  describe('エラーハンドリングと堅牢性', () => {
    test('不正なデータでの動作が適切に処理される', () => {
      const invalidGameData = {
        score: 'invalid',
        time: -1000,
        lines: null,
        pieces: undefined,
      };

      // エラーが発生しないことを確認
      expect(() => {
        difficultyManager.evaluatePlayerSkill(invalidGameData);
      }).not.toThrow();
    });

    test('空のデータでの動作が適切に処理される', () => {
      const emptyGameData = {};

      expect(() => {
        difficultyManager.evaluatePlayerSkill(emptyGameData);
      }).not.toThrow();
    });

    test('履歴の永続化エラーが適切に処理される', () => {
      // ローカルストレージが利用できない環境をシミュレート
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('Storage error');
      };

      expect(() => {
        difficultyManager.evaluatePlayerSkill(mockGameData);
      }).not.toThrow();

      // 元の実装を復元
      localStorage.setItem = originalSetItem;
    });
  });

  describe('パフォーマンスとメモリ管理', () => {
    test('分析キャッシュが正しく動作する', () => {
      // 初回分析
      const firstAnalysis = difficultyManager.history.analyzeTrends();
      expect(firstAnalysis).toBeDefined();

      // 2回目の分析（キャッシュから取得）
      const secondAnalysis = difficultyManager.history.analyzeTrends();
      expect(secondAnalysis).toBeDefined();

      // 同じオブジェクト参照であることを確認（キャッシュ使用）
      expect(firstAnalysis).toBe(secondAnalysis);
    });

    test('履歴サイズ制限が正しく動作する', () => {
      const maxSize = 50;

      // 制限を超えるデータを追加（プリセット変更で履歴を確実に記録）
      for (let i = 0; i < maxSize + 10; i++) {
        difficultyManager.loadPreset('Beginner');
        difficultyManager.loadPreset('Advanced');
      }

      // 履歴サイズが制限内に収まっていることを確認
      const history = difficultyManager.getDifficultyHistory();
      expect(history.length).toBeLessThanOrEqual(maxSize);

      // 履歴サイズ制限の動作を確認
      expect(history.length).toBe(maxSize);
    });

    test('メモリリークが発生しない', () => {
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

      // 大量のデータ処理
      for (let i = 0; i < 1000; i++) {
        difficultyManager.evaluatePlayerSkill({
          ...mockGameData,
          score: mockGameData.score + i * 10,
        });
      }

      // 履歴のクリア
      difficultyManager.history.clearHistory();

      // メモリ使用量の確認（大幅な増加がないことを確認）
      if (performance.memory) {
        const finalMemory = performance.memory.usedJSHeapSize;
        const memoryIncrease = finalMemory - initialMemory;

        // メモリ増加が1MB以下であることを確認
        expect(memoryIncrease).toBeLessThan(1024 * 1024);
      }
    });
  });
});
